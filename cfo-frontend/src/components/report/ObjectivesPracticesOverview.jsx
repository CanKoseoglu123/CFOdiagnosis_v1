// src/components/report/ObjectivesPracticesOverview.jsx
// VS-27: Objectives & Practices Overview Grid
// Shows objectives as columns with practices stacked vertically

import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// Objectives in display order (left to right)
const OBJECTIVES = [
  { id: 'obj_budget_discipline', title: 'Budget Discipline', shortTitle: 'Budget Discipline' },
  { id: 'obj_financial_controls', title: 'Financial Controls', shortTitle: 'Financial Controls' },
  { id: 'obj_performance_monitoring', title: 'Performance Monitoring', shortTitle: 'Performance Monitoring' },
  { id: 'obj_forecasting_agility', title: 'Forecasting Agility', shortTitle: 'Forecasting Agility' },
  { id: 'obj_driver_based_planning', title: 'Driver-Based Planning', shortTitle: 'Driver-Based Planning' },
  { id: 'obj_scenario_modeling', title: 'Scenario Modeling', shortTitle: 'Scenario Modeling' },
  { id: 'obj_strategic_influence', title: 'Strategic Influence', shortTitle: 'Strategic Influence' },
  { id: 'obj_decision_support', title: 'Decision Support', shortTitle: 'Decision Support' },
  { id: 'obj_operational_excellence', title: 'Operational Excellence', shortTitle: 'Operational Excellence' }
];

// Practice to objective mapping
const PRACTICE_OBJECTIVE_MAP = {
  'prac_annual_budget_cycle': 'obj_budget_discipline',
  'prac_budget_ownership': 'obj_budget_discipline',
  'prac_policy_&_governance': 'obj_budget_discipline',
  'prac_chart_of_accounts': 'obj_financial_controls',
  'prac_approval_workflows': 'obj_financial_controls',
  'prac_month_end_rigor': 'obj_financial_controls',
  'prac_management_reporting': 'obj_performance_monitoring',
  'prac_budget_vs_actuals': 'obj_performance_monitoring',
  'prac_variance_investigation': 'obj_performance_monitoring',
  'prac_rolling_forecast_cadence': 'obj_forecasting_agility',
  'prac_cash_flow_visibility': 'obj_forecasting_agility',
  'prac_collaborative_systems': 'obj_forecasting_agility',
  'prac_operational_drivers': 'obj_driver_based_planning',
  'prac_dynamic_targets': 'obj_driver_based_planning',
  'prac_continuous_planning': 'obj_driver_based_planning',
  'prac_rapid_what_if_capability': 'obj_scenario_modeling',
  'prac_multi_scenario_management': 'obj_scenario_modeling',
  'prac_stress_testing': 'obj_scenario_modeling',
  'prac_commercial_partnership': 'obj_strategic_influence',
  'prac_strategic_alignment': 'obj_strategic_influence',
  'prac_board_level_impact': 'obj_strategic_influence',
  'prac_investment_rigor': 'obj_strategic_influence',
  'prac_data_visualization': 'obj_decision_support',
  'prac_self_service_access': 'obj_decision_support',
  'prac_predictive_analytics': 'obj_decision_support',
  'prac_process_automation': 'obj_operational_excellence',
  'prac_shared_services_model': 'obj_operational_excellence',
  'prac_service_level_agreements': 'obj_operational_excellence'
};

// Evidence state to background color
const STATE_BG = {
  proven: 'bg-[#003366]',      // Dark navy - proven
  partial: 'bg-[#336699]',     // Medium blue - partial
  not_proven: 'bg-[#6699CC]'   // Light blue - gap
};

// ═══════════════════════════════════════════════════════════════════════════
// PRACTICE BOX - Single activity tile
// ═══════════════════════════════════════════════════════════════════════════

function PracticeBox({ practice }) {
  const bgColor = STATE_BG[practice.evidence_state] || STATE_BG.not_proven;

  return (
    <div
      className={`
        ${bgColor} text-white rounded-sm p-2 relative
        min-h-[50px] flex items-center justify-center text-center
      `}
    >
      {/* Maturity level badge - top right */}
      <span className="absolute top-1 right-1 text-[10px] font-bold text-white/70">
        {practice.level}
      </span>

      {/* Practice title */}
      <span className="text-[11px] font-medium leading-tight px-1">
        {practice.title}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// OBJECTIVE COLUMN - Header + practices stack
// ═══════════════════════════════════════════════════════════════════════════

function ObjectiveColumn({ objective, practices }) {
  return (
    <div className="flex flex-col min-w-[110px] max-w-[130px]">
      {/* Objective header */}
      <div className="bg-[#002244] text-white rounded-t-sm p-2 text-center relative min-h-[56px] flex items-center justify-center">
        {/* Level badge - top right */}
        {practices.length > 0 && (
          <span className="absolute top-1 right-1 text-[10px] font-bold text-white/70">
            {Math.max(...practices.map(p => p.level))}
          </span>
        )}
        <span className="text-[11px] font-semibold leading-tight">
          {objective.shortTitle}
        </span>
      </div>

      {/* Practices stack */}
      <div className="flex flex-col gap-1 pt-1">
        {practices.map(practice => (
          <PracticeBox key={practice.id} practice={practice} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LEGEND
// ═══════════════════════════════════════════════════════════════════════════

function Legend() {
  return (
    <div className="flex items-center gap-6 text-xs text-slate-500 mt-4">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-[#003366] rounded-sm" />
        <span>Proven</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-[#336699] rounded-sm" />
        <span>Partial</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-[#6699CC] rounded-sm" />
        <span>Gap</span>
      </div>
      <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-200">
        <span className="text-[10px] font-bold text-slate-400">1-4</span>
        <span>Maturity Level</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ObjectivesPracticesOverview({ levels }) {
  // Flatten all practices from all levels and add level info
  const allPractices = [];
  (levels || []).forEach(level => {
    (level.practices || []).forEach(practice => {
      allPractices.push({
        ...practice,
        level: practice.level || level.level
      });
    });
  });

  // Group practices by objective
  const practicesByObjective = {};
  OBJECTIVES.forEach(obj => {
    practicesByObjective[obj.id] = [];
  });

  allPractices.forEach(practice => {
    const objectiveId = PRACTICE_OBJECTIVE_MAP[practice.id];
    if (objectiveId && practicesByObjective[objectiveId]) {
      practicesByObjective[objectiveId].push(practice);
    }
  });

  // Sort practices within each objective by level (ascending)
  Object.keys(practicesByObjective).forEach(objId => {
    practicesByObjective[objId].sort((a, b) => (a.level || 1) - (b.level || 1));
  });

  return (
    <div className="bg-white border border-slate-300 rounded-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Objectives & Practices
        </h2>
        <p className="text-[10px] text-slate-400 mt-1">
          Overall Objectives (top row) with Functional Activities below
        </p>
      </div>

      {/* Grid container - horizontal scroll for smaller screens */}
      <div className="p-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {/* Y-axis label */}
          <div className="flex flex-col justify-center pr-2">
            <div
              className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              Functional Activities for each Objective
            </div>
          </div>

          {/* Objective columns */}
          {OBJECTIVES.map(objective => (
            <ObjectiveColumn
              key={objective.id}
              objective={objective}
              practices={practicesByObjective[objective.id] || []}
            />
          ))}
        </div>

        {/* X-axis label */}
        <div className="text-center mt-3">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
            Overall Objectives
          </span>
        </div>

        {/* Legend */}
        <Legend />
      </div>
    </div>
  );
}
