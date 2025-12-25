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

-- Enable RLS
ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own action plans
CREATE POLICY "Users can manage their own action plans"
  ON action_plans
  FOR ALL
  USING (
    run_id IN (
      SELECT id FROM diagnostic_runs WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    run_id IN (
      SELECT id FROM diagnostic_runs WHERE user_id = auth.uid()
    )
  );

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
