/**
 * VS-32: FP&A Golden Output Patterns
 *
 * Quality exemplars and structural requirements for each section.
 */

import { GoldenOutputPattern, EvidenceNamespace } from '../types';

// ============================================================
// EXECUTIVE SUMMARY
// ============================================================

export const EXECUTIVE_SUMMARY_PATTERN: GoldenOutputPattern = {
  section_id: 'executive_summary',

  required_references: [
    'score_overall',
    'gate_l{level}_passed',  // {level} replaced at runtime
  ],

  required_evidence_types: ['score_', 'gate_', 'ctx_'] as EvidenceNamespace[],

  min_evidence_count: 3,

  forbidden_patterns: [
    'according to (?:recent )?(?:studies|research)',
    'industry (benchmarks?|standards?) (?:show|indicate)',
    '\\d+% of (companies|organizations)',
    'best-in-class',
    'world-class',
  ],

  exemplar_insights: [
    // Level 1 example
    '{company_name} has achieved Level 1 (Emerging) maturity with an overall score of {score}%. ' +
    'While foundational budgeting and basic controls are in place, the assessment identified gaps in ' +
    '{gap_area} that present opportunities for meaningful improvement.',

    // Level 2 example
    'At Level 2 (Defined) maturity, {company_name}\'s FP&A function demonstrates established ' +
    'variance analysis capabilities and structured forecasting processes. The {score}% overall score ' +
    'reflects strengths in {strength_area} while highlighting room for growth in {gap_area}.',

    // Level 3 example
    '{company_name} operates at Level 3 (Managed) maturity, evidenced by driver-based planning ' +
    'practices and scenario modeling capabilities. The {score}% score positions the organization ' +
    'well for advancing toward predictive analytics and integrated planning.',

    // Level 4 example
    'With Level 4 (Optimized) maturity, {company_name}\'s FP&A function operates as a true ' +
    'strategic partner, delivering predictive insights and integrated business planning. ' +
    'The {score}% overall score reflects mature capabilities across all assessed dimensions.',
  ],

  anti_patterns: [
    'Your organization has performed well',
    'There is significant room for improvement',
    'The results show mixed performance',
    'Overall, the assessment reveals',
  ],

  context_weaving: {
    must_use: ['ctx_company_name', 'ctx_industry'],
    should_connect: [
      ['score_overall', 'gate_'],
      ['ctx_industry', 'obj_'],
    ],
  },

  fallback_if_missing: [
    {
      context_field: 'ctx_company_name',
      fallback_text: 'Your organization',
    },
    {
      context_field: 'ctx_industry',
      fallback_text: 'your industry context',
    },
  ],
};

// ============================================================
// CURRENT STATE
// ============================================================

export const CURRENT_STATE_PATTERN: GoldenOutputPattern = {
  section_id: 'current_state',

  required_references: [
    'obj_',  // At least one objective
    'prac_', // At least one practice
  ],

  required_evidence_types: ['obj_', 'prac_', 'score_'] as EvidenceNamespace[],

  min_evidence_count: 4,

  forbidden_patterns: [
    'various areas',
    'multiple dimensions',
    'several aspects',
    'different capabilities',
  ],

  exemplar_insights: [
    // Strength example
    '{company_name}\'s forecasting capabilities [obj_forecasting] demonstrate maturity, ' +
    'with documented processes for rolling forecasts and variance analysis. The {score}% score ' +
    'in this area reflects consistent forecast accuracy and timely updates.',

    // Opportunity example
    'The assessment identified driver-based planning [prac_driver_based] as an opportunity area. ' +
    'Currently at {score}%, {company_name} could benefit from connecting financial plans to ' +
    'operational drivers specific to the {industry} sector.',

    // Balanced view
    'While {company_name} shows strength in financial controls [obj_controls] at {score}%, ' +
    'the scenario modeling practice [prac_scenario] presents an opportunity to enhance ' +
    'decision support capabilities.',
  ],

  anti_patterns: [
    'Some areas are strong while others need work',
    'There is a mix of mature and developing capabilities',
    'Performance varies across different dimensions',
  ],

  context_weaving: {
    must_use: ['ctx_company_name'],
    should_connect: [
      ['obj_', 'prac_'],
      ['prac_', 'score_'],
    ],
  },

  fallback_if_missing: [
    {
      context_field: 'ctx_team_size',
      fallback_text: 'your FP&A team',
    },
  ],
};

// ============================================================
// CRITICAL RISKS
// ============================================================

export const CRITICAL_RISKS_PATTERN: GoldenOutputPattern = {
  section_id: 'critical_risks',

  required_references: [
    'critical_',  // Any critical failures
    'q_',         // Related questions
  ],

  required_evidence_types: ['critical_', 'q_', 'gate_'] as EvidenceNamespace[],

  min_evidence_count: 2,

  forbidden_patterns: [
    'potential issues',
    'possible concerns',
    'may be at risk',
    'could pose challenges',
  ],

  exemplar_insights: [
    // Critical failure with specific impact
    'The assessment identified a critical gap in budget documentation [critical_fpa_l1_q01]. ' +
    'Without formalized budget processes, {company_name} faces accuracy risks in financial ' +
    'planning and may struggle to meet audit requirements.',

    // Critical failure with remediation path
    '{company_name}\'s variance analysis process shows a critical gap [critical_fpa_l1_q03]. ' +
    'This limits visibility into budget performance and delays corrective action. ' +
    'Implementing monthly variance reviews with documented thresholds is a priority.',

    // No critical failures
    '{company_name} has addressed all foundational requirements, with no critical gaps ' +
    'identified in the Level 1 and Level 2 assessment areas. This positions the ' +
    'organization well to pursue advanced capabilities.',
  ],

  anti_patterns: [
    'There are some risks to be aware of',
    'Certain areas require attention',
    'Some gaps were identified',
  ],

  context_weaving: {
    must_use: ['ctx_company_name'],
    should_connect: [
      ['critical_', 'q_'],
      ['critical_', 'gate_'],
    ],
  },

  fallback_if_missing: [
    {
      context_field: 'critical_',
      fallback_text: 'No critical gaps were identified in the assessment.',
    },
  ],
};

