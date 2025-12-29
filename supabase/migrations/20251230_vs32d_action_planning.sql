-- VS-32d: Action Planning Tab
-- Planning wizard -> AI-generated action proposals -> user editing

-- Planning context table
CREATE TABLE IF NOT EXISTS planning_context (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  run_id UUID REFERENCES diagnostic_runs(id) ON DELETE CASCADE,
  target_maturity_level INTEGER CHECK (target_maturity_level BETWEEN 1 AND 4),
  bandwidth TEXT CHECK (bandwidth IN ('limited', 'moderate', 'available')),
  priority_focus TEXT[] DEFAULT '{}',
  team_size_override INTEGER,  -- If not captured in company setup
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(run_id)
);

-- Add AI fields to action_plans (status column already exists from VS-28)
ALTER TABLE action_plans
ADD COLUMN IF NOT EXISTS rationale JSONB;

ALTER TABLE action_plans
ADD COLUMN IF NOT EXISTS evidence_ids TEXT[];

ALTER TABLE action_plans
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;

ALTER TABLE action_plans
ADD COLUMN IF NOT EXISTS priority_rank INTEGER;

-- Action plan proposal storage
ALTER TABLE diagnostic_runs
ADD COLUMN IF NOT EXISTS action_proposal JSONB;

ALTER TABLE diagnostic_runs
ADD COLUMN IF NOT EXISTS action_proposal_generated_at TIMESTAMPTZ;

-- RLS policies for planning_context
ALTER TABLE planning_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own planning context"
  ON planning_context FOR SELECT
  USING (
    run_id IN (
      SELECT id FROM diagnostic_runs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own planning context"
  ON planning_context FOR INSERT
  WITH CHECK (
    run_id IN (
      SELECT id FROM diagnostic_runs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own planning context"
  ON planning_context FOR UPDATE
  USING (
    run_id IN (
      SELECT id FROM diagnostic_runs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own planning context"
  ON planning_context FOR DELETE
  USING (
    run_id IN (
      SELECT id FROM diagnostic_runs WHERE user_id = auth.uid()
    )
  );

-- Supabase RPC function for atomic proposal save (FIX #4: Transaction)
CREATE OR REPLACE FUNCTION save_action_proposal(
  p_run_id UUID,
  p_proposal JSONB
) RETURNS void AS $$
BEGIN
  -- Clear existing AI-generated actions
  DELETE FROM action_plans
  WHERE run_id = p_run_id AND ai_generated = true;

  -- Save proposal to run
  UPDATE diagnostic_runs
  SET
    action_proposal = p_proposal,
    action_proposal_generated_at = NOW()
  WHERE id = p_run_id;

  -- Insert new actions
  INSERT INTO action_plans (
    run_id,
    question_id,
    status,
    target_timeline,
    rationale,
    evidence_ids,
    ai_generated,
    priority_rank
  )
  SELECT
    p_run_id,
    (action->>'question_id'),
    'planned',
    (action->>'timeline'),
    (action->'rationale'),
    ARRAY(SELECT jsonb_array_elements_text(action->'evidence_ids')),
    true,
    (action->>'priority_rank')::integer
  FROM jsonb_array_elements(p_proposal->'actions') AS action;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_planning_context_run_id ON planning_context(run_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_ai_generated ON action_plans(run_id, ai_generated);
