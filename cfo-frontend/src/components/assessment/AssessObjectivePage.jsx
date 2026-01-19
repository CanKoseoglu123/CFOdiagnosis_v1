// src/components/assessment/AssessObjectivePage.jsx
// VS-44: Objective-based assessment pages (9 pages, one per objective)

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader, AlertTriangle, ArrowLeft, ArrowRight, Send, FileText, Info } from 'lucide-react';
import AppShell from '../AppShell';
import EnterpriseCanvas from '../EnterpriseCanvas';
import ChapterHeader from '../ChapterHeader';
import AssessmentSidebar from './AssessmentSidebar';
import QuestionCard from './QuestionCard';
import useStepTransition from '../../hooks/useStepTransition';

const API_URL = import.meta.env.VITE_API_URL;

// Objective order (linear progression)
const OBJECTIVE_ORDER = [
  'obj_budget_discipline',
  'obj_financial_controls',
  'obj_performance_monitoring',
  'obj_forecasting_agility',
  'obj_driver_based_planning',
  'obj_scenario_modeling',
  'obj_strategic_influence',
  'obj_decision_support',
  'obj_operational_excellence'
];

// Objective metadata
const OBJECTIVE_META = {
  obj_budget_discipline: {
    title: 'Budget Discipline',
    description: 'Establish a baseline of financial accountability.',
    theme: 'foundation',
    themeLabel: 'Foundation'
  },
  obj_financial_controls: {
    title: 'Financial Controls',
    description: 'Ensure analytical integrity through model governance and assumption management.',
    theme: 'foundation',
    themeLabel: 'Foundation'
  },
  obj_performance_monitoring: {
    title: 'Performance Monitoring',
    description: 'Create feedback loops to track actuals against the plan.',
    theme: 'foundation',
    themeLabel: 'Foundation'
  },
  obj_forecasting_agility: {
    title: 'Forecasting Agility',
    description: 'Update the financial outlook frequently and efficiently.',
    theme: 'future',
    themeLabel: 'Future'
  },
  obj_driver_based_planning: {
    title: 'Driver-Based Planning',
    description: 'Link financial outcomes to operational inputs.',
    theme: 'future',
    themeLabel: 'Future'
  },
  obj_scenario_modeling: {
    title: 'Scenario Modeling',
    description: 'Enable confident decision-making when conditions deviate from plan.',
    theme: 'future',
    themeLabel: 'Future'
  },
  obj_strategic_influence: {
    title: 'Strategic Influence',
    description: 'Proactively shape commercial decisions through financial insight.',
    theme: 'intelligence',
    themeLabel: 'Intelligence'
  },
  obj_decision_support: {
    title: 'Decision Support',
    description: 'Deliver accessible, actionable financial insights to decision-makers.',
    theme: 'intelligence',
    themeLabel: 'Intelligence'
  },
  obj_operational_excellence: {
    title: 'Operational Excellence',
    description: 'Run the finance function with maximum efficiency.',
    theme: 'intelligence',
    themeLabel: 'Intelligence'
  }
};

// Debounce helper
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Check if element is sufficiently visible in viewport (answer buttons must be visible)
function isElementVisible(el) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  // Element is "visible" only if it's well within the viewport
  // Use 200px cushion to trigger scroll more readily
  return rect.top < windowHeight - 200 && rect.bottom > 200;
}

