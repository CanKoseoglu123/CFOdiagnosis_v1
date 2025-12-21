// src/actions/prioritizeActions.ts
// V2.1: Prioritized Actions with P1/P2/P3 logic and Initiative grouping
// Fixes "High Performance Purgatory" - P2 uses potential_level, not actual_level
// Adds 2x critical multiplier and score calculation

import { PrioritizedAction, PrioritizedInitiative } from "./types";
import { MaturityResultV2 } from "../maturity/types";
import { Spec, SpecQuestion, Initiative } from "../specs/types";

// =============================================================================
// TYPES
// =============================================================================

interface DiagnosticInput {
  question_id: string;
  value: unknown;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculates the action score using the V2.1 formula.
 * Score = (Impact² / Complexity) × 2 if Critical
 *
 * The 2x multiplier ensures criticals rank above high-ROI governance tasks.
 */
function calculateScore(question: SpecQuestion): number {
  const impact = question.impact ?? 3;
  const complexity = question.complexity ?? 3;

  let score = Math.pow(impact, 2) / complexity;

  if (question.is_critical) {
    score = score * 2;
  }

  return Math.round(score * 10) / 10; // Round to 1 decimal
}

/**
 * Generates action text from a question.
 * Uses expert_action.title if available, otherwise generates from question text.
 */
function generateActionText(question: SpecQuestion): string {
  // Use expert action title if available
  if (question.expert_action?.title) {
    return question.expert_action.title;
  }

  const text = question.text;

  // Simple transformations
  if (text.startsWith('Does ') || text.startsWith('Do ')) {
    return text
      .replace(/^Does the company /, 'Implement: ')
      .replace(/^Does the /, 'Implement: ')
      .replace(/^Does /, 'Implement: ')
      .replace(/^Do /, 'Implement: ')
      .replace(/\?$/, '');
  }

  if (text.startsWith('Is there ') || text.startsWith('Is the ')) {
    return text
      .replace(/^Is there /, 'Establish: ')
      .replace(/^Is the /, 'Ensure: ')
      .replace(/^Is /, 'Implement: ')
      .replace(/\?$/, '');
  }

  if (text.startsWith('Are ') || text.startsWith('Can ')) {
    return text
      .replace(/^Are /, 'Ensure: ')
      .replace(/^Can /, 'Enable: ')
      .replace(/\?$/, '');
  }

  if (text.startsWith('Has ')) {
    return text
      .replace(/^Has /, 'Complete: ')
      .replace(/\?$/, '');
  }

  if (text.startsWith('When ') || text.startsWith('In ')) {
    return `Address: ${text.replace(/\?$/, '')}`;
  }

  // Default: prefix with "Address:"
  return `Address: ${text.replace(/\?$/, '')}`;
}

/**
 * Estimates effort based on complexity.
 */
function estimateEffort(question: SpecQuestion): 'low' | 'medium' | 'high' {
  const complexity = question.complexity ?? 3;

  if (complexity >= 4) return 'high';
  if (complexity >= 2) return 'medium';
  return 'low';
}

/**
 * Gets failed questions at a specific level.
 */
function getFailedQuestionsAtLevel(
  inputs: DiagnosticInput[],
  questions: SpecQuestion[],
  level: number
): SpecQuestion[] {
  const inputMap = new Map<string, unknown>(
    inputs.map((i) => [i.question_id, i.value])
  );

  return questions.filter((q) => {
    const qLevel = q.level ?? 1;
    if (qLevel !== level) return false;
    const answer = inputMap.get(q.id);
    // Failed = not YES and not N/A
    return answer !== true && answer !== 'N/A';
  });
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Prioritizes actions using P1/P2/P3 logic.
 *
 * P1 (Unlock): Failed criticals causing the cap
 * P2 (Optimize): Failed questions up to POTENTIAL level (not actual)
 * P3 (Future): Failed questions at POTENTIAL + 1
 *
 * Key Insight: Use potential_level for P2 to avoid "High Performance Purgatory"
 * A 90% scorer capped at L1 should see L1, L2, AND L3 gaps in P2.
 *
 * Score Formula: (Impact² / Complexity) × 2 if Critical
 *
 * @param maturity - V2 maturity result with potential_level
 * @param inputs - User answers
 * @param questions - All questions from spec
 * @returns Sorted array of PrioritizedAction
 */
export function prioritizeActions(
  maturity: MaturityResultV2,
  inputs: DiagnosticInput[],
  questions: SpecQuestion[]
): PrioritizedAction[] {
  const actions: PrioritizedAction[] = [];
  const { actual_level, potential_level, capped_by } = maturity;
  const seenQuestionIds = new Set<string>();

  // P1: Critical questions causing the cap (UNLOCK)
  for (const qId of capped_by) {
    const q = questions.find((q) => q.id === qId);
    if (q && !seenQuestionIds.has(qId)) {
      seenQuestionIds.add(qId);
      actions.push({
        priority: 'P1',
        question_id: qId,
        question_text: q.text,
        action_text: generateActionText(q),
        action_title: q.expert_action?.title,
        action_type: q.expert_action?.type,
        impact: 'Unlocks next maturity level',
        effort: estimateEffort(q),
        level: q.level ?? 1,
        score: calculateScore(q),
        is_critical: q.is_critical ?? false,
        initiative_id: q.initiative_id,
      });
    }
  }

  // P2: Failed questions from L1 up to POTENTIAL level (OPTIMIZE)
  // This ensures high performers see their full roadmap
  for (let level = 1; level <= potential_level; level++) {
    const levelFailures = getFailedQuestionsAtLevel(inputs, questions, level);
    for (const q of levelFailures) {
      // Skip if already in P1
      if (seenQuestionIds.has(q.id)) continue;
      seenQuestionIds.add(q.id);

      const qLevel = q.level ?? 1;
      actions.push({
        priority: 'P2',
        question_id: q.id,
        question_text: q.text,
        action_text: generateActionText(q),
        action_title: q.expert_action?.title,
        action_type: q.expert_action?.type,
        impact:
          qLevel <= actual_level
            ? 'Strengthens current level'
            : 'Advances toward potential',
        effort: estimateEffort(q),
        level: qLevel,
        score: calculateScore(q),
        is_critical: q.is_critical ?? false,
        initiative_id: q.initiative_id,
      });
    }
  }

  // P3: Failed questions at POTENTIAL + 1 (NEXT STEPS)
  const nextLevel = Math.min(potential_level + 1, 4);
  if (nextLevel > potential_level) {
    const nextLevelFailures = getFailedQuestionsAtLevel(inputs, questions, nextLevel);
    for (const q of nextLevelFailures) {
      if (seenQuestionIds.has(q.id)) continue;
      seenQuestionIds.add(q.id);

      actions.push({
        priority: 'P3',
        question_id: q.id,
        question_text: q.text,
        action_text: generateActionText(q),
        action_title: q.expert_action?.title,
        action_type: q.expert_action?.type,
        impact: 'Prepares for next level',
        effort: estimateEffort(q),
        level: q.level ?? 1,
        score: calculateScore(q),
        is_critical: q.is_critical ?? false,
        initiative_id: q.initiative_id,
      });
    }
  }

  // Sort by priority (P1 first), then by score (descending)
  return actions.sort((a, b) => {
    const priorityOrder = { P1: 0, P2: 1, P3: 2 };
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    // Within same priority, sort by score (higher first)
    return b.score - a.score;
  });
}

/**
 * Groups prioritized actions by initiative.
 *
 * @param actions - Flat list of prioritized actions
 * @param initiatives - Initiative definitions from spec
 * @returns Array of PrioritizedInitiative with grouped actions
 */
export function groupActionsByInitiative(
  actions: PrioritizedAction[],
  initiatives: Initiative[]
): PrioritizedInitiative[] {
  const initiativeMap = new Map<string, Initiative>(
    initiatives.map(i => [i.id, i])
  );

  const groupedMap = new Map<string, PrioritizedAction[]>();

  // Group actions by initiative_id
  for (const action of actions) {
    const initId = action.initiative_id ?? 'ungrouped';
    if (!groupedMap.has(initId)) {
      groupedMap.set(initId, []);
    }
    groupedMap.get(initId)!.push(action);
  }

  const result: PrioritizedInitiative[] = [];

  for (const [initId, groupedActions] of groupedMap) {
    const initiative = initiativeMap.get(initId);

    // Sort actions within initiative by score
    groupedActions.sort((a, b) => b.score - a.score);

    // Determine highest priority (P1 > P2 > P3)
    const priorityOrder = { P1: 0, P2: 1, P3: 2 };
    const highestPriority = groupedActions.reduce((highest, action) => {
      return priorityOrder[action.priority] < priorityOrder[highest]
        ? action.priority
        : highest;
    }, 'P3' as 'P1' | 'P2' | 'P3');

    // Calculate total score
    const totalScore = groupedActions.reduce((sum, a) => sum + a.score, 0);

    result.push({
      initiative_id: initId,
      initiative_title: initiative?.title ?? 'Other Actions',
      initiative_description: initiative?.description ?? '',
      theme_id: initiative?.theme_id ?? 'unknown',
      priority: highestPriority,
      total_score: Math.round(totalScore * 10) / 10,
      actions: groupedActions,
    });
  }

  // Sort initiatives by priority, then by total score
  result.sort((a, b) => {
    const priorityOrder = { P1: 0, P2: 1, P3: 2 };
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.total_score - a.total_score;
  });

  return result;
}
