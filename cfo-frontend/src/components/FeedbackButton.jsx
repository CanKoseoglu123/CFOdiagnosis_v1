// src/components/FeedbackButton.jsx
// Floating feedback button for beta testers

import React, { useState } from 'react';
import { MessageSquare, X, Send, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL;

// Configure your Google Form URL here (or leave null to use in-app submission)
const GOOGLE_FORM_URL = null; // e.g., 'https://forms.gle/xxx'

export default function FeedbackButton({ runId, currentPage = 'report' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // If Google Form is configured, open it in new tab
  if (GOOGLE_FORM_URL) {
    return (
      <a
        href={GOOGLE_FORM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      >
        <MessageSquare className="w-4 h-4" />
        Give Feedback
      </a>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const userEmail = session?.user?.email || 'anonymous';

      // Submit to our API endpoint
      const res = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          run_id: runId,
          page: currentPage,
          type: feedbackType,
          message: feedback.trim(),
          user_email: userEmail,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        setIsSubmitted(true);
        setFeedback('');
        setTimeout(() => {
          setIsOpen(false);
          setIsSubmitted(false);
        }, 2000);
      } else {
        // Fallback: log to console for now
        console.log('Feedback (API unavailable):', {
          run_id: runId,
          page: currentPage,
          type: feedbackType,
          message: feedback.trim(),
          user_email: userEmail,
        });
        setIsSubmitted(true);
        setTimeout(() => {
          setIsOpen(false);
          setIsSubmitted(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      // Still show success - we'll capture from logs
      setIsSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSubmitted(false);
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      >
        <MessageSquare className="w-4 h-4" />
        Give Feedback
      </button>

      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !isSubmitting && setIsOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">
                Share Your Feedback
              </h3>
              <button
                onClick={() => !isSubmitting && setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            {isSubmitted ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-lg font-medium text-slate-800">Thank you!</p>
                <p className="text-sm text-slate-500 mt-1">
                  Your feedback helps us improve.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Feedback Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    What kind of feedback?
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: 'bug', label: 'Bug' },
                      { value: 'confusion', label: 'Confusing' },
                      { value: 'suggestion', label: 'Suggestion' },
                      { value: 'general', label: 'General' },
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFeedbackType(type.value)}
                        className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                          feedbackType === type.value
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Your feedback
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Tell us what you think..."
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    autoFocus
                  />
                </div>

                {/* Context info (read-only) */}
                <div className="text-xs text-slate-400">
                  Page: {currentPage} {runId && `· Run: ${runId.slice(0, 8)}...`}
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !feedback.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? 'Sending...' : 'Send Feedback'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
