-- =======================================================
-- Security Remediation Migration
-- Date: February 1, 2026
-- Fixes: C-03, C-04, H-12, M-15, M-16
--
-- 1. Add ownership check to save_action_proposal (C-03)
-- 2. Add SET search_path = public to all SECURITY DEFINER functions (C-04)
-- 3. Add missing RLS policies (H-12, M-15, M-16)
-- =======================================================

-- ============================================================
-- 1. FIX save_action_proposal — add ownership check
-- Previously anyone with a run_id could call this function.
-- Now validates that the caller owns the diagnostic run.
-- ============================================================

CREATE OR REPLACE FUNCTION save_action_proposal(
  p_run_id UUID,
  p_proposal JSONB
) RETURNS void AS $$
BEGIN
  -- Ownership check: caller must own the diagnostic run
  IF NOT EXISTS (
    SELECT 1 FROM diagnostic_runs
    WHERE id = p_run_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = 'P0403';
  END IF;

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
-- 2. RECREATE SECURITY DEFINER trigger functions with SET search_path
-- These were created without explicit search_path in
-- 20260112_finalization_protection.sql
-- ============================================================

-- 2a. check_input_not_finalized
CREATE OR REPLACE FUNCTION check_input_not_finalized()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM diagnostic_runs
    WHERE id = NEW.run_id AND finalized_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Cannot modify inputs for finalized diagnostic run'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- 2b. check_action_not_finalized
CREATE OR REPLACE FUNCTION check_action_not_finalized()
RETURNS TRIGGER AS $$
DECLARE
  v_run_id UUID;
BEGIN
  v_run_id := COALESCE(NEW.run_id, OLD.run_id);

  IF EXISTS (
    SELECT 1 FROM diagnostic_runs
    WHERE id = v_run_id AND finalized_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Cannot modify action plan for finalized diagnostic run'
      USING ERRCODE = 'P0001';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- 2c. check_run_not_finalized
CREATE OR REPLACE FUNCTION check_run_not_finalized()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.finalized_at IS NOT NULL THEN
    IF NEW.context IS DISTINCT FROM OLD.context OR
       NEW.calibration IS DISTINCT FROM OLD.calibration OR
       NEW.setup_completed_at IS DISTINCT FROM OLD.setup_completed_at OR
       (NEW.status IS DISTINCT FROM OLD.status AND NEW.status != OLD.status) THEN
      RAISE EXCEPTION 'Cannot modify finalized diagnostic run'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- 2d. check_score_not_finalized
CREATE OR REPLACE FUNCTION check_score_not_finalized()
RETURNS TRIGGER AS $$
DECLARE
  v_run_id UUID;
BEGIN
  v_run_id := COALESCE(NEW.run_id, OLD.run_id);

  IF EXISTS (
    SELECT 1 FROM diagnostic_runs
    WHERE id = v_run_id AND finalized_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Cannot modify scores for finalized diagnostic run'
      USING ERRCODE = 'P0001';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- 2e. check_profile_not_linked_to_finalized
CREATE OR REPLACE FUNCTION check_profile_not_linked_to_finalized()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    IF EXISTS (
      SELECT 1 FROM diagnostic_runs
      WHERE company_profile_id = OLD.id AND finalized_at IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Cannot modify company profile linked to finalized diagnostic run'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- ============================================================
-- 3. ADD MISSING RLS POLICIES
-- ============================================================

-- 3a. diagnostic_scores DELETE policy (H-12)
-- Users can delete their own scores (needed for rescore operations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'diagnostic_scores'
      AND policyname = 'Users can delete their own scores'
  ) THEN
    CREATE POLICY "Users can delete their own scores"
      ON diagnostic_scores FOR DELETE
      USING (
        auth.uid() = (
          SELECT owner_id FROM diagnostic_runs WHERE id = run_id
        )
      );
  END IF;
END $$;

-- 3b. Fix feedback INSERT policy (M-15, M-16)
-- Allow anonymous feedback (user_id IS NULL) and authenticated feedback
DROP POLICY IF EXISTS "Users can submit feedback" ON feedback;
CREATE POLICY "Users can submit feedback"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
