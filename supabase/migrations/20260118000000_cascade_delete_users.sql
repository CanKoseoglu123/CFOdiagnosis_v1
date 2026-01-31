-- Migration: Add CASCADE DELETE for user deletion
-- This ensures deleting a user from auth.users automatically cleans up all related data

-- 1. diagnostic_runs.owner_id → auth.users(id)
-- First check if constraint exists, then drop and recreate with CASCADE
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'diagnostic_runs_owner_id_fkey'
    AND table_name = 'diagnostic_runs'
  ) THEN
    ALTER TABLE diagnostic_runs DROP CONSTRAINT diagnostic_runs_owner_id_fkey;
  END IF;

  -- Add constraint with CASCADE
  ALTER TABLE diagnostic_runs
    ADD CONSTRAINT diagnostic_runs_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- 2. interpretation_reports.run_id → diagnostic_runs(id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'interpretation_reports_run_id_fkey'
    AND table_name = 'interpretation_reports'
  ) THEN
    ALTER TABLE interpretation_reports DROP CONSTRAINT interpretation_reports_run_id_fkey;
  END IF;

  ALTER TABLE interpretation_reports
    ADD CONSTRAINT interpretation_reports_run_id_fkey
    FOREIGN KEY (run_id) REFERENCES diagnostic_runs(id) ON DELETE CASCADE;
END $$;

-- 3. interpretation_sessions.run_id → diagnostic_runs(id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'interpretation_sessions_run_id_fkey'
    AND table_name = 'interpretation_sessions'
  ) THEN
    ALTER TABLE interpretation_sessions DROP CONSTRAINT interpretation_sessions_run_id_fkey;
  END IF;

  ALTER TABLE interpretation_sessions
    ADD CONSTRAINT interpretation_sessions_run_id_fkey
    FOREIGN KEY (run_id) REFERENCES diagnostic_runs(id) ON DELETE CASCADE;
END $$;

-- 4. diagnostic_inputs.run_id → diagnostic_runs(id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'diagnostic_inputs_run_id_fkey'
    AND table_name = 'diagnostic_inputs'
  ) THEN
    ALTER TABLE diagnostic_inputs DROP CONSTRAINT diagnostic_inputs_run_id_fkey;
  END IF;

  ALTER TABLE diagnostic_inputs
    ADD CONSTRAINT diagnostic_inputs_run_id_fkey
    FOREIGN KEY (run_id) REFERENCES diagnostic_runs(id) ON DELETE CASCADE;
END $$;

-- 5. diagnostic_scores.run_id → diagnostic_runs(id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'diagnostic_scores_run_id_fkey'
    AND table_name = 'diagnostic_scores'
  ) THEN
    ALTER TABLE diagnostic_scores DROP CONSTRAINT diagnostic_scores_run_id_fkey;
  END IF;

  ALTER TABLE diagnostic_scores
    ADD CONSTRAINT diagnostic_scores_run_id_fkey
    FOREIGN KEY (run_id) REFERENCES diagnostic_runs(id) ON DELETE CASCADE;
END $$;

-- 6. feedback.user_id → auth.users(id) (make it SET NULL on delete, not CASCADE)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'feedback_user_id_fkey'
    AND table_name = 'feedback'
  ) THEN
    ALTER TABLE feedback DROP CONSTRAINT feedback_user_id_fkey;
  END IF;

  -- Feedback can remain with NULL user_id for analytics purposes
  ALTER TABLE feedback
    ADD CONSTRAINT feedback_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
END $$;

-- Note: These tables already have ON DELETE CASCADE from their original migrations:
-- - action_plans.run_id (20251225_vs28_action_plans.sql)
-- - planning_context.run_id (20251230_vs32d_action_planning.sql)
-- - company_profiles.user_id (20260106_vs27b_classification.sql)
-- - interpretation_steps.session_id (cascades from session deletion)
-- - interpretation_questions.session_id (cascades from session deletion)
-- - interpretation_ai_conversations.session_id (cascades from session deletion)
