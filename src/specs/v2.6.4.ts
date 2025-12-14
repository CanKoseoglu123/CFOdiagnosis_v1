// src/specs/v2.6.4.ts

import { Spec } from "./types";

export const SPEC: Spec = {
  version: "v2.6.4",

  questions: [
    {
      id: "annual_revenue",
      pillar: "liquidity",
      weight: 1,
      text: "What is your annual revenue?",
      is_critical: false,
    },
  ],

  pillars: [
    {
      id: "liquidity",
      name: "Liquidity & Cash Management",
      weight: 1,
    },
  ],

  // 5-level maturity gates (placeholder - to be populated)
  maturityGates: [
    {
      level: 0,
      label: "Ad-hoc",
      required_evidence_ids: [], // Baseline - no requirements
    },
    {
      level: 1,
      label: "Emerging",
      required_evidence_ids: [], // TODO: Define in content phase
    },
    {
      level: 2,
      label: "Defined",
      required_evidence_ids: [], // TODO: Define in content phase
    },
    {
      level: 3,
      label: "Managed",
      required_evidence_ids: [], // TODO: Define in content phase
    },
    {
      level: 4,
      label: "Optimized",
      required_evidence_ids: [], // TODO: Define in content phase
    },
  ],
};




