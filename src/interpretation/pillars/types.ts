/**
 * VS-32: Pillar Configuration Type Definitions
 *
 * Defines the interfaces for pillar-agnostic interpretation pipeline.
 * Each pillar (FP&A, Treasury, Tax, etc.) provides its own config pack.
 */

// ============================================================
// EVIDENCE ID TYPES
// ============================================================

/**
 * Evidence ID namespace prefixes.
 * All evidence citations must use these namespaces.
 */
export type EvidenceNamespace =
  | 'obj_'      // Objective scores (obj_forecasting)
  | 'prac_'     // Practice scores (prac_driver_based)
  | 'q_'        // Question responses (q_fpa_l2_q03)
  | 'gate_'     // Gate pass/fail (gate_l2_passed)
  | 'score_'    // Aggregate scores (score_overall, score_level_3)
  | 'critical_' // Critical failures (critical_fpa_l1_q01)
  | 'imp_'      // Importance calibration (imp_forecasting=5)
  | 'ctx_'      // Context fields (ctx_industry, ctx_company_name)
  | 'clarifier_'; // Clarifier responses (clarifier_round1_q1)

/**
 * Validated evidence ID with namespace and identifier.
 */
export interface EvidenceId {
  namespace: EvidenceNamespace;
  identifier: string;
  raw: string;
}

// ============================================================
// TERMINOLOGY
// ============================================================

/**
 * Pillar-specific terminology mapping.
 * Converts generic terms to pillar-appropriate language.
 */
export interface PillarTerminology {
  /** Pillar display name (e.g., "FP&A", "Treasury") */
  pillar_name: string;

  /** What we call the assessment (e.g., "FP&A Maturity Assessment") */
  assessment_name: string;

  /** Generic → Pillar term mappings */
  terms: Record<string, string>;

  /** Phrases to always use in this pillar */
  preferred_phrases: string[];

  /** Phrases to never use in this pillar */
  forbidden_phrases: string[];

  /** Industry-specific terminology overrides */
  industry_overrides?: Record<string, Record<string, string>>;
}

// ============================================================
// GOLDEN OUTPUT PATTERNS
// ============================================================

/**
 * Golden output pattern for a report section.
 * Defines structural requirements + quality exemplars.
 */
export interface GoldenOutputPattern {
  /** Section identifier (e.g., "executive_summary") */
  section_id: string;

  /** Evidence IDs that MUST be referenced */
  required_references: string[];

  /** Types of evidence required (e.g., ["score_", "ctx_"]) */
  required_evidence_types: EvidenceNamespace[];

  /** Minimum number of evidence citations */
  min_evidence_count: number;

  /** Regex patterns that indicate hallucination */
  forbidden_patterns: string[];

  /** Example insights that demonstrate quality (for AI reference) */
  exemplar_insights: string[];

  /** Anti-patterns - what NOT to write */
  anti_patterns: string[];

  /** Context weaving requirements */
  context_weaving: {
    /** Context fields that MUST appear */
    must_use: string[];
    /** Pairs of evidence that should be connected */
    should_connect: Array<[string, string]>;
  };

  /** Fallback text when context is missing */
  fallback_if_missing: Array<{
    context_field: string;
    fallback_text: string;
  }>;
}

// ============================================================
// QUESTION EXEMPLARS
// ============================================================

/**
 * Style guide for AI-generated clarifying questions.
 * Provides examples of good question formats.
 */
export interface QuestionExemplar {
  /** Type of context this question addresses */
  context_type: string;

  /** Example Yes/No question (preferred format) */
  yes_no_example: string;

  /** Example MCQ when Yes/No is insufficient */
  mcq_example?: {
    question: string;
    options: string[];
  };

  /** When to ask this type of question */
  when_to_ask: string;

  /** Evidence types this question helps resolve */
  resolves_evidence_types?: EvidenceNamespace[];
}

// ============================================================
// NARRATIVE TEMPLATES
// ============================================================

/**
 * Templates for consultant-style narrative generation.
 */
export interface NarrativeTemplates {
  /** Situation statement templates */
  situation: string[];

  /** Challenge framing templates */
  challenge: string[];

