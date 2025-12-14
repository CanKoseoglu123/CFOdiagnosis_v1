// src/reports/types.ts
// VS6/VS8 — Finance Report DTO Contract
// Strict typing: levels are numbers, never null (always at least 0).

import { ActionPlanItem } from "../actions/types";

// === Maturity Status ===

export interface MaturityGate {
  level: number;
  label: string; // "Ad-hoc", "Emerging", "Defined", "Managed", "Optimized"
  required_evidence_ids: string[];
}

export interface MaturityStatus {
  achieved_level: number;             // 0-4, always at least 0
  achieved_label: string;             // Human-readable label
  blocking_level: number | null;      // Next level that's blocked (null if at max)
  blocking_evidence_ids: string[];    // Evidence IDs preventing next level
  gates: MaturityGate[];              // All gate definitions from spec
}

// === Critical Risk ===

export interface CriticalRisk {
  evidence_id: string;
  question_text: string;
  pillar_id: string;
  user_answer: boolean | null; // The actual answer that triggered the risk
}

// === Pillar Report DTO ===

export interface PillarReportDTO {
  pillar_id: string;
  pillar_name: string;

  // From VS5
  score: number | null;
  scored_questions: number;
  total_questions: number;

  // Maturity — never null, status indicates readiness
  maturity: MaturityStatus;

  // Critical risks within this pillar
  critical_risks: CriticalRisk[];
}

// === Finance Report DTO (Top Level) ===

export interface FinanceReportDTO {
  run_id: string;
  spec_version: string;
  generated_at: string; // ISO timestamp

  // From VS5
  overall_score: number | null;

  // Maturity — never null, status indicates readiness
  maturity: MaturityStatus;

  // Derived from spec (is_critical + answer === false)
  critical_risks: CriticalRisk[];

  // Per-pillar breakdown
  pillars: PillarReportDTO[];

  // VS8: Prioritized action plan
  actions: ActionPlanItem[];
}
