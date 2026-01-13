import { Spec, SpecQuestion } from "../specs/types";

// Score thresholds matching the maturity engine (40/65/85)
const SCORE_THRESHOLDS = {
  L2: 40,
  L3: 65,
  L4: 85
};

export interface AchievedLevelsResult {
  objectiveLevels: Record<string, number>;
  practiceLevels: Record<string, number>;
}

/**
 * Calculate achieved maturity level based on score percentage.
 * Uses same thresholds as the main maturity engine:
 * - L1 (Emerging): < 40%
 * - L2 (Defined): >= 40%
 * - L3 (Managed): >= 65%
 * - L4 (Optimized): >= 85%
 *
 * Note: There is no L0 - minimum is always L1.
 */
function getAchievedLevel(questions: SpecQuestion[], answers: Map<string, unknown>): number {
  if (questions.length === 0) return 1; // No questions = L1 (not L0)

  // Calculate score as percentage of "yes" answers
  const answered = questions.filter((q) => answers.get(q.id) === true).length;
  const scorePercent = (answered / questions.length) * 100;

  // Map score to maturity level using standard thresholds
  if (scorePercent >= SCORE_THRESHOLDS.L4) return 4;
  if (scorePercent >= SCORE_THRESHOLDS.L3) return 3;
  if (scorePercent >= SCORE_THRESHOLDS.L2) return 2;
  return 1; // L1 is the minimum, never L0
}

export function computeAchievedLevels(spec: Spec, inputs: Array<{ question_id: string; value: unknown }>): AchievedLevelsResult {
  const answers = new Map<string, unknown>(inputs.map((i) => [i.question_id, i.value]));
  const practiceToObjective: Record<string, string> = {};

  for (const practice of spec.practices || []) {
    practiceToObjective[practice.id] = practice.objective_id;
  }

  const questionsByObjective: Record<string, SpecQuestion[]> = {};
  const questionsByPractice: Record<string, SpecQuestion[]> = {};

  for (const q of spec.questions) {
    const objectiveId = q.objective_id || (q.practice_id ? practiceToObjective[q.practice_id] : undefined);
    if (objectiveId) {
      if (!questionsByObjective[objectiveId]) {
        questionsByObjective[objectiveId] = [];
      }
      questionsByObjective[objectiveId].push(q);
    }

    if (q.practice_id) {
      if (!questionsByPractice[q.practice_id]) {
        questionsByPractice[q.practice_id] = [];
      }
      questionsByPractice[q.practice_id].push(q);
    }
  }

  const objectiveLevels: Record<string, number> = {};
  for (const objective of spec.objectives || []) {
    const questions = questionsByObjective[objective.id] || [];
    objectiveLevels[objective.id] = getAchievedLevel(questions, answers);
  }

  const practiceLevels: Record<string, number> = {};
  for (const practice of spec.practices || []) {
    const questions = questionsByPractice[practice.id] || [];
    practiceLevels[practice.id] = getAchievedLevel(questions, answers);
  }

  return { objectiveLevels, practiceLevels };
}
