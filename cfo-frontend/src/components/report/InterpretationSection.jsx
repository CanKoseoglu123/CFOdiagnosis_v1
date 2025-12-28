// src/components/report/InterpretationSection.jsx
// VS-25: Main interpretation workflow component
// PATCH V2: Session re-entry, 90s timeout, explicit skip semantics

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import InterpretationLoader from './InterpretationLoader';
import InterpretationQuestions from './InterpretationQuestions';
import InterpretedReport from './InterpretedReport';
import { AlertCircle, Clock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

// PATCH V2: Timeout constants
const POLL_TIMEOUT_MS = 90000; // 90 seconds max
const POLL_INTERVAL_MS = 3000; // 3 seconds between polls

// VS-32: Map status to loader step
const STATUS_TO_STEP = {
  pending: 'analyzing',
  generating: 'generating',
  critiquing: 'critiquing',
  awaiting_user: 'awaiting_user',
  refining: 'refining',
  finalizing: 'finalizing',
  complete: 'finalizing',
  completed: 'finalizing',
  failed: 'analyzing',
  force_finalized: 'finalizing'
};

const STATUS_TO_PROGRESS = {
  pending: 10,
  generating: 35,
  critiquing: 50,
  awaiting_user: 60,
  refining: 75,
  finalizing: 90,
  complete: 100,
  completed: 100,
  failed: 0,
  force_finalized: 100
};

export default function InterpretationSection({ runId }) {
  // PATCH V2: Added 'timeout' state
  const [state, setState] = useState('idle'); // idle | loading | questions | complete | error | timeout
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  // VS-32: Double-click prevention
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastClickRef = useRef(0);
  const DEBOUNCE_MS = 1000; // 1 second debounce

  // PATCH V2: Timeout tracking
  const pollStartTime = useRef(null);
  const pollTimeoutRef = useRef(null);

  // VS-32: AbortController for request cancellation
  const abortControllerRef = useRef(null);

  // Get auth token helper
  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  // PATCH V2: Safe JSON parser - handles HTML error pages from proxy/gateway
  const safeJsonParse = async (res) => {
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    }
    try {
      return await res.json();
    } catch (e) {
      throw new Error('Server returned invalid response');
    }
  };

  // Start interpretation
  const startInterpretation = async () => {
    // VS-32: Debounce and double-click prevention
    const now = Date.now();
    if (now - lastClickRef.current < DEBOUNCE_MS || isSubmitting) {
      return;
    }
    lastClickRef.current = now;
    setIsSubmitting(true);

    setState('loading');
    setError(null);
    // PATCH V2: Reset timeout tracking
    pollStartTime.current = Date.now();

    // VS-32: Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret/start`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) {
        const data = await safeJsonParse(res);
        throw new Error(data.error || 'Failed to start interpretation');
      }

      const data = await safeJsonParse(res);
      setSessionId(data.session_id);
      setStatus(data.status);

      if (data.status === 'awaiting_user' && data.questions) {
        setQuestions(data.questions);
        setState('questions');
      } else if (data.status === 'complete') {
        setReport(data.report);
        setState('complete');
      } else {
        // Start polling
        pollStatus(data.session_id);
      }
    } catch (err) {
      // VS-32: Ignore abort errors
      if (err.name === 'AbortError') return;
      console.error('Start interpretation failed:', err);
      setError(err.message);
      setState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // PATCH V2: Poll for status updates with timeout handling
  const pollStatus = useCallback(async (sid) => {
    const token = await getToken();

    const poll = async () => {
      // PATCH V2: Check timeout BEFORE polling
      const elapsed = Date.now() - (pollStartTime.current || Date.now());
      if (elapsed > POLL_TIMEOUT_MS) {
        setState('timeout');
        return;
      }

      try {
        const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) {
          throw new Error('Failed to fetch status');
        }

        const data = await safeJsonParse(res);
        setStatus(data.status);

        if (data.status === 'awaiting_user' && data.questions) {
          setQuestions(data.questions);
          setState('questions');
        } else if (data.status === 'complete') {
          await fetchReport();
          setState('complete');
        } else if (data.status === 'failed') {
          setError('Interpretation failed. Please try again.');
          setState('error');
        } else {
          // PATCH V2: Continue polling with recursive setTimeout (not setInterval)
          pollTimeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch (err) {
        console.error('Poll failed:', err);
        // Retry after longer delay, but still check timeout
        const elapsed = Date.now() - (pollStartTime.current || Date.now());
        if (elapsed < POLL_TIMEOUT_MS) {
          pollTimeoutRef.current = setTimeout(poll, 5000);
        } else {
          setState('timeout');
        }
      }
    };

    poll();
  }, [runId]);

  // Fetch final report
  const fetchReport = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret/report`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch report');
      }

      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error('Fetch report failed:', err);
      setError(err.message);
    }
  };

  // Submit answers
  const handleSubmitAnswers = async (answers) => {
    // VS-32: Debounce and double-click prevention
    const now = Date.now();
    if (now - lastClickRef.current < DEBOUNCE_MS || isSubmitting) {
      return;
    }
    lastClickRef.current = now;
    setIsSubmitting(true);

    setState('loading');
    setStatus('finalizing');

    // VS-32: Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret/answer`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers }),
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit answers');
      }

      const data = await res.json();
      setStatus(data.status);

      if (data.status === 'awaiting_user' && data.questions) {
        setQuestions(data.questions);
        setState('questions');
      } else if (data.status === 'complete') {
        setReport(data.report);
        setState('complete');
      } else {
        pollStatus(sessionId);
      }
    } catch (err) {
      // VS-32: Ignore abort errors
      if (err.name === 'AbortError') return;
      console.error('Submit answers failed:', err);
      setError(err.message);
      setState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit feedback
  const handleFeedback = async ({ rating, feedback }) => {
    try {
      const token = await getToken();
      await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret/feedback`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating, feedback })
      });
    } catch (err) {
      console.error('Submit feedback failed:', err);
    }
  };

  // PATCH V2: Resume polling after "Keep Waiting" on timeout
  const handleKeepWaiting = () => {
    pollStartTime.current = Date.now();
    setState('loading');
    pollStatus(sessionId);
  };

  // VS-36: Restart interpretation to get fresh questions
  const handleRestart = async () => {
    // VS-32: Debounce and double-click prevention
    const now = Date.now();
    if (now - lastClickRef.current < DEBOUNCE_MS || isSubmitting) {
      return;
    }
    lastClickRef.current = now;
    setIsSubmitting(true);

    setState('loading');
    setError(null);
    setReport(null);
    pollStartTime.current = Date.now();

    // VS-32: Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret/start`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ restart: true }),
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) {
        const data = await safeJsonParse(res);
        throw new Error(data.error || 'Failed to restart interpretation');
      }

      const data = await safeJsonParse(res);
      setSessionId(data.session_id);
      setStatus(data.status);

      if (data.status === 'awaiting_user' && data.questions) {
        setQuestions(data.questions);
        setState('questions');
      } else if (data.status === 'complete') {
        setReport(data.report);
        setState('complete');
      } else {
        pollStatus(data.session_id);
      }
    } catch (err) {
      // VS-32: Ignore abort errors
      if (err.name === 'AbortError') return;
      console.error('Restart interpretation failed:', err);
      setError(err.message);
      setState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // PATCH V2: Check for existing session on mount - STATUS FIRST, only START if 404
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          // Session exists - resume it
          const data = await safeJsonParse(res);
          setSessionId(data.session_id);
          setStatus(data.status);

          // Route to correct state based on status
          switch (data.status) {
            case 'awaiting_user':
              setQuestions(data.questions || []);
              setState('questions');
              break;
            case 'complete':
              await fetchReport();
              setState('complete');
              break;
            case 'failed':
              setError(data.error || 'Previous attempt failed');
              setState('error');
              break;
            case 'generating':
            case 'pending':
              // Resume polling
              pollStartTime.current = Date.now();
              setState('loading');
              pollStatus(data.session_id);
              break;
            default:
              // Unknown state - stay idle, let user click "Generate"
              break;
          }
        } else if (res.status === 404) {
          // No session exists - stay idle, user can click to start
        }
        // For other errors, stay idle
      } catch (err) {
        console.error('Session check failed:', err);
        // On error, stay idle
      }
    };

    checkExistingSession();

    // PATCH V2 + VS-32: Cleanup on unmount
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
      // VS-32: Abort any in-flight requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [runId]);

  // Idle state - show start button
  if (state === 'idle') {
    return (
      <div className="bg-white border border-slate-200 rounded-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900">Generate AI Insights</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Get personalized analysis and recommendations based on your assessment results.
              Our AI will synthesize your data into actionable insights.
            </p>
            <button
              onClick={startInterpretation}
              disabled={isSubmitting}
              className={`px-6 py-2.5 text-white text-sm font-medium rounded transition-colors flex items-center gap-2 ${
                isSubmitting
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {isSubmitting ? 'Starting...' : 'Generate Insights'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (state === 'loading') {
    return (
      <InterpretationLoader
        currentStep={STATUS_TO_STEP[status] || 'analyzing'}
        progress={STATUS_TO_PROGRESS[status] || 25}
      />
    );
  }

  // Questions state
  if (state === 'questions') {
    return (
      <InterpretationQuestions
        questions={questions}
        onSubmit={handleSubmitAnswers}
      />
    );
  }

  // Complete state
  if (state === 'complete' && report) {
    return (
      <InterpretedReport
        report={report}
        onFeedback={handleFeedback}
        onRestart={handleRestart}
      />
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div className="bg-white border border-red-200 rounded-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-red-800">Generation Failed</h3>
            <p className="text-sm text-red-600 mt-1 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setState('idle');
              }}
              className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PATCH V2: Timeout state - taking too long
  if (state === 'timeout') {
    return (
      <div className="bg-white border border-amber-200 rounded-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-amber-800">Taking Longer Than Expected</h3>
            <p className="text-sm text-slate-600 mt-1 mb-4">
              The AI is still processing. This sometimes happens with complex assessments.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleKeepWaiting}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
              >
                Keep Waiting
              </button>
              <button
                onClick={() => setState('idle')}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
