/**
 * VS-25: Interpretation Layer Configuration
 * Version: 5.1
 */

export const LOOP_CONFIG = {
  maxRounds: 2,              // Maximum refinement rounds (hard cap)
  maxQuestionsTotal: 5,      // Maximum questions across all rounds
  maxTokensPerSession: 20000, // Maximum tokens per session (safety limit)
  maxAICallsPerSession: 8,   // Maximum AI API calls per session
};

export const QUALITY_THRESHOLDS = {
  minContextSignals: 3,
  maxWordsPerSentence: 25,
  targetWordCount: 200,
  maxWordCount: 300,
};

export const TIMING_THRESHOLDS = {
  // Time thresholds for answer confidence detection
  freeTextSuspiciousMs: 2000,   // <2s for free text = suspicious
  mcqComplexSuspiciousMs: 1500, // <1.5s for 4+ option MCQ = suspicious
  mcqSimpleSuspiciousMs: 800,   // <0.8s for 2-3 option MCQ = suspicious
};

export const MODEL_CONFIG = {
  generator: {
    model: 'gpt-4o',           // Best quality for report writing
    temperature: 0.7,
    maxTokens: 1000,
  },
  critic: {
    model: 'gpt-4o-mini',      // Fast & cheap for assessment
    temperature: 0.3,
    maxTokens: 800,
  },
};

export const PROMPT_VERSION = 'v5.1';

export const STEP_ESTIMATES = {
  generator_draft: { step: 1, total: 8, seconds: 15 },
  quality_check: { step: 2, total: 8, seconds: 2 },
  critic_assess: { step: 3, total: 8, seconds: 10 },
  critic_questions: { step: 4, total: 8, seconds: 8 },
  awaiting_user: { step: 5, total: 8, seconds: 0 },
  generator_rewrite: { step: 6, total: 8, seconds: 12 },
  critic_final: { step: 7, total: 8, seconds: 8 },
  generator_final: { step: 8, total: 8, seconds: 10 },
};

export const FALLBACK_MESSAGE =
  'Data insufficient for automated interpretation. Please consult your partner.';
