// src/actions/derive.ts
// VS8 — Actions Derivation Engine
// Converts critical risks and maturity blockers into prioritized action items

import { Spec, SpecQuestion, ActionDefinition } from "../specs/types";
import { FinanceReportDTO } from "../reports/types";
import { ActionPlanItem } from "./types";

/**
 * Derives action plan items from report data and spec definitions.
 *
 * Logic:
 * 1. Collect all critical risk evidence IDs
 * 2. Collect all maturity blocking evidence IDs
 * 3. Deduplicate (an evidence can be both critical AND blocking)
 * 4. Look up trigger_action_id for each evidence
 * 5. Hydrate action details from spec
 * 6. Sort by priority: critical > high > medium
 *
 * @param report - The finance report DTO with risks and maturity info
 * @param spec - The spec containing action definitions
 * @returns Sorted array of action plan items
 */
export function deriveActions(
  report: FinanceReportDTO,
  spec: Spec
): ActionPlanItem[] {
  // Build lookup maps
  const questionMap = new Map<string, SpecQuestion>(
    spec.questions.map((q) => [q.id, q])
  );
  const actionMap = new Map<string, ActionDefinition>(
    spec.actions.map((a) => [a.id, a])
  );

  // Track which evidence IDs trigger actions and their trigger type
  // Using Map to deduplicate and track trigger type
  const triggeredEvidence = new Map<
    string,
    { type: "critical_risk" | "maturity_blocker"; pillar_id: string }
  >();

  // 1. Collect critical risk evidence IDs (highest priority)
  for (const risk of report.critical_risks) {
    triggeredEvidence.set(risk.evidence_id, {
      type: "critical_risk",
      pillar_id: risk.pillar_id,
    });
  }

  // 2. Collect maturity blocking evidence IDs
  // Check overall maturity blockers
  for (const evidenceId of report.maturity.blocking_evidence_ids) {
    if (!triggeredEvidence.has(evidenceId)) {
      // Find which pillar this evidence belongs to
      const question = questionMap.get(evidenceId);
      triggeredEvidence.set(evidenceId, {
        type: "maturity_blocker",
        pillar_id: question?.pillar ?? "unknown",
      });
    }
  }

  // Check pillar-level maturity blockers
  for (const pillar of report.pillars) {
    for (const evidenceId of pillar.maturity.blocking_evidence_ids) {
      if (!triggeredEvidence.has(evidenceId)) {
        triggeredEvidence.set(evidenceId, {
          type: "maturity_blocker",
          pillar_id: pillar.pillar_id,
        });
      }
    }
  }

  // 3. Build action plan items
  const actions: ActionPlanItem[] = [];

  for (const [evidenceId, trigger] of triggeredEvidence) {
    const question = questionMap.get(evidenceId);
    if (!question?.trigger_action_id) {
      // No action defined for this evidence — skip
      continue;
    }

    const actionDef = actionMap.get(question.trigger_action_id);
    if (!actionDef) {
      // Action ID referenced but not found in spec — skip
      continue;
    }

    // Determine priority: critical_risk triggers use action's priority,
    // but ensure critical risks are at least "high"
    let priority = actionDef.priority;
    if (trigger.type === "critical_risk" && priority === "medium") {
      priority = "high";
    }

    actions.push({
      id: actionDef.id,
      title: actionDef.title,
      description: actionDef.description,
      rationale: actionDef.rationale,
      priority,
      trigger_type: trigger.type,
      evidence_id: evidenceId,
      pillar_id: trigger.pillar_id,
    });
  }

  // 4. Sort by priority: critical > high > medium
  const priorityOrder = { critical: 0, high: 1, medium: 2 };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return actions;
}
