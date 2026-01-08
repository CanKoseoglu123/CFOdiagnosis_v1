/**
 * VS-L3L4 QA Checklist — New L3/L4 Questions Tests
 *
 * Tests the 12 new L3/L4 questions added to Budget Discipline,
 * Financial Controls, and Performance Monitoring objectives.
 *
 * 10 Normal Cases:
 * - Test maturity progression through all levels
 * - Test objective-level calculations with new questions
 *
 * 10 Edge Cases:
 * - Boundary conditions, partial answers, gaps in levels
 */

import { computeAchievedLevels } from "../benchmark/achievedLevels";
import { loadQuestions, loadPractices } from "../specs/loader";
import { SpecRegistry } from "../specs/registry";

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
// Test Data Setup
// ============================================================

const testSpec = SpecRegistry.getDefault();
const questions = loadQuestions();
const practices = loadPractices();

// New question IDs
const NEW_QUESTIONS = {
  // Budget Discipline
  policy_l3: "fpa_l3_q80",
  policy_l4: "fpa_l4_q80",
  ownership_l3: "fpa_l3_q81",
  ownership_l4: "fpa_l4_q81",
  // Financial Controls
  approval_l3: "fpa_l3_q82",
  approval_l4: "fpa_l4_q82",
  monthend_l3: "fpa_l3_q83",
  monthend_l4: "fpa_l4_q83",
  // Performance Monitoring
  reporting_l3: "fpa_l3_q84",
  reporting_l4: "fpa_l4_q84",
  variance_l3: "fpa_l3_q85",
  variance_l4: "fpa_l4_q85",
};

// Helper to get all question IDs for an objective
function getQuestionIdsForObjective(objectiveId: string): string[] {
  const practiceIds = practices
    .filter((p) => p.objective_id === objectiveId)
    .map((p) => p.id);
  return questions
    .filter((q) => practiceIds.includes(q.practice_id))
    .map((q) => q.id);
}

// Helper to get all question IDs for a practice
function getQuestionIdsForPractice(practiceId: string): string[] {
  return questions.filter((q) => q.practice_id === practiceId).map((q) => q.id);
}

// Helper to get questions up to a specific level for a practice
function getQuestionsUpToLevel(practiceId: string, maxLevel: number): string[] {
  return questions
    .filter((q) => q.practice_id === practiceId && q.maturity_level <= maxLevel)
    .map((q) => q.id);
}

// Helper to create inputs with all TRUE for given question IDs
function allTrue(questionIds: string[]): Array<{ question_id: string; value: boolean }> {
  return questionIds.map((id) => ({ question_id: id, value: true }));
}

// Helper to create inputs with all FALSE for given question IDs
function allFalse(questionIds: string[]): Array<{ question_id: string; value: boolean }> {
  return questionIds.map((id) => ({ question_id: id, value: false }));
}

// ============================================================
// Tests
// ============================================================

console.log("\n========================================");
console.log("VS-L3L4 QA CHECKLIST — New Questions Tests");
console.log("========================================\n");

// ----------------------------------------------------------
// NORMAL CASES (10 tests)
// ----------------------------------------------------------
console.log("--- NORMAL CASES ---\n");

// NC1: New L3 questions exist in correct practices
console.log("NC1: New L3 questions are linked to correct practices");
const policyQ3 = questions.find((q) => q.id === NEW_QUESTIONS.policy_l3);
assertEqual(policyQ3?.practice_id, "prac_policy_&_governance", "L3 Policy question in correct practice");
assertEqual(policyQ3?.maturity_level, 3, "L3 Policy question has level 3");

// NC2: New L4 questions exist in correct practices
console.log("\nNC2: New L4 questions are linked to correct practices");
const policyQ4 = questions.find((q) => q.id === NEW_QUESTIONS.policy_l4);
assertEqual(policyQ4?.practice_id, "prac_policy_&_governance", "L4 Policy question in correct practice");
assertEqual(policyQ4?.maturity_level, 4, "L4 Policy question has level 4");

// NC3: Budget Discipline can now reach L4
console.log("\nNC3: Budget Discipline can reach L4 with all TRUE");
const budgetQs = getQuestionIdsForObjective("obj_budget_discipline");
const budgetResult = computeAchievedLevels(testSpec, allTrue(budgetQs));
assertEqual(budgetResult.objectiveLevels["obj_budget_discipline"], 4, "Budget Discipline reaches L4");

