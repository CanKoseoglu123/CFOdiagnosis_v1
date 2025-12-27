// src/reports/builder.ts
// VS6/VS7/VS8/VS19 — Assembles Finance Report DTO from VS5 scores + spec
// Includes maturity calculation (VS7), actions derivation (VS8), and critical risks (VS19)
// V2: Added execution score, cap logic, objective scoring, P0/P1/P2 actions
// V2.1: Added P1/P2/P3 labels, 2x critical multiplier, initiative grouping

import { Spec } from "../specs/types";
import {
  FinanceReportDTO,
  PillarReportDTO,
  MaturityStatus,
  MaturityStatusV2,
  MaturityGate,
  CriticalRisk,
  ObjectiveScore,
} from "./types";
import { AggregateResult } from "../results/aggregate";
import { evaluateMaturity, calculateMaturityV2, Answer } from "../maturity";
import { deriveActions, deriveActionsFromObjectives, prioritizeActions, groupActionsByInitiative } from "../actions";
import { CalibrationData } from "../actions/types";  // VS21: Import calibration type
import { deriveCriticalRisks as deriveRisksFromEngine } from "../risks";
import { calculateObjectiveScores } from "../scoring/objectiveScoring";
import { buildMaturityFootprint } from "../maturity/footprint";  // VS23: Maturity Footprint

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
  calibration?: CalibrationData | null;  // VS21: Optional calibration data
}

// ------------------------------------------------------------------
// Main Builder (Pure Function)
// ------------------------------------------------------------------

export function buildReport(input: BuildReportInput): FinanceReportDTO {
  const { run_id, spec, aggregateResult, inputs, calibration } = input;

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
  // VS22-v3: Include expert_action for gap titles
  const allCriticalRisks: CriticalRisk[] = engineRisks.map((risk) => ({
    evidence_id: risk.questionId,
    question_text: risk.questionText,
    pillar_id: risk.pillarId,
    pillar_name: risk.pillarName,
    severity: risk.severity,
    user_answer: inputMap.get(risk.questionId) as boolean | null ?? null,
    level: risk.level,                // VS22-v3: Include maturity level
    expert_action: risk.expert_action, // VS22-v3: Include expert action for gap title
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

  // Calculate overall maturity using WEAKEST LINK rollup (per Spec Section 6)
  // finance_maturity = min(applicable pillar maturity)
  const overallMaturity = calculateOverallMaturity(pillarReports, gates);

  // V2: Calculate maturity with execution score and cap logic
  const answers: Answer[] = inputs.map((i) => ({
    question_id: i.question_id,
    value: i.value as boolean | 'N/A' | null | undefined,
  }));
  const questions = spec.questions.map((q) => ({
    id: q.id,
    text: q.text,
    level: q.level ?? 1,  // Default to level 1 if undefined
  }));
  const maturityV2Result = calculateMaturityV2({ answers, questions });

  // V2: Build extended maturity status
  const maturityV2: MaturityStatusV2 = {
    // Legacy fields
    achieved_level: maturityV2Result.actual_level,
    achieved_label: maturityV2Result.actual_label,
    blocking_level: maturityV2Result.blocking_level,
    blocking_evidence_ids: maturityV2Result.blocking_evidence_ids,
    gates,
    // V2 fields
    execution_score: maturityV2Result.execution_score,
    potential_level: maturityV2Result.potential_level,
    actual_level: maturityV2Result.actual_level,
    capped: maturityV2Result.capped,
    capped_by: maturityV2Result.capped_by,
    capped_reason: maturityV2Result.capped_reason,
  };

  // V2: Calculate objective scores with traffic lights
  const objectiveScores: ObjectiveScore[] = calculateObjectiveScores(spec, inputs);

  // V2.1: Calculate prioritized actions (P1/P2/P3) with score calculation
  // VS21: Pass calibration for importance multipliers
  const prioritizedActions = prioritizeActions(
    maturityV2Result,
    inputs,
    spec.questions,
    calibration
  );

  // V2.1: Group actions by initiative
  const groupedInitiatives = spec.initiatives
    ? groupActionsByInitiative(prioritizedActions, spec.initiatives)
    : undefined;

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

  // VS8: Derive actions from critical risks and maturity blockers (legacy)
  const actions = deriveActions(reportWithoutActions, spec);

  // VS20: Derive objective-based actions with computed priority
  const derivedActions = deriveActionsFromObjectives(
    spec,
    inputs,
    allCriticalRisks,
    overallMaturity
  );

  // VS23: Build maturity footprint (practice-level evidence states)
  const footprintAnswers = inputs.map((i) => ({
    question_id: i.question_id,
    value: i.value as boolean | string | null,
  }));
  const footprintQuestions = spec.questions.map((q) => ({
    id: q.id,
    is_critical: q.is_critical,
  }));
  const maturityFootprint = buildMaturityFootprint(footprintAnswers, footprintQuestions);

  return {
    ...reportWithoutActions,
    actions,
    derived_actions: derivedActions,
    // V2 fields
    maturity_v2: maturityV2,
    objectives: objectiveScores,
    // V2.1 fields
    prioritized_actions: prioritizedActions,
    grouped_initiatives: groupedInitiatives,
    // VS23 fields
    maturity_footprint: maturityFootprint,
    // VS-32: Include inputs for frontend calculations (execution scores, spider diagrams)
    inputs: inputs.map((i) => ({
      question_id: i.question_id,
      value: i.value,
    })),
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
 * Per Spec Section 6: finance_maturity = min(applicable pillar maturity)
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
