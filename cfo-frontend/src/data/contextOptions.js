// src/data/contextOptions.js
// VS25: Context Intake Options - Rich Content Version
// Synced with backend src/specs/schemas.ts

export const INDUSTRIES = [
  { value: 'saas', label: 'SaaS' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail' },
  { value: 'services', label: 'Professional Services' },
  { value: 'fintech', label: 'Fintech' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'media', label: 'Media' },
  { value: 'other', label: 'Other' }
];

export const REVENUE_RANGES = [
  { value: 'under_10m', label: 'Under $10M' },
  { value: '10m_50m', label: '$10M - $50M' },
  { value: '50m_250m', label: '$50M - $250M' },
  { value: 'over_250m', label: 'Over $250M' }
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

export const OWNERSHIP_STRUCTURES = [
  { value: 'pe_backed', label: 'PE Backed' },
  { value: 'listed', label: 'Listed' },
  { value: 'family_owned', label: 'Family Owned' },
  { value: 'corporate_subsidiary', label: 'Corporate Subsidiary' }
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

// === FP&A PILLAR OPTIONS ===

// Systems/Tools
export const PLANNING_TOOLS = [
  { value: 'excel', label: 'Excel' },
  { value: 'anaplan', label: 'Anaplan' },
  { value: 'adaptive', label: 'Adaptive Insights' },
  { value: 'pigment', label: 'Pigment' },
  { value: 'sap', label: 'SAP' },
  { value: 'oracle', label: 'Oracle' },
  { value: 'powerbi', label: 'Power BI' },
  { value: 'tableau', label: 'Tableau' },
  { value: 'other', label: 'Other' }
];

// Team size ranges (chips)
export const TEAM_SIZES = [
  { value: '1_3', label: '1-3' },
  { value: '4_10', label: '4-10' },
  { value: '11_25', label: '11-25' },
  { value: '26_50', label: '26-50' },
  { value: 'over_50', label: '50+' }
];

// Forecast frequency
export const FORECAST_FREQUENCIES = [
  { value: 'annual', label: 'Annual only' },
  { value: 'semi_annual', label: 'Semi-annual' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'rolling', label: 'Rolling' }
];

// Budget process types - base (mutually exclusive)
export const BUDGET_PROCESS_BASE = [
  { value: 'top_down', label: 'Top-down' },
  { value: 'bottom_up', label: 'Bottom-up' },
  { value: 'hybrid', label: 'Hybrid' }
];

// Budget process modifiers (can be added to base)
export const BUDGET_PROCESS_MODIFIERS = [
  { value: 'driver_based', label: 'Driver-based' },
  { value: 'zero_based', label: 'Zero-based' }
];

// Legacy: Combined for backward compatibility
export const BUDGET_PROCESSES = [
  { value: 'top_down', label: 'Top-down only' },
  { value: 'bottom_up', label: 'Bottom-up only' },
  { value: 'hybrid', label: 'Hybrid (top-down + bottom-up)' },
  { value: 'driver_based', label: 'Driver-based' },
  { value: 'zero_based', label: 'Zero-based budgeting' }
];

// Pain points
export const PAIN_POINTS = [
  { value: 'long_cycles', label: 'Long budget/forecast cycles' },
  { value: 'data_accuracy', label: 'Data accuracy issues' },
  { value: 'manual_consolidation', label: 'Manual consolidation' },
  { value: 'lack_insights', label: 'Lack of actionable insights' },
  { value: 'business_partnership', label: 'Weak business partnership' },
  { value: 'tool_limitations', label: 'Tool limitations' },
  { value: 'headcount', label: 'Headcount constraints' }
];

// User roles
export const USER_ROLES = [
  { value: 'cfo', label: 'CFO' },
  { value: 'finance_director', label: 'Finance Director' },
  { value: 'fpa_manager', label: 'FP&A Manager' },
  { value: 'fpa_analyst', label: 'FP&A Analyst' },
  { value: 'controller', label: 'Controller' },
  { value: 'business_partner', label: 'Business Partner' }
];

// Legal entities ranges (chips)
export const LEGAL_ENTITY_RANGES = [
  { value: '1_3', label: '1-3' },
  { value: '4_10', label: '4-10' },
  { value: '11_25', label: '11-25' },
  { value: 'over_25', label: '25+' }
];

// Finance FTE ranges (for company page)
export const FINANCE_FTE_RANGES = [
  { value: '1_10', label: '1-10' },
  { value: '10_20', label: '10-20' },
  { value: '21_35', label: '21-35' },
  { value: '36_50', label: '36-50' },
  { value: 'over_50', label: '50+' }
];

// Legacy exports for backward compatibility
export const SYSTEMS = PLANNING_TOOLS;
