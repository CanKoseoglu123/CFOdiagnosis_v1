export type QuestionType = "string" | "number";

export interface QuestionSpec {
  id: string;
  type: QuestionType;
  required: boolean;
}

export interface Spec {
  version: string;
  questions: readonly QuestionSpec[];
}

export const SPEC: Spec = {
  version: "v2.6.4",
  questions: [
    {
      id: "annual_revenue",
      type: "number",
      required: true,
    },
  ],
};
