// src/components/report/ObjectivesPracticesOverview.jsx
// VS-27: Objectives & Practices Overview Grid
// VS-35: Added branching connector lines from objectives to practices
// VS-37: Fixed connector lines, removed level badges, fixed box sizes

import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// Objectives in display order (left to right) - shorter titles for compact view
const OBJECTIVES = [
  { id: 'obj_budget_discipline', shortTitle: 'Budget Discipline' },
  { id: 'obj_financial_controls', shortTitle: 'Financial Controls' },
  { id: 'obj_performance_monitoring', shortTitle: 'Performance Monitoring' },
  { id: 'obj_forecasting_agility', shortTitle: 'Forecasting Agility' },
  { id: 'obj_driver_based_planning', shortTitle: 'Driver-Based Planning' },
  { id: 'obj_scenario_modeling', shortTitle: 'Scenario Modeling' },
  { id: 'obj_strategic_influence', shortTitle: 'Strategic Influence' },
  { id: 'obj_decision_support', shortTitle: 'Decision Support' },
  { id: 'obj_operational_excellence', shortTitle: 'Operational Excellence' }
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

// Score to color for bubble
function getScoreColor(score) {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

// Fixed practice box height (in pixels) - for consistent sizing
const PRACTICE_BOX_HEIGHT = 40;
const PRACTICE_BOX_GAP = 4; // gap-1 = 4px

// ═══════════════════════════════════════════════════════════════════════════
// PRACTICE BOX - Single activity tile (fixed size, no level badge)
// ═══════════════════════════════════════════════════════════════════════════

function PracticeBox({ practice }) {
  const bgColor = STATE_BG[practice.evidence_state] || STATE_BG.not_proven;

  return (
    <div
      className={`
        ${bgColor} text-white rounded-sm px-1.5 py-1
        flex items-center justify-center text-center
        w-full
      `}
      style={{ height: `${PRACTICE_BOX_HEIGHT}px` }}
    >
      {/* Practice title only - no level badge */}
      <span className="text-[9px] font-medium leading-tight line-clamp-2">
        {practice.title}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// OBJECTIVE COLUMN - Card with header + practices stack
// ═══════════════════════════════════════════════════════════════════════════

function ObjectiveColumn({ objective, practices, score }) {
  // Calculate dynamic vertical line height based on number of practices
  // Line should end at the center of the last practice box
  const practiceCount = practices.length;

  // Line starts from top of practices area
  // Ends at center of last practice (halfway through last box)
  // Total height = (n-1) gaps + (n-0.5) boxes = practices area minus half a box
  const lineHeight = practiceCount > 0
    ? (practiceCount - 1) * (PRACTICE_BOX_HEIGHT + PRACTICE_BOX_GAP) + (PRACTICE_BOX_HEIGHT / 2)
    : 0;

  return (
    <div className="flex flex-col flex-1 min-w-[95px] max-w-[130px] border border-slate-300 rounded bg-slate-50 overflow-hidden">
      {/* Objective header with score bubble */}
      <div className="bg-[#001a33] text-white p-1.5 text-center relative min-h-[44px] flex items-center justify-center">
        {/* Score bubble - top right */}
        {score !== undefined && (
          <span className={`absolute -top-0 -right-0 w-6 h-6 ${getScoreColor(score)} text-white text-[9px] font-bold rounded-bl-lg flex items-center justify-center`}>
            {score}
          </span>
        )}
        <span className="text-[9px] font-semibold leading-tight pr-3">
          {objective.shortTitle}
        </span>
      </div>

      {/* Practices stack with branching connector lines */}
      <div className="relative p-1.5 pt-3 flex-1">
        {/* Vertical connector line - dynamic height based on practice count */}
        {practiceCount > 0 && (
          <div
            className="absolute bg-slate-300"
            style={{
              width: '1px',
              left: '12px', // 3 * 4px = 12px (left-3)
              top: '12px', // Start from top of practices area (pt-3 = 12px)
              height: `${lineHeight}px`
            }}
          />
        )}

        {/* Practices with horizontal branch connectors */}
        <div className="flex flex-col gap-1 pl-4">
          {practices.map((practice, index) => (
            <div key={practice.id} className="relative">
              {/* Horizontal branch connector - positioned precisely */}
              <div
                className="absolute bg-slate-300"
                style={{
                  left: '-16px', // Connect from vertical line
                  width: '14px', // Stop at edge of practice box
                  height: '1px',
                  top: `${PRACTICE_BOX_HEIGHT / 2}px` // Center of practice box
                }}
              />
              <PracticeBox practice={practice} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LEGEND (compact, without level indicator)
// ═══════════════════════════════════════════════════════════════════════════

function Legend() {
  return (
    <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-200">
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 bg-[#003366] rounded-sm" />
        <span>Proven</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 bg-[#336699] rounded-sm" />
        <span>Partial</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 bg-[#6699CC] rounded-sm" />
        <span>Gap</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ObjectivesPracticesOverview({ levels, objectiveScores = {} }) {
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
      {/* Header - VS-37: increased title size to match other section titles */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">
          Objectives & Practices
        </h2>
        <span className="text-[9px] text-slate-400">
          Score shown in corner
        </span>
      </div>

      {/* Grid container */}
      <div className="p-2">
        <div className="flex gap-1.5">
          {/* Objective columns */}
          {OBJECTIVES.map(objective => (
            <ObjectiveColumn
              key={objective.id}
              objective={objective}
              practices={practicesByObjective[objective.id] || []}
              score={objectiveScores[objective.id]}
            />
          ))}
        </div>

        {/* Legend */}
        <Legend />
      </div>
    </div>
  );
}
