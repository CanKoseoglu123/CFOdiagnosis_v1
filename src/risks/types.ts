// src/risks/types.ts
// VS19: Critical Risk Engine Types
// VS22-v3: Added expert_action for gap titles

import { ExpertAction } from "../specs/types";

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
  level: number;                    // VS22-v3: Maturity level of the question
  expert_action?: ExpertAction;     // VS22-v3: Expert action for gap title/recommendation
}

/**
 * DiagnosticInput - Raw user answer from the database.
 * Used as input to the risk engine.
 */
export interface DiagnosticInput {
  question_id: string;
  value: unknown;
}
