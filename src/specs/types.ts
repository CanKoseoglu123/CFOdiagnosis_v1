/**
 * CFO Diagnostic Platform - Type Definitions
 * Version: v2.7.0
 *
 * Schema changes from v2.6.4:
 * - Added `theme` field to SpecObjective
 * - Added `purpose` field to SpecObjective
 * - Added `theme_order` field to SpecObjective
 * - Added ThemeMetadata and THEMES constant
 *
 * Backward Compatibility:
 * - Spec interface preserved for v2.6.4
 * - MaturityGateSpec preserved for v2.6.4
 * - ActionDefinition preserved for v2.6.4
 */

// =============================================================================
// PILLAR TYPES
// =============================================================================

export interface SpecPillar {
  id: string;
  name: string;
  description?: string;
  weight: number;
}

// =============================================================================
// THEME TYPES (NEW v2.7.0)
// =============================================================================

export type ThemeCode = 'foundation' | 'future' | 'intelligence';

export interface ThemeMetadata {
  code: ThemeCode;
  name: string;
  displayName: string;
  description: string;
  order: number;
}

export const THEMES: ThemeMetadata[] = [
  {
    code: 'foundation',
    name: 'The Foundation',
    displayName: 'Performance Management & Control',
    description: 'Establish baselines, ensure data integrity, and track performance against plan',
    order: 1
  },
  {
    code: 'future',
    name: 'The Future',
    displayName: 'Planning & Forecasting',
    description: 'Build forward-looking capabilities to predict and shape outcomes',
    order: 2
  },
  {
    code: 'intelligence',
    name: 'The Intelligence',
    displayName: 'Strategic Analytics',
    description: 'Leverage advanced analytics to model uncertainty and automate insights',
    order: 3
  }
];

// =============================================================================
// OBJECTIVE TYPES
// =============================================================================

export interface SpecObjective {
  id: string;
  pillar_id: string;
  level: number;
  name: string;
  purpose?: string;           // NEW v2.7.0: Purpose statement
  description: string;
  action_id?: string;
  theme?: ThemeCode;          // NEW v2.7.0: Theme grouping
  theme_order?: number;       // NEW v2.7.0: Global sort order (1-8) for UI rendering
}

// =============================================================================
// QUESTION TYPES
// =============================================================================

export interface SpecQuestion {
  id: string;
  pillar: string;
  weight: number;
  text: string;
  is_critical?: boolean;
  trigger_action_id?: string;  // DEPRECATED: use objective.action_id
  objective_id?: string;
  level?: number;
  levelLabel?: string;
  help?: string;
}

// =============================================================================
// MATURITY GATE TYPES
// =============================================================================

// v2.6.4 compatibility (uses required_evidence_ids)
export interface MaturityGateSpec {
  level: number;
  label: string;
  description?: string;
  required_evidence_ids: string[];
  threshold?: number;
}

// v2.7.0 style (uses required_question_ids)
export interface SpecMaturityGate {
  level: number;
  label: string;
  description: string;
  required_question_ids: string[];
  threshold: number;
}

// =============================================================================
// ACTION TYPES
// =============================================================================

export type ActionPriority = 'critical' | 'high' | 'medium';

// v2.6.4 compatibility
export interface ActionDefinition {
  id: string;
  title: string;
  description: string;
  rationale: string;
  priority: ActionPriority;
}

// v2.7.0 style (same structure, different name for clarity)
export interface SpecAction {
  id: string;
  title: string;
  description: string;
  rationale: string;
  priority: ActionPriority;
}

// =============================================================================
// AGGREGATE SPEC TYPES
// =============================================================================

// v2.6.4 compatibility
export interface Spec {
  version: string;
  questions: SpecQuestion[];
  pillars: SpecPillar[];
  objectives?: SpecObjective[];
  maturityGates: MaturityGateSpec[];
  actions: ActionDefinition[];
}

// v2.7.0 style
export interface AggregateSpec {
  version: string;
  pillars: SpecPillar[];
  questions: SpecQuestion[];
  maturityGates: SpecMaturityGate[];
  objectives: SpecObjective[];
  actions: SpecAction[];
  themes?: ThemeMetadata[];
}
