// src/components/assessment/AssessmentSidebar.jsx
// VS-30: Assessment progress sidebar with Action Planning design language

import React from 'react';
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Send } from 'lucide-react';

// Theme configuration
const THEME_CONFIG = {
  foundation: {
    label: 'Foundation',
    icon: '🏛️',
    color: 'amber',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-300'
  },
  future: {
    label: 'Future',
    icon: '🔮',
    color: 'blue',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-300'
  },
  intelligence: {
    label: 'Intelligence',
    icon: '🧠',
    color: 'indigo',
    bgClass: 'bg-indigo-50',
    textClass: 'text-indigo-700',
    borderClass: 'border-indigo-300'
  }
};

export default function AssessmentSidebar({
  currentTheme,
  themeProgress,
  overallProgress,
  companyName,
  onBack,
  onNext,
  onSubmit,
  canSubmit,
  isFirstTheme,
  isLastTheme,
  saving
}) {
  const config = THEME_CONFIG[currentTheme] || THEME_CONFIG.foundation;

  return (
    <div className="w-64 flex flex-col gap-3">
      {/* Company Context */}
      {companyName && (
        <div className="bg-white border border-slate-300 rounded-sm overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Assessing
            </h3>
          </div>
          <div className="px-3 py-2">
            <div className="text-sm font-semibold text-slate-700 truncate">
              {companyName}
            </div>
          </div>
        </div>
      )}

      {/* Current Theme */}
      <div className={`bg-white border rounded-sm overflow-hidden ${config.borderClass}`}>
        <div className={`px-3 py-2 border-b ${config.bgClass} ${config.borderClass}`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.icon}</span>
            <h3 className={`text-xs font-bold uppercase tracking-wide ${config.textClass}`}>
              {config.label}
            </h3>
          </div>
        </div>
        <div className="p-3">
          {/* Theme Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-slate-600">Progress</span>
              <span className="font-bold text-slate-700">
                {themeProgress.answered}/{themeProgress.total}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  themeProgress.answered === themeProgress.total
                    ? 'bg-emerald-500'
                    : 'bg-blue-500'
                }`}
                style={{
                  width: `${themeProgress.total > 0
                    ? (themeProgress.answered / themeProgress.total) * 100
                    : 0}%`
                }}
              />
            </div>
          </div>

          {/* Objectives List */}
          <div className="space-y-1.5">
            {themeProgress.objectives?.map((obj) => (
              <div
                key={obj.id}
                className="flex items-center gap-2 text-xs"
              >
                {obj.answered === obj.total ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                )}
                <span className={`flex-1 truncate ${
                  obj.answered === obj.total
                    ? 'text-slate-500'
                    : 'text-slate-700 font-medium'
                }`}>
                  {obj.name}
                </span>
                <span className="text-slate-400 text-[10px]">
                  {obj.answered}/{obj.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="bg-white border border-slate-300 rounded-sm overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            Overall Progress
          </h3>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-slate-600">All Questions</span>
            <span className="font-bold text-slate-700">
              {overallProgress.answered}/{overallProgress.total}
            </span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                overallProgress.answered === overallProgress.total
                  ? 'bg-emerald-500'
                  : 'bg-slate-600'
              }`}
              style={{
                width: `${overallProgress.total > 0
                  ? (overallProgress.answered / overallProgress.total) * 100
                  : 0}%`
              }}
            />
          </div>

          {/* Theme Mini Indicators */}
          <div className="mt-3 flex gap-1.5">
            {Object.entries(THEME_CONFIG).map(([key, cfg]) => {
              const isActive = key === currentTheme;
              return (
                <div
                  key={key}
                  className={`flex-1 h-1.5 rounded-full ${
                    isActive ? cfg.bgClass : 'bg-slate-100'
                  } ${isActive ? 'ring-1 ring-offset-1 ' + cfg.borderClass : ''}`}
                  title={cfg.label}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="bg-white border border-slate-300 rounded-sm p-3 space-y-2">
        {/* Back Button */}
        {!isFirstTheme && (
          <button
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous Theme
          </button>
        )}

        {/* Next / Submit Button */}
        {isLastTheme ? (
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded transition-colors ${
              canSubmit
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            {canSubmit ? 'Submit Assessment' : `${overallProgress.total - overallProgress.answered} remaining`}
          </button>
        ) : (
          <button
            onClick={onNext}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Next Theme
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {/* Saving indicator */}
        {saving && (
          <div className="text-center text-xs text-slate-400">
            Saving...
          </div>
        )}
      </div>
    </div>
  );
}
