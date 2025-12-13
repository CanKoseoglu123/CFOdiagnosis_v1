import { NormalizedScore } from "./types";

export function assertNormalizedScore(
  question_id: string,
  score: number
): asserts score is NormalizedScore {
  if (typeof score !== "number" || Number.isNaN(score)) {
    throw new Error(`Score for ${question_id} is not a valid number`);
  }
  if (score < 0 || score > 1) {
    throw new Error(
      `Score for ${question_id} must be normalized 0.0–1.0, got ${score}`
    );
  }
}
