/**
 * VS7 QA Checklist — Maturity Engine Tests
 *
 * Tests the maturity engine against spec requirements:
 * - Sequential gate evaluation (0 → 1 → 2 → ...)
 * - Loop breaks at first failure
 * - Cannot achieve Level N if Level N-1 failed
 * - Level 0 always achieved (baseline)
 * - Evidence must be strictly === true
 * - Blocking evidence correctly identified
 */

import { evaluateMaturity, MaturityGate } from "../maturity";

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

function assertArrayEquals<T>(actual: T[], expected: T[], testName: string): void {
  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();
  assertEqual(actualSorted, expectedSorted, testName);
}

// ============================================================
// Test Fixtures
// ============================================================

const STANDARD_GATES: MaturityGate[] = [
  { level: 0, label: "Ad-hoc", required_evidence_ids: [] },
  { level: 1, label: "Emerging", required_evidence_ids: ["e1"] },
  { level: 2, label: "Defined", required_evidence_ids: ["e2", "e3"] },
  { level: 3, label: "Managed", required_evidence_ids: ["e4"] },
  { level: 4, label: "Optimized", required_evidence_ids: ["e5", "e6"] },
];

// ============================================================
// Tests
// ============================================================

console.log("\n========================================");
console.log("VS7 QA CHECKLIST — Maturity Engine");
console.log("========================================\n");

// ----------------------------------------------------------
// 1. Level 0 Always Achieved (Baseline)
// ----------------------------------------------------------
console.log("--- Level 0 Baseline ---");

{
  const inputs = new Map<string, unknown>();
  const result = evaluateMaturity(inputs, STANDARD_GATES);

  assertEqual(result.achieved_level, 0, "Empty inputs → Level 0");
  assertEqual(result.achieved_label, "Ad-hoc", "Level 0 label is Ad-hoc");
  assertEqual(result.blocking_level, 1, "Blocked at Level 1");
  assertArrayEquals(result.blocking_evidence_ids, ["e1"], "Blocking evidence is e1");
}

// ----------------------------------------------------------
// 2. Sequential Evaluation — Level 1
// ----------------------------------------------------------
console.log("\n--- Sequential: Level 1 ---");

{
  const inputs = new Map<string, unknown>([["e1", true]]);
  const result = evaluateMaturity(inputs, STANDARD_GATES);

  assertEqual(result.achieved_level, 1, "e1=true → Level 1");
  assertEqual(result.achieved_label, "Emerging", "Level 1 label");
  assertEqual(result.blocking_level, 2, "Blocked at Level 2");
  assertArrayEquals(result.blocking_evidence_ids, ["e2", "e3"], "Blocking e2, e3");
}

// ----------------------------------------------------------
// 3. Sequential Evaluation — Level 2
// ----------------------------------------------------------
console.log("\n--- Sequential: Level 2 ---");

{
  const inputs = new Map<string, unknown>([
    ["e1", true],
    ["e2", true],
    ["e3", true],
  ]);
  const result = evaluateMaturity(inputs, STANDARD_GATES);

  assertEqual(result.achieved_level, 2, "e1,e2,e3=true → Level 2");
  assertEqual(result.achieved_label, "Defined", "Level 2 label");
  assertEqual(result.blocking_level, 3, "Blocked at Level 3");
}

// ----------------------------------------------------------
// 4. Cannot Skip Levels
// ----------------------------------------------------------
console.log("\n--- Cannot Skip Levels ---");

{
  // Has e2, e3, e4, e5, e6 but NOT e1
  const inputs = new Map<string, unknown>([
    ["e2", true],
    ["e3", true],
    ["e4", true],
    ["e5", true],
    ["e6", true],
  ]);
  const result = evaluateMaturity(inputs, STANDARD_GATES);

  assertEqual(result.achieved_level, 0, "Missing e1 → stuck at Level 0");
  assertEqual(result.blocking_level, 1, "Blocked at Level 1");
  assertArrayEquals(result.blocking_evidence_ids, ["e1"], "Missing e1");
}

// ----------------------------------------------------------
// 5. Partial Gate Failure
// ----------------------------------------------------------
console.log("\n--- Partial Gate Failure ---");

{
  // Has e1, e2 but NOT e3 (Level 2 requires both e2 AND e3)
  const inputs = new Map<string, unknown>([
    ["e1", true],
    ["e2", true],
  ]);
  const result = evaluateMaturity(inputs, STANDARD_GATES);

  assertEqual(result.achieved_level, 1, "Missing e3 → Level 1");
  assertEqual(result.blocking_level, 2, "Blocked at Level 2");
  assertArrayEquals(result.blocking_evidence_ids, ["e3"], "Only e3 missing");
}

// ----------------------------------------------------------
// 6. All Gates Satisfied (Max Level)
// ----------------------------------------------------------
console.log("\n--- All Gates Satisfied ---");

