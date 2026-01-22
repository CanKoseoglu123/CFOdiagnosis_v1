// src/components/assessment/AssessmentSidebar.jsx
// VS-44: Objective-level assessment sidebar
// - Shows 9 objectives grouped under 3 themes
// - Current objective highlighted, completed objectives clickable
// - Linear navigation enforced (can only click completed objectives)

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';

// Theme configuration with objectives in order
const THEME_CONFIG = {
  foundation: {
    label: 'Foundation',
    objectives: ['obj_budget_discipline', 'obj_financial_controls', 'obj_performance_monitoring']
  },
  future: {
    label: 'Future',
    objectives: ['obj_forecasting_agility', 'obj_driver_based_planning', 'obj_scenario_modeling']
  },
  intelligence: {
    label: 'Intelligence',
    objectives: ['obj_strategic_influence', 'obj_decision_support', 'obj_operational_excellence']
  }
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

// Full objective order for navigation checks
const OBJECTIVE_ORDER = [
  'obj_budget_discipline', 'obj_financial_controls', 'obj_performance_monitoring',
  'obj_forecasting_agility', 'obj_driver_based_planning', 'obj_scenario_modeling',
  'obj_strategic_influence', 'obj_decision_support', 'obj_operational_excellence'
];

// Workflow steps with navigation paths
const WORKFLOW_STEPS = [
  { id: 'setup', label: 'Company Setup', completed: true, path: (runId) => `/run/${runId}/setup/company?review=true` },
  { id: 'pillar', label: 'Pillar Setup', completed: true, path: (runId) => `/run/${runId}/setup/pillar?review=true` },
  { id: 'assessment', label: 'Assessment', current: true, path: null },
  { id: 'calibration', label: 'Calibration', completed: false, path: null },
  { id: 'report', label: 'Report', completed: false, path: null }
];

export default function AssessmentSidebar({
  currentObjective,
  allObjectivesProgress,
  overallProgress,
  runId,
  maxReachedIndex = 0  // High Water Mark: furthest objective index ever reached
}) {
  const navigate = useNavigate();

  // Get current objective index
  const currentIndex = OBJECTIVE_ORDER.indexOf(currentObjective);
  const isFirstObjective = currentIndex === 0;

  // Check if an objective is completed (all questions answered)
  const isObjectiveComplete = (objId) => {
    const progress = allObjectivesProgress?.[objId];
    return progress && progress.answered === progress.total && progress.total > 0;
  };

  // Check if user can navigate to an objective
  // Uses High Water Mark rule - user can navigate to any objective within HWM
  const canNavigateTo = (objId) => {
    const targetIndex = OBJECTIVE_ORDER.indexOf(objId);
    if (targetIndex === currentIndex) return false; // Already there
    if (targetIndex <= maxReachedIndex) return true; // Within HWM - can navigate
    return false; // Beyond HWM - cannot skip ahead
  };

  // Handle objective click - navigate to completed objectives for review
  const handleObjectiveClick = (objId) => {
    if (!runId || !canNavigateTo(objId)) return;
    navigate(`/assess/objective/${objId}?runId=${runId}`);
  };

  // Back button handler
  const handleBack = () => {
    if (!runId) return;
    if (isFirstObjective) {
      // First objective: go back to methodology/intro page
      navigate(`/run/${runId}/intro`);
    } else {
      // Go to previous objective
      const prevObjective = OBJECTIVE_ORDER[currentIndex - 1];
      navigate(`/assess/objective/${prevObjective}?runId=${runId}`);
    }
  };

  // Back button label
  const backButtonLabel = isFirstObjective ? 'Back to Methodology' : 'Previous Objective';

  return (
    <div className="flex flex-col h-full">
      {/* Workflow Steps */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Workflow
        </div>
        <div className="space-y-1">
          {WORKFLOW_STEPS.map((step) => {
            const canClickStep = step.completed && step.path && runId;
            const handleStepClick = () => {
              if (canClickStep) {
                navigate(step.path(runId));
              }
            };

            return (
              <button
                key={step.id}
                onClick={handleStepClick}
                disabled={!canClickStep}
                className={`group w-full flex items-center gap-2.5 py-1.5 px-2 rounded transition-colors text-left ${
                  step.current ? 'text-blue-700 font-medium' :
                  step.completed ? 'text-emerald-600 hover:bg-slate-100 cursor-pointer' :
                  'text-slate-400 cursor-default'
                }`}
              >
                {step.completed ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : step.current ? (
                  <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-blue-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="text-sm flex-1">{step.label}</span>
                {canClickStep && (
                  <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200 my-6" />

      {/* Assessment Progress - Objectives grouped by Theme */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Assessment Progress
        </div>
        <div className="space-y-4">
          {Object.entries(THEME_CONFIG).map(([themeId, config]) => {
            // Calculate theme progress
            const themeObjectives = config.objectives;
            const themeAnswered = themeObjectives.reduce((sum, objId) => {
              return sum + (allObjectivesProgress?.[objId]?.answered || 0);
            }, 0);
            const themeTotal = themeObjectives.reduce((sum, objId) => {
              return sum + (allObjectivesProgress?.[objId]?.total || 0);
            }, 0);
            const isThemeComplete = themeAnswered === themeTotal && themeTotal > 0;

            return (
              <div key={themeId}>
                {/* Theme Label */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold uppercase tracking-wide ${
                    isThemeComplete ? 'text-emerald-600' : 'text-slate-400'
                  }`}>
                    {config.label}
                  </span>
                  <span className={`text-xs ${
                    isThemeComplete ? 'text-emerald-600' : 'text-slate-400'
                  }`}>
                    {themeAnswered}/{themeTotal}
                  </span>
                </div>

                {/* Objectives in this theme */}
                <div className="space-y-1 ml-1">
                  {themeObjectives.map((objId) => {
                    const progress = allObjectivesProgress?.[objId] || { answered: 0, total: 0 };
                    const isCurrent = objId === currentObjective;
                    const isComplete = isObjectiveComplete(objId);
                    const canClick = canNavigateTo(objId);

                    return (
                      <button
                        key={objId}
                        onClick={() => handleObjectiveClick(objId)}
                        disabled={!canClick}
                        className={`group w-full flex items-center gap-2 py-1.5 px-2 rounded transition-colors ${
                          isCurrent
                            ? 'bg-blue-50 border-l-2 border-blue-500'
                            : canClick
                              ? 'hover:bg-slate-100 cursor-pointer'
                              : 'cursor-default opacity-60'
                        }`}
                      >
                        {/* Status icon */}
                        {isComplete ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        ) : isCurrent ? (
                          <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-blue-500 flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                        )}

                        {/* Objective name */}
                        <span className={`flex-1 text-left text-sm truncate ${
                          isCurrent ? 'font-medium text-blue-700' :
                          isComplete ? 'text-slate-700' :
                          'text-slate-400'
                        }`}>
                          {OBJECTIVE_NAMES[objId]}
                        </span>

                        {/* Progress count - hidden on hover when clickable, replaced by chevron */}
                        <span className={`text-xs flex-shrink-0 ${
                          canClick ? 'group-hover:hidden' : ''
                        } ${
                          isComplete ? 'text-emerald-600' :
                          isCurrent ? 'text-blue-600' :
                          'text-slate-400'
                        }`}>
                          {progress.answered}/{progress.total}
                        </span>

                        {/* Navigation chevron - only visible on hover for clickable objectives */}
                        {canClick && (
                          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 hidden group-hover:block" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200 my-6" />

      {/* Overall Progress */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Overall Progress
          </span>
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle2 className="w-3 h-3" />
            Auto-saved
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-600">All Questions</span>
          <span className="font-semibold text-slate-700">
            {overallProgress?.answered || 0}/{overallProgress?.total || 0}
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              overallProgress?.answered === overallProgress?.total && overallProgress?.total > 0
                ? 'bg-emerald-500'
                : 'bg-blue-500'
            }`}
            style={{
              width: `${overallProgress?.total > 0
                ? (overallProgress.answered / overallProgress.total) * 100
                : 0}%`
            }}
          />
        </div>
      </div>

      {/* Spacer to push buttons to bottom */}
      <div className="flex-1" />

      {/* Save & Exit Button */}
      <div className="mt-6">
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-slate-500 text-sm font-medium rounded-sm border border-slate-200 hover:bg-slate-50 hover:text-slate-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Save & Exit
        </button>
      </div>

      {/* Back Button */}
      <div className="mt-3">
        <button
          onClick={handleBack}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-600 text-sm font-medium rounded-sm border border-slate-300 hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {backButtonLabel}
        </button>
      </div>
    </div>
  );
}
