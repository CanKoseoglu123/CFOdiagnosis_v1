/**
 * VS-32: FP&A Pillar Configuration
 *
 * Complete configuration pack for FP&A interpretation.
 */

import { PillarInterpretationConfig, NarrativeTemplates } from '../types';
import { FPA_TERMINOLOGY } from './terminology';
import { FPA_GOLDEN_OUTPUTS } from './golden-outputs';
import { FPA_QUESTION_EXEMPLARS } from './question-exemplars';

// ============================================================
// NARRATIVE TEMPLATES
// ============================================================

const FPA_NARRATIVE_TEMPLATES: NarrativeTemplates = {
  situation: [
    '{company_name} operates in the {industry} sector with an FP&A team of {team_size} ' +
    'professionals. The organization has achieved Level {current_level} ({current_level_name}) ' +
    'maturity with an overall score of {overall_score}%.',

    'As a {industry} organization, {company_name} has built foundational FP&A capabilities, ' +
    'evidenced by the {overall_score}% assessment score and Level {current_level} maturity rating.',

    'The assessment reveals {company_name}\'s FP&A function at Level {current_level}, with ' +
    'particular strength in {top_strength} ({strength_score}%) and opportunity in ' +
    '{top_gap} ({gap_score}%).',
  ],

  challenge: [
    'The primary challenge is advancing from Level {current_level} to Level {target_level}, ' +
    'which requires addressing the gap in {primary_gap} while building on existing strengths.',

    'Moving to Level {target_level} ({target_level_name}) requires {company_name} to close ' +
    'critical gaps in {critical_gap_list} while maintaining momentum in established practices.',

    'The path forward involves balancing immediate priorities—addressing {critical_count} ' +
    'critical gaps—with strategic investments in {strategic_capability}.',
  ],

  approach: [
    'The recommended approach prioritizes {priority_1} as the foundation, followed by ' +
    '{priority_2} to build sustainable capability, and {priority_3} to achieve transformation goals.',

    'Given {capacity_band} capacity, the plan focuses on {focus_count} initiatives: ' +
    '{quick_win_count} quick wins in the first 6 months and {strategic_count} strategic ' +
    'initiatives over {time_horizon}.',

    'Success requires a sequenced approach: (1) stabilize {foundation_area}, (2) optimize ' +
    '{optimization_area}, and (3) transform {transformation_area}.',
  ],

  expected_outcome: [
    'Successful execution will advance {company_name} to Level {target_level} maturity, with ' +
    'expected improvement in {primary_metric} and enhanced {capability_area} capability.',

    'By the {time_horizon} milestone, {company_name} should achieve {target_score}% overall ' +
    'maturity, with measurable improvements in forecast accuracy and decision support value.',

    'The transformation will position {company_name}\'s FP&A function as a strategic partner, ' +
    'delivering {expected_value_1} and {expected_value_2}.',
  ],

  quick_win: [
    'Standardize {practice} templates within {timeline} to establish consistent processes.',
    'Implement automated {process} reporting to reduce cycle time by {reduction}%.',
    'Document and formalize {area} procedures to address the identified critical gap.',
    'Deploy {tool} for {use_case} to improve visibility and efficiency.',
  ],

  strategic_initiative: [
    'Build {capability} capability through phased implementation of {methodology}.',
    'Transform {area} by integrating {system_1} with {system_2} for unified insights.',
    'Develop {team_capability} through structured training and process redesign.',
    'Implement {advanced_practice} to achieve Level {target_level} requirements.',
  ],
};

// ============================================================
// FP&A PILLAR CONFIGURATION
// ============================================================

export const FPA_PILLAR_CONFIG: PillarInterpretationConfig = {
  pillar_id: 'fpa',
  pillar_name: 'FP&A',

  terminology: FPA_TERMINOLOGY,
  golden_outputs: FPA_GOLDEN_OUTPUTS,
  question_exemplars: FPA_QUESTION_EXEMPLARS,
  narrative_templates: FPA_NARRATIVE_TEMPLATES,

  default_capacity_caps: {
    '6m': 3,
    '12m': 5,
    '24m': 8,
  },

  pillar_forbidden_patterns: [
    // FP&A-specific hallucination patterns
    'typical finance teams',
    'most CFOs',
    'finance best practices indicate',
    'according to finance benchmarks',
    'standard FP&A metrics',
    'average forecast accuracy',
    'typical budget cycle',
    'industry-standard close process',
  ],

  pillar_anti_patterns: [
    // FP&A-specific weak language
    'consider implementing a budget',
    'may want to track variances',
    'could potentially forecast',
    'think about planning',
    'review your processes',
    'look into automation',
  ],
};

// ============================================================
// CONFIG ACCESSOR FUNCTIONS
// ============================================================

/**
 * Get the full FP&A pillar configuration.
 */
export function getFPAConfig(): PillarInterpretationConfig {
  return FPA_PILLAR_CONFIG;
}

/**
 * Get a specific golden output pattern.
 */
export function getGoldenOutput(sectionId: string) {
  return FPA_GOLDEN_OUTPUTS[sectionId];
}

/**
 * Get terminology with optional industry override.
 */
export function getTerminology(industry?: string) {
  return {
    ...FPA_TERMINOLOGY,
    activeOverrides: industry
      ? FPA_TERMINOLOGY.industry_overrides?.[industry.toLowerCase().replace(/\s+/g, '_')]
      : undefined,
  };
}

/**
 * Get narrative template by type.
 */
export function getNarrativeTemplate(
  type: keyof NarrativeTemplates,
  index?: number
): string {
  const templates = FPA_NARRATIVE_TEMPLATES[type];
  if (!templates || templates.length === 0) {
    return '';
  }

  if (index !== undefined && index >= 0 && index < templates.length) {
    return templates[index];
  }

  // Return random template
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Fill template placeholders with actual values.
 */
export function fillTemplate(
  template: string,
  values: Record<string, string | number>
): string {
  let result = template;

  for (const [key, value] of Object.entries(values)) {
    const pattern = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(pattern, String(value));
  }

  return result;
}

/**
 * Generate a filled narrative section.
 */
export function generateNarrative(
  type: keyof NarrativeTemplates,
  values: Record<string, string | number>
): string {
  const template = getNarrativeTemplate(type);
  return fillTemplate(template, values);
}
