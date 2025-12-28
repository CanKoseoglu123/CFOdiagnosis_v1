// src/components/report/InterpretedReport.jsx
// VS-25: Display AI-generated interpretation
// VS-36: User-friendly warnings + restart capability
// PATCH V2: Design system compliance (no circles)

import React, { useState } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * VS-36: Transform technical heuristic warnings to user-friendly messages
 */
function simplifyWarnings(warnings) {
  if (!warnings || warnings.length === 0) return null;

  // Count categories
  let hasWeakContext = false;
  let hasMissingReferences = false;

  for (const w of warnings) {
    if (w.includes('heuristic_warning') || w.includes('weak')) {
      hasWeakContext = true;
    }
    if (w.includes('context reference') || w.includes('not mentioned') || w.includes('Only')) {
      hasMissingReferences = true;
    }
  }

  // Return simplified message
  if (hasWeakContext || hasMissingReferences) {
    return "These insights are based on limited context. Providing more details about your specific situation could help us deliver more personalized recommendations.";
  }

  return null;
}

export default function InterpretedReport({ report, onFeedback, onRestart }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [warningDismissed, setWarningDismissed] = useState(false);

  const handleSubmitFeedback = async () => {
    if (rating === 0) return;
    try {
      await onFeedback({ rating, feedback });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  // Quality indicator badge
  const getQualityBadge = () => {
    if (!report.quality_status) return null;
    const colors = {
      green: 'bg-green-100 text-green-700',
      yellow: 'bg-amber-100 text-amber-700',
      red: 'bg-red-100 text-red-700'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-sm ${colors[report.quality_status] || colors.green}`}>
        {report.quality_status === 'green' ? 'High Confidence' :
         report.quality_status === 'yellow' ? 'Review Recommended' : 'Limited Data'}
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-primary-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* PATCH V2: Square icon container */}
            <div className="w-10 h-10 rounded-sm bg-primary-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-navy-900">AI-Generated Insights</h3>
              <div className="flex items-center gap-2 mt-1">
                {getQualityBadge()}
                {report.rounds_used && (
                  <span className="text-xs text-slate-400">
                    {report.rounds_used} refinement{report.rounds_used > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-sm"
          >
            <svg
              className={`w-5 h-5 transition-transform ${expanded ? '' : '-rotate-180'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <>
          {/* Synthesis */}
          {report.report?.synthesis && (
            <div className="px-6 py-5 border-b border-slate-100">
              <h4 className="text-sm font-semibold text-navy-800 uppercase tracking-wide mb-3">
                Executive Summary
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {report.report.synthesis}
              </p>
            </div>
          )}

          {/* Priority Rationale */}
          {report.report?.priority_rationale && (
            <div className="px-6 py-5 border-b border-slate-100">
              <h4 className="text-sm font-semibold text-navy-800 uppercase tracking-wide mb-3">
                Priority Rationale
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {report.report.priority_rationale}
              </p>
            </div>
          )}

          {/* Key Insight */}
          {report.report?.key_insight && (
            <div className="px-6 py-5 border-b border-slate-100">
              <div className="flex items-start gap-3 p-4 bg-primary-50 rounded-sm border border-primary-100">
                <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-primary-800 mb-1">Key Insight</h4>
                  <p className="text-sm text-primary-700">{report.report.key_insight}</p>
                </div>
              </div>
            </div>
          )}

          {/* VS-36: Simplified warnings with action buttons */}
          {report.heuristic_warnings && report.heuristic_warnings.length > 0 && !warningDismissed && (
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-amber-800 mb-3">
                    {simplifyWarnings(report.heuristic_warnings)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {onRestart && (
                      <button
                        onClick={onRestart}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Provide More Context
                      </button>
                    )}
                    <button
                      onClick={() => setWarningDismissed(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-600 text-xs font-medium rounded hover:bg-slate-50 transition-colors"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Continue with Current Insights
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Section */}
          <div className="px-6 py-5 bg-slate-50">
            {submitted ? (
              <div className="flex items-center gap-2 text-green-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">Thank you for your feedback!</span>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-600 mb-3">Was this insight helpful?</p>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`p-1 transition-colors ${
                          star <= rating ? 'text-amber-400' : 'text-slate-300 hover:text-amber-200'
                        }`}
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <>
                      <input
                        type="text"
                        placeholder="Any suggestions? (optional)"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      />
                      <button
                        onClick={handleSubmitFeedback}
                        className="px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-sm hover:bg-primary-700"
                      >
                        Submit
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
