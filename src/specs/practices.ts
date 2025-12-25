// src/specs/practices.ts
// VS-26: FP&A Practice Catalog - Simplified schema
// Practices now have: id, objective_id, title, capability_tags
// Level and theme derived from objective/questions

import { loadPractices, loadQuestions, loadObjectives, getPracticesByLevel } from './loader';
import { Practice as JsonPractice, ThemeId, Question, Objective } from './schemas';

// Re-export ThemeId for backward compatibility
export type { ThemeId };

export type EvidenceState = 'proven' | 'partial' | 'not_proven';

// Legacy interface - now computed from simpler JSON schema
export interface Practice {
  id: string;
  title: string;
  description: string;
  objective_id: string;
  theme_id: ThemeId;
  maturity_level: 1 | 2 | 3 | 4;
  question_ids: string[];
  capability_tags: string[];
}

// Cache for derived data
let _objectiveMap: Map<string, Objective> | null = null;
let _questionsByObjective: Map<string, Question[]> | null = null;

function getObjectiveMap(): Map<string, Objective> {
  if (!_objectiveMap) {
    _objectiveMap = new Map(loadObjectives().map(o => [o.id, o]));
  }
  return _objectiveMap;
}

function getQuestionsByObjective(): Map<string, Question[]> {
  if (!_questionsByObjective) {
    _questionsByObjective = new Map();
    for (const q of loadQuestions()) {
      const existing = _questionsByObjective.get(q.objective_id) || [];
      existing.push(q);
      _questionsByObjective.set(q.objective_id, existing);
    }
  }
  return _questionsByObjective;
}

// VS-26: Transform simplified JSON practice to legacy interface
function transformPractice(p: JsonPractice): Practice {
  const objectiveMap = getObjectiveMap();
  const questionsByObj = getQuestionsByObjective();

  const objective = objectiveMap.get(p.objective_id);
  const objQuestions = questionsByObj.get(p.objective_id) || [];

  // Derive level from questions in this objective
  const levelCounts: Record<number, number> = {};
  for (const q of objQuestions) {
    levelCounts[q.maturity_level] = (levelCounts[q.maturity_level] || 0) + 1;
  }
  const level = Object.entries(levelCounts).reduce(
    (max, [lvl, cnt]) => cnt > max.count ? { level: Number(lvl), count: cnt } : max,
    { level: 1, count: 0 }
  ).level as 1 | 2 | 3 | 4;

  return {
    id: p.id,
    title: p.title,
    description: objective?.description || '',  // Use objective description
    objective_id: p.objective_id,
    theme_id: (objective?.theme_id || 'foundation') as ThemeId,
    maturity_level: level,
    question_ids: objQuestions.map(q => q.id),  // Derived from objective's questions
    capability_tags: p.capability_tags || []
  };
}

// Lazy-loaded transformed practices
let _fpaPractices: Practice[] | null = null;

function getFpaPractices(): Practice[] {
  if (!_fpaPractices) {
    _fpaPractices = loadPractices().map(transformPractice);
  }
  return _fpaPractices;
}

// Export as FPA_PRACTICES for backward compatibility
// Note: This is now a getter, not a const, but usage is identical
export const FPA_PRACTICES: Practice[] = new Proxy([] as Practice[], {
  get(target, prop) {
    const practices = getFpaPractices();
    if (prop === 'length') return practices.length;
    if (prop === Symbol.iterator) return practices[Symbol.iterator].bind(practices);
    if (typeof prop === 'string' && !isNaN(Number(prop))) {
      return practices[Number(prop)];
    }
    if (typeof prop === 'string') {
      const method = (practices as any)[prop];
      if (typeof method === 'function') {
        return method.bind(practices);
      }
      return method;
    }
    return Reflect.get(practices, prop);
  }
});

// Level summary - computed from JSON
export const PRACTICE_COUNTS = {
  get L1() { return getFpaPractices().filter(p => p.maturity_level === 1).length; },
  get L2() { return getFpaPractices().filter(p => p.maturity_level === 2).length; },
  get L3() { return getFpaPractices().filter(p => p.maturity_level === 3).length; },
  get L4() { return getFpaPractices().filter(p => p.maturity_level === 4).length; }
};

export const LEVEL_NAMES: Record<number, string> = {
  1: 'Foundation',
  2: 'Defined',
  3: 'Managed',
  4: 'Optimized'
};

// Convenience helpers
export function getPracticeById(id: string): Practice | undefined {
  return getFpaPractices().find(p => p.id === id);
}

export function getPracticesByMaturityLevel(level: 1 | 2 | 3 | 4): Practice[] {
  return getFpaPractices().filter(p => p.maturity_level === level);
}

export function getPracticesByObjectiveId(objectiveId: string): Practice[] {
  return getFpaPractices().filter(p => p.objective_id === objectiveId);
}

export function getPracticesByThemeId(themeId: ThemeId): Practice[] {
  return getFpaPractices().filter(p => p.theme_id === themeId);
}

// Verify question count (runs once on first access)
let _validated = false;
export function validatePracticeQuestionCoverage(): void {
  if (_validated) return;

  const practices = getFpaPractices();
  const allQuestionIds = practices.flatMap(p => p.question_ids);
  const uniqueQuestionIds = [...new Set(allQuestionIds)];

  // VS-25: Updated to support 48-57 questions
  if (uniqueQuestionIds.length < 48) {
    console.warn(`Practice catalog has ${uniqueQuestionIds.length} questions, expected at least 48`);
  }

  _validated = true;
}
