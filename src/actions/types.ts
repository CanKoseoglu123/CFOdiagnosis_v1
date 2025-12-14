// src/actions/types.ts
// VS8 — Action Plan Types

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
