// src/components/report/ActionPlanTab.jsx
// VS-28: Action Planning & Simulator - War Room for maturity improvement
// VS-39: Added finalization modal and API call
// VS-46: Added Action Planning Wizard integration
// Includes ActionSidebar inside content container for interactive metrics

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import SimulatorHUD from './SimulatorHUD';
import CommandCenter from './CommandCenter';
import ActionSidebar from './ActionSidebar';
import ProgressiveWizard from './ProgressiveWizard';
import { AlertTriangle, CheckCircle, CheckCircle2, FileText, Home, Sparkles } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

// Debounce helper
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export default function ActionPlanTab({
  runId,
  report,
  questions = [],
  initiatives = [],
  objectives = [],
  practices = [],
  companyName,
  industry,
  onFinalized,  // VS-39: Callback when finalization completes (parent refetches + switches tab)
  // VS-41: Finalization state reporting to parent (for WorkflowSidebar)
  onFinalizationStateChange,
  requestShowModal = false,
  onModalClosed
}) {
  // Build practice → objective map for v2.9.0 schema
  // Questions have practice_id, practices have objective_id
  const practiceToObjective = useMemo(() => {
    const map = {};
    practices.forEach(p => {
      if (p.id && p.objective_id) {
        map[p.id] = p.objective_id;
      }
    });
    return map;
  }, [practices]);

  // Helper to get objective_id for a question (handles both old and new schema)
  const getQuestionObjectiveId = useCallback((q) => {
    // v2.9.0: question -> practice -> objective
    if (q.practice_id && practiceToObjective[q.practice_id]) {
      return practiceToObjective[q.practice_id];
    }
    // Legacy: direct objective_id on question
    return q.objective_id;
  }, [practiceToObjective]);
  const navigate = useNavigate();

  // View mode: 'actions' or 'initiatives'
  const [viewMode, setViewMode] = useState('actions');

  // Action plan state - map of question_id -> { timeline, assigned_owner, status }
  const [actionPlan, setActionPlan] = useState({});

  // Loading state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // VS-39: Finalization modal state (LOCAL only - no prop drilling)
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  // Post-completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [wizardSummary, setWizardSummary] = useState(null);
  const [showIntroModal, setShowIntroModal] = useState(false);

  // Benchmark data for objective sorting
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);

  // Ref for scrolling to simulator
  const simulatorRef = useRef(null);

  // VS-39: Derive finalization status from report (NOT separate state)
  const isFinalized = !!report?.finalized_at;

  // Fetch existing action plan on mount (wait for questions to be loaded)
  useEffect(() => {
    if (runId && questions.length > 0) {
      fetchActionPlan();
    }
  }, [runId, questions.length]);

  // Fetch benchmark data for objective sorting
  useEffect(() => {
    async function fetchBenchmarkData() {
      if (!runId) return;
      setBenchmarkLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/benchmark`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          }
        });
        if (res.ok) {
          const data = await res.json();
          setBenchmarkData(data);
        }
      } catch (err) {
        console.error('Failed to fetch benchmark data:', err);
      } finally {
        setBenchmarkLoading(false);
      }
    }
    fetchBenchmarkData();
  }, [runId]);

  // VS-47: Show intro modal on entry (only first time per run)
  useEffect(() => {
    if (!runId || isFinalized) return;
    const storageKey = `actionPlanIntroSeen:${runId}`;
    const hasSeen = window.localStorage.getItem(storageKey);
    if (!hasSeen) {
      setShowIntroModal(true);
    }
  }, [runId, isFinalized]);

  async function fetchActionPlan() {
    // Guard: Don't run until questions are loaded
    if (questions.length === 0) {
      console.log('[ActionPlanTab] Waiting for questions to load...');
      return;
    }

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/action-plan`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        }
      });

      if (res.ok) {
        const items = await res.json();
        // Build a set of valid question IDs from the current spec
        const validQuestionIds = new Set(questions.map(q => q.id));

        // Convert array to map keyed by question_id, filtering out orphaned entries
        const planMap = {};
        const orphaned = [];
        items.forEach(item => {
          if (validQuestionIds.has(item.question_id)) {
            planMap[item.question_id] = {
              timeline: item.timeline,
              assigned_owner: item.assigned_owner,
              status: item.status
            };
          } else {
            orphaned.push(item.question_id);
          }
        });

        // Auto-delete orphaned actions from database
        if (orphaned.length > 0) {
          console.log('[ActionPlanTab] Found orphaned actions, deleting:', orphaned);
          const { data: { session } } = await supabase.auth.getSession();
          const deleteToken = session?.access_token;
          for (const qId of orphaned) {
            try {
              await fetch(`${API_URL}/diagnostic-runs/${runId}/action-plan/${qId}`, {
                method: 'DELETE',
                headers: { ...(deleteToken && { Authorization: `Bearer ${deleteToken}` }) }
              });
            } catch (e) {
              console.error('[ActionPlanTab] Failed to delete orphaned action:', qId, e);
            }
          }
        }

        setActionPlan(planMap);
      }
    } catch (err) {
      console.error('Failed to fetch action plan:', err);
    } finally {
      setLoading(false);
    }
  }

  // Debounced save function
  const saveAction = useCallback(
    debounce(async (questionId, data) => {
      try {
        setSaving(true);
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (data === null) {
          // Delete
          await fetch(`${API_URL}/diagnostic-runs/${runId}/action-plan/${questionId}`, {
            method: 'DELETE',
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            }
          });
        } else {
          // Upsert
          await fetch(`${API_URL}/diagnostic-runs/${runId}/action-plan`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({
              question_id: questionId,
              ...data
            })
          });
        }
      } catch (err) {
        console.error('Failed to save action:', err);
      } finally {
        setSaving(false);
      }
    }, 500),
    [runId]
  );

  // Handle action toggle (select/deselect)
  function handleActionToggle(questionId, isSelected) {
    if (isSelected) {
      // Add to plan with default timeline
      const newData = { timeline: null, assigned_owner: null, status: 'planned' };
      setActionPlan(prev => ({ ...prev, [questionId]: newData }));
      saveAction(questionId, newData);
    } else {
      // Remove from plan
      setActionPlan(prev => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
      saveAction(questionId, null);
    }
  }

  // Handle timeline change
  function handleTimelineChange(questionId, timeline) {
    setActionPlan(prev => {
      const existing = prev[questionId] || { status: 'planned', assigned_owner: null };
      return { ...prev, [questionId]: { ...existing, timeline } };
    });
    const existing = actionPlan[questionId] || { status: 'planned', assigned_owner: null };
    saveAction(questionId, { ...existing, timeline });
  }

  // Handle owner change
  function handleOwnerChange(questionId, assigned_owner) {
    setActionPlan(prev => {
      const existing = prev[questionId] || { status: 'planned', timeline: null };
      return { ...prev, [questionId]: { ...existing, assigned_owner } };
    });
    const existing = actionPlan[questionId] || { status: 'planned', timeline: null };
    saveAction(questionId, { ...existing, assigned_owner });
  }

  // VS-39: Handle finalization
  async function handleFinalize() {
    setFinalizing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      if (res.ok) {
        setShowFinalizeModal(false);
        // Show completion modal instead of immediately redirecting
        setShowCompletionModal(true);
        // Tell parent to refetch report (for sidebar state update)
        if (onFinalized) {
          onFinalized();
        }
      } else {
        const err = await res.json();
        console.error('Finalization failed:', err);
        alert(err.error || 'Failed to finalize. Please try again.');
      }
    } catch (err) {
      console.error('Finalization error:', err);
      alert('Failed to finalize. Please try again.');
    } finally {
      setFinalizing(false);
    }
  }

  // Post-completion handlers
  function handleViewReport() {
    navigate(`/report/${runId}/executive`);
  }

  function handleDownloadPDF() {
    navigate(`/report/${runId}/executive?print=true`);
  }

  function handleReturnHome() {
    navigate('/');
  }

  // Wizard completion handler
  const handleWizardComplete = useCallback(async (actionPlanData) => {
    // Get existing IDs from current state via ref pattern
    let existingIds = [];
    setActionPlan(prev => {
      existingIds = Object.keys(prev);
      return prev; // Don't change state yet
    });

    // Clear existing action plan
    for (const questionId of existingIds) {
      await saveAction(questionId, null);
    }

    // Build new action plan map
    const newPlan = {};
    for (const item of actionPlanData) {
      newPlan[item.question_id] = {
        timeline: item.timeline,
        assigned_owner: item.assigned_owner,
        status: item.status || 'planned'
      };
      await saveAction(item.question_id, newPlan[item.question_id]);
    }

    // Update state once with new plan
    setActionPlan(newPlan);

    // Show summary toast
    setWizardSummary({ added: actionPlanData.length, removed: existingIds.length, total: actionPlanData.length });
    setTimeout(() => setWizardSummary(null), 5000);

    // Show finalization modal
    setShowFinalizeModal(true);
  }, [saveAction]);

  // Progressive Wizard draft save handler (saves without finalizing)
  const handleSaveDraft = useCallback(async (actionPlanData) => {
    // Get existing IDs from current state via ref pattern
    let existingIds = [];
    setActionPlan(prev => {
      existingIds = Object.keys(prev);
      return prev; // Don't change state yet
    });

    // Clear existing action plan
    for (const questionId of existingIds) {
      await saveAction(questionId, null);
    }

    // Build new action plan map
    const newPlan = {};
    for (const item of actionPlanData) {
      newPlan[item.question_id] = {
        timeline: item.timeline,
        assigned_owner: item.assigned_owner,
        status: item.status || 'planned'
      };
      await saveAction(item.question_id, newPlan[item.question_id]);
    }

    // Update state once with new plan
    setActionPlan(newPlan);

    // Show summary toast
    setWizardSummary({ added: actionPlanData.length, removed: existingIds.length, total: actionPlanData.length });
    setTimeout(() => setWizardSummary(null), 5000);
  }, [saveAction]);

  // Scroll to simulator when "Review Impact" is clicked
  const handleReviewImpact = useCallback(() => {
    if (simulatorRef.current) {
      simulatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Build importance map from report calibration
  const importanceMap = useMemo(() => {
    return report?.calibration?.importance_map || {};
  }, [report]);

  // Get gaps (questions not answered yes)
  const gaps = useMemo(() => {
    const inputMap = new Map(
      (report?.inputs || []).map(i => [i.question_id, i.value])
    );
    return questions.filter(q => inputMap.get(q.id) !== true);
  }, [questions, report]);

  // Calculate current and projected scores by objective
  const { currentScores, projectedScores } = useMemo(() => {
    const inputMap = new Map(
      (report?.inputs || []).map(i => [i.question_id, i.value])
    );

    const currentByObj = {};
    const projectedByObj = {};

    objectives.forEach(obj => {
      // v2.9.0: use helper to resolve practice_id -> objective_id
      const objQuestions = questions.filter(q => getQuestionObjectiveId(q) === obj.id);
      if (objQuestions.length === 0) {
        currentByObj[obj.id] = 0;
        projectedByObj[obj.id] = 0;
        return;
      }

      // Current: count of "yes" answers
      const currentYes = objQuestions.filter(q => inputMap.get(q.id) === true).length;
      currentByObj[obj.id] = Math.round((currentYes / objQuestions.length) * 100);

      // Projected: current yes + planned actions
      const projectedYes = objQuestions.filter(q =>
        inputMap.get(q.id) === true || actionPlan[q.id]
      ).length;
      projectedByObj[obj.id] = Math.round((projectedYes / objQuestions.length) * 100);
    });

    return { currentScores: currentByObj, projectedScores: projectedByObj };
  }, [questions, objectives, report, actionPlan, getQuestionObjectiveId]);

  // Calculate projected scores by timeline bucket
  const projectedByTimeline = useMemo(() => {
    const inputMap = new Map(
      (report?.inputs || []).map(i => [i.question_id, i.value])
    );

    const result = {
      current: {},
      '6m': {},
      '12m': {},
      '24m': {}
    };

    objectives.forEach(obj => {
      // v2.9.0: use helper to resolve practice_id -> objective_id
      const objQuestions = questions.filter(q => getQuestionObjectiveId(q) === obj.id);
      if (objQuestions.length === 0) {
        result.current[obj.id] = 0;
        result['6m'][obj.id] = 0;
        result['12m'][obj.id] = 0;
        result['24m'][obj.id] = 0;
        return;
      }

      // Current yes count
      const currentYes = objQuestions.filter(q => inputMap.get(q.id) === true).length;
      result.current[obj.id] = Math.round((currentYes / objQuestions.length) * 100);

      // 6m: current + 6m planned
      const planned6m = objQuestions.filter(q =>
        inputMap.get(q.id) === true || actionPlan[q.id]?.timeline === '6m'
      ).length;
      result['6m'][obj.id] = Math.round((planned6m / objQuestions.length) * 100);

      // 12m: current + 6m + 12m planned
      const planned12m = objQuestions.filter(q =>
        inputMap.get(q.id) === true ||
        actionPlan[q.id]?.timeline === '6m' ||
        actionPlan[q.id]?.timeline === '12m'
      ).length;
      result['12m'][obj.id] = Math.round((planned12m / objQuestions.length) * 100);

      // 24m: current + all planned
      const planned24m = objQuestions.filter(q =>
        inputMap.get(q.id) === true || actionPlan[q.id]
      ).length;
      result['24m'][obj.id] = Math.round((planned24m / objQuestions.length) * 100);
    });

    return result;
  }, [questions, objectives, report, actionPlan, getQuestionObjectiveId]);

  // Calculate overall execution scores
  const executionScores = useMemo(() => {
    const totalQuestions = questions.length;
    if (totalQuestions === 0) return { current: 0, projected: 0 };

    const inputMap = new Map(
      (report?.inputs || []).map(i => [i.question_id, i.value])
    );

    const currentYes = questions.filter(q => inputMap.get(q.id) === true).length;
    const projectedYes = questions.filter(q =>
      inputMap.get(q.id) === true || actionPlan[q.id]
    ).length;

    return {
      current: Math.round((currentYes / totalQuestions) * 100),
      projected: Math.round((projectedYes / totalQuestions) * 100)
    };
  }, [questions, report, actionPlan]);

  // Calculate current and projected maturity levels
  const maturityLevels = useMemo(() => {
    // Get current level from report
    const maturityV2 = report?.maturity_v2 || {};
    const currentLevel = maturityV2.actual_level ?? report?.maturity?.achieved_level ?? 1;

    // Calculate projected level based on projected score
    // Thresholds: L4 >= 85%, L3 >= 65%, L2 >= 40%, L1 < 40%
    const scoreToLevel = (score) => {
      if (score >= 85) return 4;
      if (score >= 65) return 3;
      if (score >= 40) return 2;
      return 1;
    };

    const projectedLevel = scoreToLevel(executionScores.projected);

    return { current: currentLevel, projected: projectedLevel };
  }, [report, executionScores.projected]);

  // Count selected actions by timeline and owner
  // Only count actions that are still gaps (not answered "yes")
  const actionCounts = useMemo(() => {
    const gapIds = new Set(gaps.map(g => g.id));
    const counts = { total: 0, '6m': 0, '12m': 0, '24m': 0, unassigned: 0, withOwner: 0 };
    Object.entries(actionPlan).forEach(([questionId, a]) => {
      // Skip stale actions (question now answered "yes")
      if (!gapIds.has(questionId)) return;

      counts.total++;
      if (a.timeline === '6m') counts['6m']++;
      else if (a.timeline === '12m') counts['12m']++;
      else if (a.timeline === '24m') counts['24m']++;
      else counts.unassigned++;
      // VS-40: Count actions with owner assigned
      if (a.assigned_owner && a.assigned_owner.trim() !== '') {
        counts.withOwner++;
      }
    });
    return counts;
  }, [actionPlan, gaps]);

  // VS-40: Check if all selected actions have both timeline AND owner
  // Only check actions that are still gaps (not answered "yes")
  const incompleteActions = useMemo(() => {
    const gapIds = new Set(gaps.map(g => g.id));
    const incomplete = [];
    Object.entries(actionPlan).forEach(([questionId, data]) => {
      // Skip stale actions (question now answered "yes")
      if (!gapIds.has(questionId)) return;

      const hasTimeline = data.timeline && ['6m', '12m', '24m'].includes(data.timeline);
      const hasOwner = data.assigned_owner && data.assigned_owner.trim() !== '';
      if (!hasTimeline || !hasOwner) {
        incomplete.push({
          questionId,
          missingTimeline: !hasTimeline,
          missingOwner: !hasOwner,
          data // Include data for debugging
        });
      }
    });
    // Debug: Log incomplete actions to help identify phantom entries
    if (incomplete.length > 0) {
      console.log('[ActionPlanTab] Incomplete actions:', incomplete);
    }
    return incomplete;
  }, [actionPlan, gaps]);

  const canFinalize = actionCounts.total > 0 && incompleteActions.length === 0;

  // VS-41: Report finalization state to parent (for WorkflowSidebar)
  useEffect(() => {
    if (onFinalizationStateChange) {
      onFinalizationStateChange({
        canFinalize,
        incompleteCount: incompleteActions.length,
        selectedCount: actionCounts.total
      });
    }
  }, [canFinalize, incompleteActions.length, actionCounts.total, onFinalizationStateChange]);

  // VS-41: Respond to parent request to show finalization modal
  useEffect(() => {
    if (requestShowModal && !showFinalizeModal) {
      setShowFinalizeModal(true);
      // Notify parent that we've handled the request
      if (onModalClosed) {
        onModalClosed();
      }
    }
  }, [requestShowModal]);

  // VS-41: Manual save handler for ActionSidebar
  function handleSidebarSave() {
    // Already auto-saving, this is just a manual trigger/feedback
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Loading action plan...</div>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MAIN CONTENT - Actions List */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Simulator HUD */}
        <div ref={simulatorRef}>
          <SimulatorHUD
            executionScore={executionScores.current}
            projectedScore={executionScores.projected}
            currentLevel={maturityLevels.current}
            projectedLevel={maturityLevels.projected}
            objectives={objectives}
            projectedByTimeline={projectedByTimeline}
            actionCounts={actionCounts}
            gapsTotal={gaps.length}
            saving={saving}
          />
        </div>

        {/* View Mode Toggle */}
        <div className="bg-white border border-slate-300 rounded-sm p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">View:</span>
            <div className="flex border border-slate-300 rounded overflow-hidden">
              <button
                onClick={() => setViewMode('actions')}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'actions'
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                By Objective
              </button>
              <button
                onClick={() => setViewMode('initiatives')}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'initiatives'
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                By Initiative
              </button>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            {saving ? 'Saving...' : 'Auto-saved'}
          </div>
        </div>

        {/* Command Center - Scrollable Actions/Initiatives List */}
        <CommandCenter
          viewMode={viewMode}
          gaps={gaps}
          initiatives={initiatives}
          objectives={objectives}
          actionPlan={actionPlan}
          onActionToggle={handleActionToggle}
          onTimelineChange={handleTimelineChange}
          onOwnerChange={handleOwnerChange}
          isFinalized={isFinalized}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* SIDEBAR - Actions & Finalization */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 hidden lg:block">
        <ActionSidebar
          companyName={companyName}
          industry={industry}
          pillarName="FP&A"
          // VS-41: Progress tracking props (restored)
          totalGaps={gaps.length}
          selectedCount={actionCounts.total}
          assignedCount={actionCounts.total - actionCounts.unassigned}
          ownerCount={actionCounts.withOwner}
          timelineCounts={{
            '6m': actionCounts['6m'],
            '12m': actionCounts['12m'],
            '24m': actionCounts['24m'],
            unassigned: actionCounts.unassigned
          }}
          onSave={handleSidebarSave}
          saving={saving}
          isFinalized={isFinalized}
          // Wizard trigger
          onOpenWizard={() => setShowWizard(true)}
        />
      </div>

      {/* VS-39/40: Finalization Confirmation Modal */}
      {showFinalizeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-sm max-w-md border border-slate-300 shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Are you sure you want to finalize?</h3>
                <p className="text-sm text-slate-600 mt-1">
                  You are about to lock your {actionCounts.total} selected action{actionCounts.total !== 1 ? 's' : ''} and unlock the Executive Report.
                </p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-sm p-3 mb-4">
              <p className="text-sm text-amber-800">
                <strong>This action cannot be undone.</strong> Once finalized, you will not be able to modify your action plan selections, timelines, or owners.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFinalizeModal(false)}
                disabled={finalizing}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalize}
                disabled={finalizing}
                className="flex-1 px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-sm hover:bg-slate-900 transition-colors disabled:opacity-50"
              >
                {finalizing ? 'Finalizing...' : 'Yes, Finalize'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-sm max-w-md border border-slate-300 shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Diagnostic Complete!</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Thank you for completing the CFO Diagnostic. Your Executive Report is ready.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleViewReport}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-sm hover:bg-slate-900 transition-colors"
              >
                <FileText className="w-4 h-4" />
                View Executive Report
              </button>
              <button
                onClick={handleDownloadPDF}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-sm hover:bg-slate-50 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Download PDF
              </button>
              <button
                onClick={handleReturnHome}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-slate-500 text-sm hover:text-slate-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                Return to Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Planning Intro Modal */}
      {showIntroModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-sm max-w-md border border-slate-300 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Action Planning</h3>
              <p className="text-sm text-slate-600 mt-1">
                Build your action plan with our step-by-step wizard. This is the last step before generating your Executive Report.
              </p>
            </div>

            {/* Action Planning Wizard */}
            <div className="border-2 border-slate-800 rounded-sm p-4 bg-slate-50 mb-3">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900">Action Planning Wizard</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select actions → Assign timelines → Assign owners → Review
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowIntroModal(false);
                  setShowWizard(true);
                  window.localStorage.setItem(`actionPlanIntroSeen:${runId}`, 'true');
                }}
                className="w-full px-4 py-2.5 text-white text-sm font-medium rounded-sm flex items-center justify-center gap-2 transition-colors bg-slate-800 hover:bg-slate-900"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Action Planning</span>
              </button>
            </div>

            {/* Manual Selection */}
            <div className="text-center">
              <button
                onClick={() => {
                  setShowIntroModal(false);
                  window.localStorage.setItem(`actionPlanIntroSeen:${runId}`, 'true');
                }}
                className="px-4 py-2 text-slate-500 text-sm hover:text-slate-700 transition-colors"
              >
                Skip wizard and select manually
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Planning Wizard */}
      <ProgressiveWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        gaps={gaps}
        questions={questions}
        objectives={objectives}
        practices={practices}
        report={report}
        onComplete={handleWizardComplete}
        onSaveDraft={handleSaveDraft}
        onReviewImpact={handleReviewImpact}
        benchmarkData={benchmarkData}
        importanceMap={importanceMap}
      />

      {/* VS-46: Wizard Summary Toast */}
      {wizardSummary && (
        <div className="fixed bottom-4 right-4 bg-white border border-slate-300 rounded-sm shadow-lg p-4 z-40 max-w-sm animate-in slide-in-from-bottom-2">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Action Plan Updated</h4>
              <p className="text-xs text-slate-600 mt-1">
                {wizardSummary.added > 0 && `${wizardSummary.added} action${wizardSummary.added > 1 ? 's' : ''} added`}
                {wizardSummary.added > 0 && wizardSummary.removed > 0 && ', '}
                {wizardSummary.removed > 0 && `${wizardSummary.removed} removed`}
                {wizardSummary.added === 0 && wizardSummary.removed === 0 && 'No changes made'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Review and assign timelines and owners below.
              </p>
            </div>
            <button
              onClick={() => setWizardSummary(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
