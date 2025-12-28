-- VS-32: Resilience Layer Database Updates
-- Version: 1.0
-- Date: December 28, 2025

-- ============================================================
-- ADD PENDING_QUESTIONS TO INTERPRETATION SESSIONS
-- ============================================================
-- Stores the current pending questions for quick access
-- Prevents race conditions when multiple requests check for pending state

ALTER TABLE interpretation_sessions
ADD COLUMN IF NOT EXISTS pending_questions JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN interpretation_sessions.pending_questions IS
  'VS-32: Cached pending questions for the current round. Updated atomically with status changes.';

-- ============================================================
-- ADD CIRCUIT BREAKER TRACKING
-- ============================================================
-- Track circuit breaker state for observability

ALTER TABLE interpretation_sessions
ADD COLUMN IF NOT EXISTS force_finalized BOOLEAN DEFAULT FALSE;

ALTER TABLE interpretation_sessions
ADD COLUMN IF NOT EXISTS force_finalize_reason TEXT DEFAULT NULL;

COMMENT ON COLUMN interpretation_sessions.force_finalized IS
  'VS-32: True if session was force-finalized due to max rounds or circuit breaker';

COMMENT ON COLUMN interpretation_sessions.force_finalize_reason IS
  'VS-32: Reason for force finalization (max_rounds_exceeded, circuit_breaker_open, etc.)';

-- ============================================================
-- ATOMIC ACTION PLAN UPSERT FUNCTION
-- ============================================================
-- Prevents race conditions on action plan updates

CREATE OR REPLACE FUNCTION upsert_action_item(
  p_run_id UUID,
  p_question_id TEXT,
  p_selected BOOLEAN,
  p_timeline TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_existing JSONB;
  v_action_plan JSONB;
BEGIN
  -- Get current action plan with row lock
  SELECT action_plan INTO v_action_plan
  FROM diagnostic_runs
  WHERE id = p_run_id
  FOR UPDATE;

  IF v_action_plan IS NULL THEN
    v_action_plan := '{"items": []}'::JSONB;
  END IF;

  -- Find existing item
  SELECT elem INTO v_existing
  FROM jsonb_array_elements(v_action_plan->'items') AS elem
  WHERE elem->>'question_id' = p_question_id;

  IF v_existing IS NOT NULL THEN
    -- Update existing item
    v_action_plan := jsonb_set(
      v_action_plan,
      '{items}',
      (
        SELECT jsonb_agg(
          CASE
            WHEN elem->>'question_id' = p_question_id
            THEN jsonb_build_object(
              'question_id', p_question_id,
              'selected', p_selected,
              'timeline', COALESCE(p_timeline, elem->>'timeline'),
              'notes', COALESCE(p_notes, elem->>'notes'),
              'updated_at', NOW()
            )
            ELSE elem
          END
        )
        FROM jsonb_array_elements(v_action_plan->'items') AS elem
      )
    );
  ELSE
    -- Add new item
    v_action_plan := jsonb_set(
      v_action_plan,
      '{items}',
      COALESCE(v_action_plan->'items', '[]'::JSONB) || jsonb_build_object(
        'question_id', p_question_id,
        'selected', p_selected,
        'timeline', p_timeline,
        'notes', p_notes,
        'created_at', NOW(),
        'updated_at', NOW()
      )
    );
  END IF;

  -- Update the run
  UPDATE diagnostic_runs
  SET action_plan = v_action_plan,
      updated_at = NOW()
  WHERE id = p_run_id;

  -- Return the updated item
  SELECT elem INTO v_result
  FROM jsonb_array_elements(v_action_plan->'items') AS elem
  WHERE elem->>'question_id' = p_question_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ATOMIC ACTION ITEM REMOVAL FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION remove_action_item(
  p_run_id UUID,
  p_question_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_action_plan JSONB;
  v_count_before INTEGER;
  v_count_after INTEGER;
BEGIN
  -- Get current action plan with row lock
  SELECT action_plan INTO v_action_plan
  FROM diagnostic_runs
  WHERE id = p_run_id
  FOR UPDATE;

  IF v_action_plan IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Count before
  SELECT COUNT(*) INTO v_count_before
  FROM jsonb_array_elements(v_action_plan->'items');

  -- Remove the item
  v_action_plan := jsonb_set(
    v_action_plan,
    '{items}',
    (
      SELECT COALESCE(jsonb_agg(elem), '[]'::JSONB)
      FROM jsonb_array_elements(v_action_plan->'items') AS elem
      WHERE elem->>'question_id' != p_question_id
    )
  );

  -- Count after
  SELECT COUNT(*) INTO v_count_after
  FROM jsonb_array_elements(v_action_plan->'items');

  -- Update the run
  UPDATE diagnostic_runs
  SET action_plan = v_action_plan,
      updated_at = NOW()
  WHERE id = p_run_id;

  RETURN v_count_before > v_count_after;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ATOMIC PENDING QUESTIONS UPDATE
-- ============================================================
-- Updates pending_questions atomically with status change

CREATE OR REPLACE FUNCTION set_awaiting_user_with_questions(
  p_session_id UUID,
  p_questions JSONB,
  p_current_round INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE interpretation_sessions
  SET
    status = 'awaiting_user',
    pending_questions = p_questions,
    current_round = p_current_round
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- CLEAR PENDING QUESTIONS ON STATUS CHANGE
-- ============================================================

CREATE OR REPLACE FUNCTION clear_pending_questions(
  p_session_id UUID,
  p_new_status TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE interpretation_sessions
  SET
    status = p_new_status,
    pending_questions = NULL
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- INDEX FOR PENDING QUESTIONS LOOKUP
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_interpretation_sessions_pending
ON interpretation_sessions(id)
WHERE pending_questions IS NOT NULL;

-- ============================================================
-- GRANT EXECUTE ON FUNCTIONS
-- ============================================================

GRANT EXECUTE ON FUNCTION upsert_action_item TO authenticated;
GRANT EXECUTE ON FUNCTION remove_action_item TO authenticated;
GRANT EXECUTE ON FUNCTION set_awaiting_user_with_questions TO authenticated;
GRANT EXECUTE ON FUNCTION clear_pending_questions TO authenticated;
