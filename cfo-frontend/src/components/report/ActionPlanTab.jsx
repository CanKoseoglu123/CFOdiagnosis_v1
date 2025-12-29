// src/components/report/ActionPlanTab.jsx
// VS-28 + VS-32d: Action Planning with AI-Powered Proposal Generation
// Modes: idle → wizard → generating → proposal → (manual editing)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import SimulatorHUD from './SimulatorHUD';
import CommandCenter from './CommandCenter';
import ActionSidebar from './ActionSidebar';
import { PlanningWizard } from './PlanningWizard';
import { ActionNarrative } from './ActionNarrative';
import { ActionCard } from './ActionCard';

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
  industry
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
  // VS-32d: Planning mode state
  // 'idle' = no plan, show start button
  // 'wizard' = showing planning wizard
  // 'generating' = AI is generating proposal
  // 'proposal' = showing AI proposal for review
  // 'manual' = traditional manual editing mode
  const [planMode, setPlanMode] = useState('idle');

  // VS-32d: AI-generated proposal
  const [proposal, setProposal] = useState(null);
  const [proposalError, setProposalError] = useState(null);

  // View mode: 'actions' or 'initiatives'
  const [viewMode, setViewMode] = useState('actions');

  // Action plan state - map of question_id -> { timeline, assigned_owner, status }
  const [actionPlan, setActionPlan] = useState({});

  // Loading state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        // VS-32d: If there's already a saved plan, go to manual mode
        if (Object.keys(planMap).length > 0) {
          setPlanMode('manual');
        }
      }
    } catch (err) {
      console.error('Failed to fetch action plan:', err);
    } finally {
      setLoading(false);
    }
  }

  // VS-32d: Generate AI proposal after wizard completion
  async function handleWizardComplete(planning) {
    setPlanMode('generating');
    setProposalError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/action-plan/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ planning })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate action plan');
      }

      const data = await res.json();
      setProposal(data.proposal);
      setPlanMode('proposal');
    } catch (err) {
      console.error('Failed to generate proposal:', err);
      setProposalError(err.message);
      setPlanMode('wizard'); // Go back to wizard on error
    }
  }

  // VS-32d: Accept AI proposal and save as action plan
  async function handleAcceptProposal() {
    if (!proposal?.actions) return;

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Save each action from the proposal
      for (const action of proposal.actions) {
        await fetch(`${API_URL}/diagnostic-runs/${runId}/action-plan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            question_id: action.question_id,
            timeline: action.timeline,
            status: 'planned'
          })
        });
      }

      // Update local state
      const newPlan = {};
      proposal.actions.forEach(action => {
        newPlan[action.question_id] = {
          timeline: action.timeline,
          assigned_owner: null,
          status: 'planned'
        };
      });
      setActionPlan(newPlan);
      setPlanMode('manual');
    } catch (err) {
      console.error('Failed to save proposal:', err);
    } finally {
      setSaving(false);
    }
  }

  // VS-32d: Update a proposed action's timeline
  function handleProposalTimelineChange(questionId, newTimeline) {
    if (!proposal) return;
    setProposal(prev => ({
      ...prev,
      actions: prev.actions.map(a =>
        a.question_id === questionId ? { ...a, timeline: newTimeline } : a
      )
    }));
  }

  // VS-32d: Remove a proposed action
  function handleProposalRemove(questionId) {
    if (!proposal) return;
    setProposal(prev => ({
      ...prev,
      actions: prev.actions.filter(a => a.question_id !== questionId)
    }));
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

  // Count selected actions by timeline
  const actionCounts = useMemo(() => {
    const counts = { total: 0, '6m': 0, '12m': 0, '24m': 0, unassigned: 0 };
    Object.values(actionPlan).forEach(a => {
      counts.total++;
      if (a.timeline === '6m') counts['6m']++;
      else if (a.timeline === '12m') counts['12m']++;
      else if (a.timeline === '24m') counts['24m']++;
      else counts.unassigned++;
    });
    return counts;
  }, [actionPlan]);

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

  // VS-32d: Show idle state with start button
  if (planMode === 'idle') {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">
            Create Your Action Plan
          </h2>
          <p className="text-slate-600 mb-8">
            Our AI will analyze your diagnostic results and generate a prioritized action plan
            tailored to your goals and capacity.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setPlanMode('wizard')}
              className="px-6 py-3 bg-primary text-white font-medium hover:bg-primary-hover"
            >
              Start Planning
            </button>
            <button
              onClick={() => setPlanMode('manual')}
              className="px-6 py-3 border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Build Manually
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VS-32d: Show planning wizard
  if (planMode === 'wizard') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        {proposalError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700">
            {proposalError}
          </div>
        )}
        <PlanningWizard
          currentLevel={report?.maturity?.achieved_level || 1}
          teamSizeKnown={!!report?.context?.pillar?.ftes}
          onComplete={handleWizardComplete}
        />
        <div className="mt-6 text-center">
          <button
            onClick={() => setPlanMode('idle')}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // VS-32d: Show generating state
  if (planMode === 'generating') {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-primary mb-4"></div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Generating Your Action Plan
          </h2>
          <p className="text-slate-600">
            Analyzing your diagnostic results and prioritizing actions...
          </p>
        </div>
      </div>
    );
  }

  // VS-32d: Show AI proposal for review
  if (planMode === 'proposal' && proposal) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Recommended Action Plan
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Review and adjust the AI-generated proposal, then accept to save.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setPlanMode('wizard')}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Regenerate
            </button>
            <button
              onClick={handleAcceptProposal}
              disabled={saving || !proposal.actions?.length}
              className="px-4 py-2 bg-primary text-white font-medium hover:bg-primary-hover disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Accept Plan'}
            </button>
          </div>
        </div>

        {/* Narrative (SCAO format) */}
        <ActionNarrative narrative={proposal.narrative} />

        {/* Summary stats */}
        {proposal.summary && (
          <div className="bg-white border border-slate-200 p-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-semibold text-slate-900">
                  {proposal.summary.total_actions}
                </div>
                <div className="text-xs text-slate-500 uppercase">Total Actions</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-amber-600">
                  {proposal.summary.by_timeline?.['6m'] || 0}
                </div>
                <div className="text-xs text-slate-500 uppercase">6 Months</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-blue-600">
                  {proposal.summary.by_timeline?.['12m'] || 0}
                </div>
                <div className="text-xs text-slate-500 uppercase">12 Months</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-slate-600">
                  {proposal.summary.by_timeline?.['24m'] || 0}
                </div>
                <div className="text-xs text-slate-500 uppercase">24 Months</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions list */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
            Proposed Actions
          </h3>
          {proposal.actions?.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-slate-200 text-center text-slate-500">
              No actions in the proposal. Your diagnostic shows no significant gaps.
            </div>
          ) : (
            proposal.actions?.map((action) => (
              <ActionCard
                key={action.question_id}
                action={action}
                onTimelineChange={handleProposalTimelineChange}
                onRemove={handleProposalRemove}
              />
            ))
          )}
        </div>
      </div>
    );
  }

  // VS-28: Manual editing mode (original implementation)
  return (
    <div className="flex gap-4">
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MAIN CONTENT - Actions List */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* VS-32d: Option to regenerate with AI */}
        {planMode === 'manual' && (
          <div className="bg-slate-50 border border-slate-200 p-4 flex items-center justify-between">
            <span className="text-sm text-slate-600">
              {Object.keys(actionPlan).length > 0
                ? `${Object.keys(actionPlan).length} actions in your plan`
                : 'Build your action plan manually or use AI'}
            </span>
            <button
              onClick={() => setPlanMode('wizard')}
              className="text-sm text-primary hover:underline"
            >
              Generate with AI
            </button>
          </div>
        )}

        {/* Simulator HUD */}
        <SimulatorHUD
          executionScore={executionScores.current}
          projectedScore={executionScores.projected}
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
          timelineCounts={actionCounts}
          onBack={handleSidebarBack}
          onProceed={handleSidebarProceed}
          onSave={handleSidebarSave}
          saving={saving}
          canProceed={actionCounts.total > 0}
        />
      </div>
    </div>
  );
}
