// run-migration.js
// Run the VS21 migration via Supabase

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ocyxlongqcyjpfqodgid.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jeXhsb25ncWN5anBmcW9kZ2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1ODk0MzksImV4cCI6MjA4MTE2NTQzOX0.4yGGz1UpnjX6AEwzFMTUxeqZ3uw4ZaM3GfdaH5zVM2c';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runMigration() {
  console.log('Testing if calibration column exists...');

  // Try to select the column to see if it exists
  const { data, error } = await supabase
    .from('diagnostic_runs')
    .select('id, calibration')
    .limit(1);

  if (error) {
    console.log('Error details:', JSON.stringify(error, null, 2));
    if (error.message.includes('calibration')) {
      console.log('❌ Column does not exist in schema cache.');
      console.log('Run in SQL Editor:');
      console.log(`
ALTER TABLE diagnostic_runs
ADD COLUMN IF NOT EXISTS calibration JSONB DEFAULT '{}'::jsonb;

-- Then reload schema:
NOTIFY pgrst, 'reload schema';
      `);
      return false;
    }
    console.log('Error:', error.message);
    return false;
  }

  console.log('✅ Calibration column exists!');
  console.log('Sample data:', data);
  return true;
}

// Also try to update a row to verify write access
async function testUpdate() {
  console.log('\nTesting update capability...');

  // Get an existing run
  const { data: runs } = await supabase
    .from('diagnostic_runs')
    .select('id')
    .limit(1);

  if (!runs || runs.length === 0) {
    console.log('No runs found to test');
    return;
  }

  const testRunId = runs[0].id;
  console.log('Testing with run:', testRunId);

  const { data, error } = await supabase
    .from('diagnostic_runs')
    .update({ calibration: { test: true } })
    .eq('id', testRunId)
    .select();

  if (error) {
    console.log('❌ Update failed:', error.message);
  } else {
    console.log('✅ Update succeeded:', data);
  }
}

runMigration().then(() => testUpdate());
