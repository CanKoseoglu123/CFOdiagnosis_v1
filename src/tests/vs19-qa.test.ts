/**
 * VS19 QA Checklist — Critical Risk Engine Tests
 *
 * Tests the risk engine against spec requirements (Section 5):
 * - Critical questions with FALSE answer → Risk Generated
 * - Critical questions with TRUE answer → No Risk
 * - Critical questions with NO answer → Risk Generated ("Silence is a risk")
 * - Non-critical questions with FALSE answer → No Risk
 */

import { deriveCriticalRisks } from "../risks/engine";
import { Spec, SpecQuestion, SpecPillar } from "../specs/types";
import { DiagnosticInput } from "../risks/types";

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

// ============================================================
// Test Fixtures
// ============================================================

const TEST_PILLARS: SpecPillar[] = [
  { id: "fpa", name: "Financial Planning & Analysis", weight: 1 },
  { id: "controls", name: "Internal Controls", weight: 1 },
];

const TEST_QUESTIONS: SpecQuestion[] = [
  // Critical questions
  {
    id: "q_critical_1",
    pillar: "fpa",
    weight: 2,
    text: "Do you have an annual budget?",
    is_critical: true,
    level: 1,
  },
  {
    id: "q_critical_2",
    pillar: "controls",
    weight: 2,
    text: "Do you perform bank reconciliations?",
    is_critical: true,
    level: 1,
  },
  // Non-critical questions
  {
    id: "q_non_critical_1",
    pillar: "fpa",
    weight: 1,
    text: "Do you have variance analysis?",
    is_critical: false,
    level: 2,
  },
  {
    id: "q_non_critical_2",
    pillar: "controls",
    weight: 1,
    text: "Do you have audit trails?",
    // is_critical not set (undefined)
    level: 2,
  },
];

const TEST_SPEC: Spec = {
  version: "test",
  questions: TEST_QUESTIONS,
  pillars: TEST_PILLARS,
  maturityGates: [],
  actions: [],
};

// ============================================================
// Tests
// ============================================================

console.log("\n========================================");
console.log("VS19 QA CHECKLIST — Critical Risk Engine");
console.log("========================================\n");

// ----------------------------------------------------------
// Test 1: Critical Question + Answer FALSE → Risk Generated
// ----------------------------------------------------------
console.log("--- Critical + FALSE → Risk ---");

{
  // Provide explicit answers for all critical questions to isolate the test
  const inputs: DiagnosticInput[] = [
    { question_id: "q_critical_1", value: false },  // FALSE → Risk
    { question_id: "q_critical_2", value: true },   // TRUE → No Risk
  ];

  const risks = deriveCriticalRisks(inputs, TEST_SPEC);

  assertEqual(risks.length, 1, "1 risk generated for critical FALSE");
  assertEqual(risks[0]?.questionId, "q_critical_1", "Correct question ID");
  assertEqual(risks[0]?.pillarId, "fpa", "Correct pillar ID");
  assertEqual(risks[0]?.pillarName, "Financial Planning & Analysis", "Correct pillar name");
  assertEqual(risks[0]?.severity, "CRITICAL", "Severity is CRITICAL");
}

// ----------------------------------------------------------
// Test 2: Critical Question + Answer TRUE → No Risk
// ----------------------------------------------------------
console.log("\n--- Critical + TRUE → No Risk ---");

{
  // All critical questions answered TRUE → No risks
  const inputs: DiagnosticInput[] = [
    { question_id: "q_critical_1", value: true },
    { question_id: "q_critical_2", value: true },
  ];

  const risks = deriveCriticalRisks(inputs, TEST_SPEC);

  assertEqual(risks.length, 0, "No risk for critical TRUE");
}

// ----------------------------------------------------------
// Test 3: Critical Question + No Answer → Risk Generated
// ("Silence on a critical control is a risk")
// ----------------------------------------------------------
console.log("\n--- Critical + NO ANSWER → Risk (Silence Rule) ---");

