/**
 * VS5 QA Checklist — Pure Function Tests
 *
 * Tests the aggregation engine against spec requirements:
 * - Missing score rows excluded from denominator
 * - Weight defaults to 1
 * - Divide-by-zero returns null (not crash/NaN)
 * - Rounding to 2 decimal places
 * - Historical reproducibility (deterministic)
 * - Pillar isolation (scores don't bleed across pillars)
 */

import {
  aggregateResults,
  Spec,
  ScoreRow,
  AggregateResult,
} from "../results/aggregate";
import { toAggregateSpec } from "../specs/toAggregateSpec";
import { Spec as FullSpec } from "../specs/types";

// ============================================================
// Test Utilities
// ============================================================

let passed = 0;
let failed = 0;

function assertEqual<T>(actual: T, expected: T, testName: string): void {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);

  if (actualStr === expectedStr) {
    console.log(`✅ ${testName}`);
    passed++;
  } else {
    console.log(`❌ ${testName}`);
    console.log(`   Expected: ${expectedStr}`);
    console.log(`   Actual:   ${actualStr}`);
    failed++;
  }
}

function assertClose(
  actual: number | null,
  expected: number | null,
  testName: string,
  epsilon = 0.001
): void {
  if (actual === null && expected === null) {
    console.log(`✅ ${testName}`);
    passed++;
    return;
  }
  if (actual === null || expected === null) {
    console.log(`❌ ${testName}`);
    console.log(`   Expected: ${expected}, Actual: ${actual}`);
    failed++;
    return;
  }
  if (Math.abs(actual - expected) < epsilon) {
    console.log(`✅ ${testName}`);
    passed++;
  } else {
    console.log(`❌ ${testName}`);
    console.log(`   Expected: ${expected}, Actual: ${actual}`);
    failed++;
  }
}

// ============================================================
// Test Fixtures
// ============================================================

const SINGLE_PILLAR_SPEC: Spec = {
  pillars: [
    {
      id: "liquidity",
      questions: [
        { id: "q1", weight: 1 },
        { id: "q2", weight: 2 },
        { id: "q3", weight: 1 },
      ],
    },
  ],
};

const MULTI_PILLAR_SPEC: Spec = {
  pillars: [
    {
      id: "liquidity",
      questions: [
        { id: "liq_1", weight: 1 },
        { id: "liq_2", weight: 1 },
      ],
    },
    {
      id: "fpa",
      questions: [
        { id: "fpa_1", weight: 2 },
        { id: "fpa_2", weight: 1 },
      ],
    },
  ],
};

const NO_WEIGHT_SPEC: Spec = {
  pillars: [
    {
      id: "test",
      questions: [
        { id: "q1" }, // no weight specified
        { id: "q2" }, // no weight specified
      ],
    },
  ],
};

const EMPTY_PILLAR_SPEC: Spec = {
  pillars: [
    {
      id: "empty",
      questions: [],
    },
  ],
};

// ============================================================
// Tests
// ============================================================

console.log("\n========================================");
console.log("VS5 QA CHECKLIST — Aggregation Engine");
console.log("========================================\n");

// ----------------------------------------------------------
// 1. Missing score rows excluded from denominator
// ----------------------------------------------------------
console.log("--- Missing Score Rows ---");

{
  const scores: ScoreRow[] = [
    { question_id: "q1", score: 1.0 },
    // q2 missing
    { question_id: "q3", score: 0.5 },
  ];

  const result = aggregateResults(SINGLE_PILLAR_SPEC, scores);

  // Only q1 (weight 1) and q3 (weight 1) should count
  // Weighted sum = 1.0*1 + 0.5*1 = 1.5
  // Weight sum = 1 + 1 = 2
  // Score = 1.5/2 = 0.75
  assertClose(
    result.pillars[0].score,
    0.75,
    "Missing q2 excluded from calculation"
  );
  assertEqual(
    result.pillars[0].scored_questions,
    2,
    "Only 2 questions counted"
  );
  assertEqual(
    result.pillars[0].weight_sum,
    2,
    "Weight sum excludes missing q2 (weight 2)"
  );
}

// ----------------------------------------------------------
// 2. Weight defaults to 1
// ----------------------------------------------------------
console.log("\n--- Weight Defaults ---");

{
  const scores: ScoreRow[] = [
    { question_id: "q1", score: 1.0 },
    { question_id: "q2", score: 0.0 },
  ];

  const result = aggregateResults(NO_WEIGHT_SPEC, scores);

  // Both questions default to weight 1
  // Weighted sum = 1.0*1 + 0.0*1 = 1.0
  // Weight sum = 1 + 1 = 2
  // Score = 1.0/2 = 0.5
  assertClose(result.pillars[0].score, 0.5, "Default weight of 1 applied");
  assertEqual(result.pillars[0].weight_sum, 2, "Weight sum = 2 (1+1)");
}

// ----------------------------------------------------------
// 3. Divide-by-zero returns null
// ----------------------------------------------------------
console.log("\n--- Divide-by-Zero Handling ---");

{
  // Empty pillar with no questions
  const result1 = aggregateResults(EMPTY_PILLAR_SPEC, []);
  assertEqual(
    result1.pillars[0].score,
    null,
    "Empty pillar returns null score"
  );
  assertEqual(result1.overall_score, null, "Overall score null when all empty");
}

{
  // Pillar with questions but no matching scores
  const scores: ScoreRow[] = [{ question_id: "unknown", score: 1.0 }];
  const result = aggregateResults(SINGLE_PILLAR_SPEC, scores);

  assertEqual(
    result.pillars[0].score,
    null,
    "Pillar with no matching scores returns null"
  );
}

// ----------------------------------------------------------
// 4. Rounding to 2 decimal places
// ----------------------------------------------------------
console.log("\n--- Rounding (2dp) ---");

