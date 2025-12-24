/**
 * VS-25: Gap Prioritizer
 *
 * Questions are prioritized by code, not AI judgment.
 * Priority factors: Critical > P1 > Red objectives > P2 > High importance
 */

import { Gap, PrioritizedGap, ObjectiveScore, Initiative } from '../types';
import { LOOP_CONFIG } from '../config';

/**
 * Priority scoring weights.
 */
const PRIORITY_WEIGHTS = {
  critical: 100,    // Critical failures first
  p1Initiative: 75, // P1 initiatives
  redObjective: 50, // Score < 50%
  p2Initiative: 35, // P2 initiatives
  highImportance: 25, // User-marked priority (importance >= 4)
};

/**
 * Prioritize gaps based on objective scores and initiatives.
 * Returns top N gaps based on QUESTION_LIMITS.maxTotal.
 */
export function prioritizeGaps(
  gaps: Gap[],
  objectives: ObjectiveScore[],
  initiatives: Initiative[]
): PrioritizedGap[] {
  return gaps
    .map((gap) => ({
      ...gap,
      priority_score: calculatePriority(gap, objectives, initiatives),
    }))
    .sort((a, b) => b.priority_score - a.priority_score)
    .slice(0, LOOP_CONFIG.maxQuestionsTotal);
}

/**
 * Calculate priority score for a single gap.
 */
function calculatePriority(
  gap: Gap,
  objectives: ObjectiveScore[],
  initiatives: Initiative[]
): number {
  const obj = objectives.find((o) => o.id === gap.objective_id);
  if (!obj) return 0;

  // Find related initiatives
  const relatedInitiatives = initiatives.filter((i) => i.objective_id === obj.id);
  const hasP1 = relatedInitiatives.some((i) => i.priority === 'P1');
  const hasP2 = relatedInitiatives.some((i) => i.priority === 'P2');

  let score = 0;

  // Priority factors (in order of importance)
  if (obj.has_critical_failure) score += PRIORITY_WEIGHTS.critical;
  if (hasP1) score += PRIORITY_WEIGHTS.p1Initiative;
  if (obj.score < 50) score += PRIORITY_WEIGHTS.redObjective;
  if (hasP2) score += PRIORITY_WEIGHTS.p2Initiative;
  if (obj.importance >= 4) score += PRIORITY_WEIGHTS.highImportance;

  return score;
}

/**
 * Get gaps that would generate questions.
 * Filters to only gaps worth asking about.
 */
export function getActionableGaps(
  gaps: Gap[],
  objectives: ObjectiveScore[],
  initiatives: Initiative[],
  alreadyAsked: number
): PrioritizedGap[] {
  const remainingBudget = LOOP_CONFIG.maxQuestionsTotal - alreadyAsked;
  if (remainingBudget <= 0) return [];

  return prioritizeGaps(gaps, objectives, initiatives).slice(0, remainingBudget);
}

/**
 * Group gaps by objective for better question batching.
 */
export function groupGapsByObjective(
  gaps: PrioritizedGap[]
): Map<string, PrioritizedGap[]> {
  const grouped = new Map<string, PrioritizedGap[]>();

  for (const gap of gaps) {
    const existing = grouped.get(gap.objective_id) || [];
    existing.push(gap);
    grouped.set(gap.objective_id, existing);
  }

  return grouped;
}

/**
 * Get a summary of gap priorities for logging.
 */
export function getGapPrioritySummary(
  gaps: PrioritizedGap[]
): { total: number; byScore: Record<string, number> } {
  const byScore: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const gap of gaps) {
    if (gap.priority_score >= PRIORITY_WEIGHTS.critical) {
      byScore.critical++;
    } else if (gap.priority_score >= PRIORITY_WEIGHTS.p1Initiative) {
      byScore.high++;
    } else if (gap.priority_score >= PRIORITY_WEIGHTS.redObjective) {
      byScore.medium++;
    } else {
      byScore.low++;
    }
  }

  return { total: gaps.length, byScore };
}
