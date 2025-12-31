// src/components/assessment/AssessmentSidebar.jsx
// VS-42: Assessment sidebar matching Report section styling
// - Removed "Assessing" company box
// - Matched font sizes and styling to WorkflowSidebar
// - Added back button navigation

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react';

// Theme configuration
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

// Workflow steps
const WORKFLOW_STEPS = [
  { id: 'setup', label: 'Company Setup', completed: true },
  { id: 'pillar', label: 'Pillar Setup', completed: true },
  { id: 'assessment', label: 'Assessment', current: true },
  { id: 'calibration', label: 'Calibration', completed: false },
  { id: 'report', label: 'Report', completed: false }
];

export default function AssessmentSidebar({
  currentTheme,
  allThemesProgress,
  overallProgress,
  runId
}) {
  const navigate = useNavigate();
  // Track which themes are expanded (current theme expanded by default)
  const [expandedThemes, setExpandedThemes] = useState(new Set([currentTheme]));

  const toggleTheme = (themeId) => {
    setExpandedThemes(prev => {
      const next = new Set(prev);
      if (next.has(themeId)) {
        next.delete(themeId);
      } else {
        next.add(themeId);
      }
      return next;
    });
  };

  // Theme order for navigation
  const themeOrder = ['foundation', 'future', 'intelligence'];
  const currentIndex = themeOrder.indexOf(currentTheme);
  const isFirstTheme = currentIndex === 0;
  const prevTheme = !isFirstTheme ? themeOrder[currentIndex - 1] : null;

  // Back button handler - matches main content navigation
  const handleBack = () => {
    if (!runId) return;
    if (isFirstTheme) {
      // First theme: go back to methodology/intro page
      navigate(`/run/${runId}/intro`);
    } else if (prevTheme) {
      navigate(`/assess/${prevTheme}?runId=${runId}`);
    }
  };

  // Back button label
  const backButtonLabel = isFirstTheme ? 'Back to Methodology' : 'Back to Previous Theme';

  return (
    <div className="flex flex-col h-full">
      {/* Workflow Steps */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Workflow
        </div>
        <div className="space-y-1">
          {WORKFLOW_STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-2.5 py-1.5 ${
                step.current ? 'text-blue-700 font-medium' :
                step.completed ? 'text-emerald-600' :
                'text-slate-400'
              }`}
            >
              {step.completed ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : step.current ? (
                <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-blue-500 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="text-sm">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200 my-6" />

      {/* Themes Progress */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Themes Progress
        </div>
        <div className="space-y-1">
          {Object.entries(THEME_CONFIG).map(([themeId, config]) => {
            const themeData = allThemesProgress?.[themeId] || { answered: 0, total: 0, objectives: [] };
            const isExpanded = expandedThemes.has(themeId);
            const isCurrent = themeId === currentTheme;
            const isComplete = themeData.answered === themeData.total && themeData.total > 0;

            return (
              <div key={themeId}>
                {/* Theme Header */}
                <button
                  onClick={() => toggleTheme(themeId)}
                  className={`w-full flex items-center gap-2 py-1.5 hover:bg-slate-50 transition-colors rounded ${
                    isCurrent ? 'bg-slate-50' : ''
                  }`}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  )}

                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-blue-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}

                  <span className={`flex-1 text-left text-sm ${
                    isCurrent ? 'font-medium text-blue-700' :
                    isComplete ? 'text-emerald-600' :
                    'text-slate-600'
                  }`}>
                    {config.label}
                  </span>

                  <span className={`text-xs ${
                    isComplete ? 'text-emerald-600' : 'text-slate-400'
                  }`}>
                    {themeData.answered}/{themeData.total}
                  </span>
                </button>

                {/* Objectives (expanded) */}
                {isExpanded && themeData.objectives?.length > 0 && (
                  <div className="ml-6 pl-3 border-l border-slate-200 mt-1 space-y-1">
                    {themeData.objectives.map((obj) => {
                      const objComplete = obj.answered === obj.total && obj.total > 0;
                      return (
                        <div
                          key={obj.id}
                          className="flex items-center gap-2 py-1"
                        >
                          {objComplete ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                          )}
                          <span className={`flex-1 truncate text-xs ${
                            objComplete ? 'text-emerald-600' : 'text-slate-500'
                          }`}>
                            {OBJECTIVE_NAMES[obj.id] || obj.id}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {obj.answered}/{obj.total}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200 my-6" />

      {/* Overall Progress */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Overall Progress
        </div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-600">All Questions</span>
          <span className="font-semibold text-slate-700">
            {overallProgress.answered}/{overallProgress.total}
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              overallProgress.answered === overallProgress.total
                ? 'bg-emerald-500'
                : 'bg-blue-500'
            }`}
            style={{
              width: `${overallProgress.total > 0
                ? (overallProgress.answered / overallProgress.total) * 100
                : 0}%`
            }}
          />
        </div>
      </div>

      {/* Spacer to push back button to bottom */}
      <div className="flex-1" />

      {/* Back Button */}
      <div className="mt-6">
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
