/**
 * VS-32: Interpretation Layer Types
 * Version: 6.0
 *
 * Updated with pillar-agnostic structures and evidence ID taxonomy.
 */

// Import pillar types for use in this file
import type { PillarInterpretationConfig } from './pillars/types';

// Re-export pillar types
export * from './pillars/types';

// ============================================================
// SESSION TYPES
// ============================================================

export type SessionStatus =
  | 'pending'
  | 'generating'
  | 'awaiting_user'
  | 'finalizing'
  | 'complete'
  | 'failed';

export interface InterpretationSession {
  id: string;
  run_id: string;
  status: SessionStatus;
  current_round: number;
  total_questions_asked: number;
  is_anonymized: boolean;
  total_tokens: number;
  total_cost_cents: number;
  user_rating: number | null;
  user_feedback: string | null;
  retention_policy: '30_days' | '90_days' | 'indefinite';
  created_at: string;
  completed_at: string | null;
}

// ============================================================
// DIAGNOSTIC DATA (Input to interpretation)
// ============================================================

export interface ObjectiveScore {
  id: string;
  name: string;
  score: number;
  has_critical_failure: boolean;
  importance: number;
  level: number;
}

export interface Initiative {
  id: string;
  title: string;
  recommendation: string;
  priority: 'P1' | 'P2' | 'P3';
  objective_id: string;
}

export interface DiagnosticData {
  run_id: string;
  company_name: string;
  industry: string;
  team_size?: string;
  pain_points?: string[];
  systems?: string;
  execution_score: number;
  maturity_level: number;
  level_name: string;
  capped: boolean;
  capped_by_titles: string[];
  objectives: ObjectiveScore[];
  initiatives: Initiative[];
  critical_risks: Array<{
    id: string;
    title: string;
    objective_id: string;
  }>;
}

// ============================================================
// DRAFT REPORT (Generator Output) - VS-32 Updated
// ============================================================

/**
 * Legacy DraftReport for backwards compatibility.
 * @deprecated Use OverviewSections for new implementations.
 */
export interface DraftReport {
  synthesis: string;
  priority_rationale: string;
  key_insight: string;
  gaps_marked: string[];
}

/**
 * VS-32: New 5-section overview structure.
 */
export interface OverviewSections {
  executive_summary: string;
  current_state: string;
  critical_risks: string;
  opportunities: string;
  priority_rationale: string;
  evidence_ids_used: string[];
  gaps_marked: string[];
}

/**
 * VS-32: Enhanced interpreted report with evidence tracking.
 */
export interface InterpretedReport {
  // Legacy fields for backwards compatibility
  synthesis: string;
  priority_rationale: string;
  key_insight: string;
  // New VS-32 fields
  overview?: OverviewSections;
  evidence_ids_used?: string[];
}

// ============================================================
// GAP & QUESTION TYPES - VS-32 Updated
// ============================================================

export interface Gap {
  gap_id: string;
  description: string;
  objective_id: string;
  why_needed?: string;
  /** VS-32: Evidence IDs related to this gap */
  related_evidence_ids?: string[];
  /** VS-32: Severity level for prioritization (1-5) */
  severity?: number;
}

export interface PrioritizedGap extends Gap {
  priority_score: number;
}

/**
 * VS-32: Question types - Yes/No preferred (70%), MCQ when needed, free text as last resort.
 */
export type QuestionType = 'yes_no' | 'mcq' | 'free_text';

export interface InterpretationQuestion {
  question_id: string;
  gap_id: string;
  objective_id: string;
  question: string;
  /** VS-32: Updated to prefer yes_no questions */
  type: QuestionType;
  options: string[] | null;
  max_length: number | null;
  /** VS-32: Explain why this question is being asked */
  rationale?: string;
  /** VS-32: Evidence IDs this question will help resolve */
  resolves_evidence_ids?: string[];
}

export interface QuestionAnswer {
  question_id: string;
  question: string;
  answer: string;
  time_to_answer_ms?: number;
  confidence?: 'high' | 'low' | 'unknown';
}

// ============================================================
// QUALITY ASSESSMENT
// ============================================================

export type QualityStatus = 'green' | 'yellow' | 'red';

export interface CriterionResult {
  passed: boolean;
  warnings: string[];
}

export interface HeuristicResult {
  overall: QualityStatus;
  criteria: {
    accurate: CriterionResult;
    contextual: CriterionResult;
    actionable: CriterionResult;
    complete: CriterionResult;
  };
  heuristic_warnings: string[];
  publish_anyway: boolean;
}