  /** Approach description templates */
  approach: string[];

  /** Expected outcome templates */
  expected_outcome: string[];

  /** Quick win templates */
  quick_win: string[];

  /** Strategic initiative templates */
  strategic_initiative: string[];
}

// ============================================================
// CAPACITY CONFIGURATION
// ============================================================

/**
 * Capacity bands based on team size and bandwidth.
 */
export type CapacityBand = 'constrained' | 'moderate' | 'resourced';

/**
 * Capacity configuration for action planning.
 */
export interface CapacityConfig {
  /** Team size thresholds */
  team_size_thresholds: {
    small: number;  // <= this = small team
    medium: number; // <= this = medium team
    // > medium = large team
  };

  /** Bandwidth levels */
  bandwidth_levels: ('minimal' | 'limited' | 'moderate' | 'significant')[];

  /** Matrix: team_size × bandwidth → capacity_band */
  capacity_matrix: Record<string, Record<string, CapacityBand>>;

  /** Maximum initiatives per capacity band per horizon */
  max_initiatives: Record<CapacityBand, {
    '6m': number;
    '12m': number;
    '24m': number;
  }>;
}

// ============================================================
// PILLAR INTERPRETATION CONFIG
// ============================================================

/**
 * Complete configuration for a pillar's interpretation pipeline.
 * This is the main export that each pillar provides.
 */
export interface PillarInterpretationConfig {
  /** Unique pillar identifier (e.g., "fpa", "treasury") */
  pillar_id: string;

  /** Display name (e.g., "FP&A", "Treasury Management") */
  pillar_name: string;

  /** Pillar-specific terminology */
  terminology: PillarTerminology;

  /** Golden output patterns by section */
  golden_outputs: Record<string, GoldenOutputPattern>;

  /** Question style exemplars */
  question_exemplars: QuestionExemplar[];

  /** Narrative templates for action planning */
  narrative_templates: NarrativeTemplates;

  /** Default capacity caps when not specified */
  default_capacity_caps: {
    '6m': number;
    '12m': number;
    '24m': number;
  };

  /** Pillar-specific forbidden patterns (added to shared) */
  pillar_forbidden_patterns: string[];

  /** Pillar-specific anti-patterns */
  pillar_anti_patterns: string[];
}

// ============================================================
// LOOP CONFIGURATION
// ============================================================

/**
 * Configuration for the Generator → Critic → Questions loop.
 */
export interface LoopConfig {
  /** Maximum rounds of refinement */
  maxRounds: number;

  /** Maximum questions per round */
  maxQuestionsPerRound: number;

  /** Maximum total questions across all rounds */
  maxQuestionsTotal: number;

  /** Timeout per AI call in ms */
  aiCallTimeoutMs: number;

  /** Timeout for entire interpretation in ms */
  totalTimeoutMs: number;
}

/**
 * Default loop configuration.
 */
export const DEFAULT_LOOP_CONFIG: LoopConfig = {
  maxRounds: 2,
  maxQuestionsPerRound: 3,
  maxQuestionsTotal: 5,
  aiCallTimeoutMs: 60000,      // 1 minute per AI call
  totalTimeoutMs: 300000,      // 5 minutes total
};

// ============================================================
// CLARIFYING QUESTION TYPES
// ============================================================

/**
 * Type of clarifying question.
 */
export type QuestionType = 'yes_no' | 'mcq' | 'open_ended';

/**
 * AI-generated clarifying question.
 */
export interface GeneratedQuestion {
  /** Unique question ID for this session */
  id: string;

  /** The question text */
  question: string;

  /** Type of question */
  type: QuestionType;

  /** Options for MCQ (required if type is 'mcq') */
  options?: string[];

  /** Why this question is being asked */
  rationale: string;

  /** Evidence IDs this helps resolve */
  resolves_evidence: string[];

  /** Gap ID this question addresses */
  gap_id: string;

  /** Priority (1-3, 1 = highest) */
  priority: number;
}

/**
 * User's answer to a clarifying question.
 */
export interface QuestionAnswer {
  /** Question ID */
  question_id: string;

