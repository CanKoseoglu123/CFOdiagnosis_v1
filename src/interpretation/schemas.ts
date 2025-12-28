/**
 * VS-32: Zod Schemas for AI Interpretation
 *
 * Validation schemas for all interpretation pipeline data structures.
 */

import { z } from 'zod';

// ============================================================
// EVIDENCE SCHEMAS
// ============================================================

export const EvidenceNamespaceSchema = z.enum([
  'obj_', 'prac_', 'q_', 'gate_', 'score_',
  'critical_', 'imp_', 'ctx_', 'clarifier_'
]);

export const EvidenceIdSchema = z.object({
  namespace: EvidenceNamespaceSchema,
  identifier: z.string(),
  raw: z.string(),
});

// ============================================================
// QUESTION SCHEMAS
// ============================================================

export const QuestionTypeSchema = z.enum(['yes_no', 'mcq', 'open_ended']);

export const GeneratedQuestionSchema = z.object({
  id: z.string(),
  question: z.string().min(10).max(500),
  type: QuestionTypeSchema,
  options: z.array(z.string()).optional(),
  rationale: z.string().min(10).max(300),
  resolves_evidence: z.array(z.string()),
  gap_id: z.string(),
  priority: z.number().min(1).max(3),
}).refine(
  (data) => data.type !== 'mcq' || (data.options && data.options.length >= 2),
  { message: 'MCQ questions must have at least 2 options' }
);

export const QuestionAnswerSchema = z.object({
  question_id: z.string(),
  answer: z.union([z.string(), z.boolean(), z.number()]),
  selected_option: z.number().optional(),
  additional_context: z.string().optional(),
  answered_at: z.string(),
});

// ============================================================
// GAP ASSESSMENT SCHEMAS
// ============================================================

export const GapCategorySchema = z.enum([
  'missing_context',
  'weak_evidence',
  'generic_language',
  'misaligned_tone',
  'incomplete_coverage'
]);

export const GapAssessmentSchema = z.object({
  id: z.string(),
  category: GapCategorySchema,
  severity: z.number().min(1).max(5),
  section: z.string(),
  description: z.string().min(10).max(500),
  related_evidence: z.array(z.string()),
  suggested_fix: z.string().min(10).max(300),
  resolvable_by_question: z.boolean(),
  generated_question: GeneratedQuestionSchema.optional(),
});

// ============================================================
// PLANNING CONTEXT SCHEMAS
// ============================================================

export const BandwidthSchema = z.enum(['minimal', 'limited', 'moderate', 'significant']);

export const TimeHorizonSchema = z.enum(['6m', '12m', '24m']);

export const CapacityBandSchema = z.enum(['constrained', 'moderate', 'resourced']);

export const PlanningContextSchema = z.object({
  target_level: z.number().min(1).max(4),
  bandwidth: BandwidthSchema,
  team_size: z.number().min(1).max(1000),
  focus_areas: z.array(z.string()),
  time_horizon: TimeHorizonSchema,
  constraints: z.string().optional(),
  capacity_band: CapacityBandSchema,
});

// ============================================================
// ACTION PROPOSAL SCHEMAS
// ============================================================

export const EffortLevelSchema = z.enum(['low', 'medium', 'high']);

export const ActionItemSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(1000),
  objective_id: z.string(),
  priority: z.number().min(1).max(5),
  effort: EffortLevelSchema,
  timeline: z.string(),
  prerequisites: z.array(z.string()),
  impact: z.string().min(10).max(300),
  supporting_evidence: z.array(z.string()),
});

export const ActionProposalSchema = z.object({
  title: z.string().min(10).max(200),
  summary: z.string().min(50).max(500),
  situation: z.string().min(50).max(1000),
  challenge: z.string().min(50).max(1000),
  approach: z.string().min(50).max(1500),
  expected_outcome: z.string().min(50).max(1000),
  quick_wins: z.array(ActionItemSchema),
  strategic_initiatives: z.array(ActionItemSchema),
  success_metrics: z.array(z.string()),
  risk_factors: z.array(z.string()),
});

