/**
 * VS9 QA Checklist — Content Validation Tests
 *
 * Tests that the FP&A spec content is internally consistent:
 * - All questions have required fields
 * - All actions referenced by questions exist
 * - All evidence in maturity gates exists
 * - Maturity gates are sequential (0, 1, 2, 3, 4)
 * - No orphan actions (actions not referenced by any question)
 */

import { SPEC } from "../specs/v2.6.4";

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
// Tests
// ============================================================

console.log("\n========================================");
console.log("VS9 QA CHECKLIST — Content Validation");
console.log("========================================\n");

// ----------------------------------------------------------
// 1. Spec Structure
// ----------------------------------------------------------
console.log("--- Spec Structure ---");

assertTrue(SPEC.version === "v2.6.4", "Version is v2.6.4");
assertTrue(SPEC.pillars.length > 0, "At least 1 pillar defined");
assertTrue(SPEC.questions.length > 0, "At least 1 question defined");
assertTrue(SPEC.maturityGates.length === 5, "5 maturity levels (0-4)");
assertTrue(SPEC.actions.length > 0, "At least 1 action defined");

// ----------------------------------------------------------
// 2. Questions Have Required Fields
// ----------------------------------------------------------
console.log("\n--- Question Completeness ---");

for (const q of SPEC.questions) {
  assertTrue(q.id.length > 0, `Question ${q.id} has id`);
  assertTrue(q.pillar.length > 0, `Question ${q.id} has pillar`);
  assertTrue(q.text.length > 0, `Question ${q.id} has text`);
  assertTrue(typeof q.weight === "number", `Question ${q.id} has weight`);
}

// ----------------------------------------------------------
// 3. All Questions Reference Valid Pillars
// ----------------------------------------------------------
console.log("\n--- Pillar References ---");

const pillarIds = new Set(SPEC.pillars.map((p) => p.id));
for (const q of SPEC.questions) {
  assertTrue(
    pillarIds.has(q.pillar),
    `Question ${q.id} references valid pillar: ${q.pillar}`
  );
}

// ----------------------------------------------------------
// 4. All Action References Are Valid
// ----------------------------------------------------------
console.log("\n--- Action References ---");

const actionIds = new Set(SPEC.actions.map((a) => a.id));
for (const q of SPEC.questions) {
  if (q.trigger_action_id) {
    assertTrue(
      actionIds.has(q.trigger_action_id),
      `Question ${q.id} references valid action: ${q.trigger_action_id}`
    );
  }
}

// ----------------------------------------------------------
// 5. All Maturity Gate Evidence Exists
// ----------------------------------------------------------
console.log("\n--- Maturity Gate Evidence ---");

const questionIds = new Set(SPEC.questions.map((q) => q.id));
for (const gate of SPEC.maturityGates) {
  for (const evidenceId of gate.required_evidence_ids) {
    assertTrue(
      questionIds.has(evidenceId),
      `Gate L${gate.level} evidence exists: ${evidenceId}`
    );
  }
}

// ----------------------------------------------------------
// 6. Maturity Gates Are Sequential
// ----------------------------------------------------------
console.log("\n--- Gate Sequence ---");

const sortedGates = [...SPEC.maturityGates].sort((a, b) => a.level - b.level);
for (let i = 0; i < sortedGates.length; i++) {
  assertEqual(sortedGates[i].level, i, `Gate ${i} has level ${i}`);
}

// ----------------------------------------------------------
// 7. No Orphan Actions
// ----------------------------------------------------------
console.log("\n--- Action Coverage ---");

const referencedActions = new Set(
  SPEC.questions
    .filter((q) => q.trigger_action_id)
    .map((q) => q.trigger_action_id)
);

for (const action of SPEC.actions) {
  assertTrue(
    referencedActions.has(action.id),
    `Action ${action.id} is referenced by a question`
  );
}

// ----------------------------------------------------------
// 8. Critical Questions Have Actions
// ----------------------------------------------------------
console.log("\n--- Critical Question Actions ---");

for (const q of SPEC.questions) {
  if (q.is_critical) {
    assertTrue(
      q.trigger_action_id !== undefined,
      `Critical question ${q.id} has trigger_action_id`
    );
  }
}

// ----------------------------------------------------------
// 9. Action Completeness
// ----------------------------------------------------------
console.log("\n--- Action Completeness ---");

for (const a of SPEC.actions) {
  assertTrue(a.id.length > 0, `Action ${a.id} has id`);
  assertTrue(a.title.length > 0, `Action ${a.id} has title`);
  assertTrue(a.description.length > 20, `Action ${a.id} has description (>20 chars)`);
  assertTrue(a.rationale.length > 20, `Action ${a.id} has rationale (>20 chars)`);
  assertTrue(
    ["critical", "high", "medium"].includes(a.priority),
    `Action ${a.id} has valid priority`
  );
}

// ----------------------------------------------------------
// 10. FP&A Content Summary
// ----------------------------------------------------------
console.log("\n--- Content Summary ---");

const fpaQuestions = SPEC.questions.filter((q) => q.pillar === "fpa");
const criticalQuestions = SPEC.questions.filter((q) => q.is_critical);

console.log(`   Pillars: ${SPEC.pillars.length}`);
console.log(`   Questions: ${SPEC.questions.length}`);
console.log(`   FP&A Questions: ${fpaQuestions.length}`);
console.log(`   Critical Questions: ${criticalQuestions.length}`);
console.log(`   Actions: ${SPEC.actions.length}`);
console.log(`   Maturity Levels: ${SPEC.maturityGates.length}`);

assertTrue(fpaQuestions.length === 8, "FP&A has 8 questions");
assertTrue(criticalQuestions.length === 2, "2 critical questions");
assertTrue(SPEC.actions.length === 8, "8 actions defined");

// ============================================================
// Summary
// ============================================================

console.log("\n========================================");
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log("========================================\n");

if (failed > 0) {
  process.exit(1);
}
