-- VS-44: Executive Report PDF Export
-- Adds columns for report customizations and PDF storage

-- Add report_customizations column (user edits to slide titles, key messages, action labels)
ALTER TABLE diagnostic_runs
ADD COLUMN IF NOT EXISTS report_customizations JSONB DEFAULT NULL;

-- Add report_pdf_path column (storage path to generated PDF)
ALTER TABLE diagnostic_runs
ADD COLUMN IF NOT EXISTS report_pdf_path TEXT DEFAULT NULL;

-- Add report_generated_at column (timestamp when PDF was generated)
ALTER TABLE diagnostic_runs
ADD COLUMN IF NOT EXISTS report_generated_at TIMESTAMPTZ DEFAULT NULL;

-- Comments
COMMENT ON COLUMN diagnostic_runs.report_customizations IS 'User edits to slide titles, key messages, and action labels for Executive Report';
COMMENT ON COLUMN diagnostic_runs.report_pdf_path IS 'Storage path to generated PDF after finalization';
COMMENT ON COLUMN diagnostic_runs.report_generated_at IS 'Timestamp when PDF was generated';

-- Index for runs with generated reports
CREATE INDEX IF NOT EXISTS idx_diagnostic_runs_report_generated
ON diagnostic_runs(report_generated_at)
WHERE report_generated_at IS NOT NULL;
