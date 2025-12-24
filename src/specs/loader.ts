/**
 * VS-24: JSON Content Loaders with Zod Validation
 *
 * All content files are validated at module load time.
 * Invalid content will cause the application to fail fast.
 */

import { z } from 'zod';
import {
  QuestionsFileSchema,
  PracticesFileSchema,
  InitiativesFileSchema,
  ObjectivesFileSchema,
  GatesFileSchema,
  Question,
  Practice,
  Initiative,
  Objective,
  GatesConfig
} from './schemas';

// Import JSON files
import questionsJson from '../../content/questions.json';
import practicesJson from '../../content/practices.json';
import initiativesJson from '../../content/initiatives.json';
import objectivesJson from '../../content/objectives.json';
import gatesJson from '../../content/gates.json';

// === VALIDATION CACHE ===
// Validate once at module load, throw if invalid

let _questions: Question[] | null = null;
let _practices: Practice[] | null = null;
let _initiatives: Initiative[] | null = null;
let _objectives: Objective[] | null = null;
let _gates: GatesConfig | null = null;

function validateOnce<T>(
  data: unknown,
  schema: z.ZodType<T>,
  fileName: string
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues.map((e: z.ZodIssue) =>
      `  - ${e.path.join('.')}: ${e.message}`
    ).join('\n');
    throw new Error(`Invalid ${fileName}:\n${errors}`);
  }
  return result.data;
}

// === PUBLIC LOADERS ===

export function loadQuestions(): Question[] {
  if (!_questions) {
    const validated = validateOnce(questionsJson, QuestionsFileSchema, 'questions.json');
    _questions = validated.questions;
  }
  return _questions;
}

export function loadPractices(): Practice[] {
  if (!_practices) {
    const validated = validateOnce(practicesJson, PracticesFileSchema, 'practices.json');
    _practices = validated.practices;
  }
  return _practices;
}

export function loadInitiatives(): Initiative[] {
  if (!_initiatives) {
    const validated = validateOnce(initiativesJson, InitiativesFileSchema, 'initiatives.json');
    _initiatives = validated.initiatives;
  }
  return _initiatives;
}

export function loadObjectives(): Objective[] {
  if (!_objectives) {
    const validated = validateOnce(objectivesJson, ObjectivesFileSchema, 'objectives.json');
    _objectives = validated.objectives;
  }
  return _objectives;
}

export function loadGates(): GatesConfig {
  if (!_gates) {
    _gates = validateOnce(gatesJson, GatesFileSchema, 'gates.json');
  }
  return _gates;
}

// === CROSS-REFERENCE VALIDATION ===

export function validateCrossReferences(): void {
  const questions = loadQuestions();
  const practices = loadPractices();
  const initiatives = loadInitiatives();
  const objectives = loadObjectives();
  const gates = loadGates();

  const questionIds = new Set(questions.map(q => q.id));
  const objectiveIds = new Set(objectives.map(o => o.id));
  const initiativeIds = new Set(initiatives.map(i => i.id));

  // Every question must reference valid objective and initiative
  for (const q of questions) {
    if (!objectiveIds.has(q.objective_id)) {
      throw new Error(`Question ${q.id} references invalid objective: ${q.objective_id}`);
    }
    if (!initiativeIds.has(q.initiative_id)) {
      throw new Error(`Question ${q.id} references invalid initiative: ${q.initiative_id}`);
    }
  }

  // Every practice must reference valid questions
  for (const p of practices) {
    for (const qId of p.question_ids) {
      if (!questionIds.has(qId)) {
        throw new Error(`Practice ${p.id} references invalid question: ${qId}`);
      }
    }
  }

  // Every initiative must reference valid objective
  for (const i of initiatives) {
    if (!objectiveIds.has(i.objective_id)) {
      throw new Error(`Initiative ${i.id} references invalid objective: ${i.objective_id}`);
    }
  }

  // Critical gates must reference valid questions
  for (const qId of gates.critical_gates.l1_to_l2) {
    if (!questionIds.has(qId)) {
      throw new Error(`Critical gate l1_to_l2 references invalid question: ${qId}`);
    }
  }
  for (const qId of gates.critical_gates.l2_to_l3) {
    if (!questionIds.has(qId)) {
      throw new Error(`Critical gate l2_to_l3 references invalid question: ${qId}`);
    }
  }
}

// === CONVENIENCE LOOKUPS ===

export function getQuestionById(id: string): Question | undefined {
  return loadQuestions().find(q => q.id === id);
}

export function getQuestionsByLevel(level: 1 | 2 | 3 | 4): Question[] {
  return loadQuestions().filter(q => q.maturity_level === level);
}

export function getCriticalQuestions(): Question[] {
  return loadQuestions().filter(q => q.is_critical);
}

export function getQuestionsByInitiative(initiativeId: string): Question[] {
  return loadQuestions().filter(q => q.initiative_id === initiativeId);
}

export function getQuestionsByObjective(objectiveId: string): Question[] {
  return loadQuestions().filter(q => q.objective_id === objectiveId);
}

export function getPracticesByLevel(level: 1 | 2 | 3 | 4): Practice[] {
  return loadPractices().filter(p => p.level === level);
}

export function getObjectiveById(id: string): Objective | undefined {
  return loadObjectives().find(o => o.id === id);
}

export function getInitiativeById(id: string): Initiative | undefined {
  return loadInitiatives().find(i => i.id === id);
}

export function getPracticeById(id: string): Practice | undefined {
  return loadPractices().find(p => p.id === id);
}
