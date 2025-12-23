// src/data/spec.js
// Frontend data layer for CFO Diagnostic v2.8.0
// This provides lookup functions for question titles and initiative metadata

// =============================================================================
// LEVEL NAMES (No Level 0)
// =============================================================================
export const LEVEL_NAMES = {
  1: 'Emerging',
  2: 'Defined',
  3: 'Managed',
  4: 'Optimized'
};

export const LEVEL_THRESHOLDS = {
  1: 0,
  2: 50,
  3: 80,
  4: 95
};

// =============================================================================
// INITIATIVES (9 total)
// =============================================================================
export const INITIATIVES = [
  {
    id: 'init_budget_discipline',
    title: 'Establish Budget Discipline',
    description: 'A credible budget is the foundation of financial management. Without it, variance analysis is meaningless and forecasting has no anchor.',
    theme_id: 'foundation',
    objective_id: 'obj_fpa_l1_budget'
  },
  {
    id: 'init_financial_controls',
    title: 'Strengthen Financial Controls',
    description: 'Controls protect the integrity of your numbers. A single chart of accounts, reconciliation discipline, and journal entry governance prevent errors.',
    theme_id: 'foundation',
    objective_id: 'obj_fpa_l1_control'
  },
  {
    id: 'init_feedback_loops',
    title: 'Implement Performance Feedback Loops',
    description: 'Budgets without follow-up are just wishes. Monthly BvA, variance investigation, and owner accountability create the feedback loops that drive performance.',
    theme_id: 'foundation',
    objective_id: 'obj_fpa_l2_variance'
  },
  {
    id: 'init_forecast_infrastructure',
    title: 'Modernize Forecasting Infrastructure',
    description: "A forecast trapped in one person's spreadsheet is a liability. Multi-user systems, cash flow integration, and scenario capability create a forecast you can trust.",
    theme_id: 'future',
    objective_id: 'obj_fpa_l2_forecast'
  },
  {
    id: 'init_forward_visibility',
    title: 'Build Forward Visibility',
    description: "Connect finance models to strategy. Track leading indicators, monitor value-creation initiatives, and stress-test the plan.",
    theme_id: 'future',
    objective_id: 'obj_fpa_l3_driver'
  },
  {
    id: 'init_seat_at_table',
    title: 'Earn a Seat at the Table',
    description: 'Finance must be consulted before decisions are made, not informed after. This requires building trust through reliability, then proving value through insight.',
    theme_id: 'intelligence',
    objective_id: 'obj_fpa_l3_scenario'
  },
  {
    id: 'init_strategic_influence',
    title: 'Exercise Strategic Influence',
    description: 'The ultimate test of Finance credibility: can you stop a bad project? Can you present uncomfortable truths? Influence comes from courage backed by rigor.',
    theme_id: 'intelligence',
    objective_id: 'obj_fpa_l3_scenario'
  },
  {
    id: 'init_decision_support',
    title: 'Enable Decision Support',
    description: 'Business moves fast. Finance must answer questions in hours, not weeks. Self-serve analytics, rapid ad-hoc analysis, and real-time data access enable this.',
    theme_id: 'intelligence',
    objective_id: 'obj_fpa_l4_predict'
  },
  {
    id: 'init_operational_excellence',
    title: 'Achieve Operational Excellence',
    description: 'Automate the routine to free capacity for the strategic. Data pipelines, integrated systems, and continuous improvement create efficiency headroom.',
    theme_id: 'intelligence',
    objective_id: 'obj_fpa_l4_predict'
  }
];

