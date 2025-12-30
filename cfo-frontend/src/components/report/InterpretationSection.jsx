// src/components/report/InterpretationSection.jsx
// VS-37: Consolidated AI Insights - single card with all sections
// Uses VS-32 endpoints (single AI call, no multi-round questions)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { processInterpretationSections } from '../../utils/evidence';
import { Sparkles, AlertCircle, RefreshCw, Clock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

const POLL_TIMEOUT_MS = 60000; // 60 seconds
const POLL_INTERVAL_MS = 2000; // 2 seconds

export default function InterpretationSection({ runId }) {
  const [state, setState] = useState('idle'); // idle | loading | complete | error | timeout
  const [sections, setSections] = useState([]);
  const [error, setError] = useState(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [canRegenerate, setCanRegenerate] = useState(false);

  const pollStartTime = useRef(null);
  const pollTimeoutRef = useRef(null);

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  // Start interpretation using VS-32 endpoint
  const startInterpretation = async () => {
    setState('loading');
    setError(null);
    pollStartTime.current = Date.now();

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret-v32`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start interpretation');
      }

      if (data.status === 'generating') {
        pollStatus();
      } else {
        throw new Error('Unexpected response from server');
      }
    } catch (err) {
      console.error('Start interpretation failed:', err);
      setError(err.message);
      setState('error');
    }
  };

  // Poll for status using VS-32 endpoint
  const pollStatus = useCallback(async () => {
    const token = await getToken();

    const poll = async () => {
      const elapsed = Date.now() - (pollStartTime.current || Date.now());
      if (elapsed > POLL_TIMEOUT_MS) {
        setState('timeout');
        return;
      }

      try {
        const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret-v32/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) {
          throw new Error('Failed to fetch status');
        }

        const data = await res.json();

        if (data.status === 'completed') {
          const processed = processInterpretationSections(data.report?.sections || []);
          setSections(processed);
          setUsedFallback(data.report?.used_fallback || false);
          setCanRegenerate(data.can_regenerate || false);
          setState('complete');
        } else if (data.status === 'failed') {
          setError(data.report?.error_message || 'Interpretation failed');
          setState('error');
        } else if (data.status === 'generating') {
          pollTimeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS);
        } else if (data.status === 'none') {
          setState('idle');
        }
      } catch (err) {
        console.error('Poll failed:', err);
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

  // Keep waiting after timeout
  const handleKeepWaiting = () => {
    pollStartTime.current = Date.now();
    setState('loading');
    pollStatus();
  };

  // Check for existing report on mount
  useEffect(() => {
    const checkExisting = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret-v32/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          const data = await res.json();

          if (data.status === 'completed') {
            const processed = processInterpretationSections(data.report?.sections || []);
            setSections(processed);
            setUsedFallback(data.report?.used_fallback || false);
            setCanRegenerate(data.can_regenerate || false);
            setState('complete');
          } else if (data.status === 'generating') {
            pollStartTime.current = Date.now();
            setState('loading');
            pollStatus();
          } else if (data.status === 'failed') {
            setError(data.report?.error_message || 'Previous attempt failed');
            setCanRegenerate(true);
            setState('error');
          }
        }
      } catch (err) {
        console.error('Check existing failed:', err);
      }
    };

    checkExisting();

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [runId, pollStatus]);

  // Idle state - show start button
  if (state === 'idle') {
    return (
      <div className="bg-white border border-slate-200 rounded-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-violet-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900">AI-Powered Analysis</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Generate personalized insights and strategic recommendations based on your assessment results.
            </p>
            <button
              onClick={startInterpretation}
              className="px-6 py-2.5 bg-violet-600 text-white text-sm font-medium rounded hover:bg-violet-700 transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
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
      <div className="bg-white border border-slate-200 rounded-sm p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mb-4">
            <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-2">Generating Insights</h3>
          <p className="text-sm text-slate-500 max-w-md">
            Analyzing your assessment data and generating personalized recommendations.
            This typically takes 15-30 seconds.
          </p>
          <div className="mt-6 flex gap-2 text-xs text-slate-400">
            <span className="px-2 py-1 bg-slate-100 rounded">Scoring</span>
            <span className="px-2 py-1 bg-violet-100 text-violet-600 rounded animate-pulse">Analyzing</span>
            <span className="px-2 py-1 bg-slate-100 rounded">Formatting</span>
          </div>
        </div>
      </div>
    );
  }

  // Complete state - SINGLE CARD with all sections
  if (state === 'complete' && sections.length > 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-sm">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">AI-Powered Analysis</h3>
              <p className="text-xs text-slate-500">
                {usedFallback ? 'Generated with template assistance' : 'Personalized insights from your assessment'}
              </p>
            </div>
          </div>
          {canRegenerate && (
            <button
              onClick={startInterpretation}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 border border-slate-200 rounded hover:bg-slate-50 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Regenerate
            </button>
          )}
        </div>

        {/* All sections in one card */}
        <div className="p-5 space-y-5">
          {sections.map((section, index) => (
            <div key={section.id || index}>
              {index > 0 && <div className="border-t border-slate-100 pt-5" />}
              <h4 className="text-sm font-semibold text-slate-800 mb-2">{section.title}</h4>
              <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {section.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div className="bg-white border border-red-200 rounded-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
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

  // Timeout state
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
                className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded hover:bg-violet-700 transition-colors"
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
