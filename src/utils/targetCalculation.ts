/**
 * VS-27e: Target Calculation
 * Derives persona-specific maturity targets for objectives and practices
 */

import * as fs from 'fs';
import * as path from 'path';
import { getPracticeConstraint, clampToConstraint } from './practiceConstraints';

// ============================================
// Types
// ============================================

interface TargetMatrixModifier {
  description: string;
  trigger: {
    source: string;
    field: string;
    values: string[];
  };
  adjustments: Record<string, number>;
  maxTarget: number;
}

interface TargetMatrix {
  version: string;
  description: string;
  objectiveTargets: Record<string, Record<string, number>>;
  modifiers: Record<string, TargetMatrixModifier>;
}

interface Practice {
  id: string;
  objective_id: string;
  title: string;
  capability_tags: string[];
}

interface CompanyContext {
  ownership_structure?: string;
  [key: string]: unknown;
}

interface Classification {
  persona: string;
  scores: Record<string, number>;
  confidence: number;
  override?: string;
}

export interface ObjectiveTarget {
  objective_id: string;
  baseTarget: number;
  adjustedTarget: number;
  modifiersApplied: string[];
}

export interface PracticeTarget {
  practice_id: string;
  objective_id: string;
  target: number;
  constrainedBy?: 'ceiling' | 'practice_max';
  practiceMax?: number;
}

export interface TargetsResult {
  persona: string;
  objectiveTargets: ObjectiveTarget[];
  practiceTargets: PracticeTarget[];
  modifiersApplied: string[];
}

// ============================================
// Data Loading (Cached)
// ============================================

let _targetMatrixCache: TargetMatrix | null = null;
let _practicesCache: Practice[] | null = null;

function loadTargetMatrix(): TargetMatrix {
  if (!_targetMatrixCache) {
    const matrixPath = path.join(__dirname, '../../content/targetMatrix.json');
    _targetMatrixCache = JSON.parse(fs.readFileSync(matrixPath, 'utf-8'));
  }
  return _targetMatrixCache!;
}

function loadPractices(): Practice[] {
  if (!_practicesCache) {
    const practicesPath = path.join(__dirname, '../../content/practices.json');
    _practicesCache = JSON.parse(fs.readFileSync(practicesPath, 'utf-8'));
  }
  return _practicesCache!;
}

/**
 * Clear caches (for testing or when content changes)
 */
export function clearTargetCaches(): void {
  _targetMatrixCache = null;
  _practicesCache = null;
}

// ============================================
// Core Target Calculation
// ============================================

/**
 * Get targets for a diagnostic run based on classification and context
 *
 * @param classification - Company classification with persona
 * @param context - Company context (for modifier triggers)
 * @param customMatrix - Optional custom matrix (for admin overrides)
 */
export function calculateTargets(
  classification: Classification,
  context: CompanyContext,
  customMatrix?: TargetMatrix
): TargetsResult {
  const matrix = customMatrix || loadTargetMatrix();
  const practices = loadPractices();

  // Get effective persona (override takes precedence)
  const persona = classification.override || classification.persona;

  // Get base objective targets for this persona
  const personaTargets = matrix.objectiveTargets[persona];
  if (!personaTargets) {
    throw new Error(`Unknown persona: ${persona}`);
  }

  // Determine which modifiers apply
  const appliedModifiers: string[] = [];
  const adjustments: Record<string, number> = {};

  for (const [modifierId, modifier] of Object.entries(matrix.modifiers)) {
    if (shouldApplyModifier(modifier, context)) {
      appliedModifiers.push(modifierId);

      // Accumulate adjustments
      for (const [objectiveId, adjustment] of Object.entries(modifier.adjustments)) {
        adjustments[objectiveId] = (adjustments[objectiveId] || 0) + adjustment;
      }
    }
  }

  // Calculate objective targets with modifiers
  const objectiveTargets: ObjectiveTarget[] = [];
  const objectiveTargetMap: Record<string, number> = {};

  for (const [objectiveId, baseTarget] of Object.entries(personaTargets)) {
    const adjustment = adjustments[objectiveId] || 0;
    let adjustedTarget = baseTarget + adjustment;

    // Apply max cap from modifiers
    const maxCap = getMaxCap(matrix.modifiers, appliedModifiers);
    if (maxCap !== null) {
      adjustedTarget = Math.min(adjustedTarget, maxCap);
    }

    objectiveTargets.push({
      objective_id: objectiveId,
      baseTarget,
      adjustedTarget,
      modifiersApplied: adjustment > 0 ? appliedModifiers : []
    });

    objectiveTargetMap[objectiveId] = adjustedTarget;
  }

  // Derive practice targets from objective targets
  const practiceTargets: PracticeTarget[] = [];
  const PRACTICE_CEILING = 4.0; // Default ceiling for practice targets

  for (const practice of practices) {
    const objectiveTarget = objectiveTargetMap[practice.objective_id];
    if (objectiveTarget === undefined) {
      continue; // Skip practices for unknown objectives
    }

    // Start with objective target
    let practiceTarget = objectiveTarget;
    let constrainedBy: 'ceiling' | 'practice_max' | undefined;

    // Apply ceiling
    if (practiceTarget > PRACTICE_CEILING) {
      practiceTarget = PRACTICE_CEILING;
      constrainedBy = 'ceiling';
    }

    // Apply practice constraints (can't exceed available questions)
    const constraint = getPracticeConstraint(practice.id);
    let practiceMax: number | undefined;

    if (constraint) {
      practiceMax = constraint.max;
      if (practiceTarget > constraint.max) {
        practiceTarget = constraint.max;
        constrainedBy = 'practice_max';
      }
    }

    practiceTargets.push({
      practice_id: practice.id,
      objective_id: practice.objective_id,
      target: practiceTarget,
      constrainedBy,
      practiceMax
    });
  }

  return {
    persona,
    objectiveTargets,
    practiceTargets,
    modifiersApplied: appliedModifiers
  };
}

