/**
 * Run VS-32 migration via Supabase REST API
 *
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_KEY env vars
 * The service key is required for DDL operations
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || "https://ocyxlongqcyjpfqodgid.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.log('\n=== VS-32 Migration SQL ===');
  console.log('To run the migration, paste this SQL in Supabase Dashboard > SQL Editor:\n');
  console.log('---');

  const sql = `-- VS-32: Add columns to interpretation_reports table
-- Safe to re-run (idempotent)

ALTER TABLE interpretation_reports ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE interpretation_reports ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE interpretation_reports ADD COLUMN IF NOT EXISTS sections JSONB;
ALTER TABLE interpretation_reports ADD COLUMN IF NOT EXISTS schema_version INTEGER DEFAULT 1;
ALTER TABLE interpretation_reports ADD COLUMN IF NOT EXISTS input_hash TEXT;
ALTER TABLE interpretation_reports ADD COLUMN IF NOT EXISTS heuristics_passed BOOLEAN;
ALTER TABLE interpretation_reports ADD COLUMN IF NOT EXISTS heuristics_violations JSONB;
ALTER TABLE interpretation_reports ADD COLUMN IF NOT EXISTS used_fallback BOOLEAN DEFAULT false;
ALTER TABLE interpretation_reports ADD COLUMN IF NOT EXISTS fallback_reason TEXT;
ALTER TABLE interpretation_reports ADD COLUMN IF NOT EXISTS generation_attempts INTEGER DEFAULT 0;
ALTER TABLE interpretation_reports ADD COLUMN IF NOT EXISTS model_used TEXT;
ALTER TABLE interpretation_reports ADD COLUMN IF NOT EXISTS tokens_used INTEGER;
ALTER TABLE interpretation_reports ADD COLUMN IF NOT EXISTS latency_ms INTEGER;
ALTER TABLE interpretation_reports ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE interpretation_reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE interpretation_reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_interpretation_reports_run_version ON interpretation_reports(run_id, version);
CREATE INDEX IF NOT EXISTS idx_interpretation_reports_status ON interpretation_reports(status);

-- Add unique constraint (ignore if already exists)
DO $$
BEGIN
  ALTER TABLE interpretation_reports ADD CONSTRAINT interpretation_reports_run_version_key UNIQUE(run_id, version);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`;

  console.log(sql);
  console.log('\n---');
  console.log('\nGo to: https://supabase.com/dashboard/project/ocyxlongqcyjpfqodgid/sql/new');
  console.log('Paste the SQL above and click "Run"');
  process.exit(0);
}

// If service key is provided, try to run via API
async function runMigration() {
  console.log('Running VS-32 migration via Supabase...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const columns = [
    { name: 'version', type: 'INTEGER DEFAULT 1' },
    { name: 'status', type: "TEXT DEFAULT 'pending'" },
    { name: 'sections', type: 'JSONB' },
    { name: 'schema_version', type: 'INTEGER DEFAULT 1' },
    { name: 'input_hash', type: 'TEXT' },
    { name: 'heuristics_passed', type: 'BOOLEAN' },
    { name: 'heuristics_violations', type: 'JSONB' },
    { name: 'used_fallback', type: 'BOOLEAN DEFAULT false' },
    { name: 'fallback_reason', type: 'TEXT' },
    { name: 'generation_attempts', type: 'INTEGER DEFAULT 0' },
    { name: 'model_used', type: 'TEXT' },
    { name: 'tokens_used', type: 'INTEGER' },
    { name: 'latency_ms', type: 'INTEGER' },
    { name: 'error_message', type: 'TEXT' },
    { name: 'created_at', type: 'TIMESTAMPTZ DEFAULT NOW()' },
    { name: 'updated_at', type: 'TIMESTAMPTZ DEFAULT NOW()' },
  ];

  console.log('Supabase service role cannot run DDL directly.');
  console.log('Please use the SQL Editor in Supabase Dashboard.');
  process.exit(1);
}

runMigration().catch(console.error);
