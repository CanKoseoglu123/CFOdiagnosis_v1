/**
 * VS-32a: Zod Validation Schemas for AI Interpretation
 *
 * Validates AI responses to ensure they conform to the expected structure.
 */

import { z } from 'zod';

export const SectionIdSchema = z.enum([
  'execution_snapshot',
  'priority_alignment',
  'strengths_weaknesses',
  'next_level_unlock',
  'capacity_check',
]);

export const OverviewSectionSchema = z.object({
  id: SectionIdSchema,
  title: z.string(),
  content: z.string().max(800),
  format: z.enum(['prose', 'bullets']),
  bullets: z.array(z.string().max(200)).max(6).optional(),
  evidence_ids: z.array(z.string()).min(1),
});

export const GeneratorResponseSchema = z.object({
  sections: z.array(OverviewSectionSchema).length(5),
});

export type ValidatedSection = z.infer<typeof OverviewSectionSchema>;
export type ValidatedResponse = z.infer<typeof GeneratorResponseSchema>;

// ============================================================
// VS-32c: Critic & Clarifying Questions Schemas
// ============================================================

export const VS32cGeneratedQuestionSchema = z.object({
  question_id: z.string(),
  gap_id: z.string(),
  question_text: z.string(),
  question_type: z.enum(['yes_no', 'mcq']),
  options: z.array(z.string()).min(2).max(6).optional(),
  context_field: z.string(),
  rationale: z.string(),
  related_diagnostic_questions: z.array(z.string()),
  why_not_covered: z.string(),
});

export const VS32cGapSchema = z.object({
  gap_id: z.string(),
  section_id: z.string(),
  gap_type: z.enum(['structural', 'quality', 'context']),
  description: z.string(),
  fixable_by: z.enum(['rewrite', 'clarifying_question']),
});

export const VS32cCriticAssessmentSchema = z.object({
  gaps: z.array(VS32cGapSchema),
  overall_quality: z.enum(['green', 'yellow', 'red']),
  rewrite_instructions: z.array(z.string()),
  generated_questions: z.array(VS32cGeneratedQuestionSchema),
});

export const VS32cAnswerSubmissionSchema = z.object({
  question_id: z.string(),
  answer: z.union([z.boolean(), z.string()]),
});

export type ValidatedVS32cGeneratedQuestion = z.infer<typeof VS32cGeneratedQuestionSchema>;
export type ValidatedVS32cGap = z.infer<typeof VS32cGapSchema>;
export type ValidatedVS32cCriticAssessment = z.infer<typeof VS32cCriticAssessmentSchema>;
export type ValidatedVS32cAnswerSubmission = z.infer<typeof VS32cAnswerSubmissionSchema>;

// ============================================================
// VS-32d: Action Planning Schemas
// ============================================================

export const PlanningContextSchema = z.object({
  target_maturity_level: z.number().int().min(1).max(4).nullable(),
  bandwidth: z.enum(['limited', 'moderate', 'available']).nullable(),
  priority_focus: z.array(z.string()),
  team_size_override: z.number().int().min(1).nullable(),
});

export const ActionRationaleSchema = z.object({
  why_selected: z.string().max(200),
  why_this_timeline: z.string().max(150),
  expected_impact: z.string().max(150),
});

export const ProposedActionSchema = z.object({
  question_id: z.string(),
  action_title: z.string(),
  action_recommendation: z.string(),
  timeline: z.enum(['6m', '12m', '24m']),
  rationale: ActionRationaleSchema,
  evidence_ids: z.array(z.string()).min(1),
  priority_rank: z.number().int().min(1),
  is_critical: z.boolean(),
  is_gate_blocker: z.boolean(),
});

export const ActionNarrativeSchema = z.object({
  situation: z.string().max(400),
  challenge: z.string().max(400),
  approach: z.string().max(400),
  expected_outcome: z.string().max(400),
});

export const ActionPlanProposalSchema = z.object({
  narrative: ActionNarrativeSchema,
  actions: z.array(ProposedActionSchema),
  summary: z.object({
    total_actions: z.number(),
    by_timeline: z.object({
      '6m': z.number(),
      '12m': z.number(),
      '24m': z.number(),
    }),
    addresses_critical: z.number(),
    unlocks_gates: z.number(),
  }),
});

export type ValidatedPlanningContext = z.infer<typeof PlanningContextSchema>;
export type ValidatedActionRationale = z.infer<typeof ActionRationaleSchema>;
export type ValidatedProposedAction = z.infer<typeof ProposedActionSchema>;
export type ValidatedActionNarrative = z.infer<typeof ActionNarrativeSchema>;
export type ValidatedActionPlanProposal = z.infer<typeof ActionPlanProposalSchema>;