/**
 * Check if a modifier should apply based on context
 */
function shouldApplyModifier(modifier: TargetMatrixModifier, context: CompanyContext): boolean {
  const { trigger } = modifier;
  const contextValue = context[trigger.field];

  if (!contextValue) {
    return false;
  }

  return trigger.values.includes(contextValue as string);
}

/**
 * Get the maximum cap from applied modifiers
 */
function getMaxCap(
  modifiers: Record<string, TargetMatrixModifier>,
  appliedModifierIds: string[]
): number | null {
  let minCap: number | null = null;

  for (const modifierId of appliedModifierIds) {
    const modifier = modifiers[modifierId];
    if (modifier?.maxTarget !== undefined) {
      if (minCap === null || modifier.maxTarget < minCap) {
        minCap = modifier.maxTarget;
      }
    }
  }

  return minCap;
}

// ============================================
// Convenience Functions
// ============================================

/**
 * Get target for a specific objective
 */
export function getObjectiveTarget(
  objectiveId: string,
  classification: Classification,
  context: CompanyContext,
  customMatrix?: TargetMatrix
): number | null {
  const result = calculateTargets(classification, context, customMatrix);
  const target = result.objectiveTargets.find(t => t.objective_id === objectiveId);
  return target?.adjustedTarget ?? null;
}

/**
 * Get target for a specific practice
 */
export function getPracticeTarget(
  practiceId: string,
  classification: Classification,
  context: CompanyContext,
  customMatrix?: TargetMatrix
): number | null {
  const result = calculateTargets(classification, context, customMatrix);
  const target = result.practiceTargets.find(t => t.practice_id === practiceId);
  return target?.target ?? null;
}

/**
 * Get the default target matrix
 */
export function getDefaultTargetMatrix(): TargetMatrix {
  return loadTargetMatrix();
}

/**
 * Validate a custom target matrix
 */
export function validateTargetMatrix(matrix: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!matrix || typeof matrix !== 'object') {
    return { valid: false, errors: ['Matrix must be an object'] };
  }

  const m = matrix as Record<string, unknown>;

  if (!m.objectiveTargets || typeof m.objectiveTargets !== 'object') {
    errors.push('Missing or invalid objectiveTargets');
  } else {
    const validPersonas = ['platform', 'growth', 'margin', 'governance', 'stewardship', 'resilience'];
    const validObjectives = [
      'obj_budget_discipline', 'obj_financial_controls', 'obj_performance_monitoring',
      'obj_forecasting_agility', 'obj_driver_based_planning', 'obj_scenario_modeling',
      'obj_strategic_influence', 'obj_decision_support', 'obj_operational_excellence'
    ];

    for (const [persona, targets] of Object.entries(m.objectiveTargets as Record<string, unknown>)) {
      if (!validPersonas.includes(persona)) {
        errors.push(`Invalid persona: ${persona}`);
        continue;
      }

      if (!targets || typeof targets !== 'object') {
        errors.push(`Invalid targets for persona ${persona}`);
        continue;
      }

      for (const [objectiveId, value] of Object.entries(targets as Record<string, unknown>)) {
        if (!validObjectives.includes(objectiveId)) {
          errors.push(`Invalid objective ID in ${persona}: ${objectiveId}`);
        }
        if (typeof value !== 'number' || value < 1 || value > 4) {
          errors.push(`Invalid target value for ${persona}.${objectiveId}: must be 1-4`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
