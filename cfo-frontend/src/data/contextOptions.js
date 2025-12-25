// src/data/contextOptions.js
// VS25: Context Intake Options - Rich Content Version
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

// EUR-based revenue ranges
export const REVENUE_RANGES = [
  { value: '0_50m', label: '0 - 50m€' },
  { value: '50m_100m', label: '50 - 100m€' },
  { value: '100m_250m', label: '100 - 250m€' },
  { value: '250m_500m', label: '250 - 500m€' },
  { value: 'over_500m', label: '500m€+' }
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

// Expanded tools list
export const PLANNING_TOOLS = [
  { value: 'excel', label: 'Excel (primary)', category: 'Spreadsheet' },
  { value: 'adaptive_insights', label: 'Adaptive Insights', category: 'Modern CPM' },
  { value: 'anaplan', label: 'Anaplan', category: 'Modern CPM' },
  { value: 'planful', label: 'Planful', category: 'Modern CPM' },
  { value: 'oracle_pbcs', label: 'Oracle PBCS/EPBCS', category: 'Enterprise' },
  { value: 'sap_analytics', label: 'SAP Analytics Cloud', category: 'Enterprise' },
  { value: 'board', label: 'Board', category: 'Modern CPM' },
  { value: 'prophix', label: 'Prophix', category: 'Mid-Market' },
  { value: 'workday_adaptive', label: 'Workday Adaptive Planning', category: 'Modern CPM' },
  { value: 'power_bi', label: 'Power BI', category: 'BI Tools' },
  { value: 'tableau', label: 'Tableau', category: 'BI Tools' },
  { value: 'hyperion', label: 'Hyperion', category: 'Legacy' },
  { value: 'tm1_cognos', label: 'TM1/Cognos', category: 'Legacy' }
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

// Expanded pain points
export const PAIN_POINTS = [
  { value: 'forecast_accuracy', label: 'Forecast accuracy issues' },
  { value: 'slow_budget_cycles', label: 'Slow budget cycles' },
  { value: 'limited_business_buyin', label: 'Limited business buy-in' },
  { value: 'manual_consolidation', label: 'Manual consolidation' },
  { value: 'disconnected_tools', label: 'Disconnected planning tools' },
  { value: 'lack_driver_models', label: 'Lack of driver-based models' },
  { value: 'poor_scenario_planning', label: 'Poor scenario planning' },
  { value: 'weak_business_partnering', label: 'Weak business partnering' }
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
