-- RLS Policy Performance Fix Migration
-- Date: January 9, 2026
--
-- Issue: RLS policies calling auth.uid() directly are re-evaluated per-row,
-- causing suboptimal query performance at scale.
--
-- Fix: Wrap auth.uid() in a scalar subquery (SELECT auth.uid()) so the value
-- is computed once per statement instead of per row.
--
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ============================================================
-- 1. FIX profiles TABLE POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================================
-- 2. FIX diagnostic_runs TABLE POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users can create own runs" ON diagnostic_runs;
DROP POLICY IF EXISTS "Users can read own runs" ON diagnostic_runs;
DROP POLICY IF EXISTS "Users can update own runs" ON diagnostic_runs;
DROP POLICY IF EXISTS "Users can delete own runs" ON diagnostic_runs;

CREATE POLICY "Users can create own runs"
  ON diagnostic_runs FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "Users can read own runs"
  ON diagnostic_runs FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = owner_id);

CREATE POLICY "Users can update own runs"
  ON diagnostic_runs FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = owner_id)
  WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "Users can delete own runs"
  ON diagnostic_runs FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = owner_id);

-- ============================================================
-- 3. FIX diagnostic_inputs TABLE POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users can create own inputs" ON diagnostic_inputs;
DROP POLICY IF EXISTS "Users can read own inputs" ON diagnostic_inputs;
DROP POLICY IF EXISTS "Users can update own inputs" ON diagnostic_inputs;
DROP POLICY IF EXISTS "Users can delete own inputs" ON diagnostic_inputs;

CREATE POLICY "Users can create own inputs"
  ON diagnostic_inputs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostic_runs
      WHERE id = diagnostic_inputs.run_id AND owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can read own inputs"
  ON diagnostic_inputs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_runs
      WHERE id = diagnostic_inputs.run_id AND owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own inputs"
  ON diagnostic_inputs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_runs
      WHERE id = diagnostic_inputs.run_id AND owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostic_runs
      WHERE id = diagnostic_inputs.run_id AND owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete own inputs"
  ON diagnostic_inputs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_runs
      WHERE id = diagnostic_inputs.run_id AND owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- 4. FIX diagnostic_scores TABLE POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users can create own scores" ON diagnostic_scores;
DROP POLICY IF EXISTS "Users can read own scores" ON diagnostic_scores;
DROP POLICY IF EXISTS "Users can update own scores" ON diagnostic_scores;

CREATE POLICY "Users can create own scores"
  ON diagnostic_scores FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostic_runs
      WHERE id = diagnostic_scores.run_id AND owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can read own scores"
  ON diagnostic_scores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_runs
      WHERE id = diagnostic_scores.run_id AND owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own scores"
  ON diagnostic_scores FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_runs
      WHERE id = diagnostic_scores.run_id AND owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostic_runs
      WHERE id = diagnostic_scores.run_id AND owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- 5. FIX company_profiles TABLE POLICY
-- ============================================================

DROP POLICY IF EXISTS "Users can manage own company profiles" ON company_profiles;

CREATE POLICY "Users can manage own company profiles"
  ON company_profiles FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================
-- 6. FIX action_plans TABLE POLICY
-- ============================================================

DROP POLICY IF EXISTS "Users can manage their own action plans" ON action_plans;

CREATE POLICY "Users can manage their own action plans"
  ON action_plans FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_runs
      WHERE id = action_plans.run_id AND owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostic_runs
      WHERE id = action_plans.run_id AND owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- 7. FIX interpretation_sessions TABLE POLICY
-- ============================================================

DROP POLICY IF EXISTS "Users can manage their own interpretation sessions" ON interpretation_sessions;

CREATE POLICY "Users can manage their own interpretation sessions"
  ON interpretation_sessions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_runs
      WHERE id = interpretation_sessions.run_id AND owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostic_runs
      WHERE id = interpretation_sessions.run_id AND owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- 8. FIX interpretation_steps TABLE POLICY
-- ============================================================

DROP POLICY IF EXISTS "Users can manage their own interpretation steps" ON interpretation_steps;

CREATE POLICY "Users can manage their own interpretation steps"
  ON interpretation_steps FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM interpretation_sessions s
      JOIN diagnostic_runs r ON s.run_id = r.id
      WHERE s.id = interpretation_steps.session_id AND r.owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interpretation_sessions s
      JOIN diagnostic_runs r ON s.run_id = r.id
      WHERE s.id = interpretation_steps.session_id AND r.owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- 9. FIX interpretation_questions TABLE POLICY
-- ============================================================

DROP POLICY IF EXISTS "Users can manage their own interpretation questions" ON interpretation_questions;

CREATE POLICY "Users can manage their own interpretation questions"
  ON interpretation_questions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM interpretation_sessions s
      JOIN diagnostic_runs r ON s.run_id = r.id
      WHERE s.id = interpretation_questions.session_id AND r.owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interpretation_sessions s
      JOIN diagnostic_runs r ON s.run_id = r.id
      WHERE s.id = interpretation_questions.session_id AND r.owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- 10. FIX interpretation_reports TABLE POLICY
-- ============================================================

DROP POLICY IF EXISTS "Users can manage their own interpretation reports" ON interpretation_reports;

CREATE POLICY "Users can manage their own interpretation reports"
  ON interpretation_reports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_runs
      WHERE id = interpretation_reports.run_id AND owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostic_runs
      WHERE id = interpretation_reports.run_id AND owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- 11. FIX interpretation_ai_conversations TABLE POLICY
-- ============================================================

DROP POLICY IF EXISTS "Users can manage their own ai conversations" ON interpretation_ai_conversations;

CREATE POLICY "Users can manage their own ai conversations"
  ON interpretation_ai_conversations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM interpretation_sessions s
      JOIN diagnostic_runs r ON s.run_id = r.id
      WHERE s.id = interpretation_ai_conversations.session_id AND r.owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interpretation_sessions s
      JOIN diagnostic_runs r ON s.run_id = r.id
      WHERE s.id = interpretation_ai_conversations.session_id AND r.owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- NOTE: planning_context table was dropped in 20260108_security_hardening.sql
-- so no policies need to be fixed for that table.
-- ============================================================
