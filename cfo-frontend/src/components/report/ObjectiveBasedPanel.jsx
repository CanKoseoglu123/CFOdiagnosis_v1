// src/components/report/ObjectiveBasedPanel.jsx
// Step 4: Objective-Based Actions - 2x3 Priority × Impact Matrix
// Merges functionality from ObjectiveCardGrid and ActionSelectionPanel

import React, { useState, useMemo } from 'react';
import { Check, ChevronDown, Zap, X, AlertCircle } from 'lucide-react';
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

// Matrix cell configuration
const MATRIX_CELLS = {
  highPriorityHighImpact: { label: 'Focus First', bg: 'bg-amber-50', priority: 'high', impact: 'high' },
  highPriorityMediumImpact: { label: 'Plan', bg: 'bg-slate-50', priority: 'high', impact: 'medium' },
  highPriorityLowImpact: { label: 'Defer', bg: 'bg-slate-50', priority: 'high', impact: 'low' },
  lowPriorityHighImpact: { label: 'Good Opportunity', bg: 'bg-green-50', priority: 'low', impact: 'high' },
  lowPriorityMediumImpact: { label: 'Plan', bg: 'bg-white', priority: 'low', impact: 'medium' },
  lowPriorityLowImpact: { label: 'Optional', bg: 'bg-white', priority: 'low', impact: 'low' }
};

// Score to level conversion
function scoreToLevel(score) {
  if (score >= 85) return 4;
  if (score >= 65) return 3;
  if (score >= 40) return 2;
  return 1;
}

