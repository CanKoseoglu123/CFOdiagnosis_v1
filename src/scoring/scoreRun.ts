// src/scoring/scoreRun.ts
// FIXED: Spec-driven scoring (not hardcoded rules)

import { SupabaseClient } from "@supabase/supabase-js";
import { SpecRegistry } from "../specs/registry";
import { assertNormalizedScore } from "./guard";

export type ScoreRow = {
  question_id: string;
  score: number; // normalized 0..1
};

/**
 * Scores a completed diagnostic run.
 * 
 * FIXED: Now iterates over Spec questions (single source of truth),
 * not a hardcoded rules array. This prevents "split brain" where
 * new questions in the Spec are ignored by scoring.
 */
export async function scoreRun(
  supabase: SupabaseClient,
  runId: string
): Promise<ScoreRow[]> {
  // 1) Load run and enforce trust boundary
  const { data: run, error: runError } = await supabase
    .from("diagnostic_runs")
    .select("id, status, spec_version")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    throw new Error("Run not found");
  }

  if (run.status !== "completed") {
    throw new Error("Run is not completed");
  }

  // 2) Get the Spec (single source of truth for questions)
  const spec = SpecRegistry.get(run.spec_version);

  // 3) Load inputs
  const { data: inputs, error: inputsError } = await supabase
    .from("diagnostic_inputs")
    .select("question_id, value")
    .eq("run_id", runId);

  if (inputsError) {
    throw new Error(`Failed to load inputs: ${inputsError.message}`);
  }

  const inputMap = new Map<string, unknown>(
    (inputs ?? []).map((i) => [i.question_id, i.value])
  );

  // 4) Score ALL questions from the Spec
  const scores: ScoreRow[] = [];

  for (const question of spec.questions) {
    const value = inputMap.get(question.id);

    // FIXED: Missing input = score 0 (conservative scoring)
    // Previously we skipped, which caused "grade inflation"
    let rawScore: number;

    if (value === undefined || value === null) {
      // Missing answer = 0 (not skipped)
      rawScore = 0;
    } else {
      // Apply scoring based on value type
      // Currently all questions are boolean (yes/no)
      // Future: could switch on question.type for different scoring
      rawScore = scoreValue(value);
    }

    assertNormalizedScore(question.id, rawScore);
    scores.push({ question_id: question.id, score: rawScore });
  }

  return scores;
}

/**
 * Scores a single value.
 * Handles both boolean and string representations of boolean.
 * 
 * TRUE values: true, "true", "yes", 1, "1"
 * FALSE values: false, "false", "no", 0, "0", null, undefined
 */
function scoreValue(value: unknown): number {
  // Strict boolean
  if (value === true) return 1.0;
  if (value === false) return 0.0;

  // String representations (handles JSON storage variations)
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    if (lower === "true" || lower === "yes" || lower === "1") return 1.0;
    if (lower === "false" || lower === "no" || lower === "0") return 0.0;
  }

  // Numeric representations
  if (value === 1) return 1.0;
  if (value === 0) return 0.0;

  // Unknown value type - treat as false (conservative)
  console.warn(`Unknown value type for scoring: ${typeof value} = ${value}`);
  return 0.0;
}
