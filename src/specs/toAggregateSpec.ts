import { Spec as FullSpec } from "./types";
import { Spec as AggregateSpec } from "../results/aggregate";

/**
 * Converts the full historical SPEC into the minimal
 * aggregation-only SPEC required by VS5.
 */
export function toAggregateSpec(spec: FullSpec): AggregateSpec {
  return {
    pillars: spec.pillars.map((pillar) => ({
      id: pillar.id,

      // ⬇️ THIS is where your SPEC differs
      questions: extractQuestions(pillar),
    })),
  };
}

/**
 * Domain-specific extraction of questions from a pillar.
 * This MUST return an array of { id, weight? }.
 */
function extractQuestions(pillar: any): { id: string; weight?: number }[] {
  /**
   * TODO — IMPLEMENT BASED ON YOUR SPEC
   *
   * Examples:
   *
   * If your spec is:
   * pillar.areas[].questions[]
   *
   * return pillar.areas.flatMap(a =>
   *   a.questions.map(q => ({ id: q.id, weight: q.weight }))
   * );
   */

  throw new Error(
    "toAggregateSpec.extractQuestions not implemented for this SPEC shape"
  );
}
