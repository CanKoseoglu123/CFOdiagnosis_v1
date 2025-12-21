// src/actions/prioritizeActions.ts
// V2: Prioritized Actions with P0/P1/P2 logic
// Fixes "High Performance Purgatory" - P1 uses potential_level, not actual_level

import { PrioritizedAction } from "./types";
import { MaturityResultV2 } from "../maturity/types";
import { Spec, SpecQuestion } from "../specs/types";

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
 * Generates action text from a question.
 * Converts "Do you have X?" → "Implement X"
 */
function generateActionText(question: SpecQuestion): string {
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

  // Default: prefix with "Address:"
  return `Address: ${text.replace(/\?$/, '')}`;
}

/**
 * Estimates effort based on question weight and level.
 */
function estimateEffort(question: SpecQuestion): 'low' | 'medium' | 'high' {
  const level = question.level ?? 1;

  // Higher levels = higher effort
  if (level >= 4) return 'high';
  if (level >= 3) return 'medium';

  // Weight affects effort
  if (question.weight && question.weight >= 2) return 'medium';

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
 * Prioritizes actions using P0/P1/P2 logic.
 *
 * P0 (Unlock): Failed criticals causing the cap
 * P1 (Optimize): Failed questions up to POTENTIAL level (not actual)
 * P2 (Future): Failed questions at POTENTIAL + 1
 *
 * Key Insight: Use potential_level for P1 to avoid "High Performance Purgatory"
 * A 90% scorer capped at L1 should see L1, L2, AND L3 gaps in P1.
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

  // P0: Critical questions causing the cap (UNLOCK)
  for (const qId of capped_by) {
    const q = questions.find((q) => q.id === qId);
    if (q && !seenQuestionIds.has(qId)) {
      seenQuestionIds.add(qId);
      actions.push({
        priority: 'P0',
        question_id: qId,
        question_text: q.text,
        action_text: generateActionText(q),
        impact: 'Unlocks next maturity level',
        effort: estimateEffort(q),
        level: q.level ?? 1,
      });
    }
  }

  // P1: Failed questions from L1 up to POTENTIAL level (OPTIMIZE)
  // This ensures high performers see their full roadmap
  for (let level = 1; level <= potential_level; level++) {
    const levelFailures = getFailedQuestionsAtLevel(inputs, questions, level);
    for (const q of levelFailures) {
      // Skip if already in P0
      if (seenQuestionIds.has(q.id)) continue;
      seenQuestionIds.add(q.id);

      const qLevel = q.level ?? 1;
      actions.push({
        priority: 'P1',
        question_id: q.id,
        question_text: q.text,
        action_text: generateActionText(q),
        impact:
          qLevel <= actual_level
            ? 'Strengthens current level'
            : 'Advances toward potential',
        effort: estimateEffort(q),
        level: qLevel,
      });
    }
  }

  // P2: Failed questions at POTENTIAL + 1 (NEXT STEPS)
  const nextLevel = Math.min(potential_level + 1, 4);
  if (nextLevel > potential_level) {
    const nextLevelFailures = getFailedQuestionsAtLevel(inputs, questions, nextLevel);
    for (const q of nextLevelFailures) {
      if (seenQuestionIds.has(q.id)) continue;
      seenQuestionIds.add(q.id);

      actions.push({
        priority: 'P2',
        question_id: q.id,
        question_text: q.text,
        action_text: generateActionText(q),
        impact: 'Prepares for next level',
        effort: estimateEffort(q),
        level: q.level ?? 1,
      });
    }
  }

  // Sort by priority (P0 first), then by level
  return actions.sort((a, b) => {
    const priorityOrder = { P0: 0, P1: 1, P2: 2 };
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.level - b.level;
  });
}
