// src/actions/types.ts
// VS8 — Action Plan Types
// VS20 — Dynamic Action Engine (DerivedAction)
// V2 — PrioritizedAction with P0/P1/P2

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

// V2: PrioritizedAction with P0/P1/P2 priorities
export interface PrioritizedAction {
  priority: 'P0' | 'P1' | 'P2';      // P0=unlock, P1=optimize, P2=future
  question_id: string;
  question_text: string;
  action_text: string;               // Generated action recommendation
  impact: string;                    // Why this matters
  effort: 'low' | 'medium' | 'high';
  level: number;                     // Maturity level of the question
}
