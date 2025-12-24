/**
 * VS-25: Tonality Injector
 *
 * Tonality is calculated by code and injected into the Generator prompt.
 * AI never decides tone — it follows instructions.
 */

import { ObjectiveScore } from './types';

export type Tonality = 'celebrate' | 'refine' | 'remediate' | 'urgent';

export interface TonalityRule {
  minScore: number;
  maxScore: number;
  hasCritical: boolean | null;  // null = don't care
  tonality: Tonality;
  instruction: string;
}

/**
 * Tonality rules are evaluated in order.
 * First matching rule wins.
 */
export const TONALITY_RULES: TonalityRule[] = [
  {
    minScore: 0,
    maxScore: 100,
    hasCritical: true,
    tonality: 'urgent',
    instruction: 'CRITICAL GAP EXISTS. Be direct about risk. Do not minimize or soften. State consequences clearly.',
  },
  {
    minScore: 80,
    maxScore: 100,
    hasCritical: false,
    tonality: 'celebrate',
    instruction: 'This is a strength. Validate success briefly. Ask what drives it. Do not dwell — move on.',
  },
  {
    minScore: 40,
    maxScore: 79,
    hasCritical: false,
    tonality: 'refine',
    instruction: 'Foundation exists but gaps remain. Focus on specific friction points. Be constructive, not alarming.',
  },
  {
    minScore: 0,
    maxScore: 39,
    hasCritical: false,
    tonality: 'remediate',
    instruction: 'Significant gaps. Be direct but constructive. Focus on risk mitigation. Do not sugarcoat.',
  },
];

/**
 * Get the tonality rule for a given score and critical status.
 */
export function getTonality(score: number, hasCritical: boolean): TonalityRule {
  for (const rule of TONALITY_RULES) {
    const scoreMatch = score >= rule.minScore && score <= rule.maxScore;
    const criticalMatch = rule.hasCritical === null || rule.hasCritical === hasCritical;
    if (scoreMatch && criticalMatch) {
      return rule;
    }
  }
  // Fallback to last rule (remediate)
  return TONALITY_RULES[TONALITY_RULES.length - 1];
}

/**
 * Build tonality instructions for all objectives.
 * Returns a formatted string to inject into the Generator prompt.
 */
export function buildTonalityInstructions(objectives: ObjectiveScore[]): string {
  return objectives
    .map((obj) => {
      const rule = getTonality(obj.score, obj.has_critical_failure);
      return `- ${obj.name} (${obj.score}%): ${rule.instruction}`;
    })
    .join('\n');
}

/**
 * Get a summary of tonality distribution for logging.
 */
export function getTonalitySummary(objectives: ObjectiveScore[]): Record<Tonality, number> {
  const summary: Record<Tonality, number> = {
    celebrate: 0,
    refine: 0,
    remediate: 0,
    urgent: 0,
  };

  for (const obj of objectives) {
    const rule = getTonality(obj.score, obj.has_critical_failure);
    summary[rule.tonality]++;
  }

  return summary;
}

/**
 * Get the overall tone for the report based on objectives.
 * Used for high-level styling decisions.
 */
export function getOverallTone(objectives: ObjectiveScore[]): Tonality {
  // If any objective has critical failure, overall tone is urgent
  if (objectives.some((obj) => obj.has_critical_failure)) {
    return 'urgent';
  }

  // Calculate average score
  const avgScore =
    objectives.reduce((sum, obj) => sum + obj.score, 0) / objectives.length;

  if (avgScore >= 80) return 'celebrate';
  if (avgScore >= 40) return 'refine';
  return 'remediate';
}
