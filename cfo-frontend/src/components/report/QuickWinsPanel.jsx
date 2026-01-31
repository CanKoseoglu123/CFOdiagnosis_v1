// src/components/report/QuickWinsPanel.jsx
// Quick Wins tab content - Low complexity + High impact actions

import React, { useMemo } from 'react';
import { Zap, Check, AlertCircle } from 'lucide-react';
import {
  filterQuickWins,
  sortByRelevance,
  formatImpact,
  formatComplexity,
  getImpactColor,
  getComplexityColor
} from '../../utils/wizardUtils';

export default function QuickWinsPanel({
  gaps,
  selectedActions,
  onToggleAction,
  subStep
}) {
  // Filter and sort quick wins
  const quickWins = useMemo(() => {
    return sortByRelevance(filterQuickWins(gaps));
  }, [gaps]);

  const selectedCount = quickWins.filter(q => selectedActions.has(q.id)).length;

  if (quickWins.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-base font-semibold text-slate-800">
            Quick Wins
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Low complexity, high impact actions you can start immediately.
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center py-12 text-slate-500">
            <div className="w-12 h-12 mx-auto rounded-sm bg-emerald-100 flex items-center justify-center mb-3">
              <Zap className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium">No quick wins available</p>
            <p className="text-xs text-slate-400 mt-1">
              All quick wins have been addressed or none match the criteria.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 sm:px-6 sm:py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
        <h3 className="text-sm sm:text-base font-semibold text-slate-800">
          Quick Wins
        </h3>
        <p className="text-sm text-slate-600 mt-1 hidden sm:block">
          Low complexity, high impact actions you can start immediately.
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4">
        <div className="space-y-2">
          {quickWins.map(question => (
            <ActionCard
              key={question.id}
              question={question}
              isSelected={selectedActions.has(question.id)}
              onToggle={() => onToggleAction(question.id)}
            />
          ))}
        </div>
      </div>

      {/* Footer - hidden on mobile, info shown in sub-step footer */}
      <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex-shrink-0 hidden sm:block">
        <span className="text-sm text-slate-600">
          Selected: <strong>{selectedCount}</strong> of {quickWins.length} quick win{quickWins.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

function ActionCard({ question, isSelected, onToggle }) {
  const isCritical = question.is_critical;

  return (
    <div
      onClick={onToggle}
      className={`border rounded-sm px-3 py-2 cursor-pointer transition-all ${
        isSelected
          ? 'bg-blue-50 border-slate-200'
          : 'bg-white border-slate-200 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
            isSelected
              ? 'bg-blue-600 border-blue-600'
              : 'border-slate-300 bg-white'
          }`}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isCritical && (
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            )}
            <span className="text-sm font-medium text-slate-700">
              {question.expert_action?.title || question.text}
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-sm bg-slate-700 text-white flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" />
              Quick Win
            </span>
          </div>

          {question.expert_action?.recommendation && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {question.expert_action.recommendation}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm ${getImpactColor(question.impact)}`}>
              Impact: {formatImpact(question.impact)}
            </span>
            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm ${getComplexityColor(question.complexity)}`}>
              Complexity: {formatComplexity(question.complexity)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
