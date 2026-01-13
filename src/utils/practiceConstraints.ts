/**
 * VS-27e: Practice Constraints
 * Derives min/max achievable maturity levels per practice from questions.json
 * Used for target capping - can't set a target above max available questions
 */

import * as fs from 'fs';
import * as path from 'path';

interface Question {
  id: string;
  practice_id: string;
  maturity_level: number;
}

interface QuestionsFile {
  version: string;
  pillar: string;
  questions: Question[];
}

interface PracticeConstraint {
  min: number;
  max: number;
}

// Cache for practice constraints
let _constraintsCache: Record<string, PracticeConstraint> | null = null;

/**
 * Load questions from split theme files and derive practice constraints
 */
function derivePracticeConstraints(): Record<string, PracticeConstraint> {
  // Questions are split into three theme files
  const questionFiles = [
    'questions-foundation.json',
    'questions-future.json',
    'questions-intelligence.json'
  ];

  const byPractice: Record<string, number[]> = {};

  for (const fileName of questionFiles) {
    const filePath = path.join(__dirname, '../../content', fileName);
    try {
      const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const questions = Array.isArray(fileData) ? fileData : fileData.questions || [];

      for (const question of questions) {
        const practiceId = question.practice_id;
        const level = question.maturity_level ?? question.level ?? 1;
        if (practiceId) {
          if (!byPractice[practiceId]) {
            byPractice[practiceId] = [];
          }
          byPractice[practiceId].push(level);
        }
      }
    } catch (err) {
      console.error(`[PracticeConstraints] Failed to load ${fileName}:`, err);
    }
  }

  const constraints: Record<string, PracticeConstraint> = {};
  for (const [practiceId, levels] of Object.entries(byPractice)) {
    constraints[practiceId] = {
      min: Math.min(...levels),
      max: Math.max(...levels)
    };
  }

  return constraints;
}

/**
 * Get practice constraints (cached)
 */
export function getPracticeConstraints(): Record<string, PracticeConstraint> {
  if (!_constraintsCache) {
    _constraintsCache = derivePracticeConstraints();
  }
  return _constraintsCache;
}

/**
 * Get constraint for a specific practice
 */
export function getPracticeConstraint(practiceId: string): PracticeConstraint | undefined {
  const constraints = getPracticeConstraints();
  return constraints[practiceId];
}

/**
 * Check if a target is achievable for a practice
 */
export function isTargetAchievable(practiceId: string, target: number): boolean {
  const constraint = getPracticeConstraint(practiceId);
  if (!constraint) return false;
  return target >= constraint.min && target <= constraint.max;
}

/**
 * Clamp a target to practice constraints
 */
export function clampToConstraint(practiceId: string, target: number): number {
  const constraint = getPracticeConstraint(practiceId);
  if (!constraint) return target;
  return Math.min(Math.max(target, constraint.min), constraint.max);
}

/**
 * Clear cache (for testing or when questions.json changes)
 */
export function clearConstraintsCache(): void {
  _constraintsCache = null;
  _objectiveConstraintsCache = null;
}

// ============================================
// Objective Constraints (derived from practices)
// ============================================

interface Practice {
  id: string;
  objective_id: string;
  title: string;
  capability_tags: string[];
}

interface ObjectiveConstraint {
  min: number;
  max: number;
}

let _objectiveConstraintsCache: Record<string, ObjectiveConstraint> | null = null;
let _practicesCache: Practice[] | null = null;

function loadPractices(): Practice[] {
  if (!_practicesCache) {
    const practicesPath = path.join(__dirname, '../../content/practices.json');
    _practicesCache = JSON.parse(fs.readFileSync(practicesPath, 'utf-8'));
  }
  return _practicesCache!;
}

/**
 * Derive objective constraints from practice constraints
 * An objective's max level is the max of all its practices' max levels
 */
function deriveObjectiveConstraints(): Record<string, ObjectiveConstraint> {
  const practiceConstraints = getPracticeConstraints();
  const practices = loadPractices();

  // Group practices by objective
  const byObjective: Record<string, PracticeConstraint[]> = {};
  for (const practice of practices) {
    const constraint = practiceConstraints[practice.id];
    if (constraint) {
      if (!byObjective[practice.objective_id]) {
        byObjective[practice.objective_id] = [];
      }
      byObjective[practice.objective_id].push(constraint);
    }
  }

  // Calculate objective constraints
  const objectiveConstraints: Record<string, ObjectiveConstraint> = {};
  for (const [objectiveId, constraints] of Object.entries(byObjective)) {
    const mins = constraints.map(c => c.min);
    const maxes = constraints.map(c => c.max);
    objectiveConstraints[objectiveId] = {
      min: Math.min(...mins),
      max: Math.max(...maxes)
    };
  }

  return objectiveConstraints;
}

/**
 * Get all objective constraints (cached)
 */
export function getObjectiveConstraints(): Record<string, ObjectiveConstraint> {
  if (!_objectiveConstraintsCache) {
    _objectiveConstraintsCache = deriveObjectiveConstraints();
  }
  return _objectiveConstraintsCache;
}

/**
 * Get constraint for a specific objective
 */
export function getObjectiveConstraint(objectiveId: string): ObjectiveConstraint | undefined {
  const constraints = getObjectiveConstraints();
  return constraints[objectiveId];
}
