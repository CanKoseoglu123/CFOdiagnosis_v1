/**
 * VS6 QA Checklist — Report Builder Tests
 *
 * Tests the report builder against spec requirements:
 * - DTO shape matches contract
 * - Critical risks derived correctly
 * - Maturity placeholder populated
 * - Pillar breakdown correct
 * - Score passthrough from VS5
 */

import { buildReport, BuildReportInput } from "../report/buildReport";
import { Spec } from "../specs/types";
import { AggregateResult } from "../results/aggregate";
import { FinanceReportDTO } from "../types/report";

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

function assertTrue(condition: boolean, testName: string): void {
  if (condition) {
    console.log(`✅ ${testName}`);
    passed++;
  } else {
    console.log(`❌ ${testName}`);
    failed++;
  }
}

// ============================================================
// Test Fixtures
// ============================================================

const TEST_SPEC: Spec = {
  version: "v2.6.4-test",
  questions: [
    {
      id: "q1_critical",
      pillar: "liquidity",
      weight: 1,
      text: "Do you have a CFO?",
      is_critical: true,
    },
    {
      id: "q2_normal",
      pillar: "liquidity",
      weight: 2,
      text: "What is your annual revenue?",
      is_critical: false,
    },
    {
      id: "q3_critical",
      pillar: "fpa",
      weight: 1,
      text: "Do you have a budget process?",
      is_critical: true,
    },
  ],
  pillars: [
    { id: "liquidity", name: "Liquidity & Cash", weight: 1 },
    { id: "fpa", name: "FP&A", weight: 1 },
  ],
  maturityGates: [
    { level: 0, label: "Ad-hoc", required_evidence_ids: [] },
    { level: 1, label: "Emerging", required_evidence_ids: ["q1_critical"] },
    { level: 2, label: "Defined", required_evidence_ids: ["q1_critical", "q2_normal"] },
  ],
};

const TEST_AGGREGATE_RESULT: AggregateResult = {
  overall_score: 0.75,
  pillars: [
    { pillar_id: "liquidity", score: 0.8, weight_sum: 3, scored_questions: 2 },
    { pillar_id: "fpa", score: 0.5, weight_sum: 1, scored_questions: 1 },
  ],
};

// ============================================================
// Tests
// ============================================================

console.log("\n========================================");
console.log("VS6 QA CHECKLIST — Report Builder");
console.log("========================================\n");

// ----------------------------------------------------------
// 1. Basic DTO Shape
// ----------------------------------------------------------
console.log("--- DTO Shape ---");

{
  const input: BuildReportInput = {
    run_id: "test-run-123",
    spec: TEST_SPEC,
    aggregateResult: TEST_AGGREGATE_RESULT,
    inputs: [],
  };

  const report = buildReport(input);

  assertEqual(report.run_id, "test-run-123", "run_id present");
  assertEqual(report.spec_version, "v2.6.4-test", "spec_version present");
  assertTrue(typeof report.generated_at === "string", "generated_at is string");
  assertTrue(report.generated_at.includes("T"), "generated_at is ISO format");
  assertEqual(report.overall_score, 0.75, "overall_score passed through");
  assertEqual(report.pillars.length, 2, "2 pillars present");
}

// ----------------------------------------------------------
// 2. Maturity Placeholder
// ----------------------------------------------------------
console.log("\n--- Maturity Placeholder ---");

{
  const input: BuildReportInput = {
    run_id: "test-run-123",
    spec: TEST_SPEC,
    aggregateResult: TEST_AGGREGATE_RESULT,
    inputs: [],
  };

  const report = buildReport(input);

  assertEqual(
    report.maturity.achieved_level,
    "NOT_CALCULATED",
    "achieved_level is NOT_CALCULATED"
  );
  assertEqual(
    report.maturity.blocking_evidence_ids.length,
    0,
    "blocking_evidence_ids is empty"
  );
  assertEqual(report.maturity.gates.length, 3, "3 maturity gates present");
  assertEqual(report.maturity.gates[0].label, "Ad-hoc", "Gate 0 label correct");
  assertEqual(report.maturity.gates[1].label, "Emerging", "Gate 1 label correct");
}

// ----------------------------------------------------------
// 3. Critical Risk Derivation — No Risks
// ----------------------------------------------------------
console.log("\n--- Critical Risks (No Risks) ---");

{
  const input: BuildReportInput = {
    run_id: "test-run-123",
    spec: TEST_SPEC,
    aggregateResult: TEST_AGGREGATE_RESULT,
    inputs: [
      { question_id: "q1_critical", value: true }, // Critical but TRUE = no risk
      { question_id: "q2_normal", value: 1000000 },
      { question_id: "q3_critical", value: true }, // Critical but TRUE = no risk
    ],
  };

  const report = buildReport(input);

  assertEqual(report.critical_risks.length, 0, "No critical risks when all TRUE");
}

// ----------------------------------------------------------
// 4. Critical Risk Derivation — With Risks
// ----------------------------------------------------------
console.log("\n--- Critical Risks (With Risks) ---");

