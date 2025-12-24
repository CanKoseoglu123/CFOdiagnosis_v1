-- VS-25: Interpretation Layer Database Schema
-- Version: 5.1
-- Date: December 24, 2025

-- ============================================================
-- INTERPRETATION SESSIONS
-- ============================================================

CREATE TABLE interpretation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES diagnostic_runs(id),

  status TEXT NOT NULL DEFAULT 'pending',
  -- pending | generating | awaiting_user | finalizing | complete | failed

  current_round INTEGER DEFAULT 0,
  total_questions_asked INTEGER DEFAULT 0,

  -- Privacy
  is_anonymized BOOLEAN DEFAULT FALSE,

  -- Metrics
  total_tokens INTEGER DEFAULT 0,
  total_cost_cents INTEGER DEFAULT 0,

  -- User feedback
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  user_feedback TEXT,

  -- Data retention
  retention_policy TEXT DEFAULT '30_days',
  -- '30_days' | '90_days' | 'indefinite'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  UNIQUE(run_id)
);

-- ============================================================
-- INTERPRETATION STEPS (Full AI Interaction Log)
-- ============================================================

CREATE TABLE interpretation_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interpretation_sessions(id) ON DELETE CASCADE,

  step_type TEXT NOT NULL,
  -- generator_draft | quality_check_0 | critic_assess_0 | critic_questions_0 |
  -- generator_rewrite_0 | critic_final | generator_final

  round_number INTEGER,
  agent TEXT,  -- 'generator' | 'critic' | 'code'

  -- Versioning
  prompt_version TEXT,
  model TEXT,

  -- FULL AI INTERACTION LOG (for learning & fine-tuning)
  prompt_sent TEXT,              -- Complete prompt with all injections
  system_prompt TEXT,            -- System prompt used
  tonality_injected JSONB,       -- Tonality instructions per objective
  context_injected JSONB,        -- Company context that was included

  -- Outputs
  raw_response TEXT,             -- Raw AI response before parsing
  output JSONB,                  -- Parsed structured output

  -- Quality tracking
  quality_gate_input JSONB,      -- What was checked
  quality_gate_result JSONB,     -- Pass/fail per criterion

  -- For rewrites: what changed
  previous_draft JSONB,          -- Draft before this step
  draft_diff JSONB,              -- Structured diff showing changes

  -- Metrics
  tokens_input INTEGER,
  tokens_output INTEGER,
  latency_ms INTEGER,
  temperature FLOAT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AI CONVERSATION FLOW (Dedicated table for easier querying)
-- ============================================================

CREATE TABLE interpretation_ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interpretation_sessions(id) ON DELETE CASCADE,

  -- Conversation sequence
  sequence_number INTEGER NOT NULL,  -- 1, 2, 3...

  -- The exchange
  agent TEXT NOT NULL,               -- 'generator' | 'critic'
  role TEXT NOT NULL,                -- 'draft' | 'assess' | 'questions' | 'rewrite' | 'feedback' | 'finalize'

  -- Full content
  prompt_sent TEXT NOT NULL,
  response_received TEXT NOT NULL,

  -- What was passed between agents
  input_from_previous JSONB,         -- What this agent received from prior step
  output_to_next JSONB,              -- What this agent passed to next step

  -- Effectiveness metrics (filled after session complete)
  contributed_to_final BOOLEAN,      -- Did this step's output appear in final?
  user_rating_correlation FLOAT,     -- Correlation with final user rating

  -- Data lifecycle
  pruned_at TIMESTAMPTZ,             -- When sensitive data was removed

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for easy analysis
CREATE INDEX idx_ai_conversations_session ON interpretation_ai_conversations(session_id, sequence_number);
CREATE INDEX idx_ai_conversations_agent ON interpretation_ai_conversations(agent, role);

-- ============================================================
-- INTERPRETATION QUESTIONS
-- ============================================================

CREATE TABLE interpretation_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interpretation_sessions(id) ON DELETE CASCADE,

  round_number INTEGER NOT NULL,
  question_id TEXT NOT NULL,
  gap_id TEXT,
  objective_id TEXT,

  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,  -- 'mcq' | 'free_text'
  options JSONB,

  priority_score INTEGER,

  -- Answer
  answer TEXT,
  answered_at TIMESTAMPTZ,

  -- USER SIGNAL QUALITY
  time_to_answer_ms INTEGER,           -- How long user took
  answer_confidence TEXT,              -- 'high' | 'low' | 'unknown'
  -- Rule: <2 seconds on complex question = 'low'

  -- Draft answer (auto-save)
  draft_answer TEXT,
  draft_saved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INTERPRETATION REPORTS (Final Output)
