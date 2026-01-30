// Test helper utilities

import type { Answer } from '../../maturity/types';

/**
 * Creates an array of answers with the given value for each question ID.
 */
export function createAnswers(
  questionIds: string[],
  value: boolean | 'N/A' | null
): Answer[] {
  return questionIds.map((id) => ({ question_id: id, value }));
}

/**
 * Creates a Map<string, unknown> from answer pairs (for legacy evaluateMaturity).
 */
export function createInputMap(
  entries: Array<[string, unknown]>
): Map<string, unknown> {
  return new Map(entries);
}

/**
 * Creates score rows for aggregation tests.
 */
export function createScores(
  entries: Array<{ question_id: string; score: number }>
) {
  return entries;
}
