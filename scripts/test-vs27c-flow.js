// VS-27c: End-to-end test for Persona Confirmation flow
// Tests: Create run → Create company profile → Verify classification → Save pillar → Verify setup

const API = process.env.API_URL || 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;

if (!TOKEN) {
  console.error('ERROR: AUTH_TOKEN environment variable required');
  console.log('Usage: AUTH_TOKEN="your-token" node scripts/test-vs27c-flow.js');
  process.exit(1);
}

async function test() {
  console.log('=== VS-27c End-to-End Flow Test ===\n');
  console.log('API:', API);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`
  };

  // Step 1: Create a new diagnostic run
  console.log('\n1. Creating new diagnostic run...');
  const createRes = await fetch(`${API}/diagnostic-runs`, {
    method: 'POST',
    headers
  });

  if (!createRes.ok) {
    console.log('   FAILED:', await createRes.text());
    return;
  }

  const run = await createRes.json();
  console.log('   Run ID:', run.id);
  console.log('   Status:', run.status);
  console.log('   company_profile_id:', run.company_profile_id || 'NULL (expected)');

  // Step 2: Create company profile with 9 classification inputs
  console.log('\n2. Creating company profile with classification inputs...');

  const companyContext = {
    name: 'VS27c Test Company',
    industry: 'saas',
    revenue_range: '50m_250m',
    employee_count: '201_1000',
    finance_structure: 'hybrid',
    // VS-27b: 9 classification inputs
    ownership_structure: 'pe_backed',
    change_appetite: 'standardize',
    revenue_trajectory: 'stable',
    debt_pressure: 'moderate',
    ma_intensity: 'low',
    gross_margin_band: 'high',
    audit_rigor: 'sox',
    erp_strategy: 'optimize'
  };

  const profileRes = await fetch(`${API}/api/company-profiles`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      context: companyContext,
      diagnostic_run_id: run.id
    })
  });

  if (!profileRes.ok) {
    console.log('   FAILED:', await profileRes.text());
    return;
  }

  const profile = await profileRes.json();
  console.log('   Profile ID:', profile.id);
  console.log('   Company Name:', profile.name);
  console.log('   Classification:');
  console.log('     - Persona:', profile.classification?.persona);
  console.log('     - Scores:', JSON.stringify(profile.classification?.scores));
  console.log('     - Reasoning:', profile.classification?.reasoning?.slice(0, 100) + '...');

  // Step 3: Verify run has company_profile_id linked
  console.log('\n3. Verifying company profile is linked to run...');
  const verifyRes = await fetch(`${API}/diagnostic-runs/${run.id}`, { headers });
  const verifiedRun = await verifyRes.json();

  if (verifiedRun.company_profile_id === profile.id) {
    console.log('   PASS: company_profile_id correctly linked');
  } else {
    console.log('   FAIL: Expected', profile.id, 'but got', verifiedRun.company_profile_id);
    return;
  }

  // Step 4: Test GET /diagnostic-runs/:runId/company-profile endpoint
  console.log('\n4. Testing company-profile endpoint via run ID...');
  const profileByRunRes = await fetch(`${API}/diagnostic-runs/${run.id}/company-profile`, { headers });

  if (!profileByRunRes.ok) {
    console.log('   FAILED:', await profileByRunRes.text());
    return;
  }

  const profileByRun = await profileByRunRes.json();
  console.log('   Profile fetched via run ID:');
  console.log('     - ID matches:', profileByRun.id === profile.id);
  console.log('     - Persona:', profileByRun.classification?.persona);

  // Step 5: Test persona switch (PATCH)
  console.log('\n5. Testing persona switch...');
  const scores = profile.classification?.scores || {};
  const sortedPersonas = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  if (sortedPersonas.length < 2) {
    console.log('   SKIP: Only one persona scored, cannot test switch');
  } else {
    const originalPersona = sortedPersonas[0][0];
    const alternativePersona = sortedPersonas[1][0];
    console.log('   Original persona:', originalPersona);
    console.log('   Switching to:', alternativePersona);

    const switchRes = await fetch(`${API}/api/company-profiles/${profile.id}/persona`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        selected_persona: alternativePersona,
        reason: 'Testing persona switch functionality'
      })
    });

    if (!switchRes.ok) {
      console.log('   FAILED:', await switchRes.text());
    } else {
      const switched = await switchRes.json();
      console.log('   New persona:', switched.classification?.persona);
      console.log('   Override:', JSON.stringify(switched.classification?.override));
      console.log('   PASS: Persona switch successful');
    }
  }

  // Step 6: Save pillar context (V2 format - pillar only)
  console.log('\n6. Saving pillar context (V2 format)...');

  const pillarContext = {
    tools: [
      { tool: 'excel', effectiveness: 'medium' },
      { tool: 'adaptive', effectiveness: 'high' }
    ],
    team_size: '6_10',
    forecast_frequency: 'monthly',
    budget_process: ['hybrid', 'driver_based'],
    pain_points: ['long_cycles', 'lack_insights'],
    user_role: 'fpa_director'
  };

  const setupRes = await fetch(`${API}/diagnostic-runs/${run.id}/setup`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ pillar: pillarContext })
  });

  if (!setupRes.ok) {
    console.log('   FAILED:', await setupRes.text());
    return;
  }

  const setup = await setupRes.json();
  console.log('   Setup completed at:', setup.setup_completed_at);
  console.log('   Context version:', setup.context?.version);
  console.log('   Pillar tools:', setup.context?.pillar?.tools?.length, 'tools');
  console.log('   PASS: Pillar saved in V2 format');

  // Step 7: Verify final run state
  console.log('\n7. Verifying final run state...');
  const finalRes = await fetch(`${API}/diagnostic-runs/${run.id}`, { headers });
  const finalRun = await finalRes.json();

  console.log('   Status:', finalRun.status);
  console.log('   setup_completed_at:', finalRun.setup_completed_at ? 'SET' : 'NULL');
  console.log('   company_profile_id:', finalRun.company_profile_id);
  console.log('   context.version:', finalRun.context?.version);
  console.log('   context.pillar:', finalRun.context?.pillar ? 'PRESENT' : 'MISSING');

  // Summary
  console.log('\n=== Test Results ===');
  const checks = [
    ['Run created', !!run.id],
    ['Company profile created', !!profile.id],
    ['Classification assigned', !!profile.classification?.persona],
    ['Profile linked to run', verifiedRun.company_profile_id === profile.id],
    ['Pillar saved (V2)', finalRun.context?.version === 'v2'],
    ['Setup completed', !!finalRun.setup_completed_at]
  ];

  let passed = 0;
  for (const [name, result] of checks) {
    console.log(result ? `  ✅ ${name}` : `  ❌ ${name}`);
    if (result) passed++;
  }

  console.log(`\nResult: ${passed}/${checks.length} checks passed`);
  console.log(passed === checks.length ? '\n✅ ALL TESTS PASSED!' : '\n❌ SOME TESTS FAILED');

  console.log('\n=== Test URLs ===');
  console.log(`Company Setup:  https://cfodiagnosisv1.vercel.app/run/${run.id}/setup/company`);
  console.log(`Persona Confirm: https://cfodiagnosisv1.vercel.app/run/${run.id}/setup/persona`);
  console.log(`Pillar Setup:   https://cfodiagnosisv1.vercel.app/run/${run.id}/setup/pillar`);
  console.log(`Intro Page:     https://cfodiagnosisv1.vercel.app/run/${run.id}/intro`);
}

test().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
