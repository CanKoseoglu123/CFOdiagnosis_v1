export interface SpecQuestion {
  id: string;
  pillar: string;
  weight: number;
  text: string;                    // Human-readable question
  is_critical?: boolean;           // If true + answer FALSE → critical risk
  trigger_action_id?: string;      // Action to trigger if this evidence fails (DEPRECATED: use objective.action_id)
  objective_id?: string;           // VS20: Link to parent objective
  level?: number;                  // Maturity level (1-4)
  levelLabel?: string;             // "Emerging", "Defined", etc.
  help?: string;                   // Help text for frontend
}

// VS20: Introduced Objective layer per Spec Section 1
// Objectives group related questions and attach actions at this level
export interface SpecObjective {
  id: string;
  pillar_id: string;               // Parent pillar
  level: number;                   // Maturity level (1-4)
  name: string;                    // Human-readable name, e.g., "Budget Foundation"
  description: string;             // What this objective represents
  action_id?: string;              // Action to trigger if objective not met
}

export interface SpecPillar {
  id: string;
  name: string;                    // Human-readable name
  weight: number;
}

export interface MaturityGateSpec {
  level: number;
  label: string;                    // "Ad-hoc", "Emerging", etc.
  required_evidence_ids: string[];  // Questions that must be TRUE
}

export interface ActionDefinition {
  id: string;
  title: string;
  description: string;
  rationale: string;
  priority: "critical" | "high" | "medium";
}

export interface Spec {
  version: string;
  questions: SpecQuestion[];
  pillars: SpecPillar[];
  objectives?: SpecObjective[];     // VS20: Objective layer between pillars and questions (optional for backward compat)
  maturityGates: MaturityGateSpec[];
  actions: ActionDefinition[];      // Hand-written expert actions
}
