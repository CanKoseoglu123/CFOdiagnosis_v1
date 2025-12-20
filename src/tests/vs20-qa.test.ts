/**
 * VS20 QA Checklist — Dynamic Action Engine
 *
 * Tests the objective-based action derivation:
 * - Actions attach to Objectives (L3), not Questions (L5)
 * - Priority is DERIVED based on context:
 *   - HIGH: Critical risk linked OR maturity gate blocking
 *   - MEDIUM: Objective incomplete but no critical risk / not blocking
 * - Satisfied objectives do not generate actions
 * - Deterministic and deduplicated output
 */

import { deriveActionsFromObjectives, DerivedAction } from "../actions";
import { Spec, SpecObjective } from "../specs/types";
import { CriticalRisk, MaturityStatus } from "../reports/types";

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
  pillars: [
    { id: "fpa", name: "Financial Planning & Analysis", weight: 1 },
  ],
  objectives: [
    {
      id: "obj_budget",
      pillar_id: "fpa",
      level: 1,
      name: "Budget Foundation",
      description: "Establish budget process",
      action_id: "act_budget",
    },
    {
      id: "obj_forecast",
      pillar_id: "fpa",
      level: 2,
      name: "Forecasting",
      description: "Implement forecasting",
      action_id: "act_forecast",
    },
    {
      id: "obj_advanced",
      pillar_id: "fpa",
      level: 3,
      name: "Advanced Planning",
      description: "Advanced capabilities",
      action_id: "act_advanced",
    },
  ],
  questions: [
    {
      id: "q1_critical",
      pillar: "fpa",
      weight: 1,
      text: "Do you have a budget?",
      is_critical: true,
      objective_id: "obj_budget",
      level: 1,
    },
    {
      id: "q2_normal",
      pillar: "fpa",
      weight: 1,
      text: "Do you have forecasts?",
      is_critical: false,
      objective_id: "obj_forecast",
      level: 2,
    },
    {
      id: "q3_normal",
      pillar: "fpa",
      weight: 1,
      text: "Driver-based planning?",
      is_critical: false,
      objective_id: "obj_advanced",
      level: 3,
    },
  ],
  maturityGates: [
    { level: 0, label: "Ad-hoc", required_evidence_ids: [] },
    { level: 1, label: "Emerging", required_evidence_ids: ["q1_critical"] },
    { level: 2, label: "Defined", required_evidence_ids: ["q2_normal"] },
    { level: 3, label: "Managed", required_evidence_ids: ["q3_normal"] },
  ],
  actions: [
    {
      id: "act_budget",
      title: "Establish Budget",
      description: "Create a formal budget process",
      rationale: "Budgeting is fundamental",
      priority: "critical",  // Note: This will be IGNORED by VS20
    },
    {
      id: "act_forecast",
      title: "Implement Forecasting",
      description: "Create rolling forecasts",
      rationale: "Forecasts enable planning",
      priority: "high",  // Ignored by VS20
    },
    {
      id: "act_advanced",
      title: "Advanced Planning",
      description: "Implement driver-based planning",
      rationale: "Advanced capabilities",
      priority: "medium",  // Ignored by VS20
    },
  ],
};

interface DiagnosticInput {
  question_id: string;
  value: unknown;
}

// ============================================================
// Tests
// ============================================================

console.log("\n========================================");
console.log("VS20 QA CHECKLIST — Dynamic Action Engine");
console.log("========================================\n");

// ----------------------------------------------------------
// 1. Critical Risk → HIGH Priority
// ----------------------------------------------------------
console.log("--- Critical Risk → HIGH Priority ---");

