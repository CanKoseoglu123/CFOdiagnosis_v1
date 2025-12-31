// src/components/report/ActionPlanTab.jsx
// VS-28: Action Planning & Simulator - War Room for maturity improvement
// VS-39: Added finalization modal and API call
// Includes ActionSidebar inside content container for interactive metrics

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import SimulatorHUD from './SimulatorHUD';
import CommandCenter from './CommandCenter';
import ActionSidebar from './ActionSidebar';
import { AlertTriangle } from 'lucide-react';

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
  onFinalized  // VS-39: Callback when finalization completes (parent refetches + switches tab)
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

  // VS-39: Derive finalization status from report (NOT separate state)
  const isFinalized = !!report?.finalized_at;

  // Fetch existing action plan on mount
  useEffect(() => {
    if (runId) {
      fetchActionPlan();
    }
  }, [runId]);

  async function fetchActionPlan() {
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
        // Convert array to map keyed by question_id
        const planMap = {};
        items.forEach(item => {
          planMap[item.question_id] = {
            timeline: item.timeline,
            assigned_owner: item.assigned_owner,
            status: item.status
          };
        });
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
        // Tell parent to refetch report + switch to Executive tab
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
    // Thresholds: <40=L1, 40-64=L2, 65-84=L3, 85+=L4
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
  const actionCounts = useMemo(() => {
    const counts = { total: 0, '6m': 0, '12m': 0, '24m': 0, unassigned: 0, withOwner: 0 };
    Object.values(actionPlan).forEach(a => {
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
  }, [actionPlan]);

  // VS-40: Check if all selected actions have both timeline AND owner
  const incompleteActions = useMemo(() => {
    const incomplete = [];
    Object.entries(actionPlan).forEach(([questionId, data]) => {
      const hasTimeline = data.timeline && ['6m', '12m', '24m'].includes(data.timeline);
      const hasOwner = data.assigned_owner && data.assigned_owner.trim() !== '';
      if (!hasTimeline || !hasOwner) {
        incomplete.push({
          questionId,
          missingTimeline: !hasTimeline,
          missingOwner: !hasOwner
        });
      }
    });
    return incomplete;
  }, [actionPlan]);

  const canFinalize = actionCounts.total > 0 && incompleteActions.length === 0;

  // Sidebar navigation handlers
  function handleSidebarBack() {
    // Could scroll to top or change view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSidebarProceed() {
    // Show completion message
    alert('Action plan saved! Your selections have been automatically saved.');
  }

  function handleSidebarSave() {
    // Already auto-saving, this is just a manual trigger indication
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
      {/* SIDEBAR - Planning Progress (inside content container) */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 hidden lg:block">
        <ActionSidebar
          companyName={companyName}
          industry={industry}
          pillarName="FP&A"
          totalGaps={gaps.length}
          selectedCount={actionCounts.total}
          assignedCount={actionCounts['6m'] + actionCounts['12m'] + actionCounts['24m']}
          ownerCount={actionCounts.withOwner}
          timelineCounts={actionCounts}
          onBack={handleSidebarBack}
          onProceed={handleSidebarProceed}
          onSave={handleSidebarSave}
          saving={saving}
          canProceed={actionCounts.total > 0}
          // VS-39: Finalization props
          isFinalized={isFinalized}
          onRequestFinalize={() => setShowFinalizeModal(true)}
          disabled={loading || !report}
          // VS-40: Validation for finalization
          canFinalize={canFinalize}
          incompleteCount={incompleteActions.length}
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
    </div>
  );
}
