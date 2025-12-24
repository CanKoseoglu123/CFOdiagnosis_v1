// src/components/report/InterpretationSection.jsx
// VS-25: Main interpretation workflow component

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import InterpretationLoader from './InterpretationLoader';
import InterpretationQuestions from './InterpretationQuestions';
import InterpretedReport from './InterpretedReport';

const API_URL = import.meta.env.VITE_API_URL;

// Map status to loader step
const STATUS_TO_STEP = {
  pending: 'analyzing',
  generating: 'drafting',
  awaiting_user: 'drafting',
  finalizing: 'finalizing',
  complete: 'finalizing',
  failed: 'analyzing'
};

const STATUS_TO_PROGRESS = {
  pending: 10,
  generating: 50,
  awaiting_user: 60,
  finalizing: 85,
  complete: 100,
  failed: 0
};

export default function InterpretationSection({ runId }) {
  const [state, setState] = useState('idle'); // idle | loading | questions | complete | error
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  // Get auth token helper
  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  // Start interpretation
  const startInterpretation = async () => {
    setState('loading');
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
      console.error('Start interpretation failed:', err);
      setError(err.message);
      setState('error');
    }
  };

  // Poll for status updates
  const pollStatus = useCallback(async (sid) => {
    const token = await getToken();

    const poll = async () => {
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

        const data = await res.json();
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
          // Continue polling
          setTimeout(poll, 2000);
        }
      } catch (err) {
        console.error('Poll failed:', err);
        // Retry after longer delay
        setTimeout(poll, 5000);
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
    setState('loading');
    setStatus('finalizing');

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
      console.error('Submit answers failed:', err);
      setError(err.message);
      setState('error');
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

  // Skip questions (use draft as-is)
  const handleSkip = async () => {
    setState('loading');
    setStatus('finalizing');
    // Submit empty answers to trigger finalization
    await handleSubmitAnswers([]);
  };

  // Check for existing interpretation on mount
  useEffect(() => {
    const checkExisting = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          const data = await res.json();
          setSessionId(data.session_id);
          setStatus(data.status);

          if (data.status === 'complete') {
            await fetchReport();
            setState('complete');
          } else if (data.status === 'awaiting_user' && data.questions) {
            setQuestions(data.questions);
            setState('questions');
          } else if (data.status === 'generating' || data.status === 'pending') {
            setState('loading');
            pollStatus(data.session_id);
          }
        }
      } catch (err) {
        // No existing session, stay idle
      }
    };

    checkExisting();
  }, [runId]);

  // Idle state - show start button
  if (state === 'idle') {
    return (
      <div className="bg-white border border-slate-200 rounded-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-navy-900">Generate AI Insights</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Get personalized analysis and recommendations based on your assessment results.
              Our AI will synthesize your data into actionable insights.
            </p>
            <button
              onClick={startInterpretation}
              className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Insights
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
        onSkip={handleSkip}
      />
    );
  }

  // Complete state
  if (state === 'complete' && report) {
    return (
      <InterpretedReport
        report={report}
        onFeedback={handleFeedback}
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

  return null;
}
