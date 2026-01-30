// Reusable test fixtures for scoring/maturity/risk/action tests

export const VALID_MATURITY = {
  achieved_level: 2,
  achieved_label: 'Defined',
  blocking_level: 3,
  blocking_evidence_ids: ['fpa_driver_based', 'fpa_scenario_modeling'],
  gates: [
    { level: 0, label: 'Ad-hoc', required_evidence_ids: [] },
    { level: 1, label: 'Emerging', required_evidence_ids: ['fpa_annual_budget'] },
    { level: 2, label: 'Defined', required_evidence_ids: ['fpa_variance_analysis'] },
    { level: 3, label: 'Managed', required_evidence_ids: ['fpa_driver_based'] },
    { level: 4, label: 'Optimized', required_evidence_ids: ['fpa_predictive'] },
  ],
};

export const STANDARD_GATES = [
  { level: 0, label: 'Ad-hoc', required_evidence_ids: [] as string[] },
  { level: 1, label: 'Emerging', required_evidence_ids: ['e1'] },
  { level: 2, label: 'Defined', required_evidence_ids: ['e2', 'e3'] },
  { level: 3, label: 'Managed', required_evidence_ids: ['e4'] },
  { level: 4, label: 'Optimized', required_evidence_ids: ['e5', 'e6'] },
];

export const TEST_PILLARS = [
  { id: 'fpa', name: 'Financial Planning & Analysis', weight: 1 },
  { id: 'controls', name: 'Internal Controls', weight: 1 },
];

export const TEST_QUESTIONS_RISK = [
  {
    id: 'q_critical_1',
    pillar: 'fpa',
    weight: 2,
    text: 'Do you have an annual budget?',
    is_critical: true,
    level: 1,
  },
  {
    id: 'q_critical_2',
    pillar: 'controls',
    weight: 2,
    text: 'Do you perform bank reconciliations?',
    is_critical: true,
    level: 1,
  },
  {
    id: 'q_non_critical_1',
    pillar: 'fpa',
    weight: 1,
    text: 'Do you have variance analysis?',
    is_critical: false,
    level: 2,
  },
  {
    id: 'q_non_critical_2',
    pillar: 'controls',
    weight: 1,
    text: 'Do you have audit trails?',
    level: 2,
  },
];
