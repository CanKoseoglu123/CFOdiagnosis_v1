// Debug VS-27c company profile linking flow
const email = 'koseoglucan@gmail.com';
const password = process.env.TEST_PASSWORD || '123456';
const API = 'https://cfodiagnosisv1-production.up.railway.app';
const SUPABASE_URL = 'https://ocyxlongqcyjpfqodgid.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jeXhsb25ncWN5anBmcW9kZ2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1ODk0MzksImV4cCI6MjA4MTE2NTQzOX0.4yGGz1UpnjX6AEwzFMTUxeqZ3uw4ZaM3GfdaH5zVM2c';

async function debug() {
  console.log('=== VS-27c Flow Debugging ===\n');

  // Step 1: Login
  console.log('1. Logging in...');
  const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON
    },
    body: JSON.stringify({ email, password })
  });

  const loginData = await loginRes.json();
  if (!loginData.access_token) {
    console.log('   FAILED: Login failed:', loginData);
    return;
  }

  const TOKEN = loginData.access_token;
  const userId = loginData.user?.id;
  console.log('   OK: User ID:', userId);

  // Step 2: Create a new diagnostic run
  console.log('\n2. Creating diagnostic run...');
  const runRes = await fetch(`${API}/diagnostic-runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    }
  });

  if (!runRes.ok) {
    console.log('   FAILED:', await runRes.text());
    return;
  }

  const run = await runRes.json();
  console.log('   OK: Run ID:', run.id);
  console.log('   Run owner_id:', run.owner_id);

  // Step 3: Create company profile with linking
  console.log('\n3. Creating company profile with run linking...');
  const profileRes = await fetch(`${API}/api/company-profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    },
    body: JSON.stringify({
      context: {
        name: 'Debug Test Company',
        industry: 'saas',
        revenue_range: '50m_250m',
        employee_count: '201_1000',
        finance_structure: 'hybrid',
        ownership_structure: 'pe_backed',
        change_appetite: 'standardize',
        legal_entities: '11_25',
        revenue_trajectory: 'growth_20_50',
        debt_pressure: 'moderate',
        ma_intensity: 'inactive',
        gross_margin_band: 'above_50',
        audit_rigor: 'big4',
        erp_strategy: 'tier1'
      },
      diagnostic_run_id: run.id
    })
  });

  console.log('   Status:', profileRes.status);
  if (!profileRes.ok) {
    const error = await profileRes.text();
    console.log('   FAILED:', error);
    return;
  }

  const profile = await profileRes.json();
  console.log('   OK: Profile ID:', profile.id);
  console.log('   Classification:', profile.classification?.persona, '(confidence:', profile.classification?.confidence + ')');

  // Step 4: Verify the run was linked
  console.log('\n4. Verifying run was linked to profile...');
  const verifyRunRes = await fetch(`${API}/diagnostic-runs/${run.id}`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });

  if (!verifyRunRes.ok) {
    console.log('   FAILED:', await verifyRunRes.text());
    return;
  }

  const verifyRun = await verifyRunRes.json();
  console.log('   Run company_profile_id:', verifyRun.company_profile_id);
  console.log('   Linked:', verifyRun.company_profile_id === profile.id ? 'YES' : 'NO - MISMATCH!');

  // Step 5: Test the endpoint that PersonaConfirmationPage uses
  console.log('\n5. Testing GET /diagnostic-runs/:id/company-profile...');
  const profileGetRes = await fetch(`${API}/diagnostic-runs/${run.id}/company-profile`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });

  console.log('   Status:', profileGetRes.status);
  if (!profileGetRes.ok) {
    const error = await profileGetRes.text();
    console.log('   FAILED:', error);
    console.log('\n   >>> THIS IS THE BUG! The profile is not linked properly <<<');
    return;
  }

  const fetchedProfile = await profileGetRes.json();
  console.log('   OK: Profile fetched');
  console.log('   Persona:', fetchedProfile.classification?.persona);
  console.log('   Scores:', JSON.stringify(fetchedProfile.classification?.scores || {}));

  console.log('\n=== SUCCESS: All steps passed ===');
  console.log('\nTest URL: https://cfodiagnosisv1.vercel.app/run/' + run.id + '/setup/persona');
}

debug().catch(err => {
  console.error('Script error:', err);
});