{
  const inputs = new Map<string, unknown>([
    ["e1", true],
    ["e2", true],
    ["e3", true],
    ["e4", true],
    ["e5", true],
    ["e6", true],
  ]);
  const result = evaluateMaturity(inputs, STANDARD_GATES);

  assertEqual(result.achieved_level, 4, "All evidence → Level 4");
  assertEqual(result.achieved_label, "Optimized", "Level 4 label");
  assertEqual(result.blocking_level, null, "No blocking level (at max)");
  assertArrayEquals(result.blocking_evidence_ids, [], "No blocking evidence");
}

// ----------------------------------------------------------
// 7. Strict Boolean Check — false
// ----------------------------------------------------------
console.log("\n--- Strict Check: false ---");

{
  const inputs = new Map<string, unknown>([["e1", false]]);
  const result = evaluateMaturity(inputs, STANDARD_GATES);

  assertEqual(result.achieved_level, 0, "e1=false → Level 0");
}

// ----------------------------------------------------------
// 8. Strict Boolean Check — "true" (string)
// ----------------------------------------------------------
console.log("\n--- Strict Check: string 'true' ---");

{
  const inputs = new Map<string, unknown>([["e1", "true"]]);
  const result = evaluateMaturity(inputs, STANDARD_GATES);

  assertEqual(result.achieved_level, 0, "e1='true' (string) → Level 0");
}

// ----------------------------------------------------------
// 9. Strict Boolean Check — 1 (number)
// ----------------------------------------------------------
console.log("\n--- Strict Check: number 1 ---");

{
  const inputs = new Map<string, unknown>([["e1", 1]]);
  const result = evaluateMaturity(inputs, STANDARD_GATES);

  assertEqual(result.achieved_level, 0, "e1=1 (number) → Level 0");
}

// ----------------------------------------------------------
// 10. Strict Boolean Check — null/undefined
// ----------------------------------------------------------
console.log("\n--- Strict Check: null/undefined ---");

{
  const inputs = new Map<string, unknown>([["e1", null]]);
  const result = evaluateMaturity(inputs, STANDARD_GATES);

  assertEqual(result.achieved_level, 0, "e1=null → Level 0");
}

{
  const inputs = new Map<string, unknown>([["e1", undefined]]);
  const result = evaluateMaturity(inputs, STANDARD_GATES);

  assertEqual(result.achieved_level, 0, "e1=undefined → Level 0");
}

// ----------------------------------------------------------
// 11. Unsorted Gates (engine should sort)
// ----------------------------------------------------------
console.log("\n--- Unsorted Gates ---");

{
  const unsortedGates: MaturityGate[] = [
    { level: 2, label: "Defined", required_evidence_ids: ["e2"] },
    { level: 0, label: "Ad-hoc", required_evidence_ids: [] },
    { level: 1, label: "Emerging", required_evidence_ids: ["e1"] },
  ];

  const inputs = new Map<string, unknown>([["e1", true]]);
  const result = evaluateMaturity(inputs, unsortedGates);

  assertEqual(result.achieved_level, 1, "Unsorted gates still work");
  assertEqual(result.blocking_level, 2, "Correctly identifies next gate");
}

// ----------------------------------------------------------
// 12. Empty Gates Array
// ----------------------------------------------------------
console.log("\n--- Empty Gates ---");

{
  const inputs = new Map<string, unknown>([["e1", true]]);
  const result = evaluateMaturity(inputs, []);

  assertEqual(result.achieved_level, 0, "No gates → Level 0");
  assertEqual(result.blocking_level, null, "No blocking level");
}

// ----------------------------------------------------------
// 13. Gate with Empty Required Evidence (always passes)
// ----------------------------------------------------------
console.log("\n--- Empty Required Evidence ---");

{
  const gates: MaturityGate[] = [
    { level: 0, label: "Ad-hoc", required_evidence_ids: [] },
    { level: 1, label: "Emerging", required_evidence_ids: [] }, // No requirements
    { level: 2, label: "Defined", required_evidence_ids: ["e1"] },
  ];

  const inputs = new Map<string, unknown>();
  const result = evaluateMaturity(inputs, gates);

  assertEqual(result.achieved_level, 1, "Empty gate requirements → auto-pass");
  assertEqual(result.blocking_level, 2, "Blocked at gate with requirements");
}

// ----------------------------------------------------------
// 14. Deterministic Output
// ----------------------------------------------------------
console.log("\n--- Deterministic Output ---");

{
  const inputs = new Map<string, unknown>([
    ["e1", true],
    ["e2", true],
  ]);

  const result1 = evaluateMaturity(inputs, STANDARD_GATES);
  const result2 = evaluateMaturity(inputs, STANDARD_GATES);
  const result3 = evaluateMaturity(inputs, STANDARD_GATES);

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

// ============================================================
// Summary
// ============================================================

console.log("\n========================================");
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log("========================================\n");

if (failed > 0) {
  process.exit(1);
}