{
  // No input for q_critical_1 (missing answer)
  const inputs: DiagnosticInput[] = [];

  const risks = deriveCriticalRisks(inputs, TEST_SPEC);

  // Should generate risks for ALL critical questions that have no answer
  assertEqual(risks.length, 2, "2 risks for 2 critical questions with no answer");

  const riskIds = risks.map((r) => r.questionId).sort();
  assertEqual(riskIds, ["q_critical_1", "q_critical_2"], "Both critical questions flagged");
}

// ----------------------------------------------------------
// Test 4: Non-Critical Question + Answer FALSE → No Risk
// ----------------------------------------------------------
console.log("\n--- Non-Critical + FALSE → No Risk ---");

{
  // All critical questions answered TRUE (no risk from them)
  // Non-critical questions answered FALSE (should not generate risk)
  const inputs: DiagnosticInput[] = [
    { question_id: "q_critical_1", value: true },
    { question_id: "q_critical_2", value: true },
    { question_id: "q_non_critical_1", value: false },
    { question_id: "q_non_critical_2", value: false },
  ];

  const risks = deriveCriticalRisks(inputs, TEST_SPEC);

  assertEqual(risks.length, 0, "No risk for non-critical FALSE");
}

// ----------------------------------------------------------
// Test 5: Mixed Scenario
// ----------------------------------------------------------
console.log("\n--- Mixed Scenario ---");

{
  const inputs: DiagnosticInput[] = [
    { question_id: "q_critical_1", value: true },    // Critical TRUE → No risk
    { question_id: "q_critical_2", value: false },   // Critical FALSE → Risk
    { question_id: "q_non_critical_1", value: false }, // Non-critical FALSE → No risk
    // q_non_critical_2 missing → No risk (not critical)
  ];

  const risks = deriveCriticalRisks(inputs, TEST_SPEC);

  assertEqual(risks.length, 1, "Only 1 risk in mixed scenario");
  assertEqual(risks[0]?.questionId, "q_critical_2", "Risk is for critical FALSE");
}

// ----------------------------------------------------------
// Test 6: Null/Undefined Values Count as Missing
// ----------------------------------------------------------
console.log("\n--- Null/Undefined = Missing (Risk) ---");

{
  const inputs: DiagnosticInput[] = [
    { question_id: "q_critical_1", value: null },
    { question_id: "q_critical_2", value: undefined },
  ];

  const risks = deriveCriticalRisks(inputs, TEST_SPEC);

  assertEqual(risks.length, 2, "2 risks for null/undefined critical answers");
}

// ----------------------------------------------------------
// Test 7: String Values (Invalid) Count as Missing
// ----------------------------------------------------------
console.log("\n--- String Values = Invalid (Risk) ---");

{
  const inputs: DiagnosticInput[] = [
    { question_id: "q_critical_1", value: "yes" },
    { question_id: "q_critical_2", value: "true" },
  ];

  const risks = deriveCriticalRisks(inputs, TEST_SPEC);

  assertEqual(risks.length, 2, "2 risks for string values (not boolean true)");
}

// ----------------------------------------------------------
// Test 8: Deterministic Output
// ----------------------------------------------------------
console.log("\n--- Deterministic Output ---");

{
  const inputs: DiagnosticInput[] = [
    { question_id: "q_critical_1", value: false },
  ];

  const run1 = deriveCriticalRisks(inputs, TEST_SPEC);
  const run2 = deriveCriticalRisks(inputs, TEST_SPEC);
  const run3 = deriveCriticalRisks(inputs, TEST_SPEC);

  assertEqual(
    JSON.stringify(run1),
    JSON.stringify(run2),
    "Run 1 === Run 2"
  );
  assertEqual(
    JSON.stringify(run2),
    JSON.stringify(run3),
    "Run 2 === Run 3"
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
