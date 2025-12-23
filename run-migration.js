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
    if (error.message.includes('calibration')) {
      console.log('❌ Column does not exist. Please run migration in Supabase SQL Editor:');
      console.log(`
ALTER TABLE diagnostic_runs
ADD COLUMN IF NOT EXISTS calibration JSONB DEFAULT '{}'::jsonb;
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

runMigration();
