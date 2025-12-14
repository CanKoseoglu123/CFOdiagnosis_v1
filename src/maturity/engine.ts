// src/maturity/engine.ts
// VS7 — Maturity Engine
// Pure function: evaluates maturity level based on inputs and gate definitions

import { MaturityGate, MaturityResult } from "./types";

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
