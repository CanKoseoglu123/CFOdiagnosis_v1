// src/spec.ts
// Re-exports the main spec for validateRun.ts compatibility
// All questions are boolean type for validation purposes

import { SpecRegistry } from "./specs/registry";

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
const currentSpec = SpecRegistry.getDefault();
export const SPEC: Spec = {
  version: currentSpec.version,
  questions: currentSpec.questions.map((q) => ({
    id: q.id,
    type: "boolean" as QuestionType,
    required: true,
  })),
};
