import { Spec as FullSpec } from "./types";
import { Spec as AggregateSpec } from "../results/aggregate";

/**
 * Converts the full historical SPEC into the minimal
 * aggregation-only SPEC required by VS5.
 *
 * Spec shape (v2.6.4):
 *   questions: [{ id, pillar, weight }]
 *   pillars: [{ id, weight }]
 *
 * Questions reference pillars via `pillar` field (flat, not nested).
 */
export function toAggregateSpec(spec: FullSpec): AggregateSpec {
  return {
    pillars: spec.pillars.map((pillar) => ({
      id: pillar.id,
      questions: extractQuestionsForPillar(spec, pillar.id),
    })),
  };
}

/**
 * Extracts all questions belonging to a given pillar.
 * Returns array of { id, weight? } for the aggregation engine.
 */
function extractQuestionsForPillar(
  spec: FullSpec,
  pillarId: string
): { id: string; weight?: number }[] {
  return spec.questions
    .filter((q) => q.pillar === pillarId)
    .map((q) => ({
      id: q.id,
      weight: q.weight,
    }));
}
