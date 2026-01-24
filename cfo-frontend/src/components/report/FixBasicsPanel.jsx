// src/components/report/FixBasicsPanel.jsx
// Step 3: Fix the Basics - Actions flagged as is_critical
// Renamed from CriticalRisksPanel to match sequential wizard flow

import React, { useMemo } from 'react';
import { AlertTriangle, Check, AlertCircle, Zap } from 'lucide-react';
import {
  filterCriticalRisks,
  sortByRelevance,
  formatImpact,
  formatComplexity,
  getImpactColor,
  getComplexityColor,
  isQuickWin
} from '../../utils/wizardUtils';

export default function FixBasicsPanel({
  gaps,
  selectedActions,
  onToggleAction,
  subStep
}) {
  // Filter and sort critical risks
  const criticalRisks = useMemo(() => {
    return sortByRelevance(filterCriticalRisks(gaps));
  }, [gaps]);

  const selectedCount = criticalRisks.filter(q => selectedActions.has(q.id)).length;

  if (criticalRisks.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-base font-semibold text-slate-800">
            Fix the Basics
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Critical questions that remain unanswered pose significant risk.
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center py-12 text-slate-500">
            <div className="w-12 h-12 mx-auto rounded-sm bg-emerald-100 flex items-center justify-center mb-3">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium">No critical gaps identified</p>
            <p className="text-xs text-slate-400 mt-1">
              All critical questions have been addressed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
        <h3 className="text-base font-semibold text-slate-800">
          Fix the Basics
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          Critical gaps that block maturity progression. Addressing these is essential before advancing to higher levels.
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {criticalRisks.map(question => (
            <ActionCard
              key={question.id}
              question={question}
              isSelected={selectedActions.has(question.id)}
              onToggle={() => onToggleAction(question.id)}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex-shrink-0">
        <span className="text-sm text-slate-600">
          Selected: <strong>{selectedCount}</strong> of {criticalRisks.length} critical item{criticalRisks.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

function ActionCard({ question, isSelected, onToggle }) {
  const quickWin = isQuickWin(question);

  return (
    <div
      onClick={onToggle}
      className={`border rounded-sm px-3 py-2 cursor-pointer transition-all border-l-2 border-l-red-500 ${
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
            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-sm bg-red-100 text-red-700 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              Critical
            </span>
            <span className="text-sm font-medium text-slate-700">
              {question.expert_action?.title || question.text}
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
            {quickWin && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-sm bg-slate-700 text-white flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5" />
                Quick Win
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
