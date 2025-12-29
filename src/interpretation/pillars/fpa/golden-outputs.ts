/**
 * VS-32c: FP&A Golden Output Patterns
 *
 * These patterns define what good interpretation looks like for each section.
 * The Critic uses these to assess quality and identify gaps.
 */

import { GoldenOutputPattern } from '../../types';

export const FPA_GOLDEN_OUTPUTS: Record<string, GoldenOutputPattern> = {
  execution_snapshot: {
    section_id: 'execution_snapshot',
    required_evidence_types: ['score_', 'gate_'],
    min_evidence_count: 2,

    exemplar_insights: [
      'A 3-person team managing 12 business units explains the execution gap — the ratio makes consistent process adherence difficult.',
      "The Level 2 cap isn't a quality issue; it's structural. Two critical controls in variance analysis are missing.",
      'The 58% execution score masks a bifurcated reality: strong budgeting (82%) subsidizes weak scenario modeling (31%).',
    ],

    anti_patterns: [
      'Your organization has room for improvement in several areas.',
      'The results indicate opportunities to enhance your finance function.',
      'There are areas where you could improve.',
    ],

    context_requirements: ['company_name', 'team_size_or_fallback'],
  },

  priority_alignment: {
    section_id: 'priority_alignment',
    required_evidence_types: ['obj_'],
    min_evidence_count: 2,

    exemplar_insights: [
      'Forecasting was marked Critical (5/5) but scores 41% — the largest priority-reality gap.',
      'No material misalignment detected. Stated priorities track actual performance.',
      'Budget Foundation was rated Low importance (2/5) yet scores 78% — potential overinvestment.',
    ],

    anti_patterns: [
      'There are some gaps between priorities and results.',
      'Priorities and performance could be better aligned.',
    ],

    context_requirements: [],
  },

  strengths_weaknesses: {
    section_id: 'strengths_weaknesses',
    required_evidence_types: ['obj_'],
    min_evidence_count: 3,

    exemplar_insights: [
      'Strength: Budget Discipline (82%) — Annual budgeting processes are embedded and consistent.',
      'Weakness: Scenario Modeling (31%) with CRITICAL — No systematic scenario planning exists.',
      'Strength: Financial Controls (75%) — Core compliance and control frameworks are operational.',
      'Weakness: Predictive Analytics (22%) — No analytical models beyond basic trending.',
    ],

    anti_patterns: [
      'You have both strengths and weaknesses.',
      'Some areas are stronger than others.',
      'Performance varies across objectives.',
    ],

    context_requirements: [],
  },

  next_level_unlock: {
    section_id: 'next_level_unlock',
    required_evidence_types: ['gate_', 'critical_'],
    min_evidence_count: 2,

    exemplar_insights: [
      'The L2 gate fails on a single question: documented variance analysis process. This is the unlock.',
      'Two practices block Level 3: Driver Definition and Rolling Forecast Cadence.',
      'Level 4 requires mastery of Predictive Analytics — current score (22%) indicates a multi-phase journey.',
    ],

    anti_patterns: [
      'Focus on areas with lower scores to advance.',
      'Improvement will help you reach the next level.',
      'Work on your weaknesses to progress.',
    ],

    context_requirements: [],
  },

  capacity_check: {
    section_id: 'capacity_check',
    required_evidence_types: ['ctx_'],
    min_evidence_count: 1,

    exemplar_insights: [
      'A 4-person team with moderate bandwidth can realistically tackle 5-6 initiatives in 12 months.',
      'Team size unknown. Recommendations assume moderate capacity.',
      'With 8 FTEs and ongoing ERP migration, limit parallel initiatives to 3.',
      'Lean team (2-3) should sequence initiatives rather than parallel track.',
    ],

    anti_patterns: [
      'Consider your team capacity when planning improvements.',
      'Plan according to available resources.',
      'Balance workload with team size.',
    ],

    context_requirements: ['team_size_or_acknowledge'],
  },
};

/**
 * Get golden output pattern by section ID
 */
export function getGoldenPattern(sectionId: string): GoldenOutputPattern | null {
  return FPA_GOLDEN_OUTPUTS[sectionId] || null;
}

/**
 * Check if content matches any anti-pattern
 */
export function hasAntiPattern(content: string, sectionId: string): boolean {
  const pattern = FPA_GOLDEN_OUTPUTS[sectionId];
  if (!pattern) return false;

  const contentLower = content.toLowerCase();
  return pattern.anti_patterns.some((anti) => contentLower.includes(anti.toLowerCase()));
}

/**
 * Check if content uses evidence types
 */
export function hasRequiredEvidence(evidenceIds: string[], sectionId: string): boolean {
  const pattern = FPA_GOLDEN_OUTPUTS[sectionId];
  if (!pattern) return true;

  const requiredCount = pattern.min_evidence_count;
  const matchingEvidence = evidenceIds.filter((id) =>
    pattern.required_evidence_types.some((type) => id.startsWith(type))
  );

  return matchingEvidence.length >= requiredCount;
}