-- ============================================================

CREATE TABLE interpretation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interpretation_sessions(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES diagnostic_runs(id),

  report JSONB NOT NULL,
  word_count INTEGER,
  rounds_used INTEGER,
  questions_answered INTEGER,

  -- Quality metadata
  quality_status TEXT,                 -- 'green' | 'yellow' | 'red'
  quality_compromised BOOLEAN DEFAULT FALSE,
  heuristic_warnings JSONB,

  generated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(run_id)
);

-- ============================================================
-- DATA LIFECYCLE & RETENTION (GDPR/Enterprise Compliance)
-- ============================================================

-- Auto-prune function: removes raw prompts/responses after 30 days
-- Keeps metadata (tokens, scores, pass/fail) for analytics
CREATE OR REPLACE FUNCTION prune_sensitive_ai_data()
RETURNS void AS $$
BEGIN
  UPDATE interpretation_ai_conversations
  SET
    prompt_sent = '[PRUNED]',
    response_received = '[PRUNED]',
    pruned_at = NOW()
  WHERE
    created_at < NOW() - INTERVAL '30 days'
    AND pruned_at IS NULL;

  UPDATE interpretation_steps
  SET
    prompt_sent = '[PRUNED]',
    raw_response = '[PRUNED]'
  WHERE
    created_at < NOW() - INTERVAL '30 days'
    AND prompt_sent IS NOT NULL
    AND prompt_sent != '[PRUNED]';
END;
$$ LANGUAGE plpgsql;

-- Index for efficient pruning
CREATE INDEX idx_ai_conversations_prune
  ON interpretation_ai_conversations(created_at)
  WHERE pruned_at IS NULL;

-- Index for efficient session lookups
CREATE INDEX idx_interpretation_sessions_run ON interpretation_sessions(run_id);
CREATE INDEX idx_interpretation_sessions_status ON interpretation_sessions(status);
CREATE INDEX idx_interpretation_steps_session ON interpretation_steps(session_id);
CREATE INDEX idx_interpretation_questions_session ON interpretation_questions(session_id);
CREATE INDEX idx_interpretation_reports_run ON interpretation_reports(run_id);

-- RLS Policies
ALTER TABLE interpretation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interpretation_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE interpretation_ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE interpretation_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interpretation_reports ENABLE ROW LEVEL SECURITY;

-- Users can only access their own interpretation data
CREATE POLICY "Users can view own interpretation sessions"
  ON interpretation_sessions FOR SELECT
  USING (run_id IN (SELECT id FROM diagnostic_runs WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own interpretation sessions"
  ON interpretation_sessions FOR INSERT
  WITH CHECK (run_id IN (SELECT id FROM diagnostic_runs WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own interpretation sessions"
  ON interpretation_sessions FOR UPDATE
  USING (run_id IN (SELECT id FROM diagnostic_runs WHERE user_id = auth.uid()));

-- Similar policies for related tables
CREATE POLICY "Users can view own interpretation steps"
  ON interpretation_steps FOR SELECT
  USING (session_id IN (
    SELECT id FROM interpretation_sessions
    WHERE run_id IN (SELECT id FROM diagnostic_runs WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can view own interpretation conversations"
  ON interpretation_ai_conversations FOR SELECT
  USING (session_id IN (
    SELECT id FROM interpretation_sessions
    WHERE run_id IN (SELECT id FROM diagnostic_runs WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can view own interpretation questions"
  ON interpretation_questions FOR SELECT
  USING (session_id IN (
    SELECT id FROM interpretation_sessions
    WHERE run_id IN (SELECT id FROM diagnostic_runs WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can update own interpretation questions"
  ON interpretation_questions FOR UPDATE
  USING (session_id IN (
    SELECT id FROM interpretation_sessions
    WHERE run_id IN (SELECT id FROM diagnostic_runs WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can view own interpretation reports"
  ON interpretation_reports FOR SELECT
  USING (run_id IN (SELECT id FROM diagnostic_runs WHERE user_id = auth.uid()));
