// src/components/assessment/AssessmentSidebar.jsx
// VS-30: Assessment progress sidebar with workflow steps and all themes

import React, { useState } from 'react';
import { CheckCircle, Circle, ChevronDown, ChevronRight } from 'lucide-react';

// Theme configuration (neutral styling)
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
  companyName
}) {
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

  return (
    <div className="flex flex-col gap-3">
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

      {/* Workflow Steps */}
      <div className="bg-white border border-slate-300 rounded-sm overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            Workflow
          </h3>
        </div>
        <div className="p-3 space-y-1.5">
          {WORKFLOW_STEPS.map((step, idx) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 text-xs ${
                step.current ? 'font-semibold text-slate-800' : ''
              }`}
            >
              {step.completed ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              ) : step.current ? (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 flex-shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
              )}
              <span className={step.completed ? 'text-slate-500' : step.current ? 'text-slate-800' : 'text-slate-400'}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Themes Progress */}
      <div className="bg-white border border-slate-300 rounded-sm overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            Themes Progress
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
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
                  className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                    isCurrent ? 'bg-slate-50' : ''
                  }`}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  )}

                  {isComplete ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  ) : isCurrent ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                  )}

                  <span className={`flex-1 text-left text-xs ${
                    isCurrent ? 'font-semibold text-slate-800' : 'text-slate-600'
                  }`}>
                    {config.label}
                  </span>

                  <span className={`text-[10px] ${
                    isComplete ? 'text-emerald-600' : 'text-slate-400'
                  }`}>
                    {themeData.answered}/{themeData.total}
                  </span>
                </button>

                {/* Objectives (expanded) */}
                {isExpanded && themeData.objectives?.length > 0 && (
                  <div className="px-3 pb-2 pl-8 space-y-1">
                    {themeData.objectives.map((obj) => {
                      const objComplete = obj.answered === obj.total && obj.total > 0;
                      return (
                        <div
                          key={obj.id}
                          className="flex items-center gap-2 text-[11px]"
                        >
                          {objComplete ? (
                            <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <Circle className="w-3 h-3 text-slate-300 flex-shrink-0" />
                          )}
                          <span className={`flex-1 truncate ${
                            objComplete ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            {OBJECTIVE_NAMES[obj.id] || obj.id}
                          </span>
                          <span className="text-slate-400 text-[10px]">
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
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
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
      </div>
    </div>
  );
}
