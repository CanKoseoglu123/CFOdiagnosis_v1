/**
 * VS9 QA Checklist — Content Validation Tests
 *
 * Tests that the FP&A spec content is internally consistent:
 * - All questions have required fields
 * - All questions reference valid pillars
 * - All evidence in maturity gates exists as questions
 * - Maturity gates are sequential (0, 1, 2, 3, 4)
 * - All objectives have valid action references (VS20)
 * - All questions link to valid objectives (VS20)
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
assertTrue(SPEC.objectives !== undefined && SPEC.objectives.length > 0, "At least 1 objective defined (VS20)");

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
// 4. VS20: All Questions Reference Valid Objectives
// ----------------------------------------------------------
console.log("\n--- Objective References (VS20) ---");

const objectiveIds = new Set(SPEC.objectives?.map((o) => o.id) || []);
for (const q of SPEC.questions) {
  if (q.objective_id) {
    assertTrue(
      objectiveIds.has(q.objective_id),
      `Question ${q.id} references valid objective: ${q.objective_id}`
    );
  }
}

// ----------------------------------------------------------
// 5. VS20: All Objectives Reference Valid Actions
// ----------------------------------------------------------
console.log("\n--- Objective Action References (VS20) ---");

const actionIds = new Set(SPEC.actions.map((a) => a.id));
for (const obj of SPEC.objectives || []) {
  if (obj.action_id) {
    assertTrue(
      actionIds.has(obj.action_id),
      `Objective ${obj.id} references valid action: ${obj.action_id}`
    );
  }
}

// ----------------------------------------------------------
// 6. VS20: All Actions Are Referenced By Objectives
// ----------------------------------------------------------
console.log("\n--- Action Coverage (VS20) ---");

const referencedActionsByObjectives = new Set(
  (SPEC.objectives || [])
    .filter((o) => o.action_id)
    .map((o) => o.action_id)
);

for (const action of SPEC.actions) {
  assertTrue(
    referencedActionsByObjectives.has(action.id),
    `Action ${action.id} is referenced by an objective`
  );
}

// ----------------------------------------------------------
// 7. All Maturity Gate Evidence Exists
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
// 8. Maturity Gates Are Sequential
// ----------------------------------------------------------
console.log("\n--- Gate Sequence ---");

const sortedGates = [...SPEC.maturityGates].sort((a, b) => a.level - b.level);
for (let i = 0; i < sortedGates.length; i++) {
  assertEqual(sortedGates[i].level, i, `Gate ${i} has level ${i}`);
}

// ----------------------------------------------------------
// 9. VS20: Objectives Have Required Fields
// ----------------------------------------------------------
console.log("\n--- Objective Completeness (VS20) ---");

for (const obj of SPEC.objectives || []) {
  assertTrue(obj.id.length > 0, `Objective ${obj.id} has id`);
  assertTrue(obj.pillar_id.length > 0, `Objective ${obj.id} has pillar_id`);
  assertTrue(typeof obj.level === "number", `Objective ${obj.id} has level`);
  assertTrue(obj.name.length > 0, `Objective ${obj.id} has name`);
  assertTrue(obj.description.length > 0, `Objective ${obj.id} has description`);
  assertTrue(obj.action_id !== undefined, `Objective ${obj.id} has action_id`);
}

// ----------------------------------------------------------
// 10. Action Completeness
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
// 11. FP&A Content Summary (40-question spec)
// ----------------------------------------------------------
console.log("\n--- Content Summary ---");

const fpaQuestions = SPEC.questions.filter((q) => q.pillar === "fpa");
const criticalQuestions = SPEC.questions.filter((q) => q.is_critical);
const objectives = SPEC.objectives || [];

console.log(`   Pillars: ${SPEC.pillars.length}`);
console.log(`   Objectives: ${objectives.length}`);
console.log(`   Questions: ${SPEC.questions.length}`);
console.log(`   FP&A Questions: ${fpaQuestions.length}`);
console.log(`   Critical Questions: ${criticalQuestions.length}`);
console.log(`   Actions: ${SPEC.actions.length}`);
console.log(`   Maturity Levels: ${SPEC.maturityGates.length}`);

// 40-question FP&A spec assertions
assertTrue(fpaQuestions.length === 40, "FP&A has 40 questions");
assertTrue(criticalQuestions.length === 16, "16 critical questions (L1: 10, L2: 6)");
assertTrue(SPEC.actions.length === 8, "8 actions defined (1 per objective)");
assertTrue(objectives.length === 8, "8 objectives defined (2 per level)");

// ----------------------------------------------------------
// 12. Critical Question Distribution
// ----------------------------------------------------------
console.log("\n--- Critical Question Distribution ---");

const level1Critical = SPEC.questions.filter((q) => q.level === 1 && q.is_critical).length;
const level2Critical = SPEC.questions.filter((q) => q.level === 2 && q.is_critical).length;
const level3Critical = SPEC.questions.filter((q) => q.level === 3 && q.is_critical).length;
const level4Critical = SPEC.questions.filter((q) => q.level === 4 && q.is_critical).length;

assertEqual(level1Critical, 10, "Level 1 has 10 critical questions (100%)");
assertEqual(level2Critical, 6, "Level 2 has 6 critical questions (60%)");
assertEqual(level3Critical, 0, "Level 3 has 0 critical questions");
assertEqual(level4Critical, 0, "Level 4 has 0 critical questions");

// ----------------------------------------------------------
// 13. Question Distribution Per Level
// ----------------------------------------------------------
console.log("\n--- Question Distribution Per Level ---");

const level1Questions = SPEC.questions.filter((q) => q.level === 1).length;
const level2Questions = SPEC.questions.filter((q) => q.level === 2).length;
const level3Questions = SPEC.questions.filter((q) => q.level === 3).length;
const level4Questions = SPEC.questions.filter((q) => q.level === 4).length;

assertEqual(level1Questions, 10, "Level 1 (Emerging) has 10 questions");
assertEqual(level2Questions, 10, "Level 2 (Defined) has 10 questions");
assertEqual(level3Questions, 10, "Level 3 (Managed) has 10 questions");
assertEqual(level4Questions, 10, "Level 4 (Optimized) has 10 questions");

// ----------------------------------------------------------
// 14. Objectives Per Level (VS20)
// ----------------------------------------------------------
console.log("\n--- Objectives Per Level (VS20) ---");

const level1Objectives = objectives.filter((o) => o.level === 1).length;
const level2Objectives = objectives.filter((o) => o.level === 2).length;
const level3Objectives = objectives.filter((o) => o.level === 3).length;
const level4Objectives = objectives.filter((o) => o.level === 4).length;

assertEqual(level1Objectives, 2, "Level 1 has 2 objectives");
assertEqual(level2Objectives, 2, "Level 2 has 2 objectives");
assertEqual(level3Objectives, 2, "Level 3 has 2 objectives");
assertEqual(level4Objectives, 2, "Level 4 has 2 objectives");

// ============================================================
// Summary
// ============================================================

console.log("\n========================================");
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log("========================================\n");

if (failed > 0) {
  process.exit(1);
}
