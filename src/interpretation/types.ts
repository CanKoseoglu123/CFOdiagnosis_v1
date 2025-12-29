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
  previous_draft?: DraftReport | OverviewSection[];
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

// ============================================================
// VS-32a: GENERATOR-ONLY INTERPRETATION
// ============================================================

export interface AIInterpretationInput {
  run_id: string;
  pillar_id: string;
  pillar_name: string;
  company_name: string;
  industry: string;
  finance_team_size: number | null;
  pain_points: string[] | null;

  // VS-32c: Optional diagnostic answers for critic context
  diagnostic_answers?: Array<{
    question_id: string;
    question_text: string;
    answer: string;
  }>;

  execution_score: number;
  maturity_level: 1 | 2 | 3 | 4;
  level_name: string;
  capped: boolean;
  capped_by: string[];

  objectives: Array<{
    id: string;
    name: string;
    score: number;
    importance: 1 | 2 | 3 | 4 | 5;
    has_critical_failure: boolean;
  }>;

  failed_gates: Array<{
    level: number;
    blocking_questions: Array<{ id: string; title: string }>;
  }>;

  critical_failures: Array<{
    question_id: string;
    question_title: string;
    objective_name: string;
  }>;

  priority_misalignments: Array<{
    objective_name: string;
    importance: number;
    score: number;
  }>;

  top_strengths: Array<{ objective_name: string; score: number }>;
  top_weaknesses: Array<{ objective_name: string; score: number }>;

  available_evidence: string[];
}

export type OverviewSectionId =
  | 'execution_snapshot'
  | 'priority_alignment'
  | 'strengths_weaknesses'
  | 'next_level_unlock'
  | 'capacity_check';

export interface OverviewSection {
  id: OverviewSectionId;
  title: string;
  content: string;
  format: 'prose' | 'bullets';
  bullets?: string[];
  evidence_ids: string[];
}

export type InterpretationReportStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface InterpretationReportRecord {
  id: string;
  run_id: string;
  version: number;
  status: InterpretationReportStatus;
  overview_sections: OverviewSection[] | null;
  error_message: string | null;
  model_used: string | null;
  tokens_used: number | null;
  heuristics_result: VS32bHeuristicResult | null;
  generation_attempts: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// VS-32b: QUALITY HEURISTICS LAYER
// ============================================================

export type VS32bHeuristicSeverity = 'red' | 'yellow';

export interface VS32bHeuristicViolation {
  section_id: string | null;
  rule: string;
  message: string;
  severity: VS32bHeuristicSeverity;
}

export interface VS32bHeuristicResult {
  passed: boolean;
  violations: VS32bHeuristicViolation[];
  red_count: number;
  yellow_count: number;
}

export interface GeneratorOverviewResult {
  sections: OverviewSection[];
  tokensUsed: number;
  heuristics: VS32bHeuristicResult;
  attempts: number;
}

// ============================================================
// VS-32c: CRITIC & CLARIFYING QUESTIONS
// ============================================================

export type VS32cPipelineStage =
  | 'pending'
  | 'generating'
  | 'heuristics'
  | 'critic'
  | 'awaiting_answers'
  | 'rewriting'
  | 'completed'
  | 'failed';

export interface VS32cGeneratedQuestion {
  question_id: string;
  gap_id: string;
  question_text: string;
  question_type: 'yes_no' | 'mcq';
  options?: string[];
  context_field: string;
  rationale: string;
  related_diagnostic_questions: string[];
  why_not_covered: string;
}

export interface VS32cClarifierAnswer {
  question_id: string;
  question_text: string;
  answer: boolean | string;
  evidence_id: string;
  answered_at: string;
}

export interface VS32cGap {
  gap_id: string;
  section_id: string;
  gap_type: 'structural' | 'quality' | 'context';
  description: string;
  fixable_by: 'rewrite' | 'clarifying_question';
}

export interface VS32cCriticAssessment {
  gaps: VS32cGap[];
  overall_quality: 'green' | 'yellow' | 'red';
  rewrite_instructions: string[];
  generated_questions: VS32cGeneratedQuestion[];
}

export interface VS32cPipelineState {
  run_id: string;
  session_id: string;
  current_stage: VS32cPipelineStage;
  loop_round: number;
  total_questions_asked: number;
  overview_sections: OverviewSection[] | null;
  pending_questions: VS32cGeneratedQuestion[] | null;
  clarifier_answers: VS32cClarifierAnswer[];
  quality_status: 'green' | 'yellow' | 'red';
  heuristics_result: VS32bHeuristicResult | null;
  error_message?: string;
}

export interface VS32cDiagnosticAnswer {
  question_id: string;
  question_text: string;
  answer: string;
}

export interface VS32cAIInterpretationInput extends AIInterpretationInput {
  diagnostic_answers: VS32cDiagnosticAnswer[];
  clarifier_answers?: VS32cClarifierAnswer[];
}

export interface GoldenOutputPattern {
  section_id: string;
  required_evidence_types: string[];
  min_evidence_count: number;
  exemplar_insights: string[];
  anti_patterns: string[];
  context_requirements: string[];
}

export interface QuestionExemplar {
  context_type: string;
  yes_no_example: string;
  mcq_example?: {
    question: string;
    options: string[];
  };
  when_to_ask: string;
}

// ============================================================
// VS-32d: ACTION PLANNING TAB
// ============================================================

export interface PlanningContext {
  target_maturity_level: 1 | 2 | 3 | 4 | null;
  bandwidth: 'limited' | 'moderate' | 'available' | null;
  priority_focus: string[];
  team_size_override: number | null;
}

export interface CapacityResult {
  band: 'low' | 'medium' | 'high';
  max_actions: {
    '6m': number;
    '12m': number;
    '24m': number;
  };
  assumed: boolean;
}

export interface ActionRationale {
  why_selected: string;
  why_this_timeline: string;
  expected_impact: string;
}

export interface ProposedAction {
  question_id: string;
  action_title: string;
  action_recommendation: string;
  timeline: '6m' | '12m' | '24m';
  rationale: ActionRationale;
  evidence_ids: string[];
  priority_rank: number;
  is_critical: boolean;
  is_gate_blocker: boolean;
}

export interface ActionNarrative {
  situation: string;
  challenge: string;
  approach: string;
  expected_outcome: string;
}

export interface ActionPlanProposal {
  narrative: ActionNarrative;
  actions: ProposedAction[];
  summary: {
    total_actions: number;
    by_timeline: { '6m': number; '12m': number; '24m': number };
    addresses_critical: number;
    unlocks_gates: number;
  };
  generated_at: string;
  model: string;
}

export interface CandidateAction {
  question_id: string;
  question_title: string;
  objective_id: string;
  objective_name: string;
  objective_score: number;
  expert_action: {
    title: string;
    recommendation: string;
  };
  is_critical: boolean;
  is_gate_blocker: boolean;
  level: number;
}
