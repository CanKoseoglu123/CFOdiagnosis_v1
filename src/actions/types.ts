// src/actions/types.ts
// VS8 — Action Plan Types
// VS20 — Dynamic Action Engine (DerivedAction)
// V2.1 — PrioritizedAction with P1/P2/P3 and Initiative grouping
// VS21 — Objective Importance Matrix (Calibration Layer)
// VS26 — Pain Point Context Boosting

import type { ActionType } from "../specs/types";

// VS21: Importance Levels (1-5 scale)
export type ImportanceLevel = 1 | 2 | 3 | 4 | 5;
export type ImportanceMap = Record<string, ImportanceLevel>;

// VS21: Calibration data stored on diagnostic_runs
export interface CalibrationData {
  importance_map: ImportanceMap;
  locked: string[];  // objective_ids locked by Safety Valve
}

// VS21: Importance Multipliers
export const IMPORTANCE_MULTIPLIERS: Record<ImportanceLevel, number> = {
  5: 1.50,  // Critical Priority
  4: 1.25,  // High
  3: 1.00,  // Medium (default)
  2: 0.75,  // Low
  1: 0.50   // Minimal
};

// VS21: Importance Labels for UI
export const IMPORTANCE_LABELS: Record<ImportanceLevel, string> = {
  5: 'Critical Priority',
  4: 'High',
  3: 'Medium',
  2: 'Low',
  1: 'Minimal'
};

export interface ActionPlanItem {
  id: string;
  title: string;
  description: string;
  rationale: string;
  priority: "critical" | "high" | "medium";
  trigger_type: "critical_risk" | "maturity_blocker";
  evidence_id: string;
  pillar_id: string;
}

// VS20: DerivedAction — Actions derived from Objectives with computed priority
export interface DerivedAction {
  id: string;                       // Action ID from spec
  objective_id: string;             // Source objective
  objective_name: string;           // Human-readable objective name
  title: string;                    // From ActionDefinition
  description: string;              // From ActionDefinition
  rationale: string;                // From ActionDefinition
  pillar_id: string;                // From Objective
  level: number;                    // Maturity level of the objective
  derived_priority: "HIGH" | "MEDIUM";  // Computed, not hardcoded
  trigger_reason: "critical_risk" | "maturity_blocker" | "objective_incomplete";
}

// V2.1: PrioritizedAction with P1/P2/P3 priorities and score
export interface PrioritizedAction {
  priority: 'P1' | 'P2' | 'P3';      // P1=unlock, P2=optimize, P3=future
  question_id: string;
  question_text: string;
  action_text: string;               // Generated action recommendation
  action_title?: string;             // Expert action title
  action_type?: ActionType;          // quick_win, structural, behavioral, governance
  recommendation?: string;           // Expert action recommendation (how to fix)
  impact: string;                    // Why this matters
  effort: 'low' | 'medium' | 'high';
  level: number;                     // Maturity level of the question
  score: number;                     // Calculated score: (Impact² / Complexity) × 2 if Critical × ImportanceFactor × ContextModifier
  is_critical: boolean;              // Whether this is a critical question
  initiative_id?: string;            // Initiative this belongs to
  importance?: ImportanceLevel;      // VS21: Calibrated importance (1-5), default 3
  boosted_by_context?: boolean;      // VS26: Was this action boosted by pain points?
}

// V2.1: Grouped actions by initiative
export interface PrioritizedInitiative {
  initiative_id: string;
  initiative_title: string;
  initiative_description: string;
  theme_id: string;
  priority: 'P1' | 'P2' | 'P3';      // Highest priority among contained actions
  total_score: number;               // Sum of action scores
  actions: PrioritizedAction[];      // Actions within this initiative
  boosted_by_context?: boolean;      // VS26: Does this initiative contain boosted actions?
}

// VS26: Pillar context for pain point boosting
export interface PillarContext {
  pain_points?: string[];
  tools?: Array<{
    tool: string;
    effectiveness: 'low' | 'medium' | 'high';
  }>;
}
