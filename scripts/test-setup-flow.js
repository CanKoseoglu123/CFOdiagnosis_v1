// Test VS25 Setup Flow on Production
const API = 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;

async function test() {
  console.log('=== VS25 Setup Flow Test ===\n');

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
    console.log('Failed to create run:', await createRes.text());
    return;
  }

  const run = await createRes.json();
  console.log('   Run ID:', run.id);
  console.log('   Status:', run.status);

  // Step 2: Submit v1 context (simulating Company + Pillar pages)
  console.log('\n2. Submitting v1 context (company + pillar)...');

  const company = {
    name: 'Test Corp Setup Flow',
    industry: 'saas',
    revenue_range: '50m_250m',
    employee_count: '201_1000',
    finance_structure: 'hybrid',
    change_appetite: 'standardize'
  };

  const pillar = {
    ftes: 5.5,
    systems: ['excel_sheets', 'bi_tools'],
    complexity: {
      business_units: 4,
      currencies: 3,
      legal_entities: 6
    },
    pain_points: ['manual_consolidation', 'lack_of_insights'],
    ongoing_projects: 'ERP migration Q2'
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
    console.log('Failed to save context:', await setupRes.text());
    return;
  }

  const setupData = await setupRes.json();
  console.log('   Setup saved:', setupData.message || 'OK');

  // Step 3: Verify the run has context
  console.log('\n3. Verifying saved context...');
  const verifyRes = await fetch(API + '/diagnostic-runs/' + run.id, {
    headers: { 'Authorization': 'Bearer ' + TOKEN }
  });

  const verified = await verifyRes.json();
  console.log('   Context version:', verified.context?.version);
  console.log('   Company name:', verified.context?.company?.name);
  console.log('   Industry:', verified.context?.company?.industry);
  console.log('   Change appetite:', verified.context?.company?.change_appetite);
  console.log('   FTEs:', verified.context?.pillar?.ftes);
  console.log('   Systems:', verified.context?.pillar?.systems?.join(', '));
  console.log('   Pain points:', verified.context?.pillar?.pain_points?.join(', '));
  console.log('   Setup completed:', verified.setup_completed_at ? 'YES' : 'NO');

  // Success summary
  console.log('\n=== Test Result ===');
  const passed = verified.context?.version === 'v1' &&
                 verified.context?.company?.name === 'Test Corp Setup Flow' &&
                 verified.setup_completed_at;
  console.log(passed ? '✅ PASSED - Setup flow works correctly!' : '❌ FAILED');

  console.log('\nFrontend URLs to test manually:');
  console.log('  Company setup: https://cfodiagnosisv1.vercel.app/run/' + run.id + '/setup/company');
  console.log('  Pillar setup:  https://cfodiagnosisv1.vercel.app/run/' + run.id + '/setup/pillar');
}

test().catch(console.error);
