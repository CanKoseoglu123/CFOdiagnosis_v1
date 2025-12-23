// test-vs21-flow.js
// End-to-end test for VS21 Calibration Flow

const API_BASE = 'https://cfodiagnosisv1-production.up.railway.app';
const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.error('Usage: AUTH_TOKEN=<token> node test-vs21-flow.js');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testVS21Flow() {
  console.log('='.repeat(60));
  console.log('VS21 CALIBRATION FLOW TEST');
  console.log('='.repeat(60));

  // Step 1: Create a new diagnostic run
  console.log('\n1. Creating new diagnostic run...');
  const createRes = await fetch(`${API_BASE}/diagnostic-runs`, {
    method: 'POST',
    headers
  });

  if (!createRes.ok) {
    console.error('❌ Failed to create run:', await createRes.text());
    return;
  }

  const run = await createRes.json();
  const runId = run.id;
  console.log(`✅ Created run: ${runId}`);

  // Step 2: Complete setup
  console.log('\n2. Completing setup...');
  const setupRes = await fetch(`${API_BASE}/diagnostic-runs/${runId}/setup`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      company_name: 'VS21 Test Company',
      industry: 'Technology'
    })
  });

  if (!setupRes.ok) {
    console.error('❌ Failed to complete setup:', await setupRes.text());
    return;
  }
  console.log('✅ Setup completed');

  // Step 3: Answer all questions (mix of yes/no)
  console.log('\n3. Answering questions...');
  const specRes = await fetch(`${API_BASE}/api/spec`);
  const spec = await specRes.json();

  let answeredCount = 0;
  for (const q of spec.questions) {
    // Answer pattern: criticals = yes, L1/L2 = 80% yes, L3/L4 = 50% yes
    let answer = true;
    if (q.is_critical) {
      answer = true; // Always pass criticals
    } else if (q.level <= 2) {
      answer = Math.random() < 0.8; // 80% yes for L1/L2
    } else {
      answer = Math.random() < 0.5; // 50% yes for L3/L4
    }

    await fetch(`${API_BASE}/diagnostic-inputs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        run_id: runId,
        question_id: q.id,
        value: answer
      })
    });
    answeredCount++;
  }
  console.log(`✅ Answered ${answeredCount} questions`);

  // Step 4: Complete the run
  console.log('\n4. Completing run...');
  const completeRes = await fetch(`${API_BASE}/diagnostic-runs/${runId}/complete`, {
    method: 'POST',
    headers
  });

  if (!completeRes.ok) {
    console.error('❌ Failed to complete run:', await completeRes.text());
    return;
  }
  console.log('✅ Run completed');

  // Step 5: Score the run
  console.log('\n5. Scoring run...');
  const scoreRes = await fetch(`${API_BASE}/diagnostic-runs/${runId}/score`, {
    method: 'POST',
    headers
  });

  if (!scoreRes.ok) {
    console.error('❌ Failed to score run:', await scoreRes.text());
    return;
  }
  console.log('✅ Run scored');

  // Step 6: Test GET calibration endpoint
  console.log('\n6. Testing GET /calibration endpoint...');
  const getCalibRes = await fetch(`${API_BASE}/diagnostic-runs/${runId}/calibration`, {
    headers
  });

  if (!getCalibRes.ok) {
    console.error('❌ Failed to get calibration:', await getCalibRes.text());
    return;
  }

  const calibData = await getCalibRes.json();
  console.log('✅ GET calibration response:', JSON.stringify(calibData, null, 2));

  // Step 7: Test POST calibration endpoint with custom importance
  console.log('\n7. Testing POST /calibration endpoint...');
  const customImportance = {
    'obj_fpa_l1_budget': 5,      // Critical
    'obj_fpa_l1_control': 4,    // High
    'obj_fpa_l2_variance': 3,   // Medium (default)
    'obj_fpa_l2_forecast': 2,   // Low
    'obj_fpa_l3_driver': 1,     // Minimal
    'obj_fpa_l3_scenario': 4,   // High
    'obj_fpa_l4_integrate': 3,  // Medium
    'obj_fpa_l4_predict': 5     // Critical
  };

  const postCalibRes = await fetch(`${API_BASE}/diagnostic-runs/${runId}/calibration`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ importance_map: customImportance })
  });

  if (!postCalibRes.ok) {
    console.error('❌ Failed to save calibration:', await postCalibRes.text());
    return;
  }

  const savedCalib = await postCalibRes.json();
  console.log('✅ POST calibration response:', JSON.stringify(savedCalib, null, 2));

  // Step 8: Get report and check for importance in actions
  console.log('\n8. Getting report with calibrated actions...');
  const reportRes = await fetch(`${API_BASE}/diagnostic-runs/${runId}/report`, {
    headers
  });

  if (!reportRes.ok) {
    console.error('❌ Failed to get report:', await reportRes.text());
    return;
  }

  const report = await reportRes.json();

  // Check prioritized actions for importance
  const actionsWithImportance = [];
  if (report.grouped_initiatives) {
    for (const init of report.grouped_initiatives) {
      for (const action of init.actions || []) {
        if (action.importance) {
          actionsWithImportance.push({
            title: action.action_title || action.action_text?.substring(0, 40),
            importance: action.importance,
            score: action.score,
            priority: action.priority
          });
        }
      }
    }
  }

  console.log('\n✅ Actions with importance badges:');
  if (actionsWithImportance.length > 0) {
    console.table(actionsWithImportance.slice(0, 10));
  } else {
    console.log('   No actions with importance found (may need calibration data)');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Run ID: ${runId}`);
  console.log(`Execution Score: ${report.maturity_v2?.execution_score || 'N/A'}%`);
  console.log(`Actual Level: ${report.maturity_v2?.actual_level || 'N/A'}`);
  console.log(`Potential Level: ${report.maturity_v2?.potential_level || 'N/A'}`);
  console.log(`Capped: ${report.maturity_v2?.capped || false}`);
  console.log(`Total Actions: ${report.grouped_initiatives?.reduce((s, i) => s + (i.actions?.length || 0), 0) || 0}`);
  console.log(`Actions with Importance: ${actionsWithImportance.length}`);

  console.log('\n🔗 View Report:');
  console.log(`   https://cfodiagnosisv1.vercel.app/report/${runId}`);

  console.log('\n🔗 View Calibration Page:');
  console.log(`   https://cfodiagnosisv1.vercel.app/run/${runId}/calibrate`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ VS21 FLOW TEST COMPLETE');
  console.log('='.repeat(60));
}

testVS21Flow().catch(console.error);
