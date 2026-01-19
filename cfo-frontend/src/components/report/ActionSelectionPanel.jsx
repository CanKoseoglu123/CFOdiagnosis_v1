// src/components/report/ActionSelectionPanel.jsx
// Progressive Wizard Step 2 - Select actions from chosen objectives
// Shows actions grouped by objective with collapsible sections

import React, { useState } from 'react';
import { Check, ChevronDown, AlertCircle, Zap } from 'lucide-react';
import {
  formatImpact,
  formatComplexity,
  getImpactColor,
  getComplexityColor,
  isQuickWin,
  sortByRelevance
} from '../../utils/wizardUtils';

// Objective display names
const OBJECTIVE_NAMES = {
  'obj_budget_discipline': 'Budget Discipline',
  'obj_financial_controls': 'Financial Controls',
  'obj_performance_monitoring': 'Performance Monitoring',
  'obj_forecasting_agility': 'Forecasting Agility',
  'obj_driver_based_planning': 'Driver-Based Planning',
  'obj_scenario_modeling': 'Scenario Modeling',
  'obj_strategic_influence': 'Strategic Influence',
  'obj_decision_support': 'Decision Support',
  'obj_operational_excellence': 'Operational Excellence'
};

export default function ActionSelectionPanel({
  gaps,
  objectives,
  selectedObjectives,
  selectedActions,
  onToggleAction,
  onSelectAllInObjective,
  onClearAllInObjective
}) {
  // Filter gaps to only selected objectives, sorted by relevance
  // gaps have objective_id from ProgressiveWizard
  const relevantGaps = sortByRelevance(
    gaps.filter(g => selectedObjectives.has(g.objective_id))
  );

  // Group gaps by objective
  const gapsByObjective = {};
  objectives
    .filter(obj => selectedObjectives.has(obj.id))
    .forEach(obj => {
      const objGaps = relevantGaps.filter(g => g.objective_id === obj.id);
      if (objGaps.length > 0) {
        gapsByObjective[obj.id] = {
          objective: obj,
          gaps: objGaps
        };
      }
    });

  const totalActions = relevantGaps.length;
  const selectedCount = relevantGaps.filter(g => selectedActions.has(g.id)).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              Select Actions to Include
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Choose which actions you want to pursue. Actions are sorted by impact and priority.
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4">
        {totalActions === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-sm">No objectives selected</p>
            <p className="text-xs text-slate-400 mt-1">
              Go back to select objectives first.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.values(gapsByObjective).map(({ objective, gaps: objGaps }) => (
              <ObjectiveSection
                key={objective.id}
                objective={objective}
                gaps={objGaps}
                selectedActions={selectedActions}
                onToggleAction={onToggleAction}
                onSelectAll={() => onSelectAllInObjective(objective.id)}
                onClearAll={() => onClearAllInObjective(objective.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer with selection summary */}
      <div className="px-6 py-3 border-t border-slate-200 bg-slate-50">
        <span className="text-sm text-slate-600">
          Selected: <strong>{selectedCount}</strong> of {totalActions} action{totalActions !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

function ObjectiveSection({
  objective,
  gaps,
  selectedActions,
  onToggleAction,
  onSelectAll,
  onClearAll
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const selectedCount = gaps.filter(g => selectedActions.has(g.id)).length;
  const objName = OBJECTIVE_NAMES[objective.id] || objective.name || objective.id;

  return (
    <div className="bg-white border border-slate-300 rounded-sm overflow-hidden">
      {/* Section header */}
      <div className="flex items-center bg-white border-b border-slate-200">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors"
        >
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              isExpanded ? '' : '-rotate-90'
            }`}
          />
          <span className="text-sm font-semibold text-slate-700">{objName}</span>
          <span className="text-xs text-slate-500 ml-auto mr-2">
            {selectedCount}/{gaps.length} selected
          </span>
        </button>
        <div className="flex items-center gap-1 pr-3">
          <button
            onClick={onSelectAll}
            className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
          >
            All
          </button>
          <button
            onClick={onClearAll}
            className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
          >
            None
          </button>
        </div>
      </div>

      {/* Actions list */}
      {isExpanded && (
        <div className="bg-slate-50 p-2">
          <div className="flex flex-col gap-1.5">
            {gaps.map(question => (
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
        {/* Checkbox */}
        <div
          className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
            isSelected
              ? 'bg-blue-600 border-blue-600'
              : 'border-slate-300 bg-white'
          }`}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-2">
            {isCritical && (
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            )}
            <span className="text-sm font-medium text-slate-700">
              {question.expert_action?.title || question.text}
            </span>
          </div>

          {/* Recommendation */}
          {question.expert_action?.recommendation && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {question.expert_action.recommendation}
            </p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span
              className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm ${getImpactColor(
                question.impact
              )}`}
            >
              Impact: {formatImpact(question.impact)}
            </span>
            <span
              className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm ${getComplexityColor(
                question.complexity
              )}`}
            >
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
