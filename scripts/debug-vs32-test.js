// debug-vs32-test.js
// VS-32c end-to-end test script
// Tests the full Critic Agent + Clarifying Questions pipeline
// Usage: AUTH_TOKEN="..." node scripts/debug-vs32-test.js

const API = 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;

if (!TOKEN) {
  console.error('ERROR: Set AUTH_TOKEN environment variable');
  console.error('Usage: AUTH_TOKEN="your_token" node scripts/debug-vs32-test.js');
  process.exit(1);
}

async function debugTest() {
  console.log('=== VS-32c Critic + Clarifying Questions Pipeline Test ===\n');

  // Step 1: Test API health
  console.log('1. Testing API health...');
  try {
    const healthRes = await fetch(API + '/health');
    const health = await healthRes.json();
    console.log('   Status:', healthRes.status);
    console.log('   Response:', JSON.stringify(health));
  } catch (e) {
    console.log('   ERROR:', e.message);
    return;
  }

  // Step 2: Create run
  console.log('\n2. Creating diagnostic run...');
  let runId;
  try {
    const createRes = await fetch(API + '/diagnostic-runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + TOKEN
      }
    });
    console.log('   Status:', createRes.status);
    const createText = await createRes.text();
    console.log('   Response:', createText.slice(0, 500));

    if (!createRes.ok) {
      console.log('   FAILED to create run');
      return;
    }

    const run = JSON.parse(createText);
    runId = run.id;
    console.log('   Run ID:', runId);
  } catch (e) {
    console.log('   ERROR:', e.message);
    return;
  }

  // Step 3: Setup context (test with valid company)
  console.log('\n3. Setting up context...');
  try {
    const setupRes = await fetch(API + '/diagnostic-runs/' + runId + '/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + TOKEN
      },
      body: JSON.stringify({
        company: {
          name: 'Debug Test Corp',
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
    console.log('   Status:', setupRes.status);
    const setupText = await setupRes.text();
    console.log('   Response:', setupText.slice(0, 500));

    if (!setupRes.ok) {
      console.log('   FAILED at setup');
      return;
    }
  } catch (e) {
    console.log('   ERROR:', e.message);
    return;
  }

  // Step 4: Submit a few test answers
  console.log('\n4. Submitting test answers...');
  const testQuestions = [
    'fpa_l1_q01', 'fpa_l1_q02', 'fpa_l1_q03', 'fpa_l1_q04', 'fpa_l1_q05',
    'fpa_l2_q01', 'fpa_l2_q02', 'fpa_l2_q03'
  ];

  for (const qId of testQuestions) {
    try {
      const ansRes = await fetch(API + '/diagnostic-inputs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + TOKEN
        },
        body: JSON.stringify({
          run_id: runId,
          question_id: qId,
          value: 'b'
        })
      });
      console.log(`   ${qId}: ${ansRes.status}`);

      if (!ansRes.ok) {
        const errText = await ansRes.text();
        console.log('   Error:', errText.slice(0, 200));
      }
    } catch (e) {
      console.log(`   ${qId} ERROR:`, e.message);
    }
  }

  // Step 5: Complete run
  console.log('\n5. Completing run...');
  try {
    const completeRes = await fetch(API + '/diagnostic-runs/' + runId + '/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + TOKEN
      }
    });
    console.log('   Status:', completeRes.status);
    const completeText = await completeRes.text();
    console.log('   Response:', completeText.slice(0, 500));

    if (!completeRes.ok) {
      console.log('   FAILED to complete');
      return;
    }
  } catch (e) {
    console.log('   ERROR:', e.message);
    return;
  }

  // Step 6: Start interpretation
  console.log('\n6. Starting interpretation...');
  try {
    const startRes = await fetch(API + '/diagnostic-runs/' + runId + '/interpret/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + TOKEN
      }
    });
    console.log('   Status:', startRes.status);
    const startText = await startRes.text();
    console.log('   Response:', startText.slice(0, 500));

    if (!startRes.ok) {
      console.log('   FAILED to start interpretation');
      return;
    }

    const startData = JSON.parse(startText);
    console.log('   Session ID:', startData.session_id);
    console.log('   Initial status:', startData.status);

    // Step 7: Poll for status (max 90 seconds) - VS-32c pipeline
    console.log('\n7. Polling for completion (max 90s)...');
    let attempts = 0;
    const maxAttempts = 45;  // 45 x 2s = 90s
    let finalStatus = startData.status;
    let pendingQuestions = [];

    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 2000));
      attempts++;

      const statusRes = await fetch(API + '/diagnostic-runs/' + runId + '/interpret/status', {
        headers: { 'Authorization': 'Bearer ' + TOKEN }
      });
      const statusData = await statusRes.json();
      finalStatus = statusData.status;

      let stageInfo = `   [${attempts}] ${finalStatus}`;
      if (statusData.loop_round) {
        stageInfo += ` (round ${statusData.loop_round})`;
      }
      console.log(stageInfo);

      // VS-32c: Handle awaiting_answers state
      if (finalStatus === 'awaiting_answers') {
        pendingQuestions = statusData.pending_questions || [];
        console.log(`   >>> ${pendingQuestions.length} clarifying questions pending`);
        pendingQuestions.forEach((q, i) => {
          console.log(`       Q${i + 1}: ${q.question_text?.slice(0, 60)}...`);
        });

        // Auto-skip questions for testing (submit empty answers)
        console.log('   >>> Auto-skipping questions for test...');
        const skipAnswers = pendingQuestions.map(q => ({
          question_id: q.question_id,
          question_text: q.question_text,
          answer: null,
          skipped: true
        }));

        await fetch(API + '/diagnostic-runs/' + runId + '/interpret/answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + TOKEN
          },
          body: JSON.stringify({ answers: skipAnswers })
        });
        continue;  // Resume polling
      }

      if (['completed', 'complete', 'failed', 'force_finalized'].includes(finalStatus)) {
        break;
      }
    }

    // Step 8: Get report (VS-32c format)
    console.log('\n8. Fetching interpreted report...');
    const reportRes = await fetch(API + '/diagnostic-runs/' + runId + '/interpret/report', {
      headers: { 'Authorization': 'Bearer ' + TOKEN }
    });
    console.log('   Status:', reportRes.status);

    if (reportRes.ok) {
      const report = await reportRes.json();
      console.log('   Quality:', report.quality_status);
      console.log('   Rounds used:', report.rounds_used);
      console.log('   Total questions asked:', report.total_questions_asked || 0);

      // VS-32c format: overview_sections array
      const sections = report.sections || [];
      console.log('   Sections count:', sections.length);

      if (sections.length > 0) {
        console.log('\n   --- VS-32c Overview Sections ---');
        sections.forEach((section, i) => {
          console.log(`   [${i + 1}] ${section.id || 'unknown'}: ${(section.content || '').slice(0, 80)}...`);
        });
      }

      // Check for heuristics result
      if (report.heuristics_result) {
        console.log('\n   --- Heuristics ---');
        console.log('   Status:', report.heuristics_result.status);
        console.log('   Violations:', report.heuristics_result.violations?.length || 0);
      }

      console.log('\n=== SUCCESS ===');
      console.log('Report URL:', 'https://cfodiagnosisv1.vercel.app/report/' + runId);
    } else {
      const errText = await reportRes.text();
      console.log('   Error:', errText.slice(0, 500));
    }

  } catch (e) {
    console.log('   ERROR:', e.message);
  }
}

debugTest().catch(console.error);
