/**
 * VS-25: Interpretation Layer Types
 * Version: 5.1
 */

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
// DRAFT REPORT (Generator Output)
// ============================================================

export interface DraftReport {
  synthesis: string;
  priority_rationale: string;
  key_insight: string;
  gaps_marked: string[];
}

export interface InterpretedReport {
  synthesis: string;
  priority_rationale: string;
  key_insight: string;
}

// ============================================================
// GAP & QUESTION TYPES
// ============================================================

export interface Gap {
  gap_id: string;
  description: string;
  objective_id: string;
  why_needed?: string;
}

export interface PrioritizedGap extends Gap {
  priority_score: number;
}

export interface InterpretationQuestion {
  question_id: string;
  gap_id: string;
  objective_id: string;
  question: string;
  type: 'mcq' | 'free_text';
  options: string[] | null;
  max_length: number | null;
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
// AGENT INPUTS
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
}

export interface RewriteInput {
  previous_draft: DraftReport;
  answers: QuestionAnswer[];
  context: DiagnosticData;
}

export interface CriticAssessInput {
  draft: DraftReport;
  context: DiagnosticData;
}

export interface CriticQuestionsInput {
  prioritized_gaps: PrioritizedGap[];
}

export interface CriticFinalInput {
  draft: DraftReport;
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