  /** User's answer */
  answer: string | boolean | number;

  /** For MCQ: selected option index */
  selected_option?: number;

  /** Optional additional context from user */
  additional_context?: string;

  /** Timestamp */
  answered_at: string;
}

// ============================================================
// GAP ASSESSMENT
// ============================================================

/**
 * Gap identified by the Critic agent.
 */
export interface GapAssessment {
  /** Unique gap ID */
  id: string;

  /** Gap category */
  category: 'missing_context' | 'weak_evidence' | 'generic_language' | 'misaligned_tone' | 'incomplete_coverage';

  /** Severity (1-5, 5 = most severe) */
  severity: number;

  /** Section where gap was found */
  section: string;

  /** Description of the gap */
  description: string;

  /** Evidence IDs related to this gap */
  related_evidence: string[];

  /** Suggested fix */
  suggested_fix: string;

  /** Can be resolved by clarifying question? */
  resolvable_by_question: boolean;

  /** Generated question for this gap (if resolvable) */
  generated_question?: GeneratedQuestion;
}

// ============================================================
// PLANNING CONTEXT
// ============================================================

/**
 * Planning questionnaire answers from the user.
 */
export interface PlanningContext {
  /** Target maturity level (1-4) */
  target_level: number;

  /** Available bandwidth */
  bandwidth: 'minimal' | 'limited' | 'moderate' | 'significant';

  /** Team size for initiatives */
  team_size: number;

  /** Primary focus areas (objective IDs) */
  focus_areas: string[];

  /** Time horizon preference */
  time_horizon: '6m' | '12m' | '24m';

  /** Any constraints or notes */
  constraints?: string;

  /** Calculated capacity band */
  capacity_band: CapacityBand;
}

// ============================================================
// ACTION PROPOSAL
// ============================================================

/**
 * Consultant-style action proposal.
 */
export interface ActionProposal {
  /** Proposal title */
  title: string;

  /** Executive summary */
  summary: string;

  /** Situation analysis */
  situation: string;

  /** Challenge statement */
  challenge: string;

  /** Recommended approach */
  approach: string;

  /** Expected outcome */
  expected_outcome: string;

  /** Quick wins (0-6 months) */
  quick_wins: ActionItem[];

  /** Strategic initiatives (6-24 months) */
  strategic_initiatives: ActionItem[];

  /** Success metrics */
  success_metrics: string[];

  /** Risk factors */
  risk_factors: string[];
}

/**
 * Individual action item in the proposal.
 */
export interface ActionItem {
  /** Action title */
  title: string;

  /** Description */
  description: string;

  /** Related objective ID */
  objective_id: string;

  /** Priority (1-5) */
  priority: number;

  /** Estimated effort */
  effort: 'low' | 'medium' | 'high';

  /** Timeline */
  timeline: string;

  /** Prerequisites */
  prerequisites: string[];

  /** Expected impact */
  impact: string;

  /** Evidence supporting this action */
  supporting_evidence: string[];
}

// ============================================================
// OVERVIEW SECTION STRUCTURE
// ============================================================

/**
 * 5-section Overview structure for VS-32.
 */
export interface OverviewSections {
  /** Executive summary with key metrics */
  executive_summary: {
    headline: string;
    maturity_level: number;
    maturity_name: string;
    overall_score: number;
    key_insight: string;
    evidence_citations: string[];
  };

  /** Current state analysis */
  current_state: {
    summary: string;
    strengths: Array<{
      title: string;
      description: string;
      evidence: string[];
    }>;
    evidence_citations: string[];
  };

  /** Critical risks from missed questions */
  critical_risks: {
    summary: string;
    risks: Array<{
      title: string;
      description: string;
      impact: string;
      evidence: string[];
    }>;
    evidence_citations: string[];
  };

  /** High-value opportunities */
  opportunities: {
    summary: string;
    items: Array<{
      title: string;
      description: string;
      potential_impact: string;
      evidence: string[];
    }>;
    evidence_citations: string[];
  };

  /** Priority rationale and next steps */
  priority_rationale: {
    synthesis: string;
    recommended_focus: string[];
    evidence_citations: string[];
  };
}