// ============================================================
// AGENT INPUTS - VS-32 Updated with Pillar Support
// ============================================================

export interface GeneratorInput {
  company_name: string;
  industry: string;
  team_size?: string;
  pain_points?: string[];
  systems?: string;
  execution_score: number;
  maturity_level: number;
  level_name: string;
  capped: boolean;
  capped_by_titles: string[];
  objectives: ObjectiveScore[];
  top_initiatives: Initiative[];
  tonality_instructions: string;
  /** VS-32: Pillar configuration for pillar-agnostic generation */
  pillar_config?: PillarInterpretationConfig;
  /** VS-32: Round number for iterative refinement */
  round_number?: number;
  /** VS-32: Previous answers from clarifying questions */
  clarifier_answers?: QuestionAnswer[];
}

export interface RewriteInput {
  previous_draft: DraftReport;
  answers: QuestionAnswer[];
  context: DiagnosticData;
}

export interface CriticAssessInput {
  draft: DraftReport;
  context: DiagnosticData;
  /** VS-32: Pillar configuration for validation */
  pillar_config?: PillarInterpretationConfig;
  /** VS-32: Round number */
  round_number?: number;
}

export interface CriticQuestionsInput {
  prioritized_gaps: PrioritizedGap[];
  /** VS-32: Pillar configuration for question style */
  pillar_config?: PillarInterpretationConfig;
  /** VS-32: Questions already asked (to avoid repetition) */
  questions_asked_so_far?: InterpretationQuestion[];
  /** VS-32: Total questions budget remaining */
  questions_budget?: number;
}

export interface CriticFinalInput {
  draft: DraftReport;
  /** VS-32: Pillar configuration for final check */
  pillar_config?: PillarInterpretationConfig;
}

// ============================================================
// AGENT OUTPUTS
// ============================================================

export interface CriticAssessOutput {
  gaps: Gap[];
}

export interface CriticQuestionsOutput {
  questions: InterpretationQuestion[];
}

export interface CriticFinalOutput {
  ready: boolean;
  edits: Array<{
    location: string;
    issue: string;
    fix: string;
  }>;
}

// ============================================================
// API TYPES
// ============================================================

export interface StartInterpretationResponse {
  session_id: string;
  message: string;
  poll_url: string;
}

export interface StatusResponse {
  session_id: string;
  status: SessionStatus;
  progress: {
    current_step: string;
    steps_completed: number;
    steps_total: number;
    estimated_seconds_remaining: number;
  };
  questions?: InterpretationQuestion[];
  report_ready?: boolean;
}

export interface AnswerRequest {
  answers: Array<{
    question_id: string;
    answer: string;
    time_to_answer_ms: number;
  }>;
}

export interface FeedbackRequest {
  rating: number;
  feedback?: string;
}

// ============================================================
// STEP LOGGING
// ============================================================

export type StepType =
  | 'generator_draft'
  | 'quality_check'
  | 'critic_assess'
  | 'critic_questions'
  | 'generator_rewrite'
  | 'critic_final'
  | 'generator_final';

export interface StepLog {
  session_id: string;
  step_type: StepType;
  round_number: number;
  agent: 'generator' | 'critic' | 'code';
  prompt_version: string;
  model: string;
  prompt_sent: string;
  system_prompt?: string;
  tonality_injected?: Record<string, string>;
  context_injected?: Record<string, unknown>;
  raw_response: string;
  output: unknown;
  tokens_input: number;
  tokens_output: number;
  latency_ms: number;
  temperature?: number;
  previous_draft?: DraftReport;
  quality_gate_result?: HeuristicResult;
}

// ============================================================
// CONVERSATION LOGGING
// ============================================================

export interface ConversationLog {
  session_id: string;
  sequence_number: number;
  agent: 'generator' | 'critic';
  role: 'draft' | 'assess' | 'questions' | 'rewrite' | 'feedback' | 'finalize';
  prompt_sent: string;
  response_received: string;
  input_from_previous?: unknown;
  output_to_next?: unknown;
}

// ============================================================
// FINAL REPORT OUTPUT
// ============================================================

export interface FinalReportOutput {
  session_id: string;
  run_id: string;
  report: InterpretedReport;
  word_count: number;
  rounds_used: number;
  questions_answered: number;
  quality_status: QualityStatus;
  quality_compromised: boolean;
  heuristic_warnings: string[];
}
