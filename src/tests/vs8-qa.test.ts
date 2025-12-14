/**
 * VS8 QA Checklist — Actions Engine Tests
 *
 * Tests the actions derivation engine:
 * - Critical risks trigger actions
 * - Maturity blockers trigger actions
 * - Deduplication (same evidence can be both risk + blocker)
 * - Priority sorting (critical > high > medium)
 * - Missing action definitions handled gracefully
 * - Actions included in report DTO
 */

import { deriveActions } from "../actions";
import { buildReport, BuildReportInput } from "../reports";
import { Spec } from "../specs/types";
import { FinanceReportDTO } from "../reports/types";
import { AggregateResult } from "../results/aggregate";

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
  version: "test",
  questions: [
    {
      id: "has_cfo",
      pillar: "liquidity",
      weight: 1,
      text: "Do you have a CFO?",
      is_critical: true,
      trigger_action_id: "act_hire_cfo",
    },
    {
      id: "has_budget",
      pillar: "fpa",
      weight: 1,
      text: "Do you have a budget process?",
      is_critical: false,
      trigger_action_id: "act_create_budget",
    },
    {
      id: "no_action_defined",
      pillar: "fpa",
      weight: 1,
      text: "Some question without action",
      is_critical: true,
      // No trigger_action_id
    },
  ],
  pillars: [
    { id: "liquidity", name: "Liquidity", weight: 1 },
    { id: "fpa", name: "FP&A", weight: 1 },
  ],
  maturityGates: [
    { level: 0, label: "Ad-hoc", required_evidence_ids: [] },
    { level: 1, label: "Emerging", required_evidence_ids: ["has_cfo"] },
    { level: 2, label: "Defined", required_evidence_ids: ["has_budget"] },
  ],
  actions: [
    {
      id: "act_hire_cfo",
      title: "Appoint a CFO",
      description: "Hire a CFO to lead finance.",
      rationale: "Financial leadership is essential.",
      priority: "critical",
    },
    {
      id: "act_create_budget",
      title: "Establish Budget Process",
      description: "Create an annual budget process.",
      rationale: "Budgets enable planning.",
      priority: "high",
    },
  ],
};

const TEST_AGGREGATE: AggregateResult = {
  overall_score: 0.5,
  pillars: [
    { pillar_id: "liquidity", score: 0.5, weight_sum: 1, scored_questions: 1 },
    { pillar_id: "fpa", score: 0.5, weight_sum: 2, scored_questions: 2 },
  ],
};

// ============================================================
// Tests
// ============================================================

console.log("\n========================================");
console.log("VS8 QA CHECKLIST — Actions Engine");
console.log("========================================\n");

// ----------------------------------------------------------
// 1. Critical Risk Triggers Action
// ----------------------------------------------------------
console.log("--- Critical Risk Triggers Action ---");

{
  const input: BuildReportInput = {
    run_id: "test",
    spec: TEST_SPEC,
    aggregateResult: TEST_AGGREGATE,
    inputs: [
      { question_id: "has_cfo", value: false }, // Critical risk
      { question_id: "has_budget", value: true },
    ],
  };

  const report = buildReport(input);

  assertEqual(report.actions.length, 1, "1 action triggered");
  assertEqual(report.actions[0].id, "act_hire_cfo", "Correct action ID");
  assertEqual(report.actions[0].trigger_type, "critical_risk", "Trigger type is critical_risk");
  assertEqual(report.actions[0].priority, "critical", "Priority is critical");
}

// ----------------------------------------------------------
// 2. Maturity Blocker Triggers Action
// ----------------------------------------------------------
console.log("\n--- Maturity Blocker Triggers Action ---");

{
  const input: BuildReportInput = {
    run_id: "test",
    spec: TEST_SPEC,
    aggregateResult: TEST_AGGREGATE,
    inputs: [
      { question_id: "has_cfo", value: true },   // Not a risk
      { question_id: "has_budget", value: false }, // Blocks maturity level 2
    ],
  };

  const report = buildReport(input);

  // has_budget blocks level 2, should trigger action
  const budgetAction = report.actions.find((a) => a.id === "act_create_budget");
  assertTrue(budgetAction !== undefined, "Budget action triggered");
  assertEqual(budgetAction?.trigger_type, "maturity_blocker", "Trigger type is maturity_blocker");
}

// ----------------------------------------------------------
// 3. Deduplication (Same Evidence = Risk + Blocker)
// ----------------------------------------------------------
console.log("\n--- Deduplication ---");

