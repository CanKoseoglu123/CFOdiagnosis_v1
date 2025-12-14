// src/types/report.ts
// VS6 — Finance Report DTO Contract
// These types define the JSON shape consumed by the frontend.

// === Maturity Status ===

export interface MaturityGate {
  level: number;
  label: string; // "Ad-hoc", "Emerging", "Defined", "Managed", "Optimized"
  required_evidence_ids: string[];
}

export interface MaturityStatus {
  achieved_level: number | "NOT_CALCULATED"; // Defaults to "NOT_CALCULATED" until VS7
  blocking_evidence_ids: string[];           // Empty array until VS7
  gates: MaturityGate[];                     // Always populated from spec
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

  // Placeholder until VS7 — never null
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

  // Placeholder until VS7 — never null, defaults to NOT_CALCULATED
  maturity: MaturityStatus;

  // Derived from spec (is_critical + FALSE answer)
  critical_risks: CriticalRisk[];

  // Per-pillar breakdown
  pillars: PillarReportDTO[];
}
