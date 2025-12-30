/**
 * VS-32: Simplified Interpretation Layer Types
 */

import { z } from 'zod';

// === Section Output ===
export interface OverviewSection {
  id: string;
  title: string;
  content: string;  // Contains [[evidence_id]] inline tags
}

// === Precompute Input (validated) ===
export const InterpretationInputSchema = z.object({
  pillar_id: z.string(),
  run_id: z.string().uuid(),
  company_name: z.string().min(1),
  industry: z.string(),

  overall_score: z.number().min(0).max(100),
  maturity_level: z.number().int().min(1).max(4),
  maturity_name: z.string(),
  is_capped: z.boolean(),
  capped_by: z.array(z.string()),

  objectives: z.array(z.object({
    id: z.string(),
    name: z.string(),
    score: z.number(),
    importance: z.number().int().min(1).max(5),
    has_critical: z.boolean(),
  })).min(1),

  critical_failures: z.array(z.object({
    question_id: z.string(),
    question_title: z.string(),
    objective_name: z.string(),
  })),

  failed_gates: z.array(z.object({
    level: z.number(),
    blocking_questions: z.array(z.string()),
  })),

  // Priority misalignments: high importance (>=4) but low score (<50)
  priority_misalignments: z.array(z.object({
    objective_name: z.string(),
    importance: z.number(),
    score: z.number(),
  })),

  evidence_ids: z.array(z.string()).min(1),
});

export type InterpretationInput = z.infer<typeof InterpretationInputSchema>;

// === Heuristics ===
export interface HeuristicViolation {
  rule: string;
  section_id: string | null;
  message: string;
  severity: 'error' | 'warning';
}

export interface HeuristicResult {
  passed: boolean;
  violations: HeuristicViolation[];
}

// === Tonality ===
export type Tonality = 'celebrate' | 'refine' | 'urgent' | 'remediate';

export function deriveTonality(score: number, hasCritical: boolean): Tonality {
  if (hasCritical) return 'urgent';
  if (score >= 80) return 'celebrate';
  if (score >= 50) return 'refine';
  return 'remediate';
}
