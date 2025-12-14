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

export const SPEC: Spec = {
  version: "v2.6.4",
  questions: [
    // --- Level 1: Emerging ---
    {
      id: "fpa_annual_budget",
      type: "boolean",
      required: true,
    },
    {
      id: "fpa_budget_owner",
      type: "boolean",
      required: true,
    },

    // --- Level 2: Defined ---
    {
      id: "fpa_variance_analysis",
      type: "boolean",
      required: true,
    },
    {
      id: "fpa_rolling_forecast",
      type: "boolean",
      required: true,
    },

    // --- Level 3: Managed ---
    {
      id: "fpa_driver_based",
      type: "boolean",
      required: true,
    },
    {
      id: "fpa_scenario_modeling",
      type: "boolean",
      required: true,
    },

    // --- Level 4: Optimized ---
    {
      id: "fpa_integrated_planning",
      type: "boolean",
      required: true,
    },
    {
      id: "fpa_predictive",
      type: "boolean",
      required: true,
    },
  ],
};
