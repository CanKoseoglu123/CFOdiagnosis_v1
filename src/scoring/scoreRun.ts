import { SupabaseClient } from "@supabase/supabase-js";
import { scoringRules } from "./rules";
import { assertNormalizedScore } from "./guard";

export type ScoreRow = {
  question_id: string;
  score: number; // normalized 0..1
};

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

  // 2) Load inputs
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

  // 3) Apply rules
  const scores: ScoreRow[] = [];

  for (const rule of scoringRules) {
    const value = inputMap.get(rule.question_id);

    // Missing input => no score row (N/A handling)
    if (value === undefined) continue;

    const rawScore = rule.score(value as any);
    assertNormalizedScore(rule.question_id, rawScore);

    scores.push({ question_id: rule.question_id, score: rawScore });
  }

  return scores;
}