// ============================================================
// OVERVIEW SECTION SCHEMAS
// ============================================================

export const StrengthItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  evidence: z.array(z.string()),
});

export const RiskItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  impact: z.string(),
  evidence: z.array(z.string()),
});

export const OpportunityItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  potential_impact: z.string(),
  evidence: z.array(z.string()),
});

export const ExecutiveSummarySchema = z.object({
  headline: z.string().min(10).max(200),
  maturity_level: z.number().min(1).max(4),
  maturity_name: z.string(),
  overall_score: z.number().min(0).max(100),
  key_insight: z.string().min(20).max(500),
  evidence_citations: z.array(z.string()),
});

export const CurrentStateSchema = z.object({
  summary: z.string().min(50).max(1000),
  strengths: z.array(StrengthItemSchema),
  evidence_citations: z.array(z.string()),
});

export const CriticalRisksSchema = z.object({
  summary: z.string().min(20).max(500),
  risks: z.array(RiskItemSchema),
  evidence_citations: z.array(z.string()),
});

export const OpportunitiesSchema = z.object({
  summary: z.string().min(20).max(500),
  items: z.array(OpportunityItemSchema),
  evidence_citations: z.array(z.string()),
});

export const PriorityRationaleSchema = z.object({
  synthesis: z.string().min(50).max(1500),
  recommended_focus: z.array(z.string()),
  evidence_citations: z.array(z.string()),
});

export const OverviewSectionsSchema = z.object({
  executive_summary: ExecutiveSummarySchema,
  current_state: CurrentStateSchema,
  critical_risks: CriticalRisksSchema,
  opportunities: OpportunitiesSchema,
  priority_rationale: PriorityRationaleSchema,
});

// ============================================================
// LOOP CONFIGURATION SCHEMA
// ============================================================

export const LoopConfigSchema = z.object({
  maxRounds: z.number().min(1).max(5).default(2),
  maxQuestionsPerRound: z.number().min(1).max(10).default(3),
  maxQuestionsTotal: z.number().min(1).max(20).default(5),
  aiCallTimeoutMs: z.number().min(10000).max(300000).default(60000),
  totalTimeoutMs: z.number().min(60000).max(600000).default(300000),
});

// ============================================================
// INTERPRETATION SESSION SCHEMAS
// ============================================================

export const SessionStatusSchema = z.enum([
  'pending',
  'generating',
  'critiquing',
  'awaiting_user',
  'refining',
  'finalizing',
  'completed',
  'failed',
  'force_finalized'
]);

export const InterpretationRoundSchema = z.object({
  round_number: z.number().min(1),
  draft_version: z.number(),
  gaps_identified: z.array(GapAssessmentSchema),
  questions_asked: z.array(GeneratedQuestionSchema),
  questions_answered: z.array(QuestionAnswerSchema),
  quality_score: z.number().min(0).max(100).optional(),
  completed_at: z.string().optional(),
});