// NC4: Financial Controls can now reach L4
console.log("\nNC4: Financial Controls can reach L4 with all TRUE");
const controlsQs = getQuestionIdsForObjective("obj_financial_controls");
const controlsResult = computeAchievedLevels(testSpec, allTrue(controlsQs));
assertEqual(controlsResult.objectiveLevels["obj_financial_controls"], 4, "Financial Controls reaches L4");

// NC5: Performance Monitoring can now reach L4
console.log("\nNC5: Performance Monitoring can reach L4 with all TRUE");
const monitoringQs = getQuestionIdsForObjective("obj_performance_monitoring");
const monitoringResult = computeAchievedLevels(testSpec, allTrue(monitoringQs));
assertEqual(monitoringResult.objectiveLevels["obj_performance_monitoring"], 4, "Performance Monitoring reaches L4");

// NC6: Practice Policy & Governance reaches L4
console.log("\nNC6: Policy & Governance practice reaches L4");
const policyQs = getQuestionIdsForPractice("prac_policy_&_governance");
const policyResult = computeAchievedLevels(testSpec, allTrue(policyQs));
assertEqual(policyResult.practiceLevels["prac_policy_&_governance"], 4, "Policy & Governance reaches L4");

// NC7: All TRUE through L2 only → L2 achieved
console.log("\nNC7: Answering only L1/L2 TRUE gives L2");
const approvalL2Qs = getQuestionsUpToLevel("prac_approval_workflows", 2);
const approvalL2Result = computeAchievedLevels(testSpec, allTrue(approvalL2Qs));
assertEqual(approvalL2Result.practiceLevels["prac_approval_workflows"], 2, "Approval Workflows at L2 with L1/L2 TRUE");

// NC8: All TRUE through L3 only → L3 achieved
console.log("\nNC8: Answering L1/L2/L3 TRUE gives L3");
const approvalL3Qs = getQuestionsUpToLevel("prac_approval_workflows", 3);
const approvalL3Result = computeAchievedLevels(testSpec, allTrue(approvalL3Qs));
assertEqual(approvalL3Result.practiceLevels["prac_approval_workflows"], 3, "Approval Workflows at L3 with L1-L3 TRUE");

// NC9: Month-End Rigor progresses correctly through levels
console.log("\nNC9: Month-End Rigor level progression");
const monthendQs = getQuestionIdsForPractice("prac_month_end_rigor");
const monthendAllTrue = computeAchievedLevels(testSpec, allTrue(monthendQs));
assertEqual(monthendAllTrue.practiceLevels["prac_month_end_rigor"], 4, "Month-End Rigor reaches L4 with all TRUE");

// NC10: Management Reporting progresses correctly
console.log("\nNC10: Management Reporting level progression");
const reportingQs = getQuestionIdsForPractice("prac_management_reporting");
const reportingAllTrue = computeAchievedLevels(testSpec, allTrue(reportingQs));
assertEqual(reportingAllTrue.practiceLevels["prac_management_reporting"], 4, "Management Reporting reaches L4 with all TRUE");

// ----------------------------------------------------------
// EDGE CASES (10 tests)
// ----------------------------------------------------------
console.log("\n--- EDGE CASES ---\n");

// EC1: No answers → L0
console.log("EC1: No answers results in L0");
const noAnswersResult = computeAchievedLevels(testSpec, []);
assertEqual(noAnswersResult.objectiveLevels["obj_budget_discipline"], 0, "Budget Discipline L0 with no answers");

// EC2: All FALSE → L0
console.log("\nEC2: All FALSE answers results in L0");
const allFalseResult = computeAchievedLevels(testSpec, allFalse(budgetQs));
assertEqual(allFalseResult.objectiveLevels["obj_budget_discipline"], 0, "Budget Discipline L0 with all FALSE");

// EC3: L1 TRUE, L2 FALSE → L1 (blocked at L2)
console.log("\nEC3: L1 TRUE, L2 FALSE → blocked at L2");
const approvalL1Qs = getQuestionsUpToLevel("prac_approval_workflows", 1);
const approvalL2Only = questions
  .filter((q) => q.practice_id === "prac_approval_workflows" && q.maturity_level === 2)
  .map((q) => q.id);
const mixedInputs = [...allTrue(approvalL1Qs), ...allFalse(approvalL2Only)];
const mixedResult = computeAchievedLevels(testSpec, mixedInputs);
assertEqual(mixedResult.practiceLevels["prac_approval_workflows"], 1, "Blocked at L2 when L2 is FALSE");

// EC4: Gap in answers (L2 missing, L3 TRUE) → L1 (practice has no L1 questions)
console.log("\nEC4: Gap in answers (skip L2, L3 TRUE) → L1 (no L1 questions in practice)");
const varianceL3Qs = questions
  .filter((q) => q.practice_id === "prac_variance_investigation" && q.maturity_level === 3)
  .map((q) => q.id);
