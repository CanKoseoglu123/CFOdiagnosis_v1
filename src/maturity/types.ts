// src/maturity/types.ts
// VS7 — Maturity Engine Types

export interface MaturityGate {
  level: number;
  label: string;
  required_evidence_ids: string[];
}

export interface MaturityResult {
  achieved_level: number;           // 0-4, always at least 0
  achieved_label: string;           // Human-readable label for achieved level
  blocking_level: number | null;    // Next level that's blocked (null if at max)
  blocking_evidence_ids: string[];  // Evidence IDs preventing next level
}
