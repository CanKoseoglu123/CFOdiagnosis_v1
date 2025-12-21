// src/risks/engine.ts
// VS19: Critical Risk Engine
// Identifies "Red Flag" issues independently of the scoring system.

import { Spec, SpecQuestion } from "../specs/types";
import { CriticalRisk, DiagnosticInput } from "./types";

/**
 * deriveCriticalRisks - Pure function that identifies critical risks.
 *
 * Strict Logic Rule (per Spec Section 5):
 * A risk is generated if:
 *   1. The Question has is_critical === true, AND
 *   2. The Answer is false OR missing (undefined/null/non-boolean)
 *
 * Philosophy: "Silence on a critical control is a risk."
 *
 * @param inputs - Array of user answers from the database
 * @param spec - The diagnostic specification
 * @returns Array of CriticalRisk objects
 */
export function deriveCriticalRisks(
  inputs: DiagnosticInput[],
  spec: Spec
): CriticalRisk[] {
  const risks: CriticalRisk[] = [];

  // Build lookup map for inputs (question_id → value)
  const inputMap = new Map<string, unknown>(
    inputs.map((i) => [i.question_id, i.value])
  );

  // Build lookup map for pillars (pillar_id → pillar_name)
  const pillarMap = new Map<string, string>(
    spec.pillars.map((p) => [p.id, p.name])
  );

  // Evaluate each critical question
  for (const question of spec.questions) {
    // Skip non-critical questions
    if (!question.is_critical) continue;

    const answer = inputMap.get(question.id);

    // Only safe if answer is STRICTLY true (boolean)
    // Anything else (false, null, undefined, string, number) = risk
    if (answer === true) {
      continue; // No risk - control is in place
    }

    // Generate risk
    risks.push({
      questionId: question.id,
      questionText: question.text,
      pillarId: question.pillar,
      pillarName: pillarMap.get(question.pillar) ?? "Unknown",
      severity: "CRITICAL",
    });
  }

  return risks;
}
