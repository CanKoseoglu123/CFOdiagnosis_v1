// src/components/assessment/AssessThemePage.jsx
// VS-30: Reusable theme assessment page with Action Planning design

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ChevronDown, ChevronRight, Loader, AlertTriangle, ArrowLeft, ArrowRight, Send } from 'lucide-react';
import AppShell from '../AppShell';
import EnterpriseCanvas from '../EnterpriseCanvas';
import ChapterHeader from '../ChapterHeader';
import AssessmentSidebar from './AssessmentSidebar';
import QuestionCard from './QuestionCard';

const API_URL = import.meta.env.VITE_API_URL;

// Theme metadata
const THEME_META = {
  foundation: {
    title: 'Foundation',
    subtitle: 'Budget Discipline & Financial Controls',
    description: 'Establish the baseline capabilities for financial accountability and data integrity.',
    objectives: ['obj_budget_discipline', 'obj_financial_controls', 'obj_performance_monitoring']
  },
  future: {
    title: 'Future',
    subtitle: 'Forecasting & Scenario Planning',
    description: 'Build forward-looking capabilities to anticipate and prepare for what\'s ahead.',
    objectives: ['obj_forecasting_agility', 'obj_driver_based_planning', 'obj_scenario_modeling']
  },
  intelligence: {
    title: 'Intelligence',
    subtitle: 'Strategic Influence & Decision Support',
    description: 'Transform finance into a strategic partner that drives business decisions.',
    objectives: ['obj_strategic_influence', 'obj_decision_support', 'obj_operational_excellence']
  }
};

// Objective display names
const OBJECTIVE_NAMES = {
  'obj_budget_discipline': 'Budget Discipline',
  'obj_financial_controls': 'Financial Controls',
  'obj_performance_monitoring': 'Performance Monitoring',
  'obj_forecasting_agility': 'Forecasting Agility',
  'obj_driver_based_planning': 'Driver-Based Planning',
  'obj_scenario_modeling': 'Scenario Modeling',
  'obj_strategic_influence': 'Strategic Influence',
  'obj_decision_support': 'Decision Support',
  'obj_operational_excellence': 'Operational Excellence'
};

