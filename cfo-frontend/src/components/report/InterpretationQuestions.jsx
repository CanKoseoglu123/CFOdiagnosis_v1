// src/components/report/InterpretationQuestions.jsx
// VS-25: Question cards for collecting user clarifications

import React, { useState } from 'react';

export default function InterpretationQuestions({ questions, onSubmit, onSkip }) {
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

  const handleSubmit = async () => {
    // Validate all questions have answers
    const unanswered = questions.filter(q => !answers[q.question_id]);
    if (unanswered.length > 0) {
      alert(`Please answer all questions (${unanswered.length} remaining)`);
      return;
    }

    setSubmitting(true);
    try {
      const formattedAnswers = questions.map(q => ({
        question_id: q.question_id,
        answer: answers[q.question_id],
        time_to_answer_ms: timings[q.question_id] || 0
      }));
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
        {questions.map((q, index) => (
          <div key={q.question_id} className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-navy-900 mb-3">{q.question}</p>

                {q.type === 'mcq' && q.options ? (
                  <div className="space-y-2">
                    {q.options.map((option, optIndex) => (
                      <label
                        key={optIndex}
                        className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors ${
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
                  <textarea
                    placeholder="Type your answer..."
                    value={answers[q.question_id] || ''}
                    onChange={(e) => handleAnswerChange(q.question_id, e.target.value)}
                    onFocus={() => handleFocus(q.question_id)}
                    maxLength={q.max_length || 500}
                    rows={3}
                    className="w-full p-3 border border-slate-200 rounded text-sm text-slate-700 placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        {onSkip && (
          <button
            onClick={onSkip}
            disabled={submitting}
            className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            Skip for now
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-6 py-2 bg-primary-600 text-white text-sm font-medium rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
