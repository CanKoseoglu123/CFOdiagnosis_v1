/**
 * CFO Diagnostic Platform - Type Definitions
 * Version: v2.9.0
 *
 * Schema changes from v2.8.1:
 * - v2.9.0: Questions now link to practices via `practice_id`
 * - v2.9.0: Added SpecPractice interface
 * - v2.9.0: Added `practices` to Spec interface
 * - v2.9.0: objective_id is now derived from practice → objective relationship
 *
 * Backward Compatibility:
 * - objective_id is still included on SpecQuestion (derived at runtime)
 * - All existing v2.8.x APIs remain compatible
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
// INITIATIVE TYPES (V2.1)
// =============================================================================

export type ActionType = 'quick_win' | 'structural' | 'behavioral' | 'governance';

export interface ExpertAction {
  title: string;
  recommendation: string;
  type: ActionType;
}

export interface Initiative {
  id: string;
  title: string;
  description: string;
  theme_id: ThemeCode;
  objective_id: string;
}

// =============================================================================
// PRACTICE TYPES (v2.9.0)
// =============================================================================

export interface SpecPractice {
  id: string;
  objective_id: string;
  title: string;
  capability_tags?: string[];
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
  objective_id?: string;       // v2.9.0: Now derived from practice → objective
  practice_id?: string;        // v2.9.0: Direct link to practice
  level?: number;
  levelLabel?: string;
  help?: string;
  // V2.1 Initiative Engine fields
  initiative_id?: string;
  impact?: 1 | 2 | 3 | 4 | 5;
  complexity?: 1 | 2 | 3 | 4 | 5;
  expert_action?: ExpertAction;
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

// v2.9.0 Spec interface
export interface Spec {
  version: string;
  questions: SpecQuestion[];
  pillars: SpecPillar[];
  objectives?: SpecObjective[];
  maturityGates: MaturityGateSpec[];
  actions: ActionDefinition[];
  initiatives?: Initiative[];  // V2.1 Initiative Engine
  practices?: SpecPractice[];  // v2.9.0: question → practice → objective
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
