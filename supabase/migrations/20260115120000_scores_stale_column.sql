-- =======================================================
-- Navigation Improvement: scores_stale tracking
-- Allows editing answers after completion with score recalculation
-- =======================================================

-- Add scores_stale column to diagnostic_runs
ALTER TABLE diagnostic_runs
ADD COLUMN IF NOT EXISTS scores_stale BOOLEAN DEFAULT FALSE;

-- Add comment explaining the column
COMMENT ON COLUMN diagnostic_runs.scores_stale IS 'True when answers have been modified after scoring. Requires recalculation via /rescore endpoint.';

-- Update the finalization trigger to allow scores_stale changes
-- This allows the backend to set scores_stale even on finalized runs
CREATE OR REPLACE FUNCTION check_run_not_finalized()
RETURNS TRIGGER AS $$
BEGIN
  -- Only block if already finalized AND trying to change protected fields
  IF OLD.finalized_at IS NOT NULL THEN
    -- Allow updates to: finalized_at, action_plan_snapshot, scores_stale
    -- Block changes to: context, calibration, setup_completed_at, status
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
