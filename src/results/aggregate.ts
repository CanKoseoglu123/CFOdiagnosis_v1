// src/results/aggregate.ts
// PURE aggregation engine — no DB, no Supabase, no SPEC imports.
// This file defines the ONLY aggregation contract VS5 relies on.

// ------------------------------------------------------------------
// Types consumed by aggregation
// ------------------------------------------------------------------

export type ScoreRow = {
  question_id: string;
  score: number; // normalized 0..1
};

export type QuestionSpec = {
  id: string;
  weight?: number; // defaults to 1
};

export type PillarSpec = {
  id: string;
  questions: QuestionSpec[];
};

export type Spec = {
  pillars: PillarSpec[];
};

// ------------------------------------------------------------------
// Output types
// ------------------------------------------------------------------

export type PillarResult = {
  pillar_id: string;
  score: number | null;        // 0..1 rounded to 2dp
  weight_sum: number;          // sum of weights actually used
  scored_questions: number;    // count of included questions
};

export type AggregateResult = {
  overall_score: number | null; // 0..1 rounded to 2dp
  pillars: PillarResult[];
};

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ------------------------------------------------------------------
// Aggregation Engine (PURE)
// ------------------------------------------------------------------

/**
 * Aggregates per-question scores into pillar scores and an overall score.
 *
 * Rules:
 * - Missing questions are excluded (not counted in denominator).
 * - weight defaults to 1 if missing.
 * - Pillar score is null if no questions contributed.
 * - Overall score is computed from raw weighted sums (not rounded pillars).
 */
export function aggregateResults(
  spec: Spec,
  scores: ScoreRow[]
): AggregateResult {
  const scoreMap = new Map<string, number>();
  for (const s of scores) {
    scoreMap.set(s.question_id, s.score);
  }

  const pillarResults: PillarResult[] = [];

  let overallWeightedSum = 0;
  let overallWeightSum = 0;

  for (const pillar of spec.pillars) {
    let weightedSum = 0;
    let weightSum = 0;
    let scoredCount = 0;

    for (const q of pillar.questions) {
      const s = scoreMap.get(q.id);
      if (s === undefined) continue;

      const weight = q.weight ?? 1;
      weightedSum += s * weight;
      weightSum += weight;
      scoredCount += 1;
    }

    const pillarScore =
      weightSum === 0 ? null : round2(weightedSum / weightSum);

    pillarResults.push({
      pillar_id: pillar.id,
      score: pillarScore,
      weight_sum: weightSum,
      scored_questions: scoredCount,
    });

    if (weightSum > 0) {
      overallWeightedSum += weightedSum;
      overallWeightSum += weightSum;
    }
  }

  const overallScore =
    overallWeightSum === 0
      ? null
      : round2(overallWeightedSum / overallWeightSum);

  return {
    overall_score: overallScore,
    pillars: pillarResults,
  };
}
