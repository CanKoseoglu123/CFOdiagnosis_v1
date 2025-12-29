// cfo-frontend/src/components/report/OverviewTab.jsx
// VS-32c: AI Overview tab with Critic + Clarifying Questions pipeline
// Shows PipelineProgress, handles clarifying questions, displays overview sections

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { RefreshCw, AlertTriangle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import OverviewSection from './OverviewSection';
import PipelineProgress from './PipelineProgress';
import ClarifyingQuestions from './ClarifyingQuestions';

const API_URL = import.meta.env.VITE_API_URL;
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120000; // 2 minutes for VS-32c pipeline

/**
 * OverviewTab - Manages the VS-32c AI interpretation pipeline
 *
 * Pipeline stages:
 * - pending: Not started
 * - generating: Initial AI draft
 * - heuristics: Quality check
 * - critic: Assessing gaps
 * - awaiting_answers: Waiting for user clarifications
 * - rewriting: Incorporating answers
 * - completed: Final report ready
 * - failed: Error occurred
 *
 * @param {string} runId - The diagnostic run ID
 */
export default function OverviewTab({ runId }) {
  // VS-32c pipeline state
  const [pipelineState, setPipelineState] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState(null);
  const [showWarnings, setShowWarnings] = useState(false);

  // Get auth token helper
  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  // Fetch current pipeline status
  const fetchStatus = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        if (res.status === 404) {
          // No session yet - show start button
          setPipelineState(null);
          return;
        }
        throw new Error('Failed to fetch status');
      }

      const data = await res.json();
      setPipelineState(data);

      if (data.status === 'failed') {
        setError(data.error_message || 'Pipeline failed');
      }
    } catch (err) {
      console.error('Fetch status failed:', err);
    }
  }, [runId]);

  // Initial fetch on mount
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll while pipeline is active (not awaiting_answers, completed, or failed)
  useEffect(() => {
    const activeStages = ['pending', 'generating', 'heuristics', 'critic', 'rewriting'];
    const currentStage = pipelineState?.status;

    if (!currentStage || !activeStages.includes(currentStage)) return;

    let pollCount = 0;
    const maxPolls = POLL_TIMEOUT_MS / POLL_INTERVAL_MS;

    const interval = setInterval(() => {
      pollCount++;
      if (pollCount >= maxPolls) {
        clearInterval(interval);
        setError('Pipeline timed out. Please try again.');
        return;
      }
      fetchStatus();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [pipelineState?.status, fetchStatus]);

  // Start the pipeline
  const handleStart = async () => {
    setIsStarting(true);
    setError(null);

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret/start`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to start interpretation');
      }

      const data = await res.json();
      setPipelineState({
        status: 'generating',
        session_id: data.session_id,
        loop_round: 1
      });
    } catch (err) {
      console.error('Start failed:', err);
      setError(err.message);
    } finally {
      setIsStarting(false);
    }
  };

  // Submit clarifying question answers
  const handleSubmitAnswers = async (answers) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret/answer`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit answers');
      }

      // Pipeline continues - start polling
      setPipelineState(prev => ({
        ...prev,
        status: 'rewriting'
      }));
    } catch (err) {
      console.error('Submit answers failed:', err);
      setError(err.message);
    }
  };

  // Retry after failure
  const handleRetry = () => {
    setError(null);
    setPipelineState(null);
    handleStart();
  };

  // No session yet - show start button
  if (!pipelineState) {
    return (
      <div className="bg-white border border-slate-200 rounded-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-sm bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900">Generate AI Analysis</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Get personalized insights based on your diagnostic results.
              Our AI will analyze your data and may ask a few targeted questions to refine the analysis.
            </p>
            <button
              onClick={handleStart}
              disabled={isStarting}
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-sm hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isStarting ? 'Starting...' : 'Generate Analysis'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentStage = pipelineState.status;
  const loopRound = pipelineState.loop_round || 1;
  const pendingQuestions = pipelineState.pending_questions || [];
  const overviewSections = pipelineState.overview_sections || [];
  const heuristicsResult = pipelineState.heuristics_result;
  const hasWarnings = heuristicsResult?.yellow_count > 0 || heuristicsResult?.red_count > 0;

  // Awaiting answers - show questions
  if (currentStage === 'awaiting_answers' && pendingQuestions.length > 0) {
    return (
      <div className="space-y-6">
        {/* Pipeline progress */}
        <PipelineProgress
          currentStage={currentStage}
          loopRound={loopRound}
          errorMessage={error}
          onRetry={handleRetry}
        />

        {/* Clarifying questions */}
        <ClarifyingQuestions
          questions={pendingQuestions}
          onSubmit={handleSubmitAnswers}
          round={loopRound}
        />
      </div>
    );
  }

  // Active pipeline stages - show progress
  const activeStages = ['pending', 'generating', 'heuristics', 'critic', 'rewriting'];
  if (activeStages.includes(currentStage)) {
    return (
      <div className="space-y-6">
        <PipelineProgress
          currentStage={currentStage}
          loopRound={loopRound}
          errorMessage={error}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  // Failed state
  if (currentStage === 'failed') {
    return (
      <div className="space-y-6">
        <PipelineProgress
          currentStage={currentStage}
          loopRound={loopRound}
          errorMessage={error || pipelineState.error_message}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  // Completed - show sections
  return (
    <div className="space-y-6">
      {/* Header with regenerate button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">AI Analysis</h2>
        <button
          onClick={handleStart}
          disabled={isStarting}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isStarting ? 'animate-spin' : ''}`} />
          Regenerate
        </button>
      </div>

      {/* Quality warnings */}
      {hasWarnings && (
        <div className={`border rounded-sm p-3 ${
          heuristicsResult.red_count > 0
            ? 'bg-red-50 border-red-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center justify-between">
            <p className={`text-sm ${
              heuristicsResult.red_count > 0 ? 'text-red-700' : 'text-amber-700'
            }`}>
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              {heuristicsResult.red_count > 0
                ? `${heuristicsResult.red_count} quality issue(s) detected. Consider regenerating.`
                : `${heuristicsResult.yellow_count} minor quality warning(s) detected.`
              }
            </p>
            <button
              onClick={() => setShowWarnings(!showWarnings)}
              className={`flex items-center gap-1 text-xs ${
                heuristicsResult.red_count > 0 ? 'text-red-600' : 'text-amber-600'
              } hover:underline`}
            >
              {showWarnings ? (
                <>Hide <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>Show <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          </div>
          {showWarnings && (
            <ul className={`mt-2 text-xs space-y-1 ${
              heuristicsResult.red_count > 0 ? 'text-red-600' : 'text-amber-600'
            }`}>
              {heuristicsResult.violations?.map((v, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className={`inline-block w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                    v.severity === 'red' ? 'bg-red-500' : 'bg-amber-500'
                  }`} />
                  <span>{v.section_id || 'General'}: {v.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Overview Sections */}
      {overviewSections.length > 0 ? (
        overviewSections.map((section) => (
          <OverviewSection key={section.id} section={section} />
        ))
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-sm p-6 text-center">
          <p className="text-slate-500">No analysis sections available.</p>
        </div>
      )}

      {/* Pipeline summary */}
      {pipelineState && (
        <p className="text-xs text-slate-400 text-right">
          {loopRound > 1 ? `${loopRound} refinement rounds • ` : ''}
          {pipelineState.total_questions_asked > 0 ? `${pipelineState.total_questions_asked} questions answered • ` : ''}
          Quality: {pipelineState.quality_status || 'N/A'}
        </p>
      )}
    </div>
  );
}
