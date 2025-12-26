// QA Test: MCQ Answer Saving
const API = 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;

async function testFlow() {
  console.log('=== QA TEST: Full Diagnostic Flow ===\n');

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

  // Step 2: Save setup context
  console.log('\n2. Saving setup context...');
  const setupRes = await fetch(API + '/diagnostic-runs/' + run.id + '/setup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + TOKEN
    },
    body: JSON.stringify({
      company: {
        name: 'QA Test Corp',
        industry: 'saas',
        revenue_range: '50m_250m',
        employee_count: '201_1000',
        finance_structure: 'hybrid',
        change_appetite: 'standardize'
      },
      pillar: {
        ftes: 5,
        systems: ['excel', 'powerbi'],
        complexity: { business_units: 3, currencies: 2, legal_entities: 4 },
        pain_points: ['long_cycles', 'lack_insights']
      }
    })
  });

  console.log('   Setup status:', setupRes.status);
  if (!setupRes.ok) {
    console.log('   Setup error:', await setupRes.text());
  } else {
    console.log('   Setup saved OK');
  }

  // Step 3: Test saving a single MCQ answer
  console.log('\n3. Testing MCQ answer save (single question)...');
  const testAnswer = {
    run_id: run.id,
    question_id: 'fpa_l1_q01',
    value: 'c'  // Correct field name
  };

  console.log('   Payload:', JSON.stringify(testAnswer));

  const answerRes = await fetch(API + '/diagnostic-inputs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + TOKEN
    },
    body: JSON.stringify(testAnswer)
  });

  console.log('   Response status:', answerRes.status);
  const answerData = await answerRes.json();
  console.log('   Response:', JSON.stringify(answerData).slice(0, 200));

  // Step 4: Verify the answer was saved
  console.log('\n4. Verifying answer was saved...');
  const verifyRes = await fetch(API + '/diagnostic-runs/' + run.id, {
    headers: { 'Authorization': 'Bearer ' + TOKEN }
  });

  const runData = await verifyRes.json();
  console.log('   Run status:', runData.status);
  console.log('   Inputs count:', runData.inputs?.length || 0);

  if (runData.inputs?.length > 0) {
    console.log('   First input:', JSON.stringify(runData.inputs[0]));
  } else {
    console.log('   NO INPUTS FOUND - MCQ saving is broken!');
  }

  // Step 5: Test multiple answers
  console.log('\n5. Testing multiple MCQ answers...');
  const questions = ['fpa_l1_q02', 'fpa_l1_q03', 'fpa_l1_q05'];

  for (const qId of questions) {
    const res = await fetch(API + '/diagnostic-inputs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + TOKEN
      },
      body: JSON.stringify({
        run_id: run.id,
        question_id: qId,
        value: 'b'
      })
    });
    console.log('   ' + qId + ': ' + (res.ok ? 'OK' : 'FAILED ' + res.status));
  }

  // Step 6: Final verification
  console.log('\n6. Final verification...');
  const finalRes = await fetch(API + '/diagnostic-runs/' + run.id, {
    headers: { 'Authorization': 'Bearer ' + TOKEN }
  });

  const finalData = await finalRes.json();
  console.log('   Total inputs saved:', finalData.inputs?.length || 0);
  console.log('   Expected:', 4);
  console.log('   Result:', (finalData.inputs?.length || 0) === 4 ? 'PASS' : 'FAIL');

  console.log('\n=== Test URLs ===');
  console.log('Setup: https://cfodiagnosisv1.vercel.app/run/' + run.id + '/setup/company');
  console.log('Assess: https://cfodiagnosisv1.vercel.app/assess?runId=' + run.id);
}

testFlow().catch(console.error);
