// src/maturity/index.ts
// Public API for the maturity module

export {
  evaluateMaturity,
  calculateMaturityV2,
  calculateExecutionScore,
  getFailedCriticals
} from "./engine";

export type {
  MaturityGate,
  MaturityResult,
  MaturityResultV2,
  Answer
} from "./types";