export default function AssessObjectivePage() {
  const navigate = useNavigate();
  const { objectiveId } = useParams();
  const [searchParams] = useSearchParams();
  const runId = searchParams.get('runId');
  const editMode = searchParams.get('editMode') === 'true';
  const { updateProgress } = useStepTransition();

  const [spec, setSpec] = useState(null);
  const [runStatus, setRunStatus] = useState(null);
  const [answers, setAnswers] = useState({});
  const [runContext, setRunContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [showNaConfirmModal, setShowNaConfirmModal] = useState(false);
  const [pendingNaQuestionId, setPendingNaQuestionId] = useState(null);
  const objectiveMeta = OBJECTIVE_META[objectiveId];

  // Refs for question cards (used for auto-scroll)
  const questionRefs = useRef({});

  // Navigation calculation
  const currentIndex = OBJECTIVE_ORDER.indexOf(objectiveId);
  const isFirstObjective = currentIndex === 0;
  const isLastObjective = currentIndex === OBJECTIVE_ORDER.length - 1;
  const prevObjective = !isFirstObjective ? OBJECTIVE_ORDER[currentIndex - 1] : null;
  const nextObjective = !isLastObjective ? OBJECTIVE_ORDER[currentIndex + 1] : null;

  // Validate objective ID
  useEffect(() => {
    if (!objectiveMeta) {
      setError(`Invalid objective: ${objectiveId}`);
      setLoading(false);
    }
  }, [objectiveId, objectiveMeta]);

  // Get auth headers
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  };

  // Fetch spec and run data
  useEffect(() => {
    if (!runId) {
      setError('No diagnostic run specified');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = await getAuthHeaders();

        // Fetch spec and run in parallel
        const [specRes, runRes] = await Promise.all([
          fetch(`${API_URL}/api/spec`),
          fetch(`${API_URL}/diagnostic-runs/${runId}`, { headers })
        ]);

        if (!specRes.ok) throw new Error('Failed to load questions');
        if (!runRes.ok) throw new Error('Diagnostic run not found');

        const specData = await specRes.json();
        const runData = await runRes.json();

        // Gate: If setup not completed, redirect
        if (!runData.setup_completed_at) {
          navigate(`/run/${runId}/setup/company`);
          return;
        }

        setSpec(specData);
        setRunContext(runData.context);
        setRunStatus(runData.status);

        // Load existing answers
        const existingAnswers = {};
        (runData.inputs || []).forEach(input => {
          existingAnswers[input.question_id] = input.value;
        });
        setAnswers(existingAnswers);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [runId, navigate]);

  // Build practice_id -> objective_id lookup
  const practiceToObjective = useMemo(() => {
    if (!spec?.practices) return {};
    const lookup = {};
    spec.practices.forEach(p => {
      lookup[p.id] = p.objective_id;
    });
    return lookup;
  }, [spec]);

  // Build N/A question ID set from na_rules
  const naQuestionIds = useMemo(() => {
    if (!spec?.na_rules) return new Set();
    return new Set(spec.na_rules.map(rule => rule.question_id));
  }, [spec]);

  // Check if a question allows N/A
  const questionAllowsNa = useCallback((questionId) => {
    return naQuestionIds.has(questionId);
  }, [naQuestionIds]);

  // Handle N/A button click - shows confirmation modal
  const handleNaClick = useCallback((questionId) => {
    setPendingNaQuestionId(questionId);
    setShowNaConfirmModal(true);
  }, []);

  // Confirm N/A selection
  const confirmNaSelection = useCallback(() => {
    if (pendingNaQuestionId) {
      handleAnswer(pendingNaQuestionId, 'N/A');
    }
    setShowNaConfirmModal(false);
    setPendingNaQuestionId(null);
  }, [pendingNaQuestionId]);

  // Cancel N/A selection
  const cancelNaSelection = useCallback(() => {
    setShowNaConfirmModal(false);
    setPendingNaQuestionId(null);
  }, []);

  // Helper: get objective_id for a question
  const getQuestionObjective = useCallback((q) => {
    if (q.practice_id && practiceToObjective[q.practice_id]) {
      return practiceToObjective[q.practice_id];
    }
    return q.objective_id;
  }, [practiceToObjective]);

  // Get questions for this objective
  const objectiveQuestions = useMemo(() => {
    if (!spec?.questions) return [];
    return spec.questions.filter(q => getQuestionObjective(q) === objectiveId);
  }, [spec, objectiveId, getQuestionObjective]);

  // Get all questions for overall progress
  const allQuestions = useMemo(() => spec?.questions || [], [spec]);

  // Calculate progress for ALL objectives (for sidebar)
  const allObjectivesProgress = useMemo(() => {
    if (!spec?.questions) return {};

    const getObjId = (q) => {
      if (q.practice_id && practiceToObjective[q.practice_id]) {
        return practiceToObjective[q.practice_id];
      }
      return q.objective_id;
    };

    const progress = {};
    OBJECTIVE_ORDER.forEach(objId => {
      const objQuestions = spec.questions.filter(q => getObjId(q) === objId);
      const objAnswered = objQuestions.filter(q => answers[q.id] !== undefined).length;
      progress[objId] = {
        answered: objAnswered,
        total: objQuestions.length
      };
    });

    return progress;
  }, [spec, answers, practiceToObjective]);

  // Current objective progress
  const objectiveProgress = useMemo(() => {
    return allObjectivesProgress[objectiveId] || { answered: 0, total: 0 };
  }, [allObjectivesProgress, objectiveId]);

  // Overall progress
  const overallProgress = useMemo(() => {
    const answered = allQuestions.filter(q => answers[q.id] !== undefined).length;
    return {
      answered,
      total: allQuestions.length
    };
  }, [allQuestions, answers]);

  // Gate check: Can user access this objective?
  const canAccessObjective = useMemo(() => {
    if (currentIndex === 0) return true; // First objective always accessible

    // Check all previous objectives are complete
    for (let i = 0; i < currentIndex; i++) {
      const prevObjId = OBJECTIVE_ORDER[i];
      const prevProgress = allObjectivesProgress[prevObjId];
      if (!prevProgress || prevProgress.answered < prevProgress.total) {
        return false;
      }
    }
    return true;
  }, [currentIndex, allObjectivesProgress]);

  // Redirect if trying to access locked objective
  useEffect(() => {
    if (!loading && spec && !canAccessObjective) {
      // Find first incomplete objective
      for (let i = 0; i < OBJECTIVE_ORDER.length; i++) {
        const objId = OBJECTIVE_ORDER[i];
        const progress = allObjectivesProgress[objId];
        if (!progress || progress.answered < progress.total) {
          navigate(`/assess/objective/${objId}?runId=${runId}`, { replace: true });
          return;
        }
      }
    }
  }, [loading, spec, canAccessObjective, allObjectivesProgress, runId, navigate]);

  // Show intro modal once per run on first MCQ page
  useEffect(() => {
    if (loading || !isFirstObjective || !runId) return;
    const storageKey = `assessmentIntroSeen:${runId}`;
    const hasSeen = window.localStorage.getItem(storageKey);
    if (!hasSeen) {
      setShowIntroModal(true);
      // Note: localStorage is set when user dismisses modal, not here
      // This prevents StrictMode double-mount from hiding the modal
    }
  }, [loading, isFirstObjective, runId]);

  // Debounced save
  const saveAnswer = useCallback(
    debounce(async (questionId, value) => {
      if (!runId) return;
      try {
        setSaving(true);
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/diagnostic-inputs`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ run_id: runId, question_id: questionId, value })
        });
        if (!res.ok) throw new Error('Failed to save');
      } catch (err) {
        console.error('Save failed:', err);
        setError('Failed to save answer');
      } finally {
        setSaving(false);
      }
    }, 300),
    [runId]
  );

  // Handle answer with auto-scroll
  function handleAnswer(questionId, value) {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    saveAnswer(questionId, value);

    // Auto-scroll logic: check visibility synchronously
    // Build current answer state including the answer we just set
    const updatedAnswers = { ...answers, [questionId]: value };

    // Find all visible unanswered questions (excluding the one we just answered)
    const visibleUnanswered = objectiveQuestions.filter(q => {
      if (q.id === questionId) return false; // Exclude just-answered
      if (updatedAnswers[q.id] !== undefined) return false; // Exclude already answered
      return isElementVisible(questionRefs.current[q.id]);
    });

    // If no other visible unanswered questions, scroll to next unanswered
    if (visibleUnanswered.length === 0) {
      const answeredIndex = objectiveQuestions.findIndex(q => q.id === questionId);

      // Find next unanswered question AFTER current one
      const nextUnanswered = objectiveQuestions.find(
        (q, idx) => idx > answeredIndex && updatedAnswers[q.id] === undefined
      );

      if (nextUnanswered && questionRefs.current[nextUnanswered.id]) {
        // Small delay for visual feedback before scrolling
        setTimeout(() => {
          questionRefs.current[nextUnanswered.id].scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }, 150);
      }
    }
  }

  // Track progress when objective changes (debounced)
  useEffect(() => {
    if (!runId || !objectiveId || loading) return;

    // Calculate progress percentage
    const totalQuestions = allQuestions.length || 97; // Default to 97 total questions
    const answeredCount = Object.keys(answers).filter(k => answers[k] !== undefined).length;
    const progressPct = Math.round((answeredCount / totalQuestions) * 100);

    // Update progress tracking (fire-and-forget)
    updateProgress(runId, objectiveId, progressPct);
  }, [runId, objectiveId, loading]); // Only update when objective changes, not on every answer

  // Navigation handlers
  function handleBack() {
    if (isFirstObjective) {
      navigate(`/run/${runId}/setup/pillar?review=true`);
    } else if (prevObjective) {
      navigate(`/assess/objective/${prevObjective}?runId=${runId}`);
    }
  }

  async function handleNext() {
    if (nextObjective) {
      // Calculate current progress before navigating
      const totalQuestions = allQuestions.length || 97;
      const answeredCount = Object.keys(answers).filter(k => answers[k] !== undefined).length;
      const progressPct = Math.round((answeredCount / totalQuestions) * 100);

      // Update progress with next objective as the target
      await updateProgress(runId, nextObjective, progressPct);
      navigate(`/assess/objective/${nextObjective}?runId=${runId}`);
    }
  }

  async function handleSubmit() {
    if (overallProgress.answered !== overallProgress.total) return;

    try {
      setSaving(true);
      const headers = await getAuthHeaders();

      // Complete the run
      const completeRes = await fetch(`${API_URL}/diagnostic-runs/${runId}/complete`, {
        method: 'POST',
        headers
      });
      if (!completeRes.ok && completeRes.status !== 409) {
        throw new Error('Failed to complete');
      }

      // Score the run
      const scoreRes = await fetch(`${API_URL}/diagnostic-runs/${runId}/score`, {
        method: 'POST',
        headers
      });
      if (!scoreRes.ok && scoreRes.status !== 409) {
        throw new Error('Failed to score');
      }

      // Navigate to calibration
      navigate(`/run/${runId}/calibrate`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <div className="text-slate-500">Loading assessment...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !spec) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white border border-red-200 rounded-lg p-6 max-w-md text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <div className="text-red-700 font-medium mb-2">Error</div>
          <div className="text-slate-600 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  // Sidebar content
  const sidebarContent = (
    <AssessmentSidebar
      currentObjective={objectiveId}
      allObjectivesProgress={allObjectivesProgress}
      overallProgress={overallProgress}
      runId={runId}
    />
  );

  // Check if current objective is complete (for Next button)
  const objectiveComplete = objectiveProgress.answered === objectiveProgress.total;

  // Determine if we're in edit mode (editing a completed assessment)
  const isEditingCompleted = editMode || runStatus === 'completed' || runStatus === 'locked';

  // Handler to return to report
  function handleBackToReport() {
    navigate(`/report/${runId}`);
  }

  // Mobile bottom navigation
  const mobileBottomNav = (
    <>
      <button
        onClick={handleBack}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      <div className="text-xs text-slate-500">
        {objectiveProgress.answered}/{objectiveProgress.total}
      </div>
      {isLastObjective ? (
        isEditingCompleted ? (
          <button
            onClick={handleBackToReport}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-sm"
          >
            <FileText className="w-4 h-4" />
            Report
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={overallProgress.answered !== overallProgress.total}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-sm ${
              overallProgress.answered === overallProgress.total
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 text-slate-400'
            }`}
          >
            <Send className="w-4 h-4" />
            Submit
          </button>
        )
      ) : (
        <button
          onClick={handleNext}
          disabled={!objectiveComplete}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-sm ${
            objectiveComplete
              ? 'bg-blue-600 text-white'
              : 'bg-slate-200 text-slate-400'
          }`}
        >
          Next
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </>
  );

  return (
    <AppShell sidebarContent={sidebarContent} mobileBottomNav={mobileBottomNav}>
      <div className="min-h-screen bg-slate-50">
        {/* Intro Modal */}
        {showIntroModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-sm max-w-lg w-full border border-slate-300 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-800">Assessment Questions</h3>
              <p className="text-sm text-slate-600 mt-2">
                Thanks for providing contextual information. This will be valuable in the diagnostic and in deriving the right action plan.
              </p>
              <p className="text-sm text-slate-600 mt-2">
                We now have a set of questions that will lead you to the reporting section. Thank you for your focus.
              </p>
              <p className="text-sm text-slate-600 mt-2">
                We recommend completing the assessment in one sitting, but you can save and return at any time.
              </p>
              <p className="text-sm text-slate-600 mt-2">
                If it’s not clear why a question is being asked, click the ? icon in the top right for an explanation.
              </p>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => {
                    setShowIntroModal(false);
                    // Mark as seen only when user explicitly dismisses
                    window.localStorage.setItem(`assessmentIntroSeen:${runId}`, 'true');
                  }}
                  className="px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-sm hover:bg-slate-900 transition-colors"
                >
                  Start Questions
                </button>
              </div>
            </div>
          </div>
        )}

        {/* N/A Confirmation Modal */}
        {showNaConfirmModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-sm max-w-lg w-full border border-slate-300 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-800">Confirm Not Applicable</h3>
              <p className="text-sm text-slate-600 mt-3">
                By selecting <strong>N/A</strong>, you confirm that this capability is handled by another department
                (e.g., Treasury, Operations) and is <strong>not in scope</strong> of this Finance diagnostic.
              </p>
              <p className="text-sm text-slate-500 mt-2">
                This question will be excluded from your maturity score calculation.
              </p>
              <div className="flex justify-end gap-3 mt-5">
                <button
                  onClick={cancelNaSelection}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmNaSelection}
                  className="px-4 py-2.5 bg-slate-700 text-white text-sm font-medium rounded-sm hover:bg-slate-800 transition-colors"
                >
                  Confirm N/A
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chapter Header */}
        <ChapterHeader
          label={`Objective ${currentIndex + 1} of 9 | ${objectiveMeta?.themeLabel || ''}`}
          title={objectiveMeta?.title || objectiveId}
          description={objectiveMeta?.description || ''}
          mode="assessment"
        />

        {/* Edit Mode Banner */}
        {isEditingCompleted && (
          <div className="bg-blue-50 border-b border-blue-200">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-700">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  Editing completed assessment. Changes are auto-saved and will require score recalculation.
                </span>
              </div>
              <button
                onClick={handleBackToReport}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-sm hover:bg-blue-50 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Back to Report
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <EnterpriseCanvas mode="assessment" className="py-6">
          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}

          {/* Questions List (flat, no collapsible) */}
          <div className="space-y-3">
            {objectiveQuestions.map((question, idx) => (
              <div
                key={question.id}
                ref={(el) => { questionRefs.current[question.id] = el; }}
              >
                <QuestionCard
                  question={question}
                  answer={answers[question.id]}
                  onAnswer={handleAnswer}
                  index={idx}
                  allowNa={questionAllowsNa(question.id)}
                  onNaClick={handleNaClick}
                />
              </div>
            ))}
          </div>

          {/* Bottom Navigation (Desktop) */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-sm hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {isFirstObjective ? 'Back to Setup' : 'Previous Objective'}
            </button>

            <div className="flex items-center gap-3">
              {/* Done Editing button - shown when editing completed assessment */}
              {isEditingCompleted && (
                <button
                  onClick={handleBackToReport}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-sm hover:bg-slate-50 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Done Editing
                </button>
              )}

              {/* Next/Submit buttons */}
              {isLastObjective ? (
                isEditingCompleted ? (
                  /* When editing, show "Back to Report" as primary action */
                  <button
                    onClick={handleBackToReport}
                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Return to Report
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={overallProgress.answered !== overallProgress.total}
                    className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-sm transition-colors ${
                      overallProgress.answered === overallProgress.total
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    {overallProgress.answered === overallProgress.total
                      ? 'Submit Assessment'
                      : `${overallProgress.total - overallProgress.answered} questions remaining`}
                  </button>
                )
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!objectiveComplete}
                  className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-sm transition-colors ${
                    objectiveComplete
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {objectiveComplete
                    ? 'Next Objective'
                    : `${objectiveProgress.total - objectiveProgress.answered} questions remaining`}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </EnterpriseCanvas>
      </div>
    </AppShell>
  );
}
