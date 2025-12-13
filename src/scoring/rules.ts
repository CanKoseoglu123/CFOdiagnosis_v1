import { ScoringRule } from "./types";

export const scoringRules: Array<ScoringRule<any>> = [
  // Example rule: annual_revenue (number) -> normalized score 0..1
  {
    question_id: "annual_revenue",
    score: (value: number) => {
      // NOTE: VS3 ensures strict typing, so value is a number here (for completed runs)
      if (value >= 10_000_000) return 1.0;
      if (value >= 1_000_000) return 0.6;
      if (value > 0) return 0.2;
      return 0.0;
    },
  } satisfies ScoringRule<number>,
];