// Debounce helper
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export default function AssessThemePage({ themeId }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const runId = searchParams.get('runId');

  const [spec, setSpec] = useState(null);
  const [answers, setAnswers] = useState({});
  const [runContext, setRunContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(new Set(['all']));

  const themeMeta = THEME_META[themeId];

  // Theme order for navigation
  const themeOrder = ['foundation', 'future', 'intelligence'];
  const currentIndex = themeOrder.indexOf(themeId);
  const isFirstTheme = currentIndex === 0;
  const isLastTheme = currentIndex === themeOrder.length - 1;
  const prevTheme = !isFirstTheme ? themeOrder[currentIndex - 1] : null;
  const nextTheme = !isLastTheme ? themeOrder[currentIndex + 1] : null;

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

        // Fetch existing answers
        const inputsRes = await fetch(`${API_URL}/diagnostic-runs/${runId}`, { headers });
        if (inputsRes.ok) {
          const fullRun = await inputsRes.json();
          const existingAnswers = {};
          (fullRun.inputs || []).forEach(input => {
            existingAnswers[input.question_id] = input.value;
          });
          setAnswers(existingAnswers);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [runId, navigate]);

  // Build practice_id → objective_id lookup (v2.9.0 schema)
  const practiceToObjective = useMemo(() => {
    if (!spec?.practices) return {};
    const lookup = {};
    spec.practices.forEach(p => {
      lookup[p.id] = p.objective_id;
    });
    return lookup;
  }, [spec]);

  // Helper: get objective_id for a question (supports both old and new schema)
  const getQuestionObjective = useCallback((q) => {
    // v2.9.0 schema: question.practice_id → practice.objective_id
    if (q.practice_id && practiceToObjective[q.practice_id]) {
      return practiceToObjective[q.practice_id];
    }
    // Fallback for old schema: question.objective_id
    return q.objective_id;
  }, [practiceToObjective]);

  // Get questions for this theme
  const themeQuestions = useMemo(() => {
    if (!spec?.questions) return [];
    return spec.questions.filter(q => {
      const objId = getQuestionObjective(q);
      return themeMeta.objectives.includes(objId);
    });
  }, [spec, themeMeta, getQuestionObjective]);

  // Get all questions for overall progress
  const allQuestions = useMemo(() => spec?.questions || [], [spec]);

  // Group questions by objective
  const questionsByObjective = useMemo(() => {
    const grouped = {};
    themeMeta.objectives.forEach(objId => {
      grouped[objId] = themeQuestions.filter(q => getQuestionObjective(q) === objId);
    });
    return grouped;
  }, [themeQuestions, themeMeta, getQuestionObjective]);

  // Calculate progress for ALL themes (for sidebar)
  const allThemesProgress = useMemo(() => {
    if (!spec?.questions) return {};

    // Helper inline since getQuestionObjective is a callback
    const getObjId = (q) => {
      if (q.practice_id && practiceToObjective[q.practice_id]) {
        return practiceToObjective[q.practice_id];
      }
      return q.objective_id;
    };

    const progress = {};
    Object.entries(THEME_META).forEach(([tId, tMeta]) => {
      const tQuestions = spec.questions.filter(q => tMeta.objectives.includes(getObjId(q)));
      const tAnswered = tQuestions.filter(q => answers[q.id] !== undefined).length;

      const objectives = tMeta.objectives.map(objId => {
        const objQuestions = tQuestions.filter(q => getObjId(q) === objId);
        const objAnswered = objQuestions.filter(q => answers[q.id] !== undefined).length;
        return {
          id: objId,
          name: OBJECTIVE_NAMES[objId] || objId,
          answered: objAnswered,
          total: objQuestions.length
        };
      });

      progress[tId] = {
        answered: tAnswered,
        total: tQuestions.length,
        objectives
      };
    });

    return progress;
  }, [spec, answers, practiceToObjective]);

  // Current theme progress (for local use)
  const themeProgress = useMemo(() => {
    return allThemesProgress[themeId] || { answered: 0, total: 0, objectives: [] };
  }, [allThemesProgress, themeId]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const answered = allQuestions.filter(q => answers[q.id] !== undefined).length;
    return {
      answered,
      total: allQuestions.length
    };
  }, [allQuestions, answers]);

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

  // Handle answer
  function handleAnswer(questionId, value) {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    saveAnswer(questionId, value);
  }

  // Navigation handlers
  function handleBack() {
    if (prevTheme) {
      navigate(`/assess/${prevTheme}?runId=${runId}`);
    }
  }

  function handleNext() {
    if (nextTheme) {
      navigate(`/assess/${nextTheme}?runId=${runId}`);
    }
  }

  async function handleSubmit() {
    if (overallProgress.answered !== overallProgress.total) return;

    try {
      setSaving(true);
      const headers = await getAuthHeaders();

      // Complete the run (409 = already completed, which is OK)
      const completeRes = await fetch(`${API_URL}/diagnostic-runs/${runId}/complete`, {
        method: 'POST',
        headers
      });
      // Allow 409 (already completed) - this happens when returning from report
      if (!completeRes.ok && completeRes.status !== 409) {
        throw new Error('Failed to complete');
      }

      // Score the run (409 = scores already exist, which is OK)
      const scoreRes = await fetch(`${API_URL}/diagnostic-runs/${runId}/score`, {
        method: 'POST',
        headers
      });
      // Allow 409 (scores already exist) - this happens when returning from report
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

  // Toggle objective group
  function toggleGroup(groupId) {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
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
      currentTheme={themeId}
      allThemesProgress={allThemesProgress}
      overallProgress={overallProgress}
      runId={runId}
    />
  );

  // Mobile bottom navigation
  const mobileBottomNav = (
    <>
      {!isFirstTheme && (
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      )}
      <div className="text-xs text-slate-500">
        {themeProgress.answered}/{themeProgress.total}
      </div>
      {isLastTheme ? (
        <button
          onClick={handleSubmit}
          disabled={overallProgress.answered !== overallProgress.total}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded ${
            overallProgress.answered === overallProgress.total
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-200 text-slate-400'
          }`}
        >
          <Send className="w-4 h-4" />
          Submit
        </button>
      ) : (
        <button
          onClick={handleNext}
          disabled={themeProgress.answered !== themeProgress.total}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded ${
            themeProgress.answered === themeProgress.total
              ? 'bg-blue-600 text-white'
              : 'bg-slate-200 text-slate-400'
          }`}
        >
          Next Theme
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </>
  );

  return (
    <AppShell sidebarContent={sidebarContent} mobileBottomNav={mobileBottomNav}>
      <div className="min-h-screen bg-slate-50">
        {/* Chapter Header */}
        <ChapterHeader
          label={`Theme ${currentIndex + 1} of 3`}
          title={themeMeta.title}
          description={themeMeta.description}
          mode="assessment"
        />

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

          {/* Questions by Objective */}
          <div className="space-y-4">
            {themeMeta.objectives.map((objId) => {
              const questions = questionsByObjective[objId] || [];
              const isExpanded = expandedGroups.has(objId) || expandedGroups.has('all');
              const answeredCount = questions.filter(q => answers[q.id] !== undefined).length;
              const allAnswered = answeredCount === questions.length;

              if (questions.length === 0) return null;

              return (
                <div
                  key={objId}
                  className="bg-white border border-slate-300 rounded-sm overflow-hidden"
                >
                  {/* Objective Header */}
                  <button
                    onClick={() => toggleGroup(objId)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                    <div className="flex-1 text-left">
                      <span className="font-semibold text-slate-700">
                        {OBJECTIVE_NAMES[objId] || objId}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {allAnswered && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          Complete
                        </span>
                      )}
                      <span className="text-sm text-slate-500">
                        {answeredCount}/{questions.length}
                      </span>
                    </div>
                  </button>

                  {/* Questions List */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 p-4 space-y-3 bg-slate-50">
                      {questions.map((question, idx) => (
                        <QuestionCard
                          key={question.id}
                          question={question}
                          answer={answers[question.id]}
                          onAnswer={handleAnswer}
                          index={idx}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Navigation (Desktop) */}
          <div className="mt-8 flex items-center justify-between">
            {!isFirstTheme ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous Theme
              </button>
            ) : (
              <div />
            )}

            {isLastTheme ? (
              <button
                onClick={handleSubmit}
                disabled={overallProgress.answered !== overallProgress.total}
                className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded transition-colors ${
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
            ) : (
              <button
                onClick={handleNext}
                disabled={themeProgress.answered !== themeProgress.total}
                className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded transition-colors ${
                  themeProgress.answered === themeProgress.total
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {themeProgress.answered === themeProgress.total
                  ? 'Next Theme'
                  : `${themeProgress.total - themeProgress.answered} questions remaining`}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </EnterpriseCanvas>
      </div>
    </AppShell>
  );
}
