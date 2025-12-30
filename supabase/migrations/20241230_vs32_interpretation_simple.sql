-- VS-32: Simplified Interpretation Layer
-- Idempotent migration - safe to re-run

-- Add new columns to existing interpretation_reports table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interpretation_reports' AND column_name = 'version')
  THEN
    ALTER TABLE interpretation_reports ADD COLUMN version INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interpretation_reports' AND column_name = 'status')
  THEN
    ALTER TABLE interpretation_reports ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interpretation_reports' AND column_name = 'sections')
  THEN
    ALTER TABLE interpretation_reports ADD COLUMN sections JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interpretation_reports' AND column_name = 'schema_version')
  THEN
    ALTER TABLE interpretation_reports ADD COLUMN schema_version INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interpretation_reports' AND column_name = 'input_hash')
  THEN
    ALTER TABLE interpretation_reports ADD COLUMN input_hash TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interpretation_reports' AND column_name = 'heuristics_passed')
  THEN
    ALTER TABLE interpretation_reports ADD COLUMN heuristics_passed BOOLEAN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interpretation_reports' AND column_name = 'heuristics_violations')
  THEN
    ALTER TABLE interpretation_reports ADD COLUMN heuristics_violations JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interpretation_reports' AND column_name = 'used_fallback')
  THEN
    ALTER TABLE interpretation_reports ADD COLUMN used_fallback BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interpretation_reports' AND column_name = 'fallback_reason')
  THEN
    ALTER TABLE interpretation_reports ADD COLUMN fallback_reason TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interpretation_reports' AND column_name = 'generation_attempts')
  THEN
    ALTER TABLE interpretation_reports ADD COLUMN generation_attempts INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interpretation_reports' AND column_name = 'model_used')
  THEN
    ALTER TABLE interpretation_reports ADD COLUMN model_used TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interpretation_reports' AND column_name = 'tokens_used')
  THEN
    ALTER TABLE interpretation_reports ADD COLUMN tokens_used INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interpretation_reports' AND column_name = 'latency_ms')
  THEN
    ALTER TABLE interpretation_reports ADD COLUMN latency_ms INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interpretation_reports' AND column_name = 'error_message')
  THEN
    ALTER TABLE interpretation_reports ADD COLUMN error_message TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interpretation_reports' AND column_name = 'created_at')
  THEN
    ALTER TABLE interpretation_reports ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interpretation_reports' AND column_name = 'updated_at')
  THEN
    ALTER TABLE interpretation_reports ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Add status check constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'interpretation_reports_status_check')
  THEN
    ALTER TABLE interpretation_reports ADD CONSTRAINT interpretation_reports_status_check
      CHECK (status IN ('pending', 'generating', 'completed', 'failed'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add unique constraint on run_id + version if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'interpretation_reports_run_version_key')
  THEN
    ALTER TABLE interpretation_reports ADD CONSTRAINT interpretation_reports_run_version_key UNIQUE(run_id, version);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_interpretation_reports_run_version ON interpretation_reports(run_id, version);
CREATE INDEX IF NOT EXISTS idx_interpretation_reports_status ON interpretation_reports(status);
