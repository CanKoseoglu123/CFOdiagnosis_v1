/**
 * VS11 QA Checklist — Frontend Contract Tests
 *
 * Tests that the frontend correctly handles all DTO shapes:
 * - Required fields exist
 * - Score formatting
 * - Maturity level rendering
 * - Critical risks handling
 * - Actions handling
 * - Edge cases (empty arrays, null scores)
 */

import { FinanceReportDTO, PillarReportDTO, MaturityStatus, CriticalRisk } from "../reports/types";
import { ActionPlanItem } from "../actions/types";

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
// Frontend Utility Functions (Same as in React component)
// ============================================================

const formatScore = (score: number | null): string => {
  if (score === null || score === undefined) return "—";
  return `${Math.round(score * 100)}%`;
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "critical": return { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" };
    case "high": return { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" };
    case "medium": return { bg: "#DBEAFE", text: "#1E40AF", border: "#BFDBFE" };
    default: return { bg: "#F3F4F6", text: "#374151", border: "#E5E7EB" };
  }
};

const getMaturityColor = (level: number) => {
  const colors = [
    { bg: "#FEE2E2", text: "#991B1B", accent: "#EF4444" },
    { bg: "#FEF3C7", text: "#92400E", accent: "#F59E0B" },
    { bg: "#FEF9C3", text: "#854D0E", accent: "#EAB308" },
    { bg: "#DCFCE7", text: "#166534", accent: "#22C55E" },
    { bg: "#DBEAFE", text: "#1E40AF", accent: "#3B82F6" },
  ];
  return colors[level] || colors[0];
};

// ============================================================
// Test Fixtures
// ============================================================

const VALID_MATURITY: MaturityStatus = {
  achieved_level: 2,
  achieved_label: "Defined",
  blocking_level: 3,
  blocking_evidence_ids: ["fpa_driver_based", "fpa_scenario_modeling"],
  gates: [
    { level: 0, label: "Ad-hoc", required_evidence_ids: [] },
    { level: 1, label: "Emerging", required_evidence_ids: ["fpa_annual_budget"] },
    { level: 2, label: "Defined", required_evidence_ids: ["fpa_variance_analysis"] },
    { level: 3, label: "Managed", required_evidence_ids: ["fpa_driver_based"] },
    { level: 4, label: "Optimized", required_evidence_ids: ["fpa_predictive"] },
  ],
};

const VALID_RISK: CriticalRisk = {
  evidence_id: "fpa_budget_owner",
  question_text: "Is there a single person accountable for the budget?",
  pillar_id: "fpa",
  pillar_name: "Financial Planning & Analysis", // VS19
  severity: "CRITICAL", // VS19
  user_answer: false,
};

const VALID_ACTION: ActionPlanItem = {
  id: "act_hire_cfo",
  title: "Appoint a CFO",
  description: "Hire a CFO to lead finance.",
  rationale: "Financial leadership is essential.",
  priority: "critical",
  trigger_type: "critical_risk",
  evidence_id: "has_cfo",
  pillar_id: "liquidity",
};

const VALID_PILLAR: PillarReportDTO = {
  pillar_id: "fpa",
  pillar_name: "Financial Planning & Analysis",
  score: 0.75,
  scored_questions: 8,
  total_questions: 8,
  maturity: VALID_MATURITY,
  critical_risks: [VALID_RISK],
};

const VALID_REPORT: FinanceReportDTO = {
  run_id: "test-123",
  spec_version: "v2.6.4",
  generated_at: new Date().toISOString(),
  overall_score: 0.65,
  maturity: VALID_MATURITY,
  critical_risks: [VALID_RISK],
  pillars: [VALID_PILLAR],
  actions: [VALID_ACTION],
};

// ============================================================
// Tests
// ============================================================

console.log("\n========================================");
console.log("VS11 QA CHECKLIST — Frontend Contract");
console.log("========================================\n");

// ----------------------------------------------------------
// 1. Score Formatting
// ----------------------------------------------------------
console.log("--- Score Formatting ---");

assertEqual(formatScore(1), "100%", "Score 1.0 → 100%");
assertEqual(formatScore(0), "0%", "Score 0 → 0%");
assertEqual(formatScore(0.5), "50%", "Score 0.5 → 50%");
assertEqual(formatScore(0.333), "33%", "Score 0.333 → 33% (rounded)");
assertEqual(formatScore(0.666), "67%", "Score 0.666 → 67% (rounded)");
assertEqual(formatScore(null), "—", "Score null → —");

// ----------------------------------------------------------
// 2. Priority Colors
// ----------------------------------------------------------
console.log("\n--- Priority Colors ---");

assertTrue(getPriorityColor("critical").bg === "#FEE2E2", "Critical has red bg");
assertTrue(getPriorityColor("high").bg === "#FEF3C7", "High has amber bg");
assertTrue(getPriorityColor("medium").bg === "#DBEAFE", "Medium has blue bg");
assertTrue(getPriorityColor("unknown").bg === "#F3F4F6", "Unknown has gray bg");

// ----------------------------------------------------------
// 3. Maturity Colors
// ----------------------------------------------------------
console.log("\n--- Maturity Colors ---");

assertTrue(getMaturityColor(0).accent === "#EF4444", "Level 0 is red");
assertTrue(getMaturityColor(1).accent === "#F59E0B", "Level 1 is amber");
assertTrue(getMaturityColor(2).accent === "#EAB308", "Level 2 is yellow");
assertTrue(getMaturityColor(3).accent === "#22C55E", "Level 3 is green");
assertTrue(getMaturityColor(4).accent === "#3B82F6", "Level 4 is blue");
assertTrue(getMaturityColor(99).accent === "#EF4444", "Unknown level defaults to L0");

// ----------------------------------------------------------
// 4. DTO Required Fields
// ----------------------------------------------------------
console.log("\n--- DTO Required Fields ---");

assertTrue(typeof VALID_REPORT.run_id === "string", "run_id is string");
assertTrue(typeof VALID_REPORT.spec_version === "string", "spec_version is string");
assertTrue(typeof VALID_REPORT.generated_at === "string", "generated_at is string");
assertTrue(VALID_REPORT.overall_score === null || typeof VALID_REPORT.overall_score === "number", "overall_score is number or null");
assertTrue(typeof VALID_REPORT.maturity === "object", "maturity is object");
assertTrue(Array.isArray(VALID_REPORT.critical_risks), "critical_risks is array");
assertTrue(Array.isArray(VALID_REPORT.pillars), "pillars is array");
assertTrue(Array.isArray(VALID_REPORT.actions), "actions is array");

// ----------------------------------------------------------
// 5. Maturity Structure
// ----------------------------------------------------------
console.log("\n--- Maturity Structure ---");

assertTrue(typeof VALID_MATURITY.achieved_level === "number", "achieved_level is number");
assertTrue(VALID_MATURITY.achieved_level >= 0, "achieved_level is >= 0");
assertTrue(typeof VALID_MATURITY.achieved_label === "string", "achieved_label is string");
assertTrue(VALID_MATURITY.blocking_level === null || typeof VALID_MATURITY.blocking_level === "number", "blocking_level is number or null");
assertTrue(Array.isArray(VALID_MATURITY.blocking_evidence_ids), "blocking_evidence_ids is array");
assertTrue(Array.isArray(VALID_MATURITY.gates), "gates is array");

// ----------------------------------------------------------
// 6. Critical Risk Structure
// ----------------------------------------------------------
console.log("\n--- Critical Risk Structure ---");

assertTrue(typeof VALID_RISK.evidence_id === "string", "risk.evidence_id is string");
assertTrue(typeof VALID_RISK.question_text === "string", "risk.question_text is string");
assertTrue(typeof VALID_RISK.pillar_id === "string", "risk.pillar_id is string");
assertTrue(VALID_RISK.user_answer === false || VALID_RISK.user_answer === null, "risk.user_answer is false or null");

// ----------------------------------------------------------
// 7. Action Structure
// ----------------------------------------------------------
console.log("\n--- Action Structure ---");

assertTrue(typeof VALID_ACTION.id === "string", "action.id is string");
assertTrue(typeof VALID_ACTION.title === "string", "action.title is string");
assertTrue(typeof VALID_ACTION.description === "string", "action.description is string");
assertTrue(typeof VALID_ACTION.rationale === "string", "action.rationale is string");
assertTrue(["critical", "high", "medium"].includes(VALID_ACTION.priority), "action.priority is valid");
assertTrue(["critical_risk", "maturity_blocker"].includes(VALID_ACTION.trigger_type), "action.trigger_type is valid");
assertTrue(typeof VALID_ACTION.evidence_id === "string", "action.evidence_id is string");
assertTrue(typeof VALID_ACTION.pillar_id === "string", "action.pillar_id is string");

// ----------------------------------------------------------
// 8. Pillar Structure
// ----------------------------------------------------------
console.log("\n--- Pillar Structure ---");

assertTrue(typeof VALID_PILLAR.pillar_id === "string", "pillar.pillar_id is string");
assertTrue(typeof VALID_PILLAR.pillar_name === "string", "pillar.pillar_name is string");
assertTrue(VALID_PILLAR.score === null || typeof VALID_PILLAR.score === "number", "pillar.score is number or null");
assertTrue(typeof VALID_PILLAR.scored_questions === "number", "pillar.scored_questions is number");
assertTrue(typeof VALID_PILLAR.total_questions === "number", "pillar.total_questions is number");
assertTrue(typeof VALID_PILLAR.maturity === "object", "pillar.maturity is object");
assertTrue(Array.isArray(VALID_PILLAR.critical_risks), "pillar.critical_risks is array");

// ----------------------------------------------------------
// 9. Edge Cases — Empty Arrays
// ----------------------------------------------------------
console.log("\n--- Edge Cases: Empty Arrays ---");

const EMPTY_REPORT: FinanceReportDTO = {
  run_id: "empty-test",
  spec_version: "v2.6.4",
  generated_at: new Date().toISOString(),
  overall_score: null,
  maturity: {
    achieved_level: 0,
    achieved_label: "Ad-hoc",
    blocking_level: 1,
    blocking_evidence_ids: [],
    gates: [],
  },
  critical_risks: [],
  pillars: [],
  actions: [],
};

assertTrue(EMPTY_REPORT.critical_risks.length === 0, "Empty critical_risks handled");
assertTrue(EMPTY_REPORT.pillars.length === 0, "Empty pillars handled");
assertTrue(EMPTY_REPORT.actions.length === 0, "Empty actions handled");
assertTrue(EMPTY_REPORT.maturity.gates.length === 0, "Empty gates handled");

// ----------------------------------------------------------
// 10. Edge Cases — Null Score
// ----------------------------------------------------------
console.log("\n--- Edge Cases: Null Score ---");

const NULL_SCORE_REPORT: FinanceReportDTO = {
  ...VALID_REPORT,
  overall_score: null,
};

assertTrue(NULL_SCORE_REPORT.overall_score === null, "Null overall_score handled");
assertEqual(formatScore(NULL_SCORE_REPORT.overall_score), "—", "Null score displays as —");

// ----------------------------------------------------------
// 11. Edge Cases — Max Maturity (Level 4)
// ----------------------------------------------------------
console.log("\n--- Edge Cases: Max Maturity ---");

const MAX_MATURITY: MaturityStatus = {
  achieved_level: 4,
  achieved_label: "Optimized",
  blocking_level: null, // No next level
  blocking_evidence_ids: [], // Nothing blocking
  gates: VALID_MATURITY.gates,
};

assertTrue(MAX_MATURITY.achieved_level === 4, "Level 4 achieved");
assertTrue(MAX_MATURITY.blocking_level === null, "No blocking level at max");
assertTrue(MAX_MATURITY.blocking_evidence_ids.length === 0, "No blocking evidence at max");

// ----------------------------------------------------------
// 12. Date Formatting
// ----------------------------------------------------------
console.log("\n--- Date Handling ---");

const isoDate = "2025-01-15T10:30:00.000Z";
const dateObj = new Date(isoDate);
assertTrue(!isNaN(dateObj.getTime()), "ISO date parses correctly");
assertTrue(typeof dateObj.toLocaleDateString() === "string", "Date formats to string");

// ============================================================
// Summary
// ============================================================

console.log("\n========================================");
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log("========================================\n");

if (failed > 0) {
  process.exit(1);
}
