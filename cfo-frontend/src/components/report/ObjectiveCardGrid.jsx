// src/components/report/ObjectiveCardGrid.jsx
// Progressive Wizard Step 1 - Select objectives to work on
// Displays objectives as cards grouped by theme (Foundation, Future, Intelligence)

import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

// Theme IDs are lowercase in the spec
const THEMES = ['foundation', 'future', 'intelligence'];

// Display names for themes
const THEME_LABELS = {
  'foundation': 'Foundation',
  'future': 'Future',
  'intelligence': 'Intelligence'
};

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

// Calculate score for an objective
function calculateObjectiveScore(objectiveId, allQuestions, inputMap, practiceToObjective) {
  const objQuestions = allQuestions.filter(q => {
    const qObjId = q.practice_id && practiceToObjective[q.practice_id]
      ? practiceToObjective[q.practice_id]
      : q.objective_id;
    return qObjId === objectiveId;
  });
  if (objQuestions.length === 0) return 100;

  const yesCount = objQuestions.filter(q => inputMap.get(q.id) === true).length;
  return Math.round((yesCount / objQuestions.length) * 100);
}

// Check if objective has critical gaps
function hasCriticalGaps(objectiveId, gaps) {
  return gaps.some(g => g.objective_id === objectiveId && g.is_critical);
}

export default function ObjectiveCardGrid({
  objectives,
  gaps,
  questions,
  practices,
  report,
  selectedObjectives,
  onToggleObjective,
  onSelectAll,
  onClearAll
}) {
  // Build input map for score calculation
  const inputMap = new Map(
    (report?.inputs || []).map(i => [i.question_id, i.value])
  );

  // Build practice → objective map for score calculation
  const practiceToObjective = {};
  (practices || []).forEach(p => {
    if (p.id && p.objective_id) {
      practiceToObjective[p.id] = p.objective_id;
    }
  });

  // Group objectives by theme and filter to those with gaps
  // gaps have objective_id from the API (derived from practice_id in backend)
  const objectivesByTheme = {};
  THEMES.forEach(theme => {
    objectivesByTheme[theme] = objectives
      .filter(obj => obj.theme === theme)
      .filter(obj => gaps.some(g => g.objective_id === obj.id))
      .map(obj => ({
        ...obj,
        gapCount: gaps.filter(g => g.objective_id === obj.id).length,
        score: calculateObjectiveScore(obj.id, questions, inputMap, practiceToObjective),
        hasCritical: hasCriticalGaps(obj.id, gaps)
      }));
  });

  const totalObjectivesWithGaps = Object.values(objectivesByTheme).flat().length;
  const totalGapsInSelected = gaps.filter(g => selectedObjectives.has(g.objective_id)).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header with actions */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              Select Objectives to Address
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Choose which objectives you want to improve. We'll show you relevant actions in the next step.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-sm transition-colors"
            >
              Select All
            </button>
            <button
              onClick={onClearAll}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-sm transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4">
        {totalObjectivesWithGaps === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <div className="w-12 h-12 mx-auto rounded-sm bg-emerald-100 flex items-center justify-center mb-3">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium">Perfect Score!</p>
            <p className="text-xs text-slate-400 mt-1">
              No gaps identified. You're performing excellently across all objectives.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {THEMES.map(theme => {
              const themeObjectives = objectivesByTheme[theme];
              if (themeObjectives.length === 0) return null;

              return (
                <div key={theme}>
                  {/* Theme header */}
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                    {THEME_LABELS[theme] || theme}
                  </h4>

                  {/* Objective cards grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {themeObjectives.map(obj => (
                      <ObjectiveCard
                        key={obj.id}
                        objective={obj}
                        isSelected={selectedObjectives.has(obj.id)}
                        onToggle={() => onToggleObjective(obj.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with selection summary */}
      <div className="px-6 py-3 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">
            Selected: <strong>{selectedObjectives.size}</strong> objective{selectedObjectives.size !== 1 ? 's' : ''}
            {selectedObjectives.size > 0 && (
              <span className="text-slate-400 ml-2">
                ({totalGapsInSelected} gap{totalGapsInSelected !== 1 ? 's' : ''})
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

function ObjectiveCard({ objective, isSelected, onToggle }) {
  const objName = OBJECTIVE_NAMES[objective.id] || objective.name || objective.id;

  // Score color
  let scoreColor = 'text-red-600';
  if (objective.score >= 80) scoreColor = 'text-emerald-600';
  else if (objective.score >= 50) scoreColor = 'text-amber-600';

  return (
    <div
      onClick={onToggle}
      className={`relative border rounded-sm p-4 cursor-pointer transition-all ${
        isSelected
          ? 'bg-blue-50 border-blue-300'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      } ${objective.hasCritical ? 'border-l-2 border-l-red-500' : ''}`}
    >
      {/* Selection checkbox indicator */}
      <div className="absolute top-3 right-3">
        <div
          className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-blue-600 border-blue-600'
              : 'border-slate-300 bg-white'
          }`}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>
      </div>

      {/* Objective info */}
      <div className="pr-8">
        <div className="flex items-center gap-2 mb-2">
          {objective.hasCritical && (
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          )}
          <h5 className="text-sm font-semibold text-slate-800">{objName}</h5>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-slate-500">Score: </span>
            <span className={`font-semibold ${scoreColor}`}>{objective.score}%</span>
          </div>
          <div>
            <span className="text-slate-500">Gaps: </span>
            <span className="font-semibold text-slate-700">{objective.gapCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
