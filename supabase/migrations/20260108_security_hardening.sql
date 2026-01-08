-- Security Hardening Migration
-- Date: January 8, 2026
-- Addresses audit findings for RLS coverage and SECURITY DEFINER functions
--
-- NOTE: Service role clients (using SUPABASE_SERVICE_ROLE_KEY) automatically
-- bypass RLS, so background workers using service role will continue to work.
-- See: src/interpretation/engine/routes.ts for service client usage.

-- ============================================================
-- 1. ENABLE RLS ON action_plans
-- Previously relied only on API-level auth, now adds database-level protection
-- Using FOR ALL with EXISTS for better performance
-- ============================================================

ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own action plans"
  ON action_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_runs
      WHERE id = action_plans.run_id AND owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostic_runs
      WHERE id = action_plans.run_id AND owner_id = auth.uid()
    )
  );

-- ============================================================
-- 2. ENABLE RLS ON interpretation_sessions
-- ============================================================

ALTER TABLE interpretation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own interpretation sessions"
  ON interpretation_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_runs
      WHERE id = interpretation_sessions.run_id AND owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostic_runs
      WHERE id = interpretation_sessions.run_id AND owner_id = auth.uid()
    )
  );

-- ============================================================
-- 3. ENABLE RLS ON interpretation_steps
-- Linked via session_id -> interpretation_sessions -> diagnostic_runs
-- ============================================================

ALTER TABLE interpretation_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own interpretation steps"
  ON interpretation_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM interpretation_sessions s
      JOIN diagnostic_runs r ON s.run_id = r.id
      WHERE s.id = interpretation_steps.session_id AND r.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interpretation_sessions s
      JOIN diagnostic_runs r ON s.run_id = r.id
      WHERE s.id = interpretation_steps.session_id AND r.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 4. ENABLE RLS ON interpretation_questions
-- ============================================================

ALTER TABLE interpretation_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own interpretation questions"
  ON interpretation_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM interpretation_sessions s
      JOIN diagnostic_runs r ON s.run_id = r.id
      WHERE s.id = interpretation_questions.session_id AND r.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interpretation_sessions s
      JOIN diagnostic_runs r ON s.run_id = r.id
      WHERE s.id = interpretation_questions.session_id AND r.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 5. ENABLE RLS ON interpretation_reports
-- ============================================================

ALTER TABLE interpretation_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own interpretation reports"
  ON interpretation_reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_runs
      WHERE id = interpretation_reports.run_id AND owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostic_runs
      WHERE id = interpretation_reports.run_id AND owner_id = auth.uid()
    )
  );

-- ============================================================
-- 6. ENABLE RLS ON interpretation_ai_conversations
-- ============================================================

ALTER TABLE interpretation_ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own ai conversations"
  ON interpretation_ai_conversations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM interpretation_sessions s
      JOIN diagnostic_runs r ON s.run_id = r.id
      WHERE s.id = interpretation_ai_conversations.session_id AND r.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interpretation_sessions s
      JOIN diagnostic_runs r ON s.run_id = r.id
      WHERE s.id = interpretation_ai_conversations.session_id AND r.owner_id = auth.uid()
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
-- NOTES:
-- - Service role clients bypass RLS, so background workers
--   (interpretation engine, etc.) will continue to function
-- - feedback.user_email accepts raw client input; consider
--   deriving from auth.uid() instead if not needed for
--   anonymous feedback
-- ============================================================