// =============================================================================
// QUESTION TITLES (Expert Action Titles)
// Used to display human-readable text instead of question IDs
// =============================================================================
export const QUESTION_TITLES = {
  // Level 1 - Budgeting
  'fpa_l1_q01': 'Implement Annual Budget Cycle',
  'fpa_l1_q02': 'Extend Budget to Full P&L',
  'fpa_l1_q03': 'Communicate Budget to Leaders',
  'fpa_l1_q04': 'Assign Clear Budget Ownership',

  // Level 1 - Controls
  'fpa_l1_q05': 'Standardize Chart of Accounts',
  'fpa_l1_q06': 'Enforce Approval Controls',
  'fpa_l1_q07': 'Implement Cash Reconciliations',
  'fpa_l1_q08': 'Implement System Access Controls',
  'fpa_l1_q09': 'Create Standard Reporting Package',

  // Level 2 - Variance
  'fpa_l2_q01': 'Implement Monthly BvA Reporting',
  'fpa_l2_q02': 'Establish Variance Investigation Protocol',
  'fpa_l2_q03': 'Drive Budget Owner Accountability',
  'fpa_l2_q04': 'Implement Corrective Action Tracking',
  'fpa_l2_q05': 'Develop Trend Analysis Capability',

  // Level 2 - Forecasting
  'fpa_l2_q06': 'Migrate to Collaborative Planning',
  'fpa_l2_q07': 'Add Cash Flow to Forecast',
  'fpa_l2_q08': 'Implement Blameless Forecast Reviews',
  'fpa_l2_q09': 'Establish Finance Challenge Authority',
  'fpa_l2_q10': 'Document Key Assumptions',
  'fpa_l2_q11': 'Implement Monthly Forecast Refresh',
  'fpa_l2_q12': 'Create R&O Register',
  'fpa_l2_q13': 'Establish Forecast Accuracy Metrics',
  'fpa_l2_q14': 'Enable Self-Service Analytics',

  // Level 3 - Driver-Based Planning
  'fpa_l3_q01': 'Link Model to Operational Drivers',
  'fpa_l3_q02': 'Track Unit Economics',
  'fpa_l3_q03': 'Give Finance Decision-Blocking Power',
  'fpa_l3_q04': 'Track Strategic Initiative Performance',
  'fpa_l3_q05': 'Connect Budget to Strategy',

  // Level 3 - Scenario Planning
  'fpa_l3_q06': 'Present Downside Scenarios',
  'fpa_l3_q07': 'Activate Contingency Plans',
  'fpa_l3_q08': 'Stress-Test Key Assumptions',
  'fpa_l3_q09': 'Monitor Leading Indicators',
  'fpa_l3_q10': 'Model External Volatility',

  // Level 3 - Behavioral
  'fpa_l3_q11': 'Ensure Finance Has Seat at Table',
  'fpa_l3_q12': 'Influence Decision-Making',
  'fpa_l3_q13': 'Build Operational Partnership',
  'fpa_l3_q14': 'Challenge Optimistic Assumptions',
  'fpa_l3_q15': 'Drive Evidence-Based Decisions',

  // Level 4 - Integrated Planning
  'fpa_l4_q01': 'Create Single Source of Truth',
  'fpa_l4_q02': 'Resolve Forecast Conflicts',
  'fpa_l4_q03': 'Eliminate Shadow Spreadsheets',
  'fpa_l4_q04': 'Enable Real-Time Data Access',
  'fpa_l4_q05': 'Align Planning Across Functions',

  // Level 4 - Predictive Analytics
  'fpa_l4_q06': 'Implement Algorithmic Forecasting',
  'fpa_l4_q07': 'Enable Rapid Anomaly Investigation',
  'fpa_l4_q08': 'Monitor External Signals',
  'fpa_l4_q09': 'Experiment with New Methods',
  'fpa_l4_q10': 'Automate Routine Analysis'
};

// =============================================================================
// QUESTION FULL TEXT (For tooltips and details)
// =============================================================================
export const QUESTION_TEXT = {
  'fpa_l1_q01': 'Does the company produce an approved annual budget before the fiscal year begins?',
  'fpa_l1_q02': 'Does the budget include a full P&L down to Net Income (not just Revenue/Opex)?',
  'fpa_l1_q03': 'Is the approved budget distributed to all department heads before the fiscal year starts?',
  'fpa_l1_q04': 'Is there a single named executive accountable for budget vs. actual performance?',
  'fpa_l1_q05': 'Is there a single, documented chart of accounts used by all business units?',
  'fpa_l1_q06': 'Are spending approvals systematically rejected by Finance when they exceed delegated authority?',
  'fpa_l1_q07': 'Are cash reconciliations completed monthly to ensure the reported cash position is real?',
  'fpa_l1_q08': 'Are system access controls (SoD) enforced to prevent unauthorized changes?',
  'fpa_l1_q09': 'Is there a standard monthly management reporting package distributed to leadership?',
  'fpa_l2_q01': 'Is a Budget vs. Actuals (BvA) report generated every month?',
  'fpa_l2_q02': 'Are variances exceeding a defined threshold (e.g., 10%) formally investigated?',
  'fpa_l2_q03': 'Do department heads actively review their BvA performance with Finance monthly?',
  'fpa_l2_q04': 'When a variance is identified, is there documented follow-up to confirm corrective action?',
  'fpa_l2_q05': 'Does Finance produce trend analysis showing performance over time?',
  'fpa_l2_q06': 'Is the live forecast stored in a multi-user system (not a single-user spreadsheet)?',
  'fpa_l2_q07': 'Does the forecast project cash flow and liquidity, not just P&L?',
  'fpa_l2_q08': 'When the forecast is wrong, does Finance lead a blameless post-mortem?',
  'fpa_l2_q09': 'Does Finance have authority to challenge and adjust operational inputs?',
  'fpa_l2_q10': 'Are key forecast assumptions explicitly documented and reviewed?',
  'fpa_l2_q11': 'Is the forecast refreshed at least monthly with actual results?',
  'fpa_l2_q12': 'Does Finance maintain a Risks & Opportunities register?',
  'fpa_l2_q13': 'Does Finance track forecast accuracy and report on it?',
  'fpa_l2_q14': 'Can business users access financial data without requesting custom reports?'
};

