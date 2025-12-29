-- VS-32c: Critic Agent & Clarifying Questions
-- Adds pipeline stage tracking and question persistence to interpretation_reports

-- Add new columns for VS-32c pipeline
ALTER TABLE interpretation_reports
ADD COLUMN IF NOT EXISTS pending_questions JSONB;

ALTER TABLE interpretation_reports
ADD COLUMN IF NOT EXISTS clarifier_answers JSONB DEFAULT '[]';

ALTER TABLE interpretation_reports
ADD COLUMN IF NOT EXISTS current_stage TEXT DEFAULT 'pending';
-- Stage enum: 'pending', 'generating', 'heuristics', 'critic', 'awaiting_answers', 'rewriting', 'completed', 'failed'

ALTER TABLE interpretation_reports
ADD COLUMN IF NOT EXISTS loop_round INTEGER DEFAULT 0;

ALTER TABLE interpretation_reports
ADD COLUMN IF NOT EXISTS overview_sections JSONB;

ALTER TABLE interpretation_reports
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

ALTER TABLE interpretation_reports
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
-- Status: 'pending', 'generating', 'awaiting_answers', 'completed', 'failed'

ALTER TABLE interpretation_reports
ADD COLUMN IF NOT EXISTS error_message TEXT;

ALTER TABLE interpretation_reports
ADD COLUMN IF NOT EXISTS model_used TEXT;

ALTER TABLE interpretation_reports
ADD COLUMN IF NOT EXISTS tokens_used INTEGER;

ALTER TABLE interpretation_reports
ADD COLUMN IF NOT EXISTS heuristics_result JSONB;

ALTER TABLE interpretation_reports
ADD COLUMN IF NOT EXISTS generation_attempts INTEGER;

ALTER TABLE interpretation_reports
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Drop unique constraint on run_id to allow multiple versions
ALTER TABLE interpretation_reports DROP CONSTRAINT IF EXISTS interpretation_reports_run_id_key;

-- Create index on run_id + version
CREATE INDEX IF NOT EXISTS idx_interpretation_reports_run_version
ON interpretation_reports(run_id, version DESC);

-- Create index on status
CREATE INDEX IF NOT EXISTS idx_interpretation_reports_status
ON interpretation_reports(status);
