// src/maturity/engine.ts
// VS7 — Maturity Engine
// Pure function: evaluates maturity level based on inputs and gate definitions
// V2: Added execution score and cap logic

import { MaturityGate, MaturityResult, MaturityResultV2, Answer } from "./types";

// =============================================================================
// V2 CONSTANTS: Critical Questions
// =============================================================================

const L1_CRITICALS = ['fpa_l1_q01', 'fpa_l1_q02', 'fpa_l1_q05', 'fpa_l1_q09'];
const L2_CRITICALS = ['fpa_l2_q01', 'fpa_l2_q02', 'fpa_l2_q06', 'fpa_l2_q07'];

const LEVEL_LABELS: Record<number, string> = {
  1: 'Emerging',
  2: 'Defined',
  3: 'Managed',
  4: 'Optimized',
};

// =============================================================================
// V2: Execution Score Calculation
// =============================================================================

/**
 * Calculates execution score as percentage of YES answers.
 * N/A answers are excluded from the denominator.
 *
 * @param answers - Array of user answers
 * @returns Score 0-100
 */
export function calculateExecutionScore(answers: Answer[]): number {
  let earned = 0;
  let possible = 0;

  for (const answer of answers) {
    const value = answer.value;

    if (value === true) {
      earned += 1;
      possible += 1;
    } else if (value === false) {
      earned += 0;
      possible += 1;
    }
    // N/A, null, undefined: excluded from scoring (don't penalize)
  }

  if (possible === 0) return 0;
  return Math.round((earned / possible) * 100);
}

// =============================================================================
// V2: Failed Criticals Detection
// =============================================================================

/**
 * Finds which critical questions have failed (not answered YES).
 *
 * @param answers - Array of user answers
 * @param criticalIds - Array of critical question IDs to check
 * @returns Array of failed question IDs
 */
export function getFailedCriticals(
  answers: Answer[],
  criticalIds: string[]
): string[] {
  const answerMap = new Map<string, unknown>(
    answers.map((a) => [a.question_id, a.value])
  );

  return criticalIds.filter((qId) => {
    const answer = answerMap.get(qId);
    // Failed = NO or unanswered (not YES, not N/A)
    // N/A is treated as "not applicable" so not a failure
    return answer !== true && answer !== 'N/A';
  });
}

// =============================================================================
// V2: Maturity Calculation with Potential/Actual Split
// =============================================================================

export interface CalculateMaturityV2Input {
  answers: Answer[];
  questions: Array<{ id: string; text: string; level: number }>;
}

/**
 * Calculates maturity with execution score and critical caps.
 *
 * Key Logic:
 * 1. Calculate execution score (% YES answers)
 * 2. Derive potential level from score thresholds
 * 3. Check L1/L2 critical failures
 * 4. Apply caps if critical failures exist
 * 5. Return both potential and actual levels
 *
 * Thresholds:
 * - L1 (Emerging): 0-49%
 * - L2 (Defined): 50-79%
 * - L3 (Managed): 80-94%
 * - L4 (Optimized): 95-100%
 *
 * @param input - Answers and questions
 * @returns MaturityResultV2 with execution_score, potential_level, actual_level
 */
export function calculateMaturityV2(input: CalculateMaturityV2Input): MaturityResultV2 {
  const { answers, questions } = input;

  // Step 1: Calculate execution score
  const score = calculateExecutionScore(answers);

  // Step 2: Determine potential level from score
  let potential: 1 | 2 | 3 | 4;
  if (score < 50) potential = 1;
  else if (score < 80) potential = 2;
  else if (score < 95) potential = 3;
  else potential = 4;

  // Step 3: Check critical failures
  const l1Failures = getFailedCriticals(answers, L1_CRITICALS);
  const l2Failures = getFailedCriticals(answers, L2_CRITICALS);

  // Step 4: Apply caps
  let actual: 1 | 2 | 3 | 4 = potential;
  let capped = false;
  let cappedBy: string[] = [];

  // L1 criticals failed → cap at Level 1
  if (l1Failures.length > 0 && potential > 1) {
    actual = 1;
    capped = true;
    cappedBy = l1Failures;
  }
  // L2 criticals failed → cap at Level 2 (only if not already capped lower)
  else if (l2Failures.length > 0 && potential > 2) {
    actual = 2;
    capped = true;
    cappedBy = l2Failures;
  }

  // Step 5: Build human-readable reason
  let cappedReason: string | null = null;
  if (capped) {
    const questionTexts = cappedBy.map((qId) => {
      const q = questions.find((q) => q.id === qId);
      const text = q?.text ?? qId;
      return text.length > 50 ? text.substring(0, 50) + '...' : text;
    });
    cappedReason = `Capped at Level ${actual} due to: ${questionTexts.join('; ')}`;
  }

  // Step 6: Determine blocking level (next level to unlock)
  const blockingLevel = actual < 4 ? actual + 1 : null;

  // Determine blocking evidence (what's preventing next level)
  let blockingEvidenceIds: string[] = [];
  if (actual === 1 && l1Failures.length > 0) {
    blockingEvidenceIds = l1Failures;
  } else if (actual === 2 && l2Failures.length > 0) {
    blockingEvidenceIds = l2Failures;
  }

  return {
    execution_score: score,
    potential_level: potential,
    actual_level: actual,
    actual_label: LEVEL_LABELS[actual] ?? 'Unknown',
    capped,
    capped_by: cappedBy,
    capped_reason: cappedReason,
    blocking_level: blockingLevel,
    blocking_evidence_ids: blockingEvidenceIds,
  };
}

// =============================================================================
// LEGACY: Original evaluateMaturity (for backward compatibility)
// =============================================================================

/**
 * Evaluates maturity level by checking gates sequentially.
 *
 * Rules:
 * - Gates are checked in order (0 → 1 → 2 → ...)
 * - Loop breaks at first failure
 * - Cannot achieve Level N if Level N-1 failed
 * - Level 0 is always achieved (baseline)
 * - Evidence must be strictly === true to satisfy gate
 *
 * @param inputs - Map of question_id → user answer
 * @param gates - Array of maturity gates (will be sorted by level)
 * @returns MaturityResult with achieved level and blocking info
 */
export function evaluateMaturity(
  inputs: Map<string, unknown>,
  gates: MaturityGate[]
): MaturityResult {
  // Sort gates by level ascending (defensive — don't trust input order)
  const sortedGates = [...gates].sort((a, b) => a.level - b.level);

  // Edge case: no gates defined
  if (sortedGates.length === 0) {
    return {
      achieved_level: 0,
      achieved_label: "Unknown",
      blocking_level: null,
      blocking_evidence_ids: [],
    };
  }

  let achievedLevel = 0;
  let achievedLabel = sortedGates[0]?.label ?? "Unknown";

  for (const gate of sortedGates) {
    // Find which evidence IDs are NOT satisfied (not strictly true)
    const missingEvidence = gate.required_evidence_ids.filter(
      (evidenceId) => inputs.get(evidenceId) !== true
    );

    if (missingEvidence.length === 0) {
      // Gate satisfied — update achieved level
      achievedLevel = gate.level;
      achievedLabel = gate.label;
    } else {
      // Gate failed — return current achieved level with blocking info
      return {
        achieved_level: achievedLevel,
        achieved_label: achievedLabel,
        blocking_level: gate.level,
        blocking_evidence_ids: missingEvidence,
      };
    }
  }

  // All gates satisfied — at max level
  return {
    achieved_level: achievedLevel,
    achieved_label: achievedLabel,
    blocking_level: null,
    blocking_evidence_ids: [],
  };
}
