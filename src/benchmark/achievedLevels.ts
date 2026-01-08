import { Spec, SpecQuestion } from "../specs/types";

export interface AchievedLevelsResult {
  objectiveLevels: Record<string, number>;
  practiceLevels: Record<string, number>;
}

function getAchievedLevel(questions: SpecQuestion[], answers: Map<string, unknown>): number {
  if (questions.length === 0) return 0;

  // Determine the max level present in questions for this practice
  // This prevents advancing to levels that have no questions defined
  const maxLevelPresent = Math.max(...questions.map((q) => q.level ?? 1));

  let achieved = 0;
  for (let level = 1; level <= maxLevelPresent; level += 1) {
    const eligible = questions.filter((q) => (q.level ?? 1) <= level);
    if (eligible.length === 0) {
      achieved = level;
      continue;
    }

    const passed = eligible.every((q) => answers.get(q.id) === true);
    if (!passed) break;
    achieved = level;
  }

  return achieved;
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
