-- Progress Tracking Migration
-- Adds explicit workflow step tracking to diagnostic_runs

-- Add current_step column with valid workflow steps
ALTER TABLE diagnostic_runs
ADD COLUMN IF NOT EXISTS current_step TEXT DEFAULT 'intro'
  CHECK (current_step IN (
    'intro',           -- /run/:id/intro
    'company_setup',   -- /run/:id/setup/company
    'persona',         -- /run/:id/setup/persona
    'pillar_setup',    -- /run/:id/setup/pillar
    'assessment',      -- /assess/objective/:objId
    'calibration',     -- /run/:id/calibrate
    'report',          -- /report/:id
    'finalized'        -- Locked state
  ));

-- Track last visited objective within assessment
ALTER TABLE diagnostic_runs
ADD COLUMN IF NOT EXISTS last_visited_objective_id TEXT DEFAULT NULL;

-- Track assessment completion percentage (0-100)
ALTER TABLE diagnostic_runs
ADD COLUMN IF NOT EXISTS assessment_progress_pct INTEGER DEFAULT 0
  CHECK (assessment_progress_pct BETWEEN 0 AND 100);

-- Track last user activity for smart resume
ALTER TABLE diagnostic_runs
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW();

-- Index for efficient dashboard queries (user's runs sorted by activity)
CREATE INDEX IF NOT EXISTS idx_diagnostic_runs_owner_activity
  ON diagnostic_runs(owner_id, last_activity_at DESC);

-- Backfill existing runs with best-effort inference
UPDATE diagnostic_runs
SET current_step = CASE
  -- Finalized runs
  WHEN finalized_at IS NOT NULL THEN 'finalized'
  -- Completed/locked = in report phase
  WHEN status IN ('completed', 'locked') THEN 'report'
  -- Has setup_completed_at = past all setup steps, in assessment or beyond
  WHEN setup_completed_at IS NOT NULL AND status = 'in_progress' THEN 'assessment'
  -- Has company_profile_id but no setup_completed_at = between persona and pillar
  WHEN company_profile_id IS NOT NULL AND setup_completed_at IS NULL THEN 'pillar_setup'
  -- Created but no profile = early setup
  WHEN status = 'created' OR status IS NULL THEN 'intro'
  -- Default fallback
  ELSE 'company_setup'
END,
last_activity_at = created_at
WHERE current_step IS NULL OR current_step = 'intro';

-- Calculate assessment_progress_pct for existing runs based on answered questions
UPDATE diagnostic_runs dr
SET assessment_progress_pct = (
  SELECT COALESCE(
    ROUND(COUNT(*)::numeric / 97 * 100),  -- 97 total questions
    0
  )::INTEGER
  FROM diagnostic_inputs di
  WHERE di.run_id = dr.id AND di.value IS NOT NULL
)
WHERE dr.status IN ('in_progress', 'completed', 'locked');

-- Update last_activity_at for runs with inputs
UPDATE diagnostic_runs dr
SET last_activity_at = (
  SELECT MAX(di.created_at)
  FROM diagnostic_inputs di
  WHERE di.run_id = dr.id
)
WHERE EXISTS (
  SELECT 1 FROM diagnostic_inputs di WHERE di.run_id = dr.id
);
