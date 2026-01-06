// Debug script: Trace company profile creation and linking
const API = process.env.API_URL || 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;

if (!TOKEN) {
  console.error('ERROR: AUTH_TOKEN required');
  process.exit(1);
}

async function test() {
  console.log('=== Debug Company Profile Linking ===\n');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`
  };

  // Step 1: Create a new diagnostic run
  console.log('1. Creating diagnostic run...');
  const createRes = await fetch(`${API}/diagnostic-runs`, {
    method: 'POST',
    headers
  });
  const run = await createRes.json();
  console.log('   Run ID:', run.id);
  console.log('   User ID (owner_id):', run.owner_id);
  console.log('   company_profile_id BEFORE:', run.company_profile_id);

  // Step 2: Create company profile
  console.log('\n2. Creating company profile...');
  const profileRes = await fetch(`${API}/api/company-profiles`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      context: {
        name: 'Debug Test Company',
        industry: 'saas',
        revenue_range: '50m_250m',
        employee_count: '201_1000',
        finance_structure: 'hybrid',
        ownership_structure: 'pe_backed',
        change_appetite: 'standardize',
        legal_entities: '6_10',
        revenue_trajectory: 'stable',
        debt_pressure: 'none',
        ma_intensity: 'low',
        gross_margin_band: 'high',
        audit_rigor: 'sox',
        erp_strategy: 'optimize'
      },
      diagnostic_run_id: run.id
    })
  });

  console.log('   Profile creation status:', profileRes.status);
  const profile = await profileRes.json();

  if (profileRes.ok) {
    console.log('   Profile ID:', profile.id);
    console.log('   Persona:', profile.classification?.persona);
  } else {
    console.log('   ERROR:', JSON.stringify(profile));
    return;
  }

  // Step 3: Check if company_profile_id was linked
  console.log('\n3. Checking diagnostic run after profile creation...');
  const checkRes = await fetch(`${API}/diagnostic-runs/${run.id}`, { headers });
  const updatedRun = await checkRes.json();

  console.log('   company_profile_id AFTER:', updatedRun.company_profile_id);
  console.log('   Expected profile ID:', profile.id);
  console.log('   LINKED:', updatedRun.company_profile_id === profile.id ? 'YES' : 'NO <<<< BUG');

  // Step 4: Test the company-profile endpoint
  console.log('\n4. Testing GET /diagnostic-runs/:id/company-profile...');
  const companyProfileRes = await fetch(`${API}/diagnostic-runs/${run.id}/company-profile`, { headers });
  console.log('   Status:', companyProfileRes.status);

  if (companyProfileRes.ok) {
    const fetchedProfile = await companyProfileRes.json();
    console.log('   Profile fetched successfully!');
    console.log('   ID:', fetchedProfile.id);
  } else {
    const error = await companyProfileRes.json();
    console.log('   ERROR:', error.error);
  }

  // Summary
  console.log('\n=== Diagnosis ===');
  if (updatedRun.company_profile_id === profile.id) {
    console.log('✅ Profile linking works correctly');
  } else {
    console.log('❌ Profile NOT linked to diagnostic run');
    console.log('   Possible causes:');
    console.log('   - Migration not applied (company_profile_id column missing)');
    console.log('   - RLS blocking the update');
    console.log('   - user_id mismatch between run and profile');
  }
}

test().catch(console.error);
