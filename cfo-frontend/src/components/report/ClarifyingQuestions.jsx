// src/components/report/ClarifyingQuestions.jsx
// VS-32c: AI-generated clarifying questions (yes/no or MCQ)
// Collects user answers to improve interpretation quality

import React, { useState } from 'react';
import { MessageCircleQuestion, Lightbulb, CheckCircle2 } from 'lucide-react';

/**
 * VS-32c ClarifyingQuestions Component
 *
 * Displays AI-generated questions from the Critic agent.
 * Supports two question types:
 * - yes_no: Simple Yes/No toggle
 * - mcq: Multiple choice with AI-generated options
 *
 * Props:
 * - questions: VS32cGeneratedQuestion[] from pipeline state
 * - onSubmit: (answers: VS32cClarifierAnswer[]) => Promise<void>
 * - round: Current loop round (1 or 2)
 */
export default function ClarifyingQuestions({ questions, onSubmit, round = 1 }) {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [startTimes, setStartTimes] = useState({});

  // Track when user starts interacting with a question
  const handleFocus = (questionId) => {
    if (!startTimes[questionId]) {
      setStartTimes(prev => ({ ...prev, [questionId]: Date.now() }));
    }
  };

  // Handle Yes/No toggle
  const handleYesNo = (questionId, value) => {
    handleFocus(questionId);
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  // Handle MCQ selection
  const handleMcq = (questionId, option) => {
    handleFocus(questionId);
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  // Format answers for API submission
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formattedAnswers = questions.map(q => {
        const answer = answers[q.question_id];
        const timeToAnswer = startTimes[q.question_id]
          ? Date.now() - startTimes[q.question_id]
          : null;

        return {
          question_id: q.question_id,
          question_text: q.question_text,
          answer: answer ?? null,
          skipped: answer === undefined || answer === null,
          time_to_answer_ms: answer !== undefined ? timeToAnswer : null,
          evidence_id: `clarifier_${q.question_id}`,
          answered_at: new Date().toISOString()
        };
      });

      await onSubmit(formattedAnswers);
    } catch (err) {
      console.error('Failed to submit clarifying answers:', err);
      alert('Failed to submit answers. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Count answered questions
  const answeredCount = Object.keys(answers).filter(k => answers[k] !== undefined).length;

  return (
    <div className="bg-white border border-slate-200 rounded-sm flex flex-col max-h-[600px]">
      {/* Fixed header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-sm bg-primary-100 flex items-center justify-center flex-shrink-0">
            <MessageCircleQuestion className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-navy-900">
              Quick Clarifications
              {round > 1 && (
                <span className="ml-2 text-xs font-normal text-slate-500">
                  (Round {round})
                </span>
              )}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              A few targeted questions to refine your personalized insights
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable questions area */}
      <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
        {questions.map((q, index) => {
          const currentAnswer = answers[q.question_id];
          const isAnswered = currentAnswer !== undefined;

          return (
            <div key={q.question_id} className="p-6">
              <div className="flex items-start gap-4">
                {/* Square indicator */}
                <div className={`flex-shrink-0 w-7 h-7 rounded-sm flex items-center justify-center text-sm font-semibold ${
                  isAnswered
                    ? 'bg-green-100 text-green-700'
                    : 'bg-primary-100 text-primary-700'
                }`}>
                  {isAnswered ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>

                <div className="flex-1">
                  {/* Question text */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <p className="text-sm font-medium text-navy-900">
                      {q.question_text}
                    </p>
                    <span className="flex-shrink-0 text-[10px] uppercase tracking-wide text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                      Optional
                    </span>
                  </div>

                  {/* Rationale hint */}
                  {q.rationale && (
                    <p className="text-xs text-slate-500 mb-3 flex items-start gap-1.5">
                      <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-500" />
                      <span>{q.rationale}</span>
                    </p>
                  )}

                  {/* Yes/No question type */}
                  {q.question_type === 'yes_no' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleYesNo(q.question_id, true)}
                        className={`flex-1 py-2.5 px-4 rounded-sm border text-sm font-medium transition-colors ${
                          currentAnswer === true
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => handleYesNo(q.question_id, false)}
                        className={`flex-1 py-2.5 px-4 rounded-sm border text-sm font-medium transition-colors ${
                          currentAnswer === false
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  )}

                  {/* MCQ question type */}
                  {q.question_type === 'mcq' && q.options && (
                    <div className="space-y-2">
                      {q.options.map((option, optIndex) => (
                        <label
                          key={optIndex}
                          className={`flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-colors ${
                            currentAnswer === option
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                          onClick={() => handleMcq(q.question_id, option)}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            currentAnswer === option
                              ? 'border-primary-500'
                              : 'border-slate-300'
                          }`}>
                            {currentAnswer === option && (
                              <div className="w-2 h-2 rounded-full bg-primary-500" />
                            )}
                          </div>
                          <span className="text-sm text-slate-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Skip hint for unanswered */}
                  {!isAnswered && (
                    <p className="mt-2 text-xs text-slate-400">
                      Leave unanswered to skip
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fixed footer with Continue button */}
      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
        <span className="text-xs text-slate-400">
          {answeredCount} of {questions.length} answered
        </span>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
        >
          {submitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Refining Insights...
            </>
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </div>
  );
}
