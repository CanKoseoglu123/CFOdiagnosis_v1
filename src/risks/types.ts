// src/risks/types.ts
// VS19: Critical Risk Engine Types

/**
 * CriticalRisk - Represents a "Red Flag" issue identified by the risk engine.
 * These are independent of scoring and represent fundamental control gaps.
 */
export interface CriticalRisk {
  questionId: string;
  questionText: string;
  pillarId: string;
  pillarName: string;
  severity: "CRITICAL";
}

/**
 * DiagnosticInput - Raw user answer from the database.
 * Used as input to the risk engine.
 */
export interface DiagnosticInput {
  question_id: string;
  value: unknown;
}
