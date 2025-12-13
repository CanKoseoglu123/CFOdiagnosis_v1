
import { SupabaseClient } from "@supabase/supabase-js";
import { SPEC } from "./spec";

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

export async function validateRun(
  supabase: SupabaseClient,
  runId: string
): Promise<ValidationResult> {
  // 1. Load inputs
  const { data: inputs, error } = await supabase
    .from("diagnostic_inputs")
    .select("question_id, value")
    .eq("run_id", runId);

  if (error) {
    return {
      valid: false,
      errors: [`Failed to load inputs: ${error.message}`],
    };
  }

  const errors: string[] = [];
  const inputMap = new Map<string, unknown>(
    inputs.map((i) => [i.question_id, i.value])
  );

  // 2. Validate against SPEC
  for (const question of SPEC.questions) {
    const value = inputMap.get(question.id);

    if (value === undefined) {
      errors.push(`Missing required question: ${question.id}`);
      continue;
    }

    switch (question.type) {
      case "number":
        if (typeof value !== "number") {
          errors.push(
            `Invalid type for ${question.id}: expected number, got ${typeof value}`
          );
        }
        break;

      case "string":
        if (typeof value !== "string") {
          errors.push(
            `Invalid type for ${question.id}: expected string, got ${typeof value}`
          );
        }
        break;

      default:
        errors.push(`Unsupported question type for ${question.id}`);
    }
  }

  return errors.length === 0
    ? { valid: true }
    : { valid: false, errors };
} 