export const InterpretationSessionSchema = z.object({
  id: z.string().uuid(),
  run_id: z.string().uuid(),
  status: SessionStatusSchema,
  current_round: z.number().min(0),
  rounds: z.array(InterpretationRoundSchema),
  final_report: OverviewSectionsSchema.optional(),
  action_proposal: ActionProposalSchema.optional(),
  planning_context: PlanningContextSchema.optional(),
  force_finalized: z.boolean().default(false),
  force_finalize_reason: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

// ============================================================
// API REQUEST/RESPONSE SCHEMAS
// ============================================================

export const StartInterpretationRequestSchema = z.object({
  run_id: z.string().uuid(),
  planning_context: PlanningContextSchema.optional(),
});

export const SubmitAnswersRequestSchema = z.object({
  session_id: z.string().uuid(),
  answers: z.array(QuestionAnswerSchema),
});

export const InterpretationStatusResponseSchema = z.object({
  session_id: z.string().uuid(),
  status: SessionStatusSchema,
  current_round: z.number(),
  pending_questions: z.array(GeneratedQuestionSchema).optional(),
  progress_message: z.string(),
  estimated_completion: z.string().optional(),
});

export const InterpretationReportResponseSchema = z.object({
  session_id: z.string().uuid(),
  run_id: z.string().uuid(),
  overview: OverviewSectionsSchema,
  action_proposal: ActionProposalSchema.optional(),
  metadata: z.object({
    total_rounds: z.number(),
    total_questions_asked: z.number(),
    quality_score: z.number(),
    generated_at: z.string(),
    force_finalized: z.boolean(),
  }),
});

// ============================================================
// PILLAR CONFIG SCHEMAS
// ============================================================

export const PillarTerminologySchema = z.object({
  pillar_name: z.string(),
  assessment_name: z.string(),
  terms: z.record(z.string(), z.string()),
  preferred_phrases: z.array(z.string()),
  forbidden_phrases: z.array(z.string()),
  industry_overrides: z.record(z.string(), z.record(z.string(), z.string())).optional(),
});

export const GoldenOutputPatternSchema = z.object({
  section_id: z.string(),
  required_references: z.array(z.string()),
  required_evidence_types: z.array(EvidenceNamespaceSchema),
  min_evidence_count: z.number().min(0),
  forbidden_patterns: z.array(z.string()),
  exemplar_insights: z.array(z.string()),
  anti_patterns: z.array(z.string()),
  context_weaving: z.object({
    must_use: z.array(z.string()),
    should_connect: z.array(z.tuple([z.string(), z.string()])),
  }),
  fallback_if_missing: z.array(z.object({
    context_field: z.string(),
    fallback_text: z.string(),
  })),
});

export const QuestionExemplarSchema = z.object({
  context_type: z.string(),
  yes_no_example: z.string(),
  mcq_example: z.object({
    question: z.string(),
    options: z.array(z.string()),
  }).optional(),
  when_to_ask: z.string(),
  resolves_evidence_types: z.array(EvidenceNamespaceSchema).optional(),
});

export const NarrativeTemplatesSchema = z.object({
  situation: z.array(z.string()),
  challenge: z.array(z.string()),
  approach: z.array(z.string()),
  expected_outcome: z.array(z.string()),
  quick_win: z.array(z.string()),
  strategic_initiative: z.array(z.string()),
});

export const PillarInterpretationConfigSchema = z.object({
  pillar_id: z.string(),
  pillar_name: z.string(),
  terminology: PillarTerminologySchema,
  golden_outputs: z.record(z.string(), GoldenOutputPatternSchema),
  question_exemplars: z.array(QuestionExemplarSchema),
  narrative_templates: NarrativeTemplatesSchema,
  default_capacity_caps: z.object({
    '6m': z.number(),
    '12m': z.number(),
    '24m': z.number(),
  }),
  pillar_forbidden_patterns: z.array(z.string()),
  pillar_anti_patterns: z.array(z.string()),
});

// ============================================================
// TYPE EXPORTS (inferred from schemas)
// ============================================================

export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;
export type QuestionAnswer = z.infer<typeof QuestionAnswerSchema>;
export type GapAssessment = z.infer<typeof GapAssessmentSchema>;
export type PlanningContext = z.infer<typeof PlanningContextSchema>;
export type ActionProposal = z.infer<typeof ActionProposalSchema>;
export type ActionItem = z.infer<typeof ActionItemSchema>;
export type OverviewSections = z.infer<typeof OverviewSectionsSchema>;
export type InterpretationRound = z.infer<typeof InterpretationRoundSchema>;
export type InterpretationSession = z.infer<typeof InterpretationSessionSchema>;
export type SessionStatus = z.infer<typeof SessionStatusSchema>;
