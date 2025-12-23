// src/specs/practices.ts
// VS-23: FP&A Practice Catalog v1.1
// 21 practices mapped to 48 questions
// NOTE: No is_critical field - critical logic stays at Question level

export type ThemeId = 'foundation' | 'future' | 'intelligence';
export type EvidenceState = 'proven' | 'partial' | 'not_proven';

export interface Practice {
  id: string;
  title: string;
  description: string;
  objective_id: string;
  theme_id: ThemeId;
  maturity_level: 1 | 2 | 3 | 4;
  question_ids: string[];
}

export const FPA_PRACTICES: Practice[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // L1 FOUNDATION (5 Practices, 9 Questions)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'prac_annual_budget',
    title: 'Annual Budget Existence',
    description: 'Company produces an approved annual budget with full P&L before fiscal year begins',
    objective_id: 'obj_budget_integrity',
    theme_id: 'foundation',
    maturity_level: 1,
    question_ids: ['fpa_l1_q01', 'fpa_l1_q02']
    // Contains critical: fpa_l1_q01, fpa_l1_q02
  },
  {
    id: 'prac_budget_owners',
    title: 'Budget Owner Assignment',
    description: 'Budget owners are identified for each cost center with clear authority',
    objective_id: 'obj_budget_integrity',
    theme_id: 'foundation',
    maturity_level: 1,
    question_ids: ['fpa_l1_q03', 'fpa_l1_q04']
  },
  {
    id: 'prac_chart_of_accounts',
    title: 'Chart of Accounts',
    description: 'Single, documented chart of accounts used by all business units',
    objective_id: 'obj_financial_controls',
    theme_id: 'foundation',
    maturity_level: 1,
    question_ids: ['fpa_l1_q05']
    // Contains critical: fpa_l1_q05
  },
  {
    id: 'prac_approval_controls',
    title: 'Basic Approval Controls',
    description: 'Finance is in approval workflows with standard limits',
    objective_id: 'obj_financial_controls',
    theme_id: 'foundation',
    maturity_level: 1,
    question_ids: ['fpa_l1_q06', 'fpa_l1_q07', 'fpa_l1_q08']
  },
  {
    id: 'prac_mgmt_reporting',
    title: 'Management Reporting Package',
    description: 'Standard monthly management reporting package distributed to leadership',
    objective_id: 'obj_variance_discipline',
    theme_id: 'foundation',
    maturity_level: 1,
    question_ids: ['fpa_l1_q09']
    // Contains critical: fpa_l1_q09
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // L2 DEFINED (6 Practices, 14 Questions)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'prac_monthly_bva',
    title: 'Monthly BvA Generation',
    description: 'Budget vs Actuals report generated every month',
    objective_id: 'obj_variance_discipline',
    theme_id: 'foundation',
    maturity_level: 2,
    question_ids: ['fpa_l2_q01']
    // Contains critical: fpa_l2_q01
  },
  {
    id: 'prac_variance_investigation',
    title: 'Variance Investigation Discipline',
    description: 'Variances exceeding thresholds are formally investigated with defined process',
    objective_id: 'obj_variance_discipline',
    theme_id: 'foundation',
    maturity_level: 2,
    question_ids: ['fpa_l2_q02', 'fpa_l2_q03', 'fpa_l2_q04', 'fpa_l2_q05']
    // Contains critical: fpa_l2_q02
  },
  {
    id: 'prac_collaborative_forecast',
    title: 'Collaborative Forecast System',
    description: 'Live forecast stored in multi-user system (not single-user spreadsheet)',
    objective_id: 'obj_forecast_agility',
    theme_id: 'future',
    maturity_level: 2,
    question_ids: ['fpa_l2_q06']
    // Contains critical: fpa_l2_q06
  },
  {
    id: 'prac_cash_flow_forecast',
    title: 'Cash Flow Forecasting',
    description: 'Forecast projects cash flow and liquidity, not just P&L',
    objective_id: 'obj_forecast_agility',
    theme_id: 'future',
    maturity_level: 2,
    question_ids: ['fpa_l2_q07']
    // Contains critical: fpa_l2_q07
  },
  {
    id: 'prac_forecast_cycle',
    title: 'Forecast Refresh Cycle',
    description: 'Regular forecast update cadence with defined triggers',
    objective_id: 'obj_forecast_agility',
    theme_id: 'future',
    maturity_level: 2,
    question_ids: ['fpa_l2_q08', 'fpa_l2_q09', 'fpa_l2_q10']
  },
  {
    id: 'prac_process_controls',
    title: 'Process & Control Documentation',
    description: 'Finance processes documented with control monitoring in place',
    objective_id: 'obj_financial_controls',
    theme_id: 'foundation',
    maturity_level: 2,
    question_ids: ['fpa_l2_q11', 'fpa_l2_q12', 'fpa_l2_q13', 'fpa_l2_q14']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // L3 MANAGED (6 Practices, 15 Questions)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'prac_driver_based',
    title: 'Driver-Based Models',
    description: 'Planning uses operational drivers, not just financial line items',
    objective_id: 'obj_decision_support',
    theme_id: 'intelligence',
    maturity_level: 3,
    question_ids: ['fpa_l3_q01', 'fpa_l3_q02']
  },
  {
    id: 'prac_integrated_planning',
    title: 'Integrated Planning',
    description: 'Financial plan integrates with operational plans across functions',
    objective_id: 'obj_decision_support',
    theme_id: 'intelligence',
    maturity_level: 3,
    question_ids: ['fpa_l3_q03', 'fpa_l3_q04']
  },
  {
    id: 'prac_business_partnership',
    title: 'Business Partnership',
    description: 'Finance actively partners with business leaders on decisions',
    objective_id: 'obj_decision_support',
    theme_id: 'intelligence',
    maturity_level: 3,
    question_ids: ['fpa_l3_q05', 'fpa_l3_q06']
  },
  {
    id: 'prac_strategic_planning',
    title: 'Strategic Planning Integration',
    description: 'FP&A connected to strategic planning cycle',
    objective_id: 'obj_decision_support',
    theme_id: 'intelligence',
    maturity_level: 3,
    question_ids: ['fpa_l3_q07', 'fpa_l3_q08']
  },
  {
    id: 'prac_rolling_forecast',
    title: 'Rolling Forecast Cadence',
    description: 'Forecast extends beyond fiscal year with regular rolling updates',
    objective_id: 'obj_forecast_agility',
    theme_id: 'future',
    maturity_level: 3,
    question_ids: ['fpa_l3_q09', 'fpa_l3_q10', 'fpa_l3_q11']
  },
  {
    id: 'prac_scenario_planning',
    title: 'Scenario Planning',
    description: 'Multiple scenarios maintained and updated for decision support',
    objective_id: 'obj_scenario_planning',
    theme_id: 'future',
    maturity_level: 3,
    question_ids: ['fpa_l3_q12', 'fpa_l3_q13', 'fpa_l3_q14', 'fpa_l3_q15']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // L4 OPTIMIZED (4 Practices, 10 Questions)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'prac_forward_kpis',
    title: 'Forward-Looking KPIs',
    description: 'Leading indicators and predictive metrics tracked alongside lagging KPIs',
    objective_id: 'obj_analytics_capability',
    theme_id: 'intelligence',
    maturity_level: 4,
    question_ids: ['fpa_l4_q01', 'fpa_l4_q04', 'fpa_l4_q05']
  },
  {
    id: 'prac_automated_insights',
    title: 'Automated Insight Generation',
    description: 'Variance explanations and anomalies surfaced automatically, not manually',
    objective_id: 'obj_analytics_capability',
    theme_id: 'intelligence',
    maturity_level: 4,
    question_ids: ['fpa_l4_q02', 'fpa_l4_q03']
  },
  {
    id: 'prac_continuous_planning',
    title: 'Continuous Planning Cycle',
    description: 'Plan updates triggered by events, not calendar; real-time reforecasting capability',
    objective_id: 'obj_forecast_agility',
    theme_id: 'future',
    maturity_level: 4,
    question_ids: ['fpa_l4_q06', 'fpa_l4_q07', 'fpa_l4_q08', 'fpa_l4_q09']
  },
  {
    id: 'prac_self_service',
    title: 'Self-Service Analytics',
    description: 'Business users can pull reports and analyze data without FP&A intervention',
    objective_id: 'obj_analytics_capability',
    theme_id: 'intelligence',
    maturity_level: 4,
    question_ids: ['fpa_l4_q10']
  }
];

// Verify question count
const allQuestionIds = FPA_PRACTICES.flatMap(p => p.question_ids);
const uniqueQuestionIds = [...new Set(allQuestionIds)];

if (uniqueQuestionIds.length !== 48) {
  console.warn(`Practice catalog has ${uniqueQuestionIds.length} questions, expected 48`);
}

// Level summary
export const PRACTICE_COUNTS = {
  L1: FPA_PRACTICES.filter(p => p.maturity_level === 1).length, // 5
  L2: FPA_PRACTICES.filter(p => p.maturity_level === 2).length, // 6
  L3: FPA_PRACTICES.filter(p => p.maturity_level === 3).length, // 6
  L4: FPA_PRACTICES.filter(p => p.maturity_level === 4).length  // 4
};

export const LEVEL_NAMES: Record<number, string> = {
  1: 'Foundation',
  2: 'Defined',
  3: 'Managed',
  4: 'Optimized'
};
