-- Add user_email column to diagnostic_runs for admin visibility
-- This stores the email at run creation time, avoiding Auth Admin API lookups

ALTER TABLE diagnostic_runs
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_diagnostic_runs_user_email ON diagnostic_runs(user_email);

-- Backfill existing runs (will remain NULL since we can't lookup historical emails)
-- New runs will have this populated automatically
