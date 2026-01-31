// src/components/report/PainPointsPanel.jsx
// Pain Points tab content - Actions grouped by user's selected pain points

import React, { useState, useMemo } from 'react';
import { Target, Check, ChevronDown, AlertCircle, Zap } from 'lucide-react';
import {
  groupByPainPoint,
  formatImpact,
  formatComplexity,
  getImpactColor,
  getComplexityColor,
  isQuickWin
} from '../../utils/wizardUtils';

export default function PainPointsPanel({
  gaps,
  selectedActions,
  onToggleAction,
  painPoints,
  subStep
}) {
  // Group gaps by pain point
  const groupedData = useMemo(() => {
    return groupByPainPoint(gaps, painPoints);
  }, [gaps, painPoints]);

  const totalActions = groupedData.reduce((sum, g) => sum + g.actions.length, 0);
  const selectedCount = groupedData.reduce(
    (sum, g) => sum + g.actions.filter(a => selectedActions.has(a.id)).length,
    0
  );

  if (!painPoints || painPoints.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-base font-semibold text-slate-800">
            Address Your Pain Points
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            No pain points were selected during setup.
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center py-12 text-slate-500">
            <div className="w-12 h-12 mx-auto rounded-sm bg-slate-100 flex items-center justify-center mb-3">
              <Target className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm">Set up pain points to use this view</p>
            <p className="text-xs text-slate-400 mt-1">
              You can configure pain points in the Setup section.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (groupedData.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-base font-semibold text-slate-800">
            Address Your Pain Points
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            No gaps found related to your selected pain points.
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center py-12 text-slate-500">
            <div className="w-12 h-12 mx-auto rounded-sm bg-emerald-100 flex items-center justify-center mb-3">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium">All pain point actions addressed!</p>
            <p className="text-xs text-slate-400 mt-1">
              You've already addressed actions related to your pain points.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 lg:px-6 lg:py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
        <h3 className="text-sm lg:text-base font-semibold text-slate-800">
          Address Your Pain Points
        </h3>
        <p className="text-sm text-slate-600 mt-1 hidden lg:block">
          Actions related to the pain points you identified during setup.
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-2 lg:p-4">
        <div className="space-y-4">
          {groupedData.map(group => (
            <GroupedSection
              key={group.painPoint.value}
              title={group.painPoint.label}
              actions={group.actions}
              selectedActions={selectedActions}
              onToggleAction={onToggleAction}
            />
          ))}
        </div>
      </div>

      {/* Footer - hidden on mobile, info shown in sub-step footer */}
      <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex-shrink-0 hidden lg:block">
        <span className="text-sm text-slate-600">
          Selected: <strong>{selectedCount}</strong> of {totalActions} action{totalActions !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

function GroupedSection({ title, actions, selectedActions, onToggleAction }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const selectedCount = actions.filter(a => selectedActions.has(a.id)).length;

  return (
    <div className="bg-white border border-slate-300 rounded-sm overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors bg-white"
      >
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        <span className="text-xs text-slate-500 ml-auto">
          {selectedCount}/{actions.length} selected
        </span>
      </button>

      {isExpanded && (
        <div className="bg-slate-50 border-t border-slate-200 p-2">
          <div className="flex flex-col gap-1.5">
            {actions.map(question => (
              <ActionCard
                key={question.id}
                question={question}
                isSelected={selectedActions.has(question.id)}
                onToggle={() => onToggleAction(question.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionCard({ question, isSelected, onToggle }) {
  const quickWin = isQuickWin(question);
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
