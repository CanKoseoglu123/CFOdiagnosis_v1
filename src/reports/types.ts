// src/reports/types.ts
// VS6/VS8 — Finance Report DTO Contract
// Strict typing: levels are numbers, never null (always at least 0).
// V2: Added ObjectiveScore, execution_score, potential_level, actual_level

import { ActionPlanItem, DerivedAction, PrioritizedAction } from "../actions/types";

// === Maturity Status ===

export interface MaturityGate {
  level: number;
  label: string; // "Ad-hoc", "Emerging", "Defined", "Managed", "Optimized"
  required_evidence_ids: string[];
}

// Legacy MaturityStatus (for backward compatibility)
export interface MaturityStatus {
  achieved_level: number;             // 0-4, always at least 0
  achieved_label: string;             // Human-readable label
  blocking_level: number | null;      // Next level that's blocked (null if at max)
  blocking_evidence_ids: string[];    // Evidence IDs preventing next level
  gates: MaturityGate[];              // All gate definitions from spec
}

// V2: Extended MaturityStatus with execution score and cap logic
export interface MaturityStatusV2 extends MaturityStatus {
  execution_score: number;            // 0-100, percentage of YES answers
  potential_level: number;            // 1-4, based on score alone
  actual_level: number;               // 1-4, after caps applied
  capped: boolean;                    // True if critical failures caused a cap
  capped_by: string[];                // Question IDs that caused the cap
  capped_reason: string | null;       // Human-readable explanation
}

// === Objective Score (V2) ===

export interface ObjectiveScore {
  objective_id: string;
  objective_name: string;
  level: number;                      // Maturity level (1-4)
  score: number;                      // 0-100
  status: 'green' | 'yellow' | 'red'; // Traffic light
  overridden: boolean;                // True if critical override applied
  override_reason: string | null;     // Tooltip text if overridden
  questions_total: number;
  questions_passed: number;
  failed_criticals: string[];         // IDs of failed criticals in this objective
}

// === Critical Risk ===
// VS19: Updated to include severity and pillar_name

export interface CriticalRisk {
  evidence_id: string;
  question_text: string;
  pillar_id: string;
  pillar_name: string;              // VS19: Added for display
  severity: "CRITICAL";             // VS19: Always CRITICAL for now
  user_answer: boolean | null;      // The actual answer that triggered the risk
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

  // VS8: Prioritized action plan (legacy, question-based)
  actions: ActionPlanItem[];

  // VS20: Objective-based derived actions (priority computed, not hardcoded)
  derived_actions?: DerivedAction[];

  // V2: Extended maturity with execution score and cap logic
  maturity_v2?: MaturityStatusV2;

  // V2: Objective-level traffic lights
  objectives?: ObjectiveScore[];

  // V2: P0/P1/P2 prioritized actions
  prioritized_actions?: PrioritizedAction[];
}