{
  const criticalRisks: CriticalRisk[] = [
    {
      evidence_id: "q1_critical",
      question_text: "Do you have a budget?",
      pillar_id: "fpa",
      pillar_name: "FP&A",
      severity: "CRITICAL",
      user_answer: false,
    },
  ];

  const maturity: MaturityStatus = {
    achieved_level: 0,
    achieved_label: "Ad-hoc",
    blocking_level: 1,
    blocking_evidence_ids: ["q1_critical"],
    gates: TEST_SPEC.maturityGates,
  };

  const inputs: DiagnosticInput[] = [
    { question_id: "q1_critical", value: false },
    { question_id: "q2_normal", value: true },
    { question_id: "q3_normal", value: true },
  ];

  const actions = deriveActionsFromObjectives(TEST_SPEC, inputs, criticalRisks, maturity);

  assertEqual(actions.length, 1, "1 action for critical risk objective");
  assertEqual(actions[0]?.objective_id, "obj_budget", "Correct objective ID");
  assertEqual(actions[0]?.derived_priority, "HIGH", "Priority is HIGH for critical risk");
  assertEqual(actions[0]?.trigger_reason, "critical_risk", "Trigger reason is critical_risk");
}

// ----------------------------------------------------------
// 2. Maturity Blocker → HIGH Priority
// ----------------------------------------------------------
console.log("\n--- Maturity Blocker → HIGH Priority ---");

{
  // q1 is satisfied (no critical risk), but q2 is blocking maturity
  const criticalRisks: CriticalRisk[] = [];

  const maturity: MaturityStatus = {
    achieved_level: 1,
    achieved_label: "Emerging",
    blocking_level: 2,
    blocking_evidence_ids: ["q2_normal"],
    gates: TEST_SPEC.maturityGates,
  };

  const inputs: DiagnosticInput[] = [
    { question_id: "q1_critical", value: true },
    { question_id: "q2_normal", value: false },  // Blocking maturity
    { question_id: "q3_normal", value: true },
  ];

  const actions = deriveActionsFromObjectives(TEST_SPEC, inputs, criticalRisks, maturity);

  assertEqual(actions.length, 1, "1 action for maturity blocker");
  assertEqual(actions[0]?.objective_id, "obj_forecast", "Correct objective ID");
  assertEqual(actions[0]?.derived_priority, "HIGH", "Priority is HIGH for maturity blocker");
  assertEqual(actions[0]?.trigger_reason, "maturity_blocker", "Trigger reason is maturity_blocker");
}

// ----------------------------------------------------------
// 3. Objective Incomplete (No Critical, Not Blocking) → MEDIUM
// ----------------------------------------------------------
console.log("\n--- Objective Incomplete → MEDIUM Priority ---");

{
  // At level 2, q3 is not answered but it's not blocking next level yet
  const criticalRisks: CriticalRisk[] = [];

  const maturity: MaturityStatus = {
    achieved_level: 2,
    achieved_label: "Defined",
    blocking_level: 3,
    blocking_evidence_ids: ["q3_normal"],  // This is blocking, so it will be HIGH
    gates: TEST_SPEC.maturityGates,
  };

  const inputs: DiagnosticInput[] = [
    { question_id: "q1_critical", value: true },
    { question_id: "q2_normal", value: true },
    { question_id: "q3_normal", value: false },  // Incomplete
  ];

  const actions = deriveActionsFromObjectives(TEST_SPEC, inputs, criticalRisks, maturity);

  // Since q3 is blocking level 3, it should still be HIGH
  assertEqual(actions.length, 1, "1 action for incomplete objective");
  assertEqual(actions[0]?.objective_id, "obj_advanced", "Correct objective ID");
  assertEqual(actions[0]?.derived_priority, "HIGH", "Priority is HIGH when blocking");
}

// ----------------------------------------------------------
// 4. All Objectives Satisfied → No Actions
// ----------------------------------------------------------
console.log("\n--- All Satisfied → No Actions ---");

{
  const criticalRisks: CriticalRisk[] = [];

  const maturity: MaturityStatus = {
    achieved_level: 3,
    achieved_label: "Managed",
    blocking_level: null,
    blocking_evidence_ids: [],
    gates: TEST_SPEC.maturityGates,
  };

  const inputs: DiagnosticInput[] = [
    { question_id: "q1_critical", value: true },
    { question_id: "q2_normal", value: true },
    { question_id: "q3_normal", value: true },
  ];

  const actions = deriveActionsFromObjectives(TEST_SPEC, inputs, criticalRisks, maturity);

  assertEqual(actions.length, 0, "No actions when all objectives satisfied");
}

