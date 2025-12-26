// src/components/assessment/QuestionCard.jsx
// VS-30: Polished question card with Action Planning design language

import React, { useState } from 'react';
import { HelpCircle, CheckCircle, X, AlertCircle } from 'lucide-react';

export default function QuestionCard({
  question,
  answer,
  onAnswer,
  index
}) {
  const [showHelp, setShowHelp] = useState(false);

  const isAnswered = answer !== null && answer !== undefined;
  const isYes = answer === true;
  const isNo = answer === false;

  return (
    <div className={`bg-white border rounded-sm overflow-hidden transition-all ${
      isAnswered ? 'border-slate-400' : 'border-slate-300'
    }`}>
      {/* Question Header */}
      <div className="px-4 py-3 flex items-start gap-3">
        {/* Question Number */}
        <div className={`flex-shrink-0 w-7 h-7 rounded-sm flex items-center justify-center text-xs font-bold ${
          isAnswered
            ? 'bg-slate-700 text-white'
            : 'bg-slate-100 text-slate-500'
        }`}>
          {index + 1}
        </div>

        {/* Question Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {/* Tags Row */}
              <div className="flex items-center gap-2 mb-2">
                {question.is_critical && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-red-100 text-red-700 rounded">
                    <AlertCircle className="w-3 h-3" />
                    Critical
                  </span>
                )}
                <span className={`px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded ${
                  question.level === 1 ? 'bg-amber-100 text-amber-700' :
                  question.level === 2 ? 'bg-yellow-100 text-yellow-700' :
                  question.level === 3 ? 'bg-emerald-100 text-emerald-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  Level {question.level}
                </span>
              </div>

              {/* Question Text */}
              <p className="text-sm font-medium text-slate-800 leading-relaxed">
                {question.text}
              </p>
            </div>

            {/* Help Toggle */}
            {question.help && (
              <button
                onClick={() => setShowHelp(!showHelp)}
                className={`flex-shrink-0 p-1.5 rounded transition-colors ${
                  showHelp
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
                title="Why we ask this"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Help Text (collapsible) */}
          {showHelp && question.help && (
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-700">Why we ask: </span>
              {question.help}
            </div>
          )}
        </div>
      </div>

      {/* Answer Buttons */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mr-2">
          Answer:
        </span>

        {/* Yes Button */}
        <button
          onClick={() => onAnswer(question.id, true)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded transition-all ${
            isYes
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-300 hover:border-emerald-400 hover:text-emerald-600'
          }`}
        >
          {isYes && <CheckCircle className="w-4 h-4" />}
          Yes
        </button>

        {/* No Button */}
        <button
          onClick={() => onAnswer(question.id, false)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded transition-all ${
            isNo
              ? 'bg-slate-700 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-300 hover:border-slate-500 hover:text-slate-700'
          }`}
        >
          {isNo && <X className="w-4 h-4" />}
          No
        </button>

        {/* Answered indicator */}
        {isAnswered && (
          <span className="ml-auto text-xs text-slate-400">
            Saved
          </span>
        )}
      </div>
    </div>
  );
}
