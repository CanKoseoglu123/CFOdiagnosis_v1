// src/reports/builder.ts
// VS6/VS7/VS8/VS19 — Assembles Finance Report DTO from VS5 scores + spec
// Includes maturity calculation (VS7), actions derivation (VS8), and critical risks (VS19)

import { Spec } from "../specs/types";
import {
  FinanceReportDTO,
  PillarReportDTO,
  MaturityStatus,
  MaturityGate,
  CriticalRisk,
} from "./types";
import { AggregateResult } from "../results/aggregate";
import { evaluateMaturity } from "../maturity";
import { deriveActions } from "../actions";
import { deriveCriticalRisks as deriveRisksFromEngine } from "../risks";

// ------------------------------------------------------------------
// Input Types
// ------------------------------------------------------------------

export interface DiagnosticInput {
  question_id: string;
  value: unknown;
}

export interface BuildReportInput {
  run_id: string;
  spec: Spec;
  aggregateResult: AggregateResult; // From VS5
  inputs: DiagnosticInput[];        // Raw user answers
}

// ------------------------------------------------------------------
// Main Builder (Pure Function)
// ------------------------------------------------------------------

export function buildReport(input: BuildReportInput): FinanceReportDTO {
  const { run_id, spec, aggregateResult, inputs } = input;

  // Build input lookup map
  const inputMap = new Map<string, unknown>(
    inputs.map((i) => [i.question_id, i.value])
  );

  // Build gates array for maturity engine
  const gates: MaturityGate[] = spec.maturityGates.map((gate) => ({
    level: gate.level,
    label: gate.label,
    required_evidence_ids: gate.required_evidence_ids,
  }));

  // VS19: Derive all critical risks using the new engine
  // Philosophy: "Silence on a critical control is a risk"
  const engineRisks = deriveRisksFromEngine(inputs, spec);

  // Map engine risks to report format (add user_answer for backward compat)
  const allCriticalRisks: CriticalRisk[] = engineRisks.map((risk) => ({
    evidence_id: risk.questionId,
    question_text: risk.questionText,
    pillar_id: risk.pillarId,
    pillar_name: risk.pillarName,
    severity: risk.severity,
    user_answer: inputMap.get(risk.questionId) as boolean | null ?? null,
  }));

  // Build pillar reports (each with its own maturity calculation)
  const pillarReports = spec.pillars.map((pillar) =>
    buildPillarReport(
      pillar.id,
      pillar.name,
      spec,
      aggregateResult,
      inputMap,
      gates,
      allCriticalRisks // VS19: Pass pre-computed risks
    )
  );

  // Calculate overall maturity using WEAKEST LINK rollup (per Spec v2.6.4 Section 6)
  // finance_maturity = min(applicable pillar maturity)
  const overallMaturity = calculateOverallMaturity(pillarReports, gates);

  // Build the report (without actions first, needed for deriveActions)
  const reportWithoutActions: FinanceReportDTO = {
    run_id,
    spec_version: spec.version,
    generated_at: new Date().toISOString(),
    overall_score: aggregateResult.overall_score,
    maturity: overallMaturity,
    critical_risks: allCriticalRisks,
    pillars: pillarReports,
    actions: [], // Placeholder, will be replaced
  };

  // VS8: Derive actions from critical risks and maturity blockers
  const actions = deriveActions(reportWithoutActions, spec);

  return {
    ...reportWithoutActions,
    actions,
  };
}

// ------------------------------------------------------------------
// Pillar Report Builder
// ------------------------------------------------------------------

function buildPillarReport(
  pillarId: string,
  pillarName: string,
  spec: Spec,
  aggregateResult: AggregateResult,
  inputMap: Map<string, unknown>,
  gates: MaturityGate[],
  allCriticalRisks: CriticalRisk[] // VS19: Pre-computed risks
): PillarReportDTO {
  // Get pillar questions from spec
  const pillarQuestions = spec.questions.filter((q) => q.pillar === pillarId);

  // Get pillar result from VS5
  const pillarResult = aggregateResult.pillars.find(
    (p) => p.pillar_id === pillarId
  );

  // VS19: Filter pre-computed risks to this pillar
  const pillarCriticalRisks = allCriticalRisks.filter(
    (r) => r.pillar_id === pillarId
  );

  // Build pillar-specific input map (only this pillar's questions)
  const pillarInputMap = new Map<string, unknown>();
  for (const q of pillarQuestions) {
    const value = inputMap.get(q.id);
    if (value !== undefined) {
      pillarInputMap.set(q.id, value);
    }
  }

  // Calculate maturity for this pillar
  // Filter gates to only include evidence from this pillar
  const pillarGates = gates.map((gate) => ({
    ...gate,
    required_evidence_ids: gate.required_evidence_ids.filter((evidenceId) =>
      pillarQuestions.some((q) => q.id === evidenceId)
    ),
  }));

  const maturityResult = evaluateMaturity(pillarInputMap, pillarGates);
  const maturity: MaturityStatus = {
    achieved_level: maturityResult.achieved_level,
    achieved_label: maturityResult.achieved_label,
    blocking_level: maturityResult.blocking_level,
    blocking_evidence_ids: maturityResult.blocking_evidence_ids,
    gates: pillarGates,
  };

  return {
    pillar_id: pillarId,
    pillar_name: pillarName,
    score: pillarResult?.score ?? null,
    scored_questions: pillarResult?.scored_questions ?? 0,
    total_questions: pillarQuestions.length,
    maturity,
    critical_risks: pillarCriticalRisks,
  };
}

// ------------------------------------------------------------------
// Overall Maturity Rollup (Weakest Link)
// ------------------------------------------------------------------

/**
 * Calculates overall finance maturity using weakest-link rollup.
 * Per Spec v2.6.4 Section 6: finance_maturity = min(applicable pillar maturity)
 *
 * @param pillarReports - Array of pillar reports with calculated maturity
 * @param gates - All maturity gates (for label lookup)
 * @returns MaturityStatus with overall level = min of all pillar levels
 */
function calculateOverallMaturity(
  pillarReports: PillarReportDTO[],
  gates: MaturityGate[]
): MaturityStatus {
  // Get all pillar maturity levels
  const pillarLevels = pillarReports.map((p) => p.maturity.achieved_level);

  // Weakest link: overall = min of all pillars
  const overallLevel = pillarLevels.length > 0 ? Math.min(...pillarLevels) : 0;

  // Find the label for this level
  const matchingGate = gates.find((g) => g.level === overallLevel);
  const overallLabel = matchingGate?.label ?? "Unknown";

  // Find blocking info from the weakest pillar(s)
  const weakestPillars = pillarReports.filter(
    (p) => p.maturity.achieved_level === overallLevel
  );

  // Collect blocking info from weakest pillars
  // If multiple pillars are at the same level, aggregate their blocking evidence
  const blockingLevel = weakestPillars[0]?.maturity.blocking_level ?? null;
  const blockingEvidenceIds = [
    ...new Set(
      weakestPillars.flatMap((p) => p.maturity.blocking_evidence_ids)
    ),
  ];

  return {
    achieved_level: overallLevel,
    achieved_label: overallLabel,
    blocking_level: blockingLevel,
    blocking_evidence_ids: blockingEvidenceIds,
    gates,
  };
}

// ------------------------------------------------------------------
// VS19: Critical Risk Derivation
// ------------------------------------------------------------------
// Moved to src/risks/engine.ts
// Now uses the "Silence is a risk" philosophy:
// - Risk if answer === false OR answer is missing/null/undefined
// - Only safe if answer === true (strict boolean check)
