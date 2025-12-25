// src/data/contextOptions.js
// VS25: Context Intake Options
// Synced with backend src/specs/schemas.ts

export const INDUSTRIES = [
  { value: 'saas', label: 'SaaS' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail_ecom', label: 'Retail / E-commerce' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'fintech', label: 'Fintech' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'other', label: 'Other' }
];

export const REVENUE_RANGES = [
  { value: 'under_10m', label: '< $10M' },
  { value: '10m_50m', label: '$10M - $50M' },
  { value: '50m_250m', label: '$50M - $250M' },
  { value: 'over_250m', label: '$250M+' }
];

export const EMPLOYEE_COUNTS = [
  { value: '1_50', label: '1 - 50' },
  { value: '51_200', label: '51 - 200' },
  { value: '201_1000', label: '201 - 1,000' },
  { value: 'over_1000', label: '1,000+' }
];

export const FINANCE_STRUCTURES = [
  { value: 'centralized', label: 'Centralized', description: 'Single finance team serves all business units' },
  { value: 'decentralized', label: 'Decentralized', description: 'Each business unit has its own finance team' },
  { value: 'hybrid', label: 'Hybrid', description: 'Mix of central COE and embedded finance partners' }
];

export const CHANGE_APPETITES = [
  {
    value: 'optimize',
    label: 'Optimize',
    description: 'Fix basics, low disruption',
    color: '#22C55E' // green
  },
  {
    value: 'standardize',
    label: 'Standardize',
    description: 'Scale processes, medium disruption',
    color: '#F59E0B' // amber
  },
  {
    value: 'transform',
    label: 'Transform',
    description: 'Reinvent the function, high disruption',
    color: '#EF4444' // red
  }
];

export const SYSTEMS = [
  { value: 'excel_sheets', label: 'Excel / Google Sheets', category: 'Manual' },
  { value: 'anaplan_adaptive', label: 'Anaplan / Adaptive Insights', category: 'Modern CPM' },
  { value: 'sap_oracle', label: 'SAP / Oracle EPM', category: 'Legacy ERP' },
  { value: 'bi_tools', label: 'BI Tools (Tableau, PowerBI)', category: 'Analytics' },
  { value: 'other', label: 'Other', category: 'Other' }
];

export const PAIN_POINTS = [
  { value: 'long_budget_cycles', label: 'Long Budget Cycles' },
  { value: 'data_accuracy', label: 'Data Accuracy / Trust Issues' },
  { value: 'manual_consolidation', label: 'Manual Consolidation' },
  { value: 'lack_of_insights', label: 'Lack of Actionable Insights' },
  { value: 'business_partnership', label: 'Weak Business Partnership' }
];