// Answer L3 TRUE but not L2 - practice has no L1 questions so L1 is auto-passed
const gapInputs = [...allTrue(varianceL3Qs)];
const gapResult = computeAchievedLevels(testSpec, gapInputs);
assertEqual(gapResult.practiceLevels["prac_variance_investigation"], 1, "Passes L1 (no L1 qs), blocked at L2");

// EC5: Only new L4 question TRUE, rest unanswered → L1 (practice has no L1 questions)
console.log("\nEC5: Only L4 TRUE, rest unanswered → L1 (no L1 questions)");
const onlyL4Inputs = [{ question_id: NEW_QUESTIONS.policy_l4, value: true }];
const onlyL4Result = computeAchievedLevels(testSpec, onlyL4Inputs);
assertEqual(onlyL4Result.practiceLevels["prac_policy_&_governance"], 1, "Passes L1 (no L1 qs), blocked at L2");

// EC6: All TRUE except one L3 → L2 (blocked at L3)
console.log("\nEC6: All TRUE except one L3 → blocked at L3");
const monthendAllQs = getQuestionIdsForPractice("prac_month_end_rigor");
const monthendInputs = allTrue(monthendAllQs).map((input) =>
  input.question_id === NEW_QUESTIONS.monthend_l3 ? { ...input, value: false } : input
);
const blockedL3Result = computeAchievedLevels(testSpec, monthendInputs);
assertEqual(blockedL3Result.practiceLevels["prac_month_end_rigor"], 2, "Blocked at L3 when L3 question is FALSE");

// EC7: All TRUE except one L4 → L3 (blocked at L4)
console.log("\nEC7: All TRUE except L4 → L3");
const reportingAllQs = getQuestionIdsForPractice("prac_management_reporting");
const reportingInputs = allTrue(reportingAllQs).map((input) =>
  input.question_id === NEW_QUESTIONS.reporting_l4 ? { ...input, value: false } : input
);
const blockedL4Result = computeAchievedLevels(testSpec, reportingInputs);
assertEqual(blockedL4Result.practiceLevels["prac_management_reporting"], 3, "Blocked at L4 when L4 question is FALSE");

// EC8: Mixed TRUE/FALSE within same level → blocked
console.log("\nEC8: Mixed answers within same level → blocked");
const ownershipQs = getQuestionIdsForPractice("prac_budget_ownership");
const ownershipL1Qs = questions
  .filter((q) => q.practice_id === "prac_budget_ownership" && q.maturity_level === 1)
  .map((q) => q.id);
// Answer only first L1 question TRUE
const partialL1Inputs = [{ question_id: ownershipL1Qs[0], value: true }];
const partialL1Result = computeAchievedLevels(testSpec, partialL1Inputs);
assertEqual(partialL1Result.practiceLevels["prac_budget_ownership"], 0, "Partial L1 answers → L0");

// EC9: Objective with multiple practices - one practice blocks
console.log("\nEC9: Objective blocked when one practice is behind");
const budgetDisciplineQs = getQuestionIdsForObjective("obj_budget_discipline");
// Answer all TRUE except one practice's questions
const policyPracticeQs = getQuestionIdsForPractice("prac_policy_&_governance");
const partialObjectiveInputs = allTrue(budgetDisciplineQs).filter(
  (input) => !policyPracticeQs.includes(input.question_id)
);
const partialObjectiveResult = computeAchievedLevels(testSpec, partialObjectiveInputs);
assertTrue(
  partialObjectiveResult.objectiveLevels["obj_budget_discipline"] < 4,
  "Objective blocked when practice has no answers"
);

// EC10: Verify new questions have required schema fields
console.log("\nEC10: New questions have all required fields");
const newQuestionIds = Object.values(NEW_QUESTIONS);
const newQuestionObjs = questions.filter((q) => newQuestionIds.includes(q.id));
const allHaveRequiredFields = newQuestionObjs.every(
  (q) =>
    q.id &&
    q.practice_id &&
    q.text &&
    q.help &&
    q.maturity_level &&
    q.initiative_id &&
    q.impact &&
    q.complexity &&
    q.expert_action?.title &&
    q.expert_action?.recommendation &&
    q.expert_action?.type
);
assertTrue(allHaveRequiredFields, "All 12 new questions have required schema fields");

// ============================================================
// Summary
// ============================================================

console.log("\n========================================");
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log("========================================\n");

if (failed > 0) {
  process.exit(1);
}
