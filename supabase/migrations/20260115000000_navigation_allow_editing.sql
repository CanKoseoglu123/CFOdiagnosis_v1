-- =======================================================
-- Navigation Improvement: Allow editing at any time
-- Drop finalization triggers that block input/score changes
-- Keep triggers for action_plans and company_profiles
-- =======================================================

-- Drop trigger that prevents input changes on finalized runs
-- Now handled by backend auto de-finalization logic
DROP TRIGGER IF EXISTS prevent_finalized_input_changes ON diagnostic_inputs;
DROP FUNCTION IF EXISTS check_input_not_finalized();

-- Drop trigger that prevents score changes on finalized runs
-- Scores can now be recalculated via /rescore endpoint
DROP TRIGGER IF EXISTS prevent_finalized_score_changes ON diagnostic_scores;
DROP FUNCTION IF EXISTS check_score_not_finalized();

-- Note: The following triggers are KEPT for data integrity:
-- - prevent_finalized_action_changes (action_plans should be regenerated, not edited post-finalization)
-- - prevent_finalized_run_changes (context/calibration should not change post-finalization)
-- - prevent_finalized_profile_changes (company profile changes would invalidate persona)

-- Update the run trigger to also allow finalized_at changes (for de-finalization)
CREATE OR REPLACE FUNCTION check_run_not_finalized()
RETURNS TRIGGER AS $$
BEGIN
  -- Only block if already finalized AND trying to change protected fields
  IF OLD.finalized_at IS NOT NULL THEN
    -- Allow updates to: finalized_at (for de-finalization), action_plan_snapshot, scores_stale
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
