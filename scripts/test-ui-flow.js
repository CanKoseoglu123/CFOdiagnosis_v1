// Test UI setup flow - simulates what the frontend sends
const API = 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;

async function testUIFlow() {
  console.log('=== Testing UI Setup Flow on Production ===\n');

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

  // Step 2: Submit context exactly as frontend does
  console.log('\n2. Submitting context (as frontend would)...');

  // Company data (from CompanySetupPage)
  const company = {
    name: 'UI Flow Test Corp',
    industry: 'services',
    revenue_range: '50m_250m',
    employee_count: '201_1000',
    finance_ftes: '21_35',
    legal_entities: '4_10',
    finance_structure: 'hybrid',
    ownership_structure: 'pe_backed',
    change_appetite: 'transform'
  };

  // Pillar data (from PillarSetupPage)
  const pillar = {
    tools: ['powerbi', 'excel', 'adaptive'],
    other_tool: 'Custom in-house tool',
    team_size: '11_25',
    forecast_frequency: 'monthly',
    budget_process: ['hybrid', 'driver_based'],
    pain_points: ['long_cycles', 'lack_insights', 'tool_limitations'],
    other_pain_point: 'Integration challenges',
    user_role: 'fpa_manager',
    other_role: '',
    additional_context: 'Currently migrating from legacy Oracle system'
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
    const errorData = await setupRes.json();
    console.log('   FAILED:', errorData.error);
    if (errorData.details) {
      console.log('   Details:', errorData.details.join('\n            '));
    }
    return;
  }

  console.log('   Setup saved successfully!');

  // Step 3: Verify the saved context
  console.log('\n3. Verifying saved context...');
  const verifyRes = await fetch(API + '/diagnostic-runs/' + run.id, {
    headers: { 'Authorization': 'Bearer ' + TOKEN }
  });

  const verified = await verifyRes.json();

  console.log('\n   Company fields:');
  console.log('   - name:', verified.context?.company?.name);
  console.log('   - industry:', verified.context?.company?.industry);
  console.log('   - revenue_range:', verified.context?.company?.revenue_range);
  console.log('   - employee_count:', verified.context?.company?.employee_count);
  console.log('   - finance_ftes:', verified.context?.company?.finance_ftes);
  console.log('   - legal_entities:', verified.context?.company?.legal_entities);
  console.log('   - finance_structure:', verified.context?.company?.finance_structure);
  console.log('   - ownership_structure:', verified.context?.company?.ownership_structure);
  console.log('   - change_appetite:', verified.context?.company?.change_appetite);

  console.log('\n   Pillar fields:');
  console.log('   - tools:', verified.context?.pillar?.tools?.join(', '));
  console.log('   - other_tool:', verified.context?.pillar?.other_tool);
  console.log('   - team_size:', verified.context?.pillar?.team_size);
  console.log('   - forecast_frequency:', verified.context?.pillar?.forecast_frequency);
  console.log('   - budget_process:', verified.context?.pillar?.budget_process?.join(', '));
  console.log('   - pain_points:', verified.context?.pillar?.pain_points?.join(', '));
  console.log('   - user_role:', verified.context?.pillar?.user_role);
  console.log('   - additional_context:', verified.context?.pillar?.additional_context?.substring(0, 50) + '...');

  // Validation
  console.log('\n=== Test Results ===');
  const checks = [
    ['Company name saved', verified.context?.company?.name === 'UI Flow Test Corp'],
    ['Industry saved', verified.context?.company?.industry === 'services'],
    ['Finance FTEs saved', verified.context?.company?.finance_ftes === '21_35'],
    ['Ownership structure saved', verified.context?.company?.ownership_structure === 'pe_backed'],
    ['Tools saved', verified.context?.pillar?.tools?.includes('powerbi')],
    ['Team size saved', verified.context?.pillar?.team_size === '11_25'],
    ['Budget process saved', verified.context?.pillar?.budget_process?.includes('driver_based')],
    ['User role saved', verified.context?.pillar?.user_role === 'fpa_manager'],
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

testUIFlow().catch(console.error);
