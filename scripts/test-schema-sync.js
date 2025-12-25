// Test schema sync on production
const API = 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;

async function testSetupFlow() {
  console.log('=== Testing Setup Flow on Production ===\n');

  // Step 1: Create a new run
  console.log('1. Creating new diagnostic run...');
  const createRes = await fetch(API + '/diagnostic-runs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + TOKEN
    }
  });

  if (!createRes.ok) {
    console.log('   FAILED:', await createRes.text());
    return;
  }

  const run = await createRes.json();
  console.log('   Run ID:', run.id);
  console.log('   Status:', run.status);

  // Step 2: Submit v1 context with NEW schema values
  console.log('\n2. Submitting v1 context with NEW schema values...');

  const company = {
    name: 'Schema Sync Test Corp',
    industry: 'services',           // NEW value (was professional_services)
    revenue_range: '50m_250m',      // NEW value (was 50m_100m)
    employee_count: '201_1000',
    finance_structure: 'hybrid',
    change_appetite: 'standardize'
  };

  const pillar = {
    ftes: 8,
    systems: ['powerbi', 'excel', 'adaptive'],  // NEW values
    complexity: {
      business_units: 3,
      currencies: 2,
      legal_entities: 4
    },
    pain_points: ['long_cycles', 'lack_insights', 'headcount'],  // NEW values
    ongoing_projects: 'ERP migration Q1'
  };

  const setupRes = await fetch(API + '/diagnostic-runs/' + run.id + '/setup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + TOKEN
    },
    body: JSON.stringify({ company, pillar })
  });

  if (!setupRes.ok) {
    console.log('   FAILED:', await setupRes.text());
    return;
  }

  const setupData = await setupRes.json();
  console.log('   Setup saved:', setupData.message || 'OK');

  // Step 3: Verify the saved context
  console.log('\n3. Verifying saved context...');
  const verifyRes = await fetch(API + '/diagnostic-runs/' + run.id, {
    headers: { 'Authorization': 'Bearer ' + TOKEN }
  });

  const verified = await verifyRes.json();
  console.log('   Version:', verified.context?.version);
  console.log('   Company:', verified.context?.company?.name);
  console.log('   Industry:', verified.context?.company?.industry);
  console.log('   Revenue:', verified.context?.company?.revenue_range);
  console.log('   Tools:', verified.context?.pillar?.tools?.join(', '));
  console.log('   Pain points:', verified.context?.pillar?.pain_points?.join(', '));
  console.log('   Setup completed:', verified.setup_completed_at ? 'YES' : 'NO');

  // Validation
  console.log('\n=== Test Results ===');
  const checks = [
    ['Version is v1', verified.context?.version === 'v1'],
    ['Industry is services', verified.context?.company?.industry === 'services'],
    ['Revenue is 50m_250m', verified.context?.company?.revenue_range === '50m_250m'],
    ['Tools includes powerbi', verified.context?.pillar?.tools?.includes('powerbi')],
    ['Pain points includes long_cycles', verified.context?.pillar?.pain_points?.includes('long_cycles')],
    ['Setup completed', !!verified.setup_completed_at]
  ];

  let passed = 0;
  for (const [name, result] of checks) {
    console.log(result ? '✅ ' + name : '❌ ' + name);
    if (result) passed++;
  }

  console.log('\nResult:', passed + '/' + checks.length, 'checks passed');
  console.log(passed === checks.length ? '\n✅ ALL TESTS PASSED!' : '\n❌ SOME TESTS FAILED');

  console.log('\nTest URL: https://cfodiagnosisv1.vercel.app/run/' + run.id + '/setup/company');
}

testSetupFlow().catch(console.error);
