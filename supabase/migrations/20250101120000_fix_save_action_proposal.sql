-- Fix column name bug in save_action_proposal function
-- Bug: Used 'target_timeline' but actual column is 'timeline'
-- See: 20251225_vs28_action_plans.sql line 10 for original definition

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
    timeline,  -- FIXED: was 'target_timeline' which doesn't exist
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
