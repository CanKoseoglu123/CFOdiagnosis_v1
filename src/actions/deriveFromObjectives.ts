// src/actions/deriveFromObjectives.ts
// VS20 — Dynamic Action Engine
// Actions attach to Objectives (L3), priority is DERIVED based on context

import { DerivedAction } from "./types";
import { Spec, SpecObjective } from "../specs/types";
import { CriticalRisk, MaturityStatus } from "../reports/types";

interface DiagnosticInput {
  question_id: string;
  value: unknown;
}

/**
 * Derives actions from Objectives based on diagnostic results.
 *
 * Priority derivation rules:
 * - HIGH: Objective has a critical risk OR blocks maturity advancement
 * - MEDIUM: Objective is incomplete but not critical/blocking
 *
 * Returns deduplicated, sorted actions (HIGH first, then by level).
 */
export function deriveActionsFromObjectives(
  spec: Spec,
  inputs: DiagnosticInput[],
  criticalRisks: CriticalRisk[],
  maturity: MaturityStatus
): DerivedAction[] {
  // Early return if no objectives
  if (!spec.objectives || spec.objectives.length === 0) {
    return [];
  }

  // Build lookup maps
  const inputMap = new Map<string, unknown>();
  for (const input of inputs) {
    inputMap.set(input.question_id, input.value);
  }

  const criticalRiskQuestionIds = new Set(criticalRisks.map((r) => r.evidence_id));
  const blockingEvidenceIds = new Set(maturity.blocking_evidence_ids);

  // Build question-to-objective lookup
  const questionToObjective = new Map<string, string>();
  for (const q of spec.questions) {
    if (q.objective_id) {
      questionToObjective.set(q.id, q.objective_id);
    }
  }

  // Build objective status map
  const objectiveStatus = new Map<string, {
    hasCriticalRisk: boolean;
    isMaturityBlocker: boolean;
    isIncomplete: boolean;
  }>();

  for (const objective of spec.objectives) {
    // Find all questions belonging to this objective
    const objectiveQuestions = spec.questions.filter((q) => q.objective_id === objective.id);

    let hasCriticalRisk = false;
    let isMaturityBlocker = false;
    let isIncomplete = false;

    for (const q of objectiveQuestions) {
      // Check if any question triggers a critical risk
      if (criticalRiskQuestionIds.has(q.id)) {
        hasCriticalRisk = true;
      }

      // Check if any question blocks maturity
      if (blockingEvidenceIds.has(q.id)) {
        isMaturityBlocker = true;
      }

      // Check if any question is not satisfied (answer !== true)
      const answer = inputMap.get(q.id);
      if (answer !== true) {
        isIncomplete = true;
      }
    }

    objectiveStatus.set(objective.id, {
      hasCriticalRisk,
      isMaturityBlocker,
      isIncomplete,
    });
  }

  // Derive actions for objectives that need attention
  const actions: DerivedAction[] = [];
  const seenObjectiveIds = new Set<string>();

  for (const objective of spec.objectives) {
    // Skip if no action_id defined
    if (!objective.action_id) {
      continue;
    }

    const status = objectiveStatus.get(objective.id);
    if (!status) continue;

    // Skip if objective is complete (all questions satisfied)
    if (!status.isIncomplete) {
      continue;
    }

    // Skip if already processed (deduplication)
    if (seenObjectiveIds.has(objective.id)) {
      continue;
    }
    seenObjectiveIds.add(objective.id);

    // Find the action definition
    const actionDef = spec.actions.find((a) => a.id === objective.action_id);
    if (!actionDef) {
      continue;  // No action definition found
    }

    // Derive priority and trigger reason
    let derivedPriority: "HIGH" | "MEDIUM";
    let triggerReason: "critical_risk" | "maturity_blocker" | "objective_incomplete";

    if (status.hasCriticalRisk) {
      derivedPriority = "HIGH";
      triggerReason = "critical_risk";
    } else if (status.isMaturityBlocker) {
      derivedPriority = "HIGH";
      triggerReason = "maturity_blocker";
    } else {
      derivedPriority = "MEDIUM";
      triggerReason = "objective_incomplete";
    }

    actions.push({
      id: actionDef.id,
      objective_id: objective.id,
      objective_name: objective.name,
      title: actionDef.title,
      description: actionDef.description,
      rationale: actionDef.rationale,
      pillar_id: objective.pillar_id,
      level: objective.level,
      derived_priority: derivedPriority,
      trigger_reason: triggerReason,
    });
  }

  // Sort: HIGH priority first, then by level (ascending)
  actions.sort((a, b) => {
    // Priority comparison (HIGH < MEDIUM for sorting)
    if (a.derived_priority !== b.derived_priority) {
      return a.derived_priority === "HIGH" ? -1 : 1;
    }
    // Level comparison
    return a.level - b.level;
  });

  return actions;
}
