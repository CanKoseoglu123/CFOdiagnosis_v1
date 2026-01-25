/**
 * Demo Report Data
 *
 * Static sample data for the demo report page.
 * Fictional company "Apex Industries Inc." used to showcase
 * what a full executive report looks like.
 */

export const DEMO_COMPANY = {
  name: 'Apex Industries Inc.',
  industry: 'Manufacturing',
  size: '$50M-100M Revenue',
  country: 'United States',
  fteCount: '150-250',
  persona: 'Growth-Focused',
};

export const DEMO_SCORES = {
  overall: {
    score: 58,
    level: 2,
    levelName: 'Defined',
    trend: 'improving',
  },
  themes: [
    {
      id: 'foundation',
      name: 'Operational Foundation',
      score: 62,
      level: 2,
      objectives: [
        { id: 'obj_budget_discipline', name: 'Budget Discipline', score: 71, level: 3 },
        { id: 'obj_close_efficiency', name: 'Close Efficiency', score: 58, level: 2 },
        { id: 'obj_control_integration', name: 'Control Integration', score: 54, level: 2 },
        { id: 'obj_data_foundation', name: 'Data Foundation', score: 65, level: 2 },
      ],
    },
    {
      id: 'future',
      name: 'Future Orientation',
      score: 52,
      level: 2,
      objectives: [
        { id: 'obj_forecasting_agility', name: 'Forecasting Agility', score: 48, level: 2 },
        { id: 'obj_planning_depth', name: 'Planning Depth', score: 55, level: 2 },
        { id: 'obj_scenario_readiness', name: 'Scenario Readiness', score: 42, level: 2 },
      ],
    },
    {
      id: 'intelligence',
      name: 'Strategic Intelligence',
      score: 55,
      level: 2,
      objectives: [
        { id: 'obj_strategic_influence', name: 'Strategic Influence', score: 62, level: 2 },
        { id: 'obj_value_architecture', name: 'Value Architecture', score: 51, level: 2 },
        { id: 'obj_ai_analytics', name: 'AI & Analytics', score: 38, level: 1 },
      ],
    },
  ],
};

export const DEMO_BENCHMARKS = {
  industry: {
    name: 'Manufacturing',
    average: 52,
    percentile: 65,
  },
  size: {
    name: '$50M-100M Revenue',
    average: 55,
    percentile: 58,
  },
};

export const DEMO_PRIORITIES = [
  {
    id: 1,
    objective: 'Scenario Readiness',
    action: 'Implement structured what-if modeling framework',
    impact: 4,
    complexity: 2,
    priority: 'P1',
    type: 'quick_win',
  },
  {
    id: 2,
    objective: 'AI & Analytics',
    action: 'Deploy automated variance analysis dashboards',
    impact: 4,
    complexity: 3,
    priority: 'P1',
    type: 'structural',
  },
  {
    id: 3,
    objective: 'Forecasting Agility',
    action: 'Reduce forecast cycle from 10 days to 5 days',
    impact: 3,
    complexity: 3,
    priority: 'P2',
    type: 'structural',
  },
  {
    id: 4,
    objective: 'Close Efficiency',
    action: 'Automate top 5 manual journal entry categories',
    impact: 3,
    complexity: 2,
    priority: 'P2',
    type: 'quick_win',
  },
  {
    id: 5,
    objective: 'Value Architecture',
    action: 'Define and track 10 leading KPIs by business unit',
    impact: 4,
    complexity: 3,
    priority: 'P1',
    type: 'structural',
  },
];

export const DEMO_MATURITY_JOURNEY = {
  today: 58,
  month6: 65,
  month12: 72,
  month24: 82,
  targetLevel: 3,
  targetLevelName: 'Managed',
};

export const DEMO_CRITICAL_GAPS = [
  {
    id: 1,
    name: 'No scenario modeling capability',
    level: 'L2',
    impact: 'Cannot stress-test plans or respond to volatility',
    recommendation: 'Build basic what-if model for top 3 revenue drivers',
  },
  {
    id: 2,
    name: 'Manual variance analysis',
    level: 'L1',
    impact: 'Analysis delivered too late for decision-making',
    recommendation: 'Automate top variance categories with exception alerts',
  },
];