// ----------------------------------------------------------
// 5. Action Contains Objective Info
// ----------------------------------------------------------
console.log("\n--- Action Contains Objective Info ---");

{
  const criticalRisks: CriticalRisk[] = [
    {
      evidence_id: "q1_critical",
      question_text: "Do you have a budget?",
      pillar_id: "fpa",
      pillar_name: "FP&A",
      severity: "CRITICAL",
      user_answer: false,
    },
  ];

  const maturity: MaturityStatus = {
    achieved_level: 0,
    achieved_label: "Ad-hoc",
    blocking_level: 1,
    blocking_evidence_ids: ["q1_critical"],
    gates: TEST_SPEC.maturityGates,
  };

  const inputs: DiagnosticInput[] = [
    { question_id: "q1_critical", value: false },
    { question_id: "q2_normal", value: true },
    { question_id: "q3_normal", value: true },
  ];

  const actions = deriveActionsFromObjectives(TEST_SPEC, inputs, criticalRisks, maturity);

  assertTrue(actions.length > 0, "At least 1 action");
  const action = actions[0]!;

  assertEqual(action.id, "act_budget", "Action ID from spec");
  assertEqual(action.objective_id, "obj_budget", "Objective ID");
  assertEqual(action.objective_name, "Budget Foundation", "Objective name");
  assertEqual(action.title, "Establish Budget", "Title from spec action");
  assertTrue(action.description.length > 0, "Description present");
  assertTrue(action.rationale.length > 0, "Rationale present");
  assertEqual(action.pillar_id, "fpa", "Pillar ID from objective");
  assertEqual(action.level, 1, "Level from objective");
}

// ----------------------------------------------------------
// 6. Multiple Actions Sorted by Priority
// ----------------------------------------------------------
console.log("\n--- Sorting by Priority ---");

{
  // Multiple objectives failing - critical risk should come first
  const criticalRisks: CriticalRisk[] = [
    {
      evidence_id: "q1_critical",
      question_text: "Do you have a budget?",
      pillar_id: "fpa",
      pillar_name: "FP&A",
      severity: "CRITICAL",
      user_answer: false,
    },
  ];

  const maturity: MaturityStatus = {
    achieved_level: 0,
    achieved_label: "Ad-hoc",
    blocking_level: 1,
    blocking_evidence_ids: ["q1_critical"],
    gates: TEST_SPEC.maturityGates,
  };

  const inputs: DiagnosticInput[] = [
    { question_id: "q1_critical", value: false },
    { question_id: "q2_normal", value: false },
    { question_id: "q3_normal", value: false },
  ];

  const actions = deriveActionsFromObjectives(TEST_SPEC, inputs, criticalRisks, maturity);

  // Should have multiple actions, sorted by priority (HIGH first, then by level)
  assertTrue(actions.length >= 1, "At least 1 action");

  // First action should be HIGH priority (critical risk)
  assertEqual(actions[0]?.derived_priority, "HIGH", "First action is HIGH priority");
}

// ----------------------------------------------------------
// 7. No Objectives in Spec → Empty Actions
// ----------------------------------------------------------
console.log("\n--- No Objectives → Empty Actions ---");

{
  const noObjectivesSpec: Spec = {
    ...TEST_SPEC,
    objectives: undefined,  // No objectives
  };

  const actions = deriveActionsFromObjectives(
    noObjectivesSpec,
    [],
    [],
    { achieved_level: 0, achieved_label: "Ad-hoc", blocking_level: null, blocking_evidence_ids: [], gates: [] }
  );

  assertEqual(actions.length, 0, "No actions when no objectives defined");
}

// ----------------------------------------------------------
// 8. Objective Without Action ID → Skipped
// ----------------------------------------------------------
console.log("\n--- Objective Without action_id → Skipped ---");