{
  const spec: Spec = {
    pillars: [
      {
        id: "test",
        questions: [
          { id: "q1", weight: 1 },
          { id: "q2", weight: 1 },
          { id: "q3", weight: 1 },
        ],
      },
    ],
  };

  // 1/3 = 0.333... should round to 0.33
  const scores: ScoreRow[] = [
    { question_id: "q1", score: 1.0 },
    { question_id: "q2", score: 0.0 },
    { question_id: "q3", score: 0.0 },
  ];

  const result = aggregateResults(spec, scores);
  assertEqual(result.pillars[0].score, 0.33, "0.333... rounds to 0.33");
}

{
  const spec: Spec = {
    pillars: [
      {
        id: "test",
        questions: [
          { id: "q1", weight: 1 },
          { id: "q2", weight: 1 },
          { id: "q3", weight: 1 },
        ],
      },
    ],
  };

  // 2/3 = 0.666... should round to 0.67
  const scores: ScoreRow[] = [
    { question_id: "q1", score: 1.0 },
    { question_id: "q2", score: 1.0 },
    { question_id: "q3", score: 0.0 },
  ];

  const result = aggregateResults(spec, scores);
  assertEqual(result.pillars[0].score, 0.67, "0.666... rounds to 0.67");
}

// ----------------------------------------------------------
// 5. Deterministic / Historical Reproducibility
// ----------------------------------------------------------
console.log("\n--- Deterministic Output ---");

{
  const scores: ScoreRow[] = [
    { question_id: "liq_1", score: 0.8 },
    { question_id: "liq_2", score: 0.6 },
    { question_id: "fpa_1", score: 1.0 },
    { question_id: "fpa_2", score: 0.5 },
  ];

  const result1 = aggregateResults(MULTI_PILLAR_SPEC, scores);
  const result2 = aggregateResults(MULTI_PILLAR_SPEC, scores);
  const result3 = aggregateResults(MULTI_PILLAR_SPEC, scores);

  assertEqual(
    JSON.stringify(result1),
    JSON.stringify(result2),
    "Run 1 === Run 2"
  );
  assertEqual(
    JSON.stringify(result2),
    JSON.stringify(result3),
    "Run 2 === Run 3"
  );
}

// ----------------------------------------------------------
// 6. Pillar Isolation
// ----------------------------------------------------------
console.log("\n--- Pillar Isolation ---");

{
  const scores: ScoreRow[] = [
    { question_id: "liq_1", score: 1.0 },
    { question_id: "liq_2", score: 1.0 },
    { question_id: "fpa_1", score: 0.0 },
    { question_id: "fpa_2", score: 0.0 },
  ];

  const result = aggregateResults(MULTI_PILLAR_SPEC, scores);

  assertEqual(
    result.pillars[0].score,
    1.0,
    "Liquidity pillar score = 1.0 (isolated)"
  );
  assertEqual(result.pillars[1].score, 0.0, "FPA pillar score = 0.0 (isolated)");
}

// ----------------------------------------------------------
// 7. Overall Score Calculation
// ----------------------------------------------------------
console.log("\n--- Overall Score ---");

{
  // liquidity: (0.8*1 + 0.6*1) / 2 = 0.7
  // fpa: (1.0*2 + 0.5*1) / 3 = 0.833...
  // overall: (0.8 + 0.6 + 2.0 + 0.5) / (1+1+2+1) = 3.9/5 = 0.78
  const scores: ScoreRow[] = [
    { question_id: "liq_1", score: 0.8 },
    { question_id: "liq_2", score: 0.6 },
    { question_id: "fpa_1", score: 1.0 },
    { question_id: "fpa_2", score: 0.5 },
  ];

  const result = aggregateResults(MULTI_PILLAR_SPEC, scores);

  assertEqual(result.pillars[0].score, 0.7, "Liquidity pillar = 0.7");
  assertEqual(result.pillars[1].score, 0.83, "FPA pillar = 0.83 (rounded)");
  assertEqual(result.overall_score, 0.78, "Overall = 0.78 (from raw sums)");
}

// ----------------------------------------------------------
// 8. toAggregateSpec Adapter
// ----------------------------------------------------------
console.log("\n--- toAggregateSpec Adapter ---");

{
  const fullSpec: FullSpec = {
    version: "v2.6.4",
    questions: [
      { id: "annual_revenue", pillar: "liquidity", weight: 1, text: "Annual revenue?", is_critical: false },
      { id: "cash_reserves", pillar: "liquidity", weight: 2, text: "Cash reserves?", is_critical: false },
      { id: "forecast_accuracy", pillar: "fpa", weight: 1, text: "Forecast accuracy?", is_critical: false },
    ],
    pillars: [
      { id: "liquidity", name: "Liquidity", weight: 1 },
      { id: "fpa", name: "FP&A", weight: 1 },
    ],
    maturityGates: [],
    actions: [],
  };

  const aggregateSpec = toAggregateSpec(fullSpec);

  assertEqual(aggregateSpec.pillars.length, 2, "2 pillars converted");
  assertEqual(
    aggregateSpec.pillars[0].questions.length,
    2,
    "Liquidity has 2 questions"
  );
  assertEqual(aggregateSpec.pillars[1].questions.length, 1, "FPA has 1 question");
  assertEqual(
    aggregateSpec.pillars[0].questions[0].id,
    "annual_revenue",
    "First question ID correct"
  );
  assertEqual(
    aggregateSpec.pillars[0].questions[1].weight,
    2,
    "Weight preserved"
  );
}

// ============================================================
// Summary
// ============================================================

console.log("\n========================================");
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log("========================================\n");

if (failed > 0) {
  process.exit(1);
}
