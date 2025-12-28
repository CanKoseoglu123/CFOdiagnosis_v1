/**
 * VS-32: FP&A Pillar Terminology
 *
 * Finance-specific language and preferred phrases.
 */

import { PillarTerminology } from '../types';

export const FPA_TERMINOLOGY: PillarTerminology = {
  pillar_name: 'FP&A',
  assessment_name: 'FP&A Maturity Assessment',

  terms: {
    // Generic → FP&A specific
    'planning': 'financial planning',
    'analysis': 'financial analysis',
    'reporting': 'management reporting',
    'forecast': 'financial forecast',
    'budget': 'annual budget',
    'variance': 'budget variance',
    'kpi': 'financial KPI',
    'metric': 'performance metric',
    'dashboard': 'finance dashboard',
    'automation': 'process automation',
    'integration': 'data integration',
    'collaboration': 'business partnership',
    'strategy': 'financial strategy',
    'optimization': 'process optimization',
    'transformation': 'finance transformation',
    'capability': 'FP&A capability',
    'maturity': 'maturity level',
    'team': 'FP&A team',
    'function': 'finance function',
    'process': 'finance process',
    'model': 'financial model',
    'driver': 'business driver',
    'scenario': 'scenario analysis',
    'sensitivity': 'sensitivity analysis',
    'rolling': 'rolling forecast',
    'close': 'financial close',
    'consolidation': 'data consolidation',
    'variance analysis': 'variance analysis',
    'forecasting': 'forecasting',
    'budgeting': 'budgeting',
  },

  preferred_phrases: [
    // Value-oriented language
    'business partnership',
    'decision support',
    'actionable insights',
    'forward-looking analysis',
    'driver-based planning',
    'continuous improvement',
    'data-driven decisions',
    'strategic alignment',
    'operational efficiency',
    'value creation',

    // Process-oriented language
    'standardized processes',
    'documented procedures',
    'repeatable workflows',
    'automated reporting',
    'integrated systems',

    // Outcome-oriented language
    'forecast accuracy',
    'cycle time reduction',
    'variance explanation',
    'performance visibility',
    'strategic contribution',
  ],

  forbidden_phrases: [
    // Generic corporate speak
    'synergy',
    'paradigm shift',
    'move the needle',
    'boil the ocean',
    'low-hanging fruit',
    'best in class',
    'world-class',
    'cutting-edge',
    'game-changing',
    'disruptive',

    // Vague language
    'various',
    'numerous',
    'several',
    'many',
    'some',
    'few',
    'multiple',

    // Unsupported claims
    'industry standard',
    'market average',
    'typically',
    'usually',
    'generally',

    // Consultant buzzwords
    'holistic',
    'ecosystem',
    'leverage',
    'unlock value',
    'drive transformation',
  ],

  industry_overrides: {
    // Technology/SaaS companies
    'technology': {
      'budget': 'operating plan',
      'forecast': 'guidance',
      'variance': 'plan variance',
      'metric': 'SaaS metric',
    },
    'saas': {
      'budget': 'operating plan',
      'forecast': 'guidance',
      'variance': 'plan variance',
      'metric': 'SaaS metric',
    },

    // Manufacturing companies
    'manufacturing': {
      'budget': 'production budget',
      'forecast': 'demand forecast',
      'variance': 'cost variance',
      'metric': 'operational KPI',
    },

    // Financial services
    'financial_services': {
      'budget': 'financial plan',
      'forecast': 'financial projection',
      'variance': 'P&L variance',
      'metric': 'financial metric',
    },

    // Healthcare
    'healthcare': {
      'budget': 'operating budget',
      'forecast': 'volume forecast',
      'variance': 'budget variance',
      'metric': 'quality metric',
    },

    // Retail
    'retail': {
      'budget': 'merchandise budget',
      'forecast': 'sales forecast',
      'variance': 'sales variance',
      'metric': 'retail KPI',
    },
  },
};

/**
 * Get industry-specific term.
 */
export function getIndustryTerm(
  genericTerm: string,
  industry?: string
): string {
  const term = genericTerm.toLowerCase();

  // Check for industry override
  if (industry) {
    const industryKey = industry.toLowerCase().replace(/\s+/g, '_');
    const overrides = FPA_TERMINOLOGY.industry_overrides?.[industryKey];
    if (overrides && overrides[term]) {
      return overrides[term];
    }
  }

  // Fall back to general FP&A term
  return FPA_TERMINOLOGY.terms[term] || genericTerm;
}

/**
 * Check if a phrase is forbidden.
 */
export function isForbiddenPhrase(phrase: string): boolean {
  const lower = phrase.toLowerCase();
  return FPA_TERMINOLOGY.forbidden_phrases.some(
    (forbidden) => lower.includes(forbidden.toLowerCase())
  );
}

/**
 * Count preferred phrases in text.
 */
export function countPreferredPhrases(text: string): number {
  const lower = text.toLowerCase();
  return FPA_TERMINOLOGY.preferred_phrases.filter(
    (phrase) => lower.includes(phrase.toLowerCase())
  ).length;
}
