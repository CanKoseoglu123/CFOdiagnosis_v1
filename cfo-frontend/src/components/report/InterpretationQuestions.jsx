// src/components/report/InterpretationQuestions.jsx
// VS-25: Question cards for collecting user clarifications
// PATCH V2: Explicit skip semantics, optional badges

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export default function InterpretationQuestions({ questions, onSubmit }) {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [timings, setTimings] = useState({});
  const [startTimes, setStartTimes] = useState({});

  // Track when user starts interacting with a question
  const handleFocus = (questionId) => {
    if (!startTimes[questionId]) {
      setStartTimes(prev => ({ ...prev, [questionId]: Date.now() }));
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));

    // Record time to answer
    if (startTimes[questionId]) {
      const timeToAnswer = Date.now() - startTimes[questionId];
      setTimings(prev => ({ ...prev, [questionId]: timeToAnswer }));
    }
  };

  // PATCH V2: Allow partial/empty answers with explicit skip markers
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // PATCH V2: Build answers with explicit skipped field
      const formattedAnswers = questions.map(q => {
        const answer = answers[q.question_id]?.trim() || null;
        return {
          question_id: q.question_id,
          answer: answer,
          skipped: answer === null,  // Explicit skip marker
          time_to_answer_ms: answer ? (timings[q.question_id] || 0) : null
        };
      });
      await onSubmit(formattedAnswers);
    } catch (err) {
      console.error('Failed to submit answers:', err);
      alert('Failed to submit answers. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-sm">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="text-base font-semibold text-navy-900">Help Us Personalize Your Insights</h3>
        <p className="text-sm text-slate-500 mt-1">
          A few quick questions to tailor our recommendations to your situation
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {questions.map((q, index) => {
          const currentAnswer = answers[q.question_id] || '';
          const isEmpty = !currentAnswer.trim();

          return (
            <div key={q.question_id} className="p-6">
              <div className="flex items-start gap-4">
                {/* PATCH V2: Square indicator per design system */}
                <div className="flex-shrink-0 w-7 h-7 rounded-sm bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <p className="text-sm font-medium text-navy-900">{q.question}</p>
                    {/* PATCH V2: Optional badge */}
                    <span className="flex-shrink-0 text-[10px] uppercase tracking-wide text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                      Optional
                    </span>
                  </div>

                  {/* Context hint if available */}
                  {q.context && (
                    <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" />
                      {q.context}
                    </p>
                  )}

                  {q.type === 'mcq' && q.options ? (
                    <div className="space-y-2">
                      {q.options.map((option, optIndex) => (
                        <label
                          key={optIndex}
                          className={`flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-colors ${
                            answers[q.question_id] === option
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                          onFocus={() => handleFocus(q.question_id)}
                        >
                          <input
                            type="radio"
                            name={q.question_id}
                            value={option}
                            checked={answers[q.question_id] === option}
                            onChange={() => handleAnswerChange(q.question_id, option)}
                            className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-slate-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <>
                      <textarea
                        placeholder="Type your answer, or leave blank to skip..."
                        value={currentAnswer}
                        onChange={(e) => handleAnswerChange(q.question_id, e.target.value)}
                        onFocus={() => handleFocus(q.question_id)}
                        maxLength={q.max_length || 500}
                        rows={3}
                        className="w-full p-3 border border-slate-200 rounded-sm text-sm text-slate-700 placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
                      />
                      {/* PATCH V2: Status hint */}
                      <div className="mt-1 flex justify-between">
                        <span className="text-xs text-slate-400">
                          {isEmpty ? 'Will be skipped' : ''}
                        </span>
                        <span className={`text-xs ${currentAnswer.length > 400 ? 'text-amber-600' : 'text-slate-400'}`}>
                          {currentAnswer.length} / 500
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-6 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Submitting...
            </>
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </div>
  );
}
