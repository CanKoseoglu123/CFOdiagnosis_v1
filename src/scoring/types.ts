export type NormalizedScore = number; // must be 0.0–1.0

export interface ScoringRule<T> {
  // Must match SPEC question id
  question_id: string;

  // Pure function: Input -> Normalized score
  score: (value: T) => NormalizedScore;
}
