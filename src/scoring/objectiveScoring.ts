// src/scoring/objectiveScoring.ts
// V2: Objective scoring with traffic light logic and critical override
// Fixes "Green Light of Death" - objectives with failed criticals max at Yellow

import { ObjectiveScore } from "../reports/types";
import { Spec, SpecQuestion, SpecObjective } from "../specs/types";

// =============================================================================
// CRITICAL-TO-OBJECTIVE MAPPING
// =============================================================================

const L1_CRITICALS = ['fpa_l1_q01', 'fpa_l1_q02', 'fpa_l1_q05', 'fpa_l1_q09'];
const L2_CRITICALS = ['fpa_l2_q01', 'fpa_l2_q02', 'fpa_l2_q06', 'fpa_l2_q07'];
const ALL_CRITICALS = [...L1_CRITICALS, ...L2_CRITICALS];

// =============================================================================
// OBJECTIVE SCORING
// =============================================================================

interface DiagnosticInput {
  question_id: string;
  value: unknown;
}

/**
 * Calculates traffic light status for an objective.
 *
 * Base thresholds:
 * - Green: 80-100%
 * - Yellow: 50-79%
 * - Red: 0-49%
 *
 * Critical Override Rule:
 * If objective contains a failed critical, max status is Yellow (never Green).
 *
 * @param score - Objective score 0-100
 * @param failedCriticals - Array of failed critical question IDs in this objective
 * @returns Traffic light status with override info
 */
function getObjectiveTrafficLight(
  score: number,
  failedCriticals: string[]
): { status: 'green' | 'yellow' | 'red'; overridden: boolean; override_reason: string | null } {
  // Base status from score
  let baseStatus: 'green' | 'yellow' | 'red';
  if (score >= 80) baseStatus = 'green';
  else if (score >= 50) baseStatus = 'yellow';
  else baseStatus = 'red';

  // Apply critical override: if any critical failed, max is Yellow
  if (failedCriticals.length > 0 && baseStatus === 'green') {
    return {
      status: 'yellow',
      overridden: true,
      override_reason: `Score (${score}%) indicates strong execution, but status is downgraded due to critical failure`,
    };
  }

  return {
    status: baseStatus,
    overridden: false,
    override_reason: null,
  };
}

/**
 * Calculates scores for all objectives with traffic light status.
 *
 * @param spec - The diagnostic specification
 * @param inputs - Array of user answers
 * @returns Array of ObjectiveScore
 */
export function calculateObjectiveScores(
  spec: Spec,
  inputs: DiagnosticInput[]
): ObjectiveScore[] {
  // Build input map
  const inputMap = new Map<string, unknown>(
    inputs.map((i) => [i.question_id, i.value])
  );

  // Build question-to-objective map
  const questionsByObjective = new Map<string, SpecQuestion[]>();
  for (const q of spec.questions) {
    if (q.objective_id) {
      const existing = questionsByObjective.get(q.objective_id) || [];
      existing.push(q);
      questionsByObjective.set(q.objective_id, existing);
    }
  }

  const objectiveScores: ObjectiveScore[] = [];

  for (const objective of spec.objectives || []) {
    const questions = questionsByObjective.get(objective.id) || [];

    // Calculate objective score
    let passed = 0;
    let total = 0;
    const failedCriticals: string[] = [];

    for (const q of questions) {
      const answer = inputMap.get(q.id);

      // Skip N/A answers from scoring
      if (answer === 'N/A') continue;

      total += 1;
      if (answer === true) {
        passed += 1;
      }

      // Check if this is a failed critical
      if (ALL_CRITICALS.includes(q.id) && answer !== true) {
        failedCriticals.push(q.id);
      }
    }

    const score = total > 0 ? Math.round((passed / total) * 100) : 0;
    const trafficLight = getObjectiveTrafficLight(score, failedCriticals);

    objectiveScores.push({
      objective_id: objective.id,
      objective_name: objective.name,
      level: objective.level,
      score,
      status: trafficLight.status,
      overridden: trafficLight.overridden,
      override_reason: trafficLight.override_reason,
      questions_total: total,
      questions_passed: passed,
      failed_criticals: failedCriticals,
    });
  }

  return objectiveScores;
}
