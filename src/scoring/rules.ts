import { ScoringRule } from "./types";

/**
 * Scoring Rules for FP&A Pillar
 * 
 * All FP&A questions are boolean (yes/no evidence).
 * TRUE = 1.0, FALSE = 0.0
 */

// Helper for boolean questions
const booleanScore = (value: boolean): number => (value === true ? 1.0 : 0.0);

export const scoringRules: Array<ScoringRule<any>> = [
  // --- Level 1: Emerging ---
  {
    question_id: "fpa_annual_budget",
    score: booleanScore,
  },
  {
    question_id: "fpa_budget_owner",
    score: booleanScore,
  },

  // --- Level 2: Defined ---
  {
    question_id: "fpa_variance_analysis",
    score: booleanScore,
  },
  {
    question_id: "fpa_rolling_forecast",
    score: booleanScore,
  },

  // --- Level 3: Managed ---
  {
    question_id: "fpa_driver_based",
    score: booleanScore,
  },
  {
    question_id: "fpa_scenario_modeling",
    score: booleanScore,
  },

  // --- Level 4: Optimized ---
  {
    question_id: "fpa_integrated_planning",
    score: booleanScore,
  },
  {
    question_id: "fpa_predictive",
    score: booleanScore,
  },
];