// Calculate score for an objective
function calculateObjectiveScore(objectiveId, questions, inputMap, practiceToObjective) {
  const objQuestions = questions.filter(q => {
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

// Classify objective into matrix cell
function classifyObjective(objective, importanceMap) {
  const importance = importanceMap?.[objective.id] || 3;
  const priority = importance >= 4 ? 'high' : 'low';

  // Impact based on benchmark gap and critical status
  let impact;
  if (objective.benchmarkGap >= 2 || objective.hasCritical) {
    impact = 'high';
  } else if (objective.benchmarkGap === 1) {
    impact = 'medium';
  } else {
    impact = 'low';
  }

  return { priority, impact };
}

export default function ObjectiveBasedPanel({
  gaps,
  objectives,
  practices,
  report,
  selectedActions,
  onToggleAction,
  onSelectAllInObjective,
  onClearAllInObjective,
  benchmarkData,
  importanceMap,
  questions,
  subStep
}) {
  // Build input map for score calculation
  const inputMap = useMemo(() => new Map(
    (report?.inputs || []).map(i => [i.question_id, i.value])
  ), [report]);

  // Build practice → objective map
  const practiceToObjective = useMemo(() => {
    const map = {};
    (practices || []).forEach(p => {
      if (p.id && p.objective_id) {
        map[p.id] = p.objective_id;
      }
    });
    return map;
  }, [practices]);

  // Build benchmark lookup maps
  const objectiveTargets = useMemo(() => new Map(
    benchmarkData?.targets?.objectiveTargets?.map(t => [t.objective_id, t.adjustedTarget]) || []
  ), [benchmarkData]);
  const achievedLevels = benchmarkData?.achieved?.objectiveLevels || {};

  // Enrich objectives with computed data
  const enrichedObjectives = useMemo(() => {
    return objectives
      .filter(obj => gaps.some(g => g.objective_id === obj.id))
      .map(obj => {
        const score = calculateObjectiveScore(obj.id, questions || [], inputMap, practiceToObjective);
        const level = achievedLevels[obj.id] || scoreToLevel(score);
        const target = objectiveTargets.get(obj.id) || null;
        const benchmarkGap = target ? (target - level) : 0;
        const priority = importanceMap?.[obj.id] || 3;
        const objGaps = sortByRelevance(gaps.filter(g => g.objective_id === obj.id));

        return {
          ...obj,
          gapCount: objGaps.length,
          gaps: objGaps,
          score,
          hasCritical: hasCriticalGaps(obj.id, gaps),
          level,
          target,
          benchmarkGap,
          priority
        };
      });
  }, [objectives, gaps, questions, inputMap, practiceToObjective, achievedLevels, objectiveTargets, importanceMap]);

  // Group objectives into matrix cells (2 priority × 3 impact)
  const matrixData = useMemo(() => {
    const cells = {
      highPriorityHighImpact: [],
      highPriorityMediumImpact: [],
      highPriorityLowImpact: [],
      lowPriorityHighImpact: [],
      lowPriorityMediumImpact: [],
      lowPriorityLowImpact: []
    };

    enrichedObjectives.forEach(obj => {
      const { priority, impact } = classifyObjective(obj, importanceMap);
      const cellKey = `${priority}Priority${impact.charAt(0).toUpperCase() + impact.slice(1)}Impact`;
      cells[cellKey].push(obj);
    });

    // Sort within each cell by gap count (descending)
    Object.keys(cells).forEach(key => {
      cells[key].sort((a, b) => b.gapCount - a.gapCount);
    });

    return cells;
  }, [enrichedObjectives, importanceMap]);

  // Track which objective is expanded for detail view
  const [selectedObjectiveId, setSelectedObjectiveId] = useState(null);

  // Find the selected objective
  const selectedObjective = useMemo(() => {
    if (!selectedObjectiveId) return null;
    return enrichedObjectives.find(obj => obj.id === selectedObjectiveId) || null;
  }, [selectedObjectiveId, enrichedObjectives]);

  const totalObjectivesWithGaps = enrichedObjectives.length;
  const totalActions = gaps.length;
  const selectedCount = gaps.filter(g => selectedActions.has(g.id)).length;

  if (totalObjectivesWithGaps === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-base font-semibold text-slate-800">
            Select Actions by Objective
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Choose actions grouped by the objectives they support.
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center py-12 text-slate-500">
            <div className="w-12 h-12 mx-auto rounded-sm bg-emerald-100 flex items-center justify-center mb-3">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium">Perfect Score!</p>
            <p className="text-xs text-slate-400 mt-1">
              No gaps identified. You're performing excellently across all objectives.
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
          Objective-Based Actions
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          Objectives grouped by your priority settings and benchmark gap. Click an objective to select actions.
        </p>
      </div>

      {/* Matrix Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="border border-slate-300 rounded-sm overflow-hidden">
          {/* Column Headers - Low → Medium → High (left to right) */}
          <div className="grid grid-cols-[80px_1fr_1fr_1fr] bg-slate-100 border-b border-slate-300">
            <div className="p-2" /> {/* Empty corner */}
            <div className="p-2 text-center border-l border-slate-300">
              <span className="text-xs font-bold text-slate-600 uppercase">Low Impact</span>
            </div>
            <div className="p-2 text-center border-l border-slate-300">
              <span className="text-xs font-bold text-slate-600 uppercase">Medium Impact</span>
            </div>
            <div className="p-2 text-center border-l border-slate-300">
              <span className="text-xs font-bold text-slate-600 uppercase">High Impact</span>
            </div>
          </div>

          {/* High Priority Row */}
          <div className="grid grid-cols-[80px_1fr_1fr_1fr] border-b border-slate-300">
            <div className="p-2 bg-slate-100 flex items-center justify-center border-r border-slate-300">
              <span
                className="text-xs font-bold text-slate-600 uppercase whitespace-nowrap"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                High Priority
              </span>
            </div>
            <MatrixCell
              objectives={matrixData.highPriorityLowImpact}
              config={MATRIX_CELLS.highPriorityLowImpact}
              selectedObjectiveId={selectedObjectiveId}
              onSelectObjective={setSelectedObjectiveId}
            />
            <MatrixCell
              objectives={matrixData.highPriorityMediumImpact}
              config={MATRIX_CELLS.highPriorityMediumImpact}
              selectedObjectiveId={selectedObjectiveId}
              onSelectObjective={setSelectedObjectiveId}
            />
            <MatrixCell
              objectives={matrixData.highPriorityHighImpact}
              config={MATRIX_CELLS.highPriorityHighImpact}
              selectedObjectiveId={selectedObjectiveId}
              onSelectObjective={setSelectedObjectiveId}
            />
          </div>

          {/* Lower Priority Row */}
          <div className="grid grid-cols-[80px_1fr_1fr_1fr]">
            <div className="p-2 bg-slate-100 flex items-center justify-center border-r border-slate-300">
              <span
                className="text-xs font-bold text-slate-600 uppercase whitespace-nowrap"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                Lower Priority
              </span>
            </div>
            <MatrixCell
              objectives={matrixData.lowPriorityLowImpact}
              config={MATRIX_CELLS.lowPriorityLowImpact}
              selectedObjectiveId={selectedObjectiveId}
              onSelectObjective={setSelectedObjectiveId}
            />
            <MatrixCell
              objectives={matrixData.lowPriorityMediumImpact}
              config={MATRIX_CELLS.lowPriorityMediumImpact}
              selectedObjectiveId={selectedObjectiveId}
              onSelectObjective={setSelectedObjectiveId}
            />
            <MatrixCell
              objectives={matrixData.lowPriorityHighImpact}
              config={MATRIX_CELLS.lowPriorityHighImpact}
              selectedObjectiveId={selectedObjectiveId}
              onSelectObjective={setSelectedObjectiveId}
            />
          </div>
        </div>

        {/* Detail Block - Shows actions for selected objective */}
        {selectedObjective && (
          <div className="mt-4 border border-slate-300 rounded-sm overflow-hidden bg-white">
            {/* Detail Header */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ChevronDown className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">
                  {OBJECTIVE_NAMES[selectedObjective.id] || selectedObjective.name}
                </span>
                <span className="text-xs text-slate-500">
                  ({selectedObjective.gaps.length} action{selectedObjective.gaps.length !== 1 ? 's' : ''})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectAllInObjective(selectedObjective.id)}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-sm transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={() => onClearAllInObjective(selectedObjective.id)}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-sm transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => setSelectedObjectiveId(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Detail Content - Action Cards */}
            <div className="p-4">
              <div className="flex flex-col gap-2">
                {selectedObjective.gaps.map(question => (
                  <ActionCard
                    key={question.id}
                    question={question}
                    isSelected={selectedActions.has(question.id)}
                    onToggle={() => onToggleAction(question.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex-shrink-0">
        <span className="text-sm text-slate-600">
          Selected: <strong>{selectedCount}</strong> of {totalActions} action{totalActions !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

// Matrix cell component - shows clickable objective names with zone label
function MatrixCell({
  objectives,
  config,
  selectedObjectiveId,
  onSelectObjective
}) {
  return (
    <div className={`p-3 min-h-[140px] border-l border-slate-300 relative ${config.bg}`}>
      {/* Zone label */}
      <span className="absolute top-1 right-2 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
        {config.label}
      </span>

      {/* Objective names - clickable */}
      <div className="mt-4 space-y-1.5">
        {objectives.length > 0 ? (
          objectives.map(obj => {
            const objName = OBJECTIVE_NAMES[obj.id] || obj.name || obj.id;
            const isSelected = selectedObjectiveId === obj.id;
            return (
              <button
                key={obj.id}
                onClick={() => onSelectObjective(isSelected ? null : obj.id)}
                className={`w-full text-left px-2 py-1.5 rounded-sm border transition-colors ${
                  isSelected
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                } ${obj.hasCritical ? 'border-l-2 border-l-red-500' : ''}`}
              >
                <span className="text-xs font-medium">{objName}</span>
                <span className="text-[10px] text-slate-400 ml-1.5">
                  ({obj.gaps.length})
                </span>
              </button>
            );
          })
        ) : (
          <span className="text-xs text-slate-400 italic">No objectives</span>
        )}
      </div>
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
              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-sm bg-red-100 text-red-700 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                Critical
              </span>
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