{
  const input: BuildReportInput = {
    run_id: "test-run-123",
    spec: TEST_SPEC,
    aggregateResult: TEST_AGGREGATE_RESULT,
    inputs: [
      { question_id: "q1_critical", value: false }, // Critical + FALSE = RISK
      { question_id: "q2_normal", value: 1000000 },  // Not critical, ignored
      { question_id: "q3_critical", value: false },  // Critical + FALSE = RISK
    ],
  };

  const report = buildReport(input);

  assertEqual(report.critical_risks.length, 2, "2 critical risks detected");
  assertEqual(
    report.critical_risks[0].evidence_id,
    "q1_critical",
    "First risk evidence_id"
  );
  assertEqual(
    report.critical_risks[0].question_text,
    "Do you have a CFO?",
    "First risk question_text"
  );
  assertEqual(
    report.critical_risks[0].user_answer,
    false,
    "First risk user_answer"
  );
  assertEqual(
    report.critical_risks[0].pillar_id,
    "liquidity",
    "First risk pillar_id"
  );
}

// ----------------------------------------------------------
// 5. Critical Risk — Non-Boolean Not Flagged
// ----------------------------------------------------------
console.log("\n--- Critical Risks (Non-Boolean Ignored) ---");

{
  const input: BuildReportInput = {
    run_id: "test-run-123",
    spec: TEST_SPEC,
    aggregateResult: TEST_AGGREGATE_RESULT,
    inputs: [
      { question_id: "q1_critical", value: "no" },   // String, not boolean FALSE
      { question_id: "q3_critical", value: null },   // Null, not boolean FALSE
    ],
  };

  const report = buildReport(input);

  assertEqual(
    report.critical_risks.length,
    0,
    "Non-boolean values don't trigger risks"
  );
}

// ----------------------------------------------------------
// 6. Pillar Report Structure
// ----------------------------------------------------------
console.log("\n--- Pillar Report Structure ---");

{
  const input: BuildReportInput = {
    run_id: "test-run-123",
    spec: TEST_SPEC,
    aggregateResult: TEST_AGGREGATE_RESULT,
    inputs: [],
  };

  const report = buildReport(input);
  const liquidityPillar = report.pillars.find((p) => p.pillar_id === "liquidity");
  const fpaPillar = report.pillars.find((p) => p.pillar_id === "fpa");

  assertTrue(liquidityPillar !== undefined, "Liquidity pillar exists");
  assertEqual(liquidityPillar?.pillar_name, "Liquidity & Cash", "Pillar name correct");
  assertEqual(liquidityPillar?.score, 0.8, "Pillar score from VS5");
  assertEqual(liquidityPillar?.scored_questions, 2, "Scored questions from VS5");
  assertEqual(liquidityPillar?.total_questions, 2, "Total questions from spec");

  assertTrue(fpaPillar !== undefined, "FPA pillar exists");
  assertEqual(fpaPillar?.pillar_name, "FP&A", "FPA pillar name correct");
  assertEqual(fpaPillar?.total_questions, 1, "FPA has 1 question");
}

// ----------------------------------------------------------
// 7. Pillar-Level Critical Risks
// ----------------------------------------------------------
console.log("\n--- Pillar-Level Critical Risks ---");

{
  const input: BuildReportInput = {
    run_id: "test-run-123",
    spec: TEST_SPEC,
    aggregateResult: TEST_AGGREGATE_RESULT,
    inputs: [
      { question_id: "q1_critical", value: false }, // Liquidity risk
      { question_id: "q3_critical", value: true },  // FPA no risk
    ],
  };

  const report = buildReport(input);
  const liquidityPillar = report.pillars.find((p) => p.pillar_id === "liquidity");
  const fpaPillar = report.pillars.find((p) => p.pillar_id === "fpa");

  assertEqual(
    liquidityPillar?.critical_risks.length,
    1,
    "Liquidity has 1 risk"
  );
  assertEqual(fpaPillar?.critical_risks.length, 0, "FPA has 0 risks");
}

// ----------------------------------------------------------
// 8. Empty Inputs Handled
// ----------------------------------------------------------
console.log("\n--- Empty Inputs ---");

{
  const input: BuildReportInput = {
    run_id: "test-run-123",
    spec: TEST_SPEC,
    aggregateResult: TEST_AGGREGATE_RESULT,
    inputs: [], // No inputs at all
  };

  const report = buildReport(input);

  assertEqual(report.critical_risks.length, 0, "No risks with empty inputs");
  assertTrue(report.pillars.length > 0, "Pillars still generated");
}

// ----------------------------------------------------------
// 9. Deterministic Output
// ----------------------------------------------------------
console.log("\n--- Deterministic Output ---");

{
  const input: BuildReportInput = {
    run_id: "test-run-123",
    spec: TEST_SPEC,
    aggregateResult: TEST_AGGREGATE_RESULT,
    inputs: [{ question_id: "q1_critical", value: false }],
  };

  const report1 = buildReport(input);
  const report2 = buildReport(input);

  // Compare without generated_at (timestamp varies)
  const compare1 = { ...report1, generated_at: "" };
  const compare2 = { ...report2, generated_at: "" };

  assertEqual(
    JSON.stringify(compare1),
    JSON.stringify(compare2),
    "Deterministic (excluding timestamp)"
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
