-- VS-39: Finalization Workflow
-- Adds columns to lock action plans and enable Executive Report tab

-- Add finalized_at timestamp (when user locks their action plan)
ALTER TABLE diagnostic_runs
ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ DEFAULT NULL;

-- Add action_plan_snapshot (frozen copy of action plan at finalization)
ALTER TABLE diagnostic_runs
ADD COLUMN IF NOT EXISTS action_plan_snapshot JSONB DEFAULT NULL;

-- Index for quick lookup of finalized runs
CREATE INDEX IF NOT EXISTS idx_diagnostic_runs_finalized_at
ON diagnostic_runs(finalized_at)
WHERE finalized_at IS NOT NULL;

COMMENT ON COLUMN diagnostic_runs.finalized_at IS 'Timestamp when user finalized their action plan (irreversible)';
COMMENT ON COLUMN diagnostic_runs.action_plan_snapshot IS 'Frozen copy of action_plans at finalization time';
