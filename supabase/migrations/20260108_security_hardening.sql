-- Security Hardening Migration
-- Date: January 8, 2026
-- Addresses audit findings for RLS coverage and SECURITY DEFINER functions

-- ============================================================
-- 1. ENABLE RLS ON action_plans
-- Previously relied only on API-level auth, now adds database-level protection
-- ============================================================

ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;

-- Users can view their own action plans (via run ownership)
CREATE POLICY "Users can view their own action plans"
  ON action_plans FOR SELECT
  USING (
    run_id IN (
      SELECT id FROM diagnostic_runs WHERE owner_id = auth.uid()
    )
  );

-- Users can insert action plans for their own runs
CREATE POLICY "Users can insert their own action plans"
  ON action_plans FOR INSERT
  WITH CHECK (
    run_id IN (
      SELECT id FROM diagnostic_runs WHERE owner_id = auth.uid()
    )
  );

-- Users can update their own action plans
CREATE POLICY "Users can update their own action plans"
  ON action_plans FOR UPDATE
  USING (
    run_id IN (
      SELECT id FROM diagnostic_runs WHERE owner_id = auth.uid()
    )
  );

-- Users can delete their own action plans
CREATE POLICY "Users can delete their own action plans"
  ON action_plans FOR DELETE
  USING (
    run_id IN (
      SELECT id FROM diagnostic_runs WHERE owner_id = auth.uid()
    )
  );

-- ============================================================
-- 2. ENABLE RLS ON interpretation_sessions
-- ============================================================

ALTER TABLE interpretation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interpretation sessions"
  ON interpretation_sessions FOR SELECT
  USING (
    run_id IN (
      SELECT id FROM diagnostic_runs WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own interpretation sessions"
  ON interpretation_sessions FOR INSERT
  WITH CHECK (
    run_id IN (
      SELECT id FROM diagnostic_runs WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own interpretation sessions"
  ON interpretation_sessions FOR UPDATE
  USING (
    run_id IN (
      SELECT id FROM diagnostic_runs WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own interpretation sessions"
  ON interpretation_sessions FOR DELETE
  USING (
    run_id IN (
      SELECT id FROM diagnostic_runs WHERE owner_id = auth.uid()
    )
  );

-- ============================================================
-- 3. ENABLE RLS ON interpretation_steps
-- Linked via session_id -> interpretation_sessions -> diagnostic_runs
-- ============================================================

ALTER TABLE interpretation_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interpretation steps"
  ON interpretation_steps FOR SELECT
  USING (
    session_id IN (
      SELECT s.id FROM interpretation_sessions s
      JOIN diagnostic_runs r ON s.run_id = r.id
      WHERE r.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own interpretation steps"
  ON interpretation_steps FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT s.id FROM interpretation_sessions s
      JOIN diagnostic_runs r ON s.run_id = r.id
      WHERE r.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own interpretation steps"
  ON interpretation_steps FOR UPDATE
  USING (
    session_id IN (
      SELECT s.id FROM interpretation_sessions s
      JOIN diagnostic_runs r ON s.run_id = r.id
      WHERE r.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own interpretation steps"
  ON interpretation_steps FOR DELETE
  USING (
    session_id IN (
      SELECT s.id FROM interpretation_sessions s
      JOIN diagnostic_runs r ON s.run_id = r.id
      WHERE r.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 4. ENABLE RLS ON interpretation_questions
-- ============================================================

ALTER TABLE interpretation_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interpretation questions"
  ON interpretation_questions FOR SELECT
  USING (
    session_id IN (
      SELECT s.id FROM interpretation_sessions s
      JOIN diagnostic_runs r ON s.run_id = r.id
      WHERE r.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own interpretation questions"
  ON interpretation_questions FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT s.id FROM interpretation_sessions s
      JOIN diagnostic_runs r ON s.run_id = r.id
      WHERE r.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own interpretation questions"
  ON interpretation_questions FOR UPDATE
  USING (
    session_id IN (
      SELECT s.id FROM interpretation_sessions s
      JOIN diagnostic_runs r ON s.run_id = r.id
      WHERE r.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own interpretation questions"
  ON interpretation_questions FOR DELETE
  USING (
    session_id IN (
      SELECT s.id FROM interpretation_sessions s
      JOIN diagnostic_runs r ON s.run_id = r.id
      WHERE r.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 5. ENABLE RLS ON interpretation_reports
-- ============================================================

ALTER TABLE interpretation_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interpretation reports"
  ON interpretation_reports FOR SELECT
  USING (
    run_id IN (
      SELECT id FROM diagnostic_runs WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own interpretation reports"
  ON interpretation_reports FOR INSERT
  WITH CHECK (
    run_id IN (
      SELECT id FROM diagnostic_runs WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own interpretation reports"
  ON interpretation_reports FOR UPDATE
  USING (
    run_id IN (
      SELECT id FROM diagnostic_runs WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own interpretation reports"
  ON interpretation_reports FOR DELETE
  USING (
    run_id IN (
      SELECT id FROM diagnostic_runs WHERE owner_id = auth.uid()
    )
  );

-- ============================================================
-- 6. ENABLE RLS ON interpretation_ai_conversations
-- ============================================================

ALTER TABLE interpretation_ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ai conversations"
  ON interpretation_ai_conversations FOR SELECT
  USING (
    session_id IN (
      SELECT s.id FROM interpretation_sessions s
      JOIN diagnostic_runs r ON s.run_id = r.id
      WHERE r.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own ai conversations"
  ON interpretation_ai_conversations FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT s.id FROM interpretation_sessions s
      JOIN diagnostic_runs r ON s.run_id = r.id
      WHERE r.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own ai conversations"
  ON interpretation_ai_conversations FOR UPDATE
  USING (
    session_id IN (
      SELECT s.id FROM interpretation_sessions s
      JOIN diagnostic_runs r ON s.run_id = r.id
      WHERE r.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own ai conversations"
  ON interpretation_ai_conversations FOR DELETE
  USING (
    session_id IN (
      SELECT s.id FROM interpretation_sessions s
      JOIN diagnostic_runs r ON s.run_id = r.id
      WHERE r.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 7. ENABLE RLS ON feedback
-- Admin-only access: only service role can read/write
-- Regular users can only insert their own feedback
-- ============================================================

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to submit feedback (insert only)
CREATE POLICY "Users can submit feedback"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- No SELECT/UPDATE/DELETE policies for regular users
-- Service role bypasses RLS for admin access

-- ============================================================
-- 8. FIX save_action_proposal SECURITY DEFINER FUNCTION
-- Add explicit search_path to prevent search_path attacks
-- ============================================================

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
    timeline,
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
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- ============================================================
-- 9. FIX prune_sensitive_ai_data SECURITY DEFINER FUNCTION
-- Add explicit search_path for consistency
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
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- ============================================================
-- 10. DROP planning_context TABLE (UNUSED)
-- This table was created but never used in the codebase
-- Removing to reduce schema surface area
-- ============================================================

DROP TABLE IF EXISTS planning_context CASCADE;

-- ============================================================
-- NOTES FOR OPERATIONAL SECURITY:
-- - The /admin/key-check endpoint in src/index.ts should be
--   removed or protected with admin auth before production
-- - feedback.user_email accepts raw client input; consider
--   deriving from auth.uid() instead if not needed for
--   anonymous feedback
-- ============================================================
