// src/maturity/types.ts
// VS7 — Maturity Engine Types
// V2: Added execution_score, potential_level, actual_level, cap logic

export interface MaturityGate {
  level: number;
  label: string;
  required_evidence_ids: string[];
  threshold?: number;  // Optional threshold (e.g., 0.8 for 80%)
}

// Legacy result (for backward compatibility)
export interface MaturityResult {
  achieved_level: number;           // 0-4, always at least 0
  achieved_label: string;           // Human-readable label for achieved level
  blocking_level: number | null;    // Next level that's blocked (null if at max)
  blocking_evidence_ids: string[];  // Evidence IDs preventing next level
}

// V2: New maturity result with execution score and cap logic
export interface MaturityResultV2 {
  execution_score: number;           // 0-100, percentage of YES answers
  potential_level: 1 | 2 | 3 | 4;    // Based on score alone (before caps)
  actual_level: 1 | 2 | 3 | 4;       // After critical caps applied
  actual_label: string;              // Human-readable label for actual level
  capped: boolean;                   // True if critical failures caused a cap
  capped_by: string[];               // Question IDs that caused the cap
  capped_reason: string | null;      // Human-readable explanation

  // Legacy compatibility fields
  blocking_level: number | null;
  blocking_evidence_ids: string[];
}

// V2: Answer type for execution score calculation
export interface Answer {
  question_id: string;
  value: boolean | 'N/A' | null | undefined;
}