// ============================================================
// OPPORTUNITIES
// ============================================================

export const OPPORTUNITIES_PATTERN: GoldenOutputPattern = {
  section_id: 'opportunities',

  required_references: [
    'obj_',  // Objectives with improvement potential
    'imp_',  // Importance calibration
  ],

  required_evidence_types: ['obj_', 'imp_', 'prac_'] as EvidenceNamespace[],

  min_evidence_count: 3,

  forbidden_patterns: [
    'could potentially',
    'might consider',
    'may want to',
    'there are opportunities',
  ],

  exemplar_insights: [
    // High-importance opportunity
    'Given the high importance assigned to forecasting [imp_forecasting=5], improving rolling ' +
    'forecast practices represents the highest-value opportunity for {company_name}. ' +
    'Current score of {score}% indicates meaningful headroom for improvement.',

    // Quick win opportunity
    '{company_name} can achieve a quick win by standardizing variance analysis templates ' +
    '[prac_variance_templates]. This practice scored {score}% and supports the organization\'s ' +
    'goal of improved financial visibility.',

    // Strategic opportunity
    'Advancing to driver-based planning [obj_driver_based] aligns with {company_name}\'s ' +
    'transformation goals. While current capabilities are at Level 2, the {industry} sector ' +
    'context suggests high value from connecting financial plans to operational metrics.',
  ],

  anti_patterns: [
    'There are many opportunities available',
    'Several areas present possibilities',
    'Various improvements could be made',
  ],

  context_weaving: {
    must_use: ['ctx_company_name', 'imp_'],
    should_connect: [
      ['obj_', 'imp_'],
      ['prac_', 'ctx_industry'],
    ],
  },

  fallback_if_missing: [
    {
      context_field: 'imp_',
      fallback_text: 'based on assessment priorities',
    },
  ],
};

// ============================================================
// PRIORITY RATIONALE
// ============================================================

export const PRIORITY_RATIONALE_PATTERN: GoldenOutputPattern = {
  section_id: 'priority_rationale',

  required_references: [
    'obj_',
    'imp_',
    'score_',
  ],

  required_evidence_types: ['obj_', 'imp_', 'score_', 'ctx_'] as EvidenceNamespace[],

  min_evidence_count: 5,

  forbidden_patterns: [
    'it is recommended',
    'the organization should',
    'consideration should be given',
    'it would be advisable',
  ],

  exemplar_insights: [
    // Synthesized recommendation
    'For {company_name}, the path from Level {current_level} to Level {target_level} centers on ' +
    'three priorities: (1) addressing the critical gap in {gap_1}, (2) building on the ' +
    'strength in {strength_1} to accelerate {related_capability}, and (3) implementing ' +
    '{quick_win} as a foundation for {strategic_goal}.',

    // Capacity-aware recommendation
    'Given {company_name}\'s {capacity_band} capacity, the recommended focus is on ' +
    '{priority_objective} [imp_{objective}={importance}]. This aligns with the organization\'s ' +
    'declared priorities while respecting resource constraints.',

    // Evidence-based synthesis
    'The assessment data points to {primary_recommendation} as the highest-impact opportunity. ' +
    'With an overall score of {score}% and {critical_count} critical gaps addressed, ' +
    '{company_name} is positioned to advance {target_capability} within the {time_horizon} horizon.',
  ],

  anti_patterns: [
    'Based on the above, the following actions are recommended',
    'In conclusion, the organization should focus on',
    'The next steps involve',
  ],

  context_weaving: {
    must_use: ['ctx_company_name', 'imp_', 'score_overall'],
    should_connect: [
      ['obj_', 'imp_'],
      ['score_', 'gate_'],
      ['ctx_industry', 'obj_'],
    ],
  },

  fallback_if_missing: [
    {
      context_field: 'imp_',
      fallback_text: 'based on standard prioritization criteria',
    },
    {
      context_field: 'ctx_industry',
      fallback_text: 'industry-relevant',
    },
  ],
};

// ============================================================
// EXPORTS
// ============================================================

/**
 * All golden output patterns for FP&A.
 */
export const FPA_GOLDEN_OUTPUTS: Record<string, GoldenOutputPattern> = {
  executive_summary: EXECUTIVE_SUMMARY_PATTERN,
  current_state: CURRENT_STATE_PATTERN,
  critical_risks: CRITICAL_RISKS_PATTERN,
  opportunities: OPPORTUNITIES_PATTERN,
  priority_rationale: PRIORITY_RATIONALE_PATTERN,
};

/**
 * Get pattern by section ID.
 */
export function getGoldenPattern(sectionId: string): GoldenOutputPattern | null {
  return FPA_GOLDEN_OUTPUTS[sectionId] || null;
}