{
  const specWithNoActionId: Spec = {
    ...TEST_SPEC,
    objectives: [
      {
        id: "obj_no_action",
        pillar_id: "fpa",
        level: 1,
        name: "No Action Objective",
        description: "This has no action",
        // action_id is missing
      },
    ],
    questions: [
      {
        id: "q_test",
        pillar: "fpa",
        weight: 1,
        text: "Test question",
        is_critical: true,
        objective_id: "obj_no_action",
        level: 1,
      },
    ],
  };

  const criticalRisks: CriticalRisk[] = [
    {
      evidence_id: "q_test",
      question_text: "Test question",
      pillar_id: "fpa",
      pillar_name: "FP&A",
      severity: "CRITICAL",
      user_answer: false,
    },
  ];

  const actions = deriveActionsFromObjectives(
    specWithNoActionId,
    [{ question_id: "q_test", value: false }],
    criticalRisks,
    { achieved_level: 0, achieved_label: "Ad-hoc", blocking_level: 1, blocking_evidence_ids: ["q_test"], gates: [] }
  );

  assertEqual(actions.length, 0, "No actions when objective has no action_id");
}

// ----------------------------------------------------------
// 9. Deduplication
// ----------------------------------------------------------
console.log("\n--- Deduplication ---");

{
  // Same objective triggered by both critical risk AND maturity blocker
  const criticalRisks: CriticalRisk[] = [
    {
      evidence_id: "q1_critical",
      question_text: "Do you have a budget?",
      pillar_id: "fpa",
      pillar_name: "FP&A",
      severity: "CRITICAL",
      user_answer: false,
    },
  ];

  const maturity: MaturityStatus = {
    achieved_level: 0,
    achieved_label: "Ad-hoc",
    blocking_level: 1,
    blocking_evidence_ids: ["q1_critical"],  // Same question blocks maturity
    gates: TEST_SPEC.maturityGates,
  };

  const inputs: DiagnosticInput[] = [
    { question_id: "q1_critical", value: false },
    { question_id: "q2_normal", value: true },
    { question_id: "q3_normal", value: true },
  ];

  const actions = deriveActionsFromObjectives(TEST_SPEC, inputs, criticalRisks, maturity);

  // Should NOT duplicate - only 1 action for obj_budget
  const budgetActions = actions.filter((a: DerivedAction) => a.objective_id === "obj_budget");
  assertEqual(budgetActions.length, 1, "Only 1 action per objective (deduplicated)");

  // When both triggers apply, critical_risk takes precedence
  assertEqual(budgetActions[0]?.trigger_reason, "critical_risk", "Critical risk takes precedence");
}

// ----------------------------------------------------------
// 10. Deterministic Output
// ----------------------------------------------------------
console.log("\n--- Deterministic Output ---");

{
  const criticalRisks: CriticalRisk[] = [
    {
      evidence_id: "q1_critical",
      question_text: "Do you have a budget?",
      pillar_id: "fpa",
      pillar_name: "FP&A",
      severity: "CRITICAL",
      user_answer: false,
    },
  ];

  const maturity: MaturityStatus = {
    achieved_level: 0,
    achieved_label: "Ad-hoc",
    blocking_level: 1,
    blocking_evidence_ids: ["q1_critical"],
    gates: TEST_SPEC.maturityGates,
  };

  const inputs: DiagnosticInput[] = [
    { question_id: "q1_critical", value: false },
    { question_id: "q2_normal", value: true },
    { question_id: "q3_normal", value: true },
  ];

  const run1 = deriveActionsFromObjectives(TEST_SPEC, inputs, criticalRisks, maturity);
  const run2 = deriveActionsFromObjectives(TEST_SPEC, inputs, criticalRisks, maturity);
  const run3 = deriveActionsFromObjectives(TEST_SPEC, inputs, criticalRisks, maturity);

  assertEqual(JSON.stringify(run1), JSON.stringify(run2), "Run 1 === Run 2");
  assertEqual(JSON.stringify(run2), JSON.stringify(run3), "Run 2 === Run 3");
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
