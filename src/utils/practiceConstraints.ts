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
 * Load questions.json and derive practice constraints
 */
function derivePracticeConstraints(): Record<string, PracticeConstraint> {
  const questionsPath = path.join(__dirname, '../../content/questions.json');
  const questionsData: QuestionsFile = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

  const byPractice: Record<string, number[]> = {};

  for (const question of questionsData.questions) {
    const practiceId = question.practice_id;
    if (!byPractice[practiceId]) {
      byPractice[practiceId] = [];
    }
    byPractice[practiceId].push(question.maturity_level);
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
}
