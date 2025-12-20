-- VS18: Minimal Context Intake
-- Add context (JSONB) and setup_completed_at columns to diagnostic_runs

-- Add context column with default empty object
ALTER TABLE diagnostic_runs
ADD COLUMN IF NOT EXISTS context JSONB DEFAULT '{}'::jsonb;

-- Add setup_completed_at timestamp (nullable)
ALTER TABLE diagnostic_runs
ADD COLUMN IF NOT EXISTS setup_completed_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for querying runs by setup status
CREATE INDEX IF NOT EXISTS idx_diagnostic_runs_setup_completed
ON diagnostic_runs (setup_completed_at)
WHERE setup_completed_at IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN diagnostic_runs.context IS 'JSONB storing intake context (company_name, industry, etc.)';
COMMENT ON COLUMN diagnostic_runs.setup_completed_at IS 'Timestamp when user completed the setup form. NULL means setup pending.';
