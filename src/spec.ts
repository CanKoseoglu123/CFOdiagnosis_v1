// src/spec.ts
// Re-exports the main spec for validateRun.ts compatibility
// All questions are boolean type for validation purposes

import { SPEC as SPEC_V264 } from "./specs/v2.6.4";

export type QuestionType = "string" | "number" | "boolean";

export interface QuestionSpec {
  id: string;
  type: QuestionType;
  required: boolean;
}

export interface Spec {
  version: string;
  questions: readonly QuestionSpec[];
}

// Convert the full spec questions to validation format
// All our diagnostic questions are boolean yes/no
export const SPEC: Spec = {
  version: SPEC_V264.version,
  questions: SPEC_V264.questions.map((q) => ({
    id: q.id,
    type: "boolean" as QuestionType,
    required: true,
  })),
};
