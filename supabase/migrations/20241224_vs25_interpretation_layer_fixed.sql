-- VS-25: Interpretation Layer Database Schema (Fixed)
-- Version: 5.1
-- Date: December 24, 2025

-- ============================================================
-- INTERPRETATION SESSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS interpretation_sessions (
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

CREATE TABLE IF NOT EXISTS interpretation_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interpretation_sessions(id) ON DELETE CASCADE,

  step_type TEXT NOT NULL,
  round_number INTEGER,
  agent TEXT,  -- 'generator' | 'critic' | 'code'

  -- Versioning
  prompt_version TEXT,
  model TEXT,

  -- FULL AI INTERACTION LOG
  prompt_sent TEXT,
  system_prompt TEXT,
  tonality_injected JSONB,
  context_injected JSONB,

  -- Outputs
  raw_response TEXT,
  output JSONB,

  -- Quality tracking
  quality_gate_input JSONB,
  quality_gate_result JSONB,

  -- For rewrites
  previous_draft JSONB,
  draft_diff JSONB,

  -- Metrics
  tokens_input INTEGER,
  tokens_output INTEGER,
  latency_ms INTEGER,
  temperature FLOAT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AI CONVERSATION FLOW
-- ============================================================

CREATE TABLE IF NOT EXISTS interpretation_ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interpretation_sessions(id) ON DELETE CASCADE,

  sequence_number INTEGER NOT NULL,
  agent TEXT NOT NULL,
  role TEXT NOT NULL,

  prompt_sent TEXT NOT NULL,
  response_received TEXT NOT NULL,

  input_from_previous JSONB,
  output_to_next JSONB,

  contributed_to_final BOOLEAN,
  user_rating_correlation FLOAT,

  pruned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INTERPRETATION QUESTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS interpretation_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interpretation_sessions(id) ON DELETE CASCADE,

  round_number INTEGER NOT NULL,
  question_id TEXT NOT NULL,
  gap_id TEXT,
  objective_id TEXT,

  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  options JSONB,

  priority_score INTEGER,

  answer TEXT,
  answered_at TIMESTAMPTZ,

  time_to_answer_ms INTEGER,
  answer_confidence TEXT,

  draft_answer TEXT,
  draft_saved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INTERPRETATION REPORTS
-- ============================================================

CREATE TABLE IF NOT EXISTS interpretation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interpretation_sessions(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES diagnostic_runs(id),

  report JSONB NOT NULL,
  word_count INTEGER,
  rounds_used INTEGER,
  questions_answered INTEGER,

  quality_status TEXT,
  quality_compromised BOOLEAN DEFAULT FALSE,
  heuristic_warnings JSONB,

  generated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(run_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ai_conversations_session ON interpretation_ai_conversations(session_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_agent ON interpretation_ai_conversations(agent, role);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_prune ON interpretation_ai_conversations(created_at) WHERE pruned_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_interpretation_sessions_run ON interpretation_sessions(run_id);
CREATE INDEX IF NOT EXISTS idx_interpretation_sessions_status ON interpretation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_interpretation_steps_session ON interpretation_steps(session_id);
CREATE INDEX IF NOT EXISTS idx_interpretation_questions_session ON interpretation_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_interpretation_reports_run ON interpretation_reports(run_id);

-- ============================================================
-- DATA LIFECYCLE FUNCTION
-- ============================================================

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

-- ============================================================
-- RLS (Disabled for now - relies on API-level auth)
-- ============================================================

-- RLS is handled at the API level via Supabase auth tokens
-- The API endpoints already verify user owns the diagnostic_run
-- before allowing access to interpretation data
