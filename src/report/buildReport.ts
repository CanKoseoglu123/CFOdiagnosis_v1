// src/report/buildReport.ts
// VS6 — Assembles Finance Report DTO from VS5 scores + spec
// DOES NOT compute maturity (that's VS7)

import { Spec, SpecQuestion } from "../specs/types";
import {
  FinanceReportDTO,
  PillarReportDTO,
  MaturityStatus,
  MaturityGate,
  CriticalRisk,
} from "../types/report";
import { AggregateResult, PillarResult } from "../results/aggregate";

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

  // Build maturity status placeholder (same for all levels until VS7)
  const maturityStatus = buildMaturityPlaceholder(spec);

  // Build pillar reports
  const pillarReports = spec.pillars.map((pillar) =>
    buildPillarReport(
      pillar.id,
      pillar.name,
      spec,
      aggregateResult,
      inputMap,
      maturityStatus
    )
  );

  // Collect all critical risks across pillars
  const allCriticalRisks = pillarReports.flatMap((p) => p.critical_risks);

  return {
    run_id,
    spec_version: spec.version,
    generated_at: new Date().toISOString(),
    overall_score: aggregateResult.overall_score,
    maturity: maturityStatus,
    critical_risks: allCriticalRisks,
    pillars: pillarReports,
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
  maturityStatus: MaturityStatus
): PillarReportDTO {
  // Get pillar questions from spec
  const pillarQuestions = spec.questions.filter((q) => q.pillar === pillarId);

  // Get pillar result from VS5
  const pillarResult = aggregateResult.pillars.find(
    (p) => p.pillar_id === pillarId
  );

  // Derive critical risks for this pillar
  const criticalRisks = deriveCriticalRisks(pillarQuestions, inputMap, pillarId);

  return {
    pillar_id: pillarId,
    pillar_name: pillarName,
    score: pillarResult?.score ?? null,
    scored_questions: pillarResult?.scored_questions ?? 0,
    total_questions: pillarQuestions.length,
    maturity: maturityStatus,
    critical_risks: criticalRisks,
  };
}

// ------------------------------------------------------------------
// Critical Risk Derivation
// ------------------------------------------------------------------

/**
 * Derives critical risks from spec definitions and user inputs.
 * A critical risk occurs when:
 *   1. Question has is_critical = true in spec
 *   2. User answered FALSE (or falsy boolean)
 */
function deriveCriticalRisks(
  questions: SpecQuestion[],
  inputMap: Map<string, unknown>,
  pillarId: string
): CriticalRisk[] {
  const risks: CriticalRisk[] = [];

  for (const question of questions) {
    // Skip non-critical questions
    if (!question.is_critical) continue;

    const userAnswer = inputMap.get(question.id);

    // Only flag as risk if explicitly FALSE
    // (null/undefined = not answered, not a risk)
    if (userAnswer === false) {
      risks.push({
        evidence_id: question.id,
        question_text: question.text,
        pillar_id: pillarId,
        user_answer: false,
      });
    }
  }

  return risks;
}

// ------------------------------------------------------------------
// Maturity Placeholder Builder
// ------------------------------------------------------------------

/**
 * Builds a placeholder MaturityStatus from spec.
 * achieved_level is NOT_CALCULATED until VS7 implements gate evaluation.
 */
function buildMaturityPlaceholder(spec: Spec): MaturityStatus {
  const gates: MaturityGate[] = spec.maturityGates.map((gate) => ({
    level: gate.level,
    label: gate.label,
    required_evidence_ids: gate.required_evidence_ids,
  }));

  return {
    achieved_level: "NOT_CALCULATED",
    blocking_evidence_ids: [],
    gates,
  };
}
