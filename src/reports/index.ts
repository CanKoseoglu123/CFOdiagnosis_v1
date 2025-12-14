// src/reports/index.ts
// Public API for the reports module

// Types
export type {
  FinanceReportDTO,
  PillarReportDTO,
  MaturityStatus,
  MaturityGate,
  CriticalRisk,
} from "./types";

// Builder
export { buildReport } from "./builder";
export type { BuildReportInput, DiagnosticInput } from "./builder";
