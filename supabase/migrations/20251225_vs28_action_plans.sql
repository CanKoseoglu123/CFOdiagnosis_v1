-- VS-28: Action Plans table for War Room simulator
-- Stores user commitments to address gaps

-- Create action_plans table
CREATE TABLE IF NOT EXISTS action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES diagnostic_runs(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,  -- Supports future pillars like 'r2r_l1_q01'
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'completed')),
  timeline TEXT CHECK (timeline IS NULL OR timeline IN ('6m', '12m', '24m')),
  assigned_owner TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one action per question per run
  CONSTRAINT unique_run_question UNIQUE (run_id, question_id)
);

-- Index for fast lookups by run_id
CREATE INDEX IF NOT EXISTS idx_action_plans_run_id ON action_plans(run_id);

-- RLS is handled at the API level via Supabase auth tokens
-- The API endpoints verify user owns the diagnostic_run before allowing access

-- Trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_action_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER action_plans_updated_at
  BEFORE UPDATE ON action_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_action_plans_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON action_plans TO authenticated;
