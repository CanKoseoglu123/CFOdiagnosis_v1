-- =======================================================
-- VS-Security: Finalization Protection Triggers
-- Defense in depth - prevents modifications at DB level
-- even if API checks are bypassed
-- =======================================================

-- 1. Protect diagnostic_inputs from modifications after finalization
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_finalized_input_changes ON diagnostic_inputs;
CREATE TRIGGER prevent_finalized_input_changes
  BEFORE INSERT OR UPDATE ON diagnostic_inputs
  FOR EACH ROW
  EXECUTE FUNCTION check_input_not_finalized();


-- 2. Protect action_plans from modifications after finalization
CREATE OR REPLACE FUNCTION check_action_not_finalized()
RETURNS TRIGGER AS $$
DECLARE
  v_run_id UUID;
BEGIN
  -- Handle both INSERT/UPDATE (NEW) and DELETE (OLD)
  v_run_id := COALESCE(NEW.run_id, OLD.run_id);

  IF EXISTS (
    SELECT 1 FROM diagnostic_runs
    WHERE id = v_run_id AND finalized_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Cannot modify action plan for finalized diagnostic run'
      USING ERRCODE = 'P0001';
  END IF;

  -- Return appropriate record based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_finalized_action_changes ON action_plans;
CREATE TRIGGER prevent_finalized_action_changes
  BEFORE INSERT OR UPDATE OR DELETE ON action_plans
  FOR EACH ROW
  EXECUTE FUNCTION check_action_not_finalized();


-- 3. Protect diagnostic_runs context/calibration columns after finalization
CREATE OR REPLACE FUNCTION check_run_not_finalized()
RETURNS TRIGGER AS $$
BEGIN
  -- Only block if already finalized AND trying to change protected fields
  IF OLD.finalized_at IS NOT NULL THEN
    -- Allow updates to finalized_at and action_plan_snapshot (for idempotent finalization)
    -- Block changes to context, calibration, setup_completed_at, status
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

DROP TRIGGER IF EXISTS prevent_finalized_run_changes ON diagnostic_runs;
CREATE TRIGGER prevent_finalized_run_changes
  BEFORE UPDATE ON diagnostic_runs
  FOR EACH ROW
  EXECUTE FUNCTION check_run_not_finalized();


-- 4. Protect diagnostic_scores from modifications after finalization
CREATE OR REPLACE FUNCTION check_score_not_finalized()
RETURNS TRIGGER AS $$
DECLARE
  v_run_id UUID;
BEGIN
  -- Handle both INSERT/UPDATE (NEW) and DELETE (OLD)
  v_run_id := COALESCE(NEW.run_id, OLD.run_id);

  IF EXISTS (
    SELECT 1 FROM diagnostic_runs
    WHERE id = v_run_id AND finalized_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Cannot modify scores for finalized diagnostic run'
      USING ERRCODE = 'P0001';
  END IF;

  -- Return appropriate record based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_finalized_score_changes ON diagnostic_scores;
CREATE TRIGGER prevent_finalized_score_changes
  BEFORE INSERT OR UPDATE OR DELETE ON diagnostic_scores
  FOR EACH ROW
  EXECUTE FUNCTION check_score_not_finalized();


-- 5. Protect company_profiles linked to finalized runs
CREATE OR REPLACE FUNCTION check_profile_not_linked_to_finalized()
RETURNS TRIGGER AS $$
BEGIN
  -- For UPDATE operations, check if profile is linked to a finalized run
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_finalized_profile_changes ON company_profiles;
CREATE TRIGGER prevent_finalized_profile_changes
  BEFORE UPDATE OR DELETE ON company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_profile_not_linked_to_finalized();
