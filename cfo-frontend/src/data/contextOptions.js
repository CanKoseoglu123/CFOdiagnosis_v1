// src/data/contextOptions.js
// VS26: Context Intake Options - Enhanced with Practice Mappings
// Pain points now map to practices for recommendation boosting
// Tools now have categories and effectiveness ratings

export const INDUSTRIES = [
  { value: 'automotive', label: 'Automotive' },
  { value: 'consumer_goods', label: 'Consumer Goods' },
  { value: 'fintech', label: 'Fintech' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'media', label: 'Media' },
  { value: 'services', label: 'Professional Services' },
  { value: 'retail', label: 'Retail' },
  { value: 'saas', label: 'SaaS' },
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

// Tool Categories
export const TOOL_CATEGORIES = {
  spreadsheet: {
    label: 'Spreadsheet',
    description: 'File-based, manual version control'
  },
  excel_connected: {
    label: 'Excel-Connected',
    description: 'Excel interface with cloud backend'
  },
  planning_platform: {
    label: 'Planning Platform',
    description: 'Dedicated planning and forecasting tools'
  },
  bi_tool: {
    label: 'BI / Reporting',
    description: 'Visualization and dashboards'
  },
  other: {
    label: 'Other',
    description: 'User-specified tool'
  }
};

// Systems/Tools with categories
export const PLANNING_TOOLS = [
  // Spreadsheet
  { value: 'excel', label: 'Excel / Google Sheets', category: 'spreadsheet' },

  // Excel-connected
  { value: 'datarails', label: 'Datarails', category: 'excel_connected' },
  { value: 'vena', label: 'Vena', category: 'excel_connected' },
  { value: 'jirav', label: 'Jirav', category: 'excel_connected' },
  { value: 'aleph', label: 'Aleph', category: 'excel_connected' },

  // Planning platforms
  { value: 'anaplan', label: 'Anaplan', category: 'planning_platform' },
  { value: 'adaptive', label: 'Workday Adaptive', category: 'planning_platform' },
  { value: 'planful', label: 'Planful', category: 'planning_platform' },
  { value: 'pigment', label: 'Pigment', category: 'planning_platform' },
  { value: 'cube', label: 'Cube', category: 'planning_platform' },
  { value: 'onestream', label: 'OneStream', category: 'planning_platform' },
  { value: 'oracle_epm', label: 'Oracle EPM Cloud', category: 'planning_platform' },
  { value: 'sap_sac', label: 'SAP BPC / SAC', category: 'planning_platform' },

  // BI tools
  { value: 'powerbi', label: 'Power BI', category: 'bi_tool' },
  { value: 'tableau', label: 'Tableau', category: 'bi_tool' },
  { value: 'looker', label: 'Looker', category: 'bi_tool' },

  // Other
  { value: 'other', label: 'Other', category: 'other' }
];

// Tool effectiveness ratings
export const TOOL_EFFECTIVENESS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

export const TOOL_EFFECTIVENESS_LEGEND = {
  low: 'Basic usage, significant gaps',
  medium: 'Regular usage, not full potential',
  high: 'Fully adopted, getting real value'
};

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

// Pain points with practice mappings for recommendation boosting
export const PAIN_POINTS = [
  {
    value: 'data_wrangling',
    label: 'Endless manual data gathering',
    related_practices: [
      'prac_collaborative_systems',
      'prac_process_automation',
      'prac_chart_of_accounts'
    ]
  },
  {
    value: 'forecast_accuracy',
    label: 'Forecasting accuracy & credibility',
    related_practices: [
      'prac_rolling_forecast_cadence',
      'prac_operational_drivers',
      'prac_dynamic_targets',
      'prac_predictive_analytics'
    ]
  },
  {
    value: 'partner_engagement',
    label: 'Business partners don\'t engage',
    related_practices: [
      'prac_commercial_partnership',
      'prac_strategic_alignment',
      'prac_variance_investigation',
      'prac_data_visualization'
    ]
  },
  {
    value: 'budget_cycle',
    label: 'Endless budget process',
    related_practices: [
      'prac_annual_budget_cycle',
      'prac_continuous_planning',
      'prac_rolling_forecast_cadence',
      'prac_process_automation'
    ]
  },
  {
    value: 'bandwidth',
    label: 'Talent & bandwidth constraints',
    related_practices: [
      'prac_process_automation',
      'prac_shared_services_model',
      'prac_service_level_agreements'
    ]
  },
  {
    value: 'tech_fragmentation',
    label: 'Technology stack fragmentation',
    related_practices: [
      'prac_collaborative_systems',
      'prac_chart_of_accounts',
      'prac_process_automation'
    ]
  },
  {
    value: 'scenario_planning',
    label: 'Scenario planning gaps',
    related_practices: [
      'prac_rapid_what_if_capability',
      'prac_multi_scenario_management',
      'prac_stress_testing'
    ]
  },
  {
    value: 'communication',
    label: 'Communicating to non-finance execs',
    related_practices: [
      'prac_data_visualization',
      'prac_board_level_impact',
      'prac_operational_drivers'
    ]
  },
  {
    value: 'realtime_visibility',
    label: 'Real-time visibility gaps',
    related_practices: [
      'prac_month_end_rigor',
      'prac_self_service_access',
      'prac_management_reporting'
    ]
  }
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