// =============================================================================
// LOOKUP FUNCTIONS
// =============================================================================

/**
 * Get human-readable title for a question ID
 * Falls back to the question ID if not found
 */
export function getQuestionTitle(questionId) {
  return QUESTION_TITLES[questionId] || questionId;
}

/**
 * Get full question text for a question ID
 * Falls back to the title or ID if not found
 */
export function getQuestionText(questionId) {
  return QUESTION_TEXT[questionId] || QUESTION_TITLES[questionId] || questionId;
}

/**
 * Get initiative by ID
 */
export function getInitiative(initiativeId) {
  return INITIATIVES.find(i => i.id === initiativeId);
}

/**
 * Get level name from level number
 * Returns 'Unknown' for invalid levels (including 0)
 */
export function getLevelName(level) {
  return LEVEL_NAMES[level] || 'Unknown';
}

/**
 * Get level threshold percentage
 */
export function getLevelThreshold(level) {
  return LEVEL_THRESHOLDS[level] ?? 0;
}

// =============================================================================
// PRIORITY CONFIG (For tabs)
// =============================================================================
export const PRIORITY_CONFIG = {
  P1: {
    label: 'Unlock',
    description: 'Fix these critical gaps to advance',
    color: 'red'
  },
  P2: {
    label: 'Optimize',
    description: 'Strengthen your current level',
    color: 'yellow'
  },
  P3: {
    label: 'Future',
    description: 'Prepare for the next level',
    color: 'blue'
  }
};

// =============================================================================
// ACTION TYPE CONFIG
// =============================================================================
export const ACTION_TYPE_CONFIG = {
  quick_win: {
    label: 'Quick Win',
    color: 'text-green-700 bg-green-50 border-green-200'
  },
  structural: {
    label: 'Structural',
    color: 'text-blue-700 bg-blue-50 border-blue-200'
  },
  behavioral: {
    label: 'Behavioral',
    color: 'text-purple-700 bg-purple-50 border-purple-200'
  },
  governance: {
    label: 'Governance',
    color: 'text-orange-700 bg-orange-50 border-orange-200'
  }
};

// =============================================================================
// EFFORT CONFIG
// =============================================================================
export const EFFORT_CONFIG = {
  low: { label: 'Low', color: 'text-green-700' },
  medium: { label: 'Med', color: 'text-yellow-700' },
  high: { label: 'High', color: 'text-red-700' }
};

// =============================================================================
// VS21: IMPORTANCE CONFIG (Calibration Layer)
// =============================================================================
export const IMPORTANCE_CONFIG = {
  5: { label: 'Crit', fullLabel: 'Critical Priority', color: 'text-red-700 bg-red-50 border-red-200' },
  4: { label: 'High', fullLabel: 'High Priority', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  3: { label: 'Med', fullLabel: 'Medium Priority', color: 'text-slate-600 bg-slate-50 border-slate-200' },
  2: { label: 'Low', fullLabel: 'Low Priority', color: 'text-slate-500 bg-slate-50 border-slate-200' },
  1: { label: 'Min', fullLabel: 'Minimal Priority', color: 'text-slate-400 bg-slate-50 border-slate-200' }
};

/**
 * Get importance config by level
 */
export function getImportanceConfig(level) {
  return IMPORTANCE_CONFIG[level] || IMPORTANCE_CONFIG[3];
}