{
  const input: BuildReportInput = {
    run_id: "test",
    spec: TEST_SPEC,
    aggregateResult: TEST_AGGREGATE,
    inputs: [
      { question_id: "has_cfo", value: false }, // Both critical risk AND maturity blocker
      { question_id: "has_budget", value: true },
    ],
  };

  const report = buildReport(input);

  // Should only have ONE action for has_cfo, not two
  const cfoActions = report.actions.filter((a) => a.id === "act_hire_cfo");
  assertEqual(cfoActions.length, 1, "Deduplicated: only 1 action for has_cfo");
  assertEqual(cfoActions[0].trigger_type, "critical_risk", "Critical risk takes precedence");
}

// ----------------------------------------------------------
// 4. Priority Sorting
// ----------------------------------------------------------
console.log("\n--- Priority Sorting ---");

{
  const input: BuildReportInput = {
    run_id: "test",
    spec: TEST_SPEC,
    aggregateResult: TEST_AGGREGATE,
    inputs: [
      { question_id: "has_cfo", value: false },   // Critical
      { question_id: "has_budget", value: false }, // High (blocker)
    ],
  };

  const report = buildReport(input);

  assertEqual(report.actions.length, 2, "2 actions triggered");
  assertEqual(report.actions[0].priority, "critical", "First action is critical");
  assertEqual(report.actions[1].priority, "high", "Second action is high");
}

// ----------------------------------------------------------
// 5. Missing Action Definition — Graceful Skip
// ----------------------------------------------------------
console.log("\n--- Missing Action Definition ---");

{
  const input: BuildReportInput = {
    run_id: "test",
    spec: TEST_SPEC,
    aggregateResult: TEST_AGGREGATE,
    inputs: [
      { question_id: "has_cfo", value: true },            // Satisfied (not a blocker)
      { question_id: "has_budget", value: true },         // Satisfied (not a blocker)
      { question_id: "no_action_defined", value: false }, // Critical but no action defined
    ],
  };

  const report = buildReport(input);

  // Should have 0 actions (the critical risk exists but no action is defined)
  assertEqual(report.actions.length, 0, "No action when trigger_action_id missing");
  assertEqual(report.critical_risks.length, 1, "Critical risk still recorded");
}

// ----------------------------------------------------------
// 6. No Triggers — Empty Actions
// ----------------------------------------------------------
console.log("\n--- No Triggers ---");

{
  const input: BuildReportInput = {
    run_id: "test",
    spec: TEST_SPEC,
    aggregateResult: TEST_AGGREGATE,
    inputs: [
      { question_id: "has_cfo", value: true },
      { question_id: "has_budget", value: true },
    ],
  };

  const report = buildReport(input);

  assertEqual(report.actions.length, 0, "No actions when all evidence satisfied");
}

// ----------------------------------------------------------
// 7. Action Contains Full Details
// ----------------------------------------------------------
console.log("\n--- Action Contains Full Details ---");

{
  const input: BuildReportInput = {
    run_id: "test",
    spec: TEST_SPEC,
    aggregateResult: TEST_AGGREGATE,
    inputs: [{ question_id: "has_cfo", value: false }],
  };

  const report = buildReport(input);
  const action = report.actions[0];

  assertEqual(action.id, "act_hire_cfo", "ID present");
  assertEqual(action.title, "Appoint a CFO", "Title from spec");
  assertEqual(action.description, "Hire a CFO to lead finance.", "Description from spec");
  assertEqual(action.rationale, "Financial leadership is essential.", "Rationale from spec");
  assertEqual(action.evidence_id, "has_cfo", "Evidence ID tracked");
  assertEqual(action.pillar_id, "liquidity", "Pillar ID tracked");
}

// ----------------------------------------------------------
// 8. Actions in FinanceReportDTO
// ----------------------------------------------------------
console.log("\n--- Actions in DTO ---");

{
  const input: BuildReportInput = {
    run_id: "test",
    spec: TEST_SPEC,
    aggregateResult: TEST_AGGREGATE,
    inputs: [{ question_id: "has_cfo", value: false }],
  };

  const report = buildReport(input);

  assertTrue(Array.isArray(report.actions), "actions is an array");
  assertTrue("actions" in report, "actions field exists in DTO");
}

// ----------------------------------------------------------
// 9. Deterministic Output
// ----------------------------------------------------------
console.log("\n--- Deterministic Output ---");

{
  const input: BuildReportInput = {
    run_id: "test",
    spec: TEST_SPEC,
    aggregateResult: TEST_AGGREGATE,
    inputs: [
      { question_id: "has_cfo", value: false },
      { question_id: "has_budget", value: false },
    ],
  };

  const report1 = buildReport(input);
  const report2 = buildReport(input);

  assertEqual(
    JSON.stringify(report1.actions),
    JSON.stringify(report2.actions),
    "Actions are deterministic"
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
