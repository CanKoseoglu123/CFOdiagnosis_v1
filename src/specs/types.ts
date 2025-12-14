export interface SpecQuestion {
  id: string;
  pillar: string;
  weight: number;
  text: string;                    // Human-readable question
  is_critical?: boolean;           // If true + answer FALSE → critical risk
  trigger_action_id?: string;      // Action to trigger if this evidence fails
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
  maturityGates: MaturityGateSpec[];
  actions: ActionDefinition[];      // Hand-written expert actions
}
