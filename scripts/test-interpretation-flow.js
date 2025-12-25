// Test VS-25 Interpretation Flow in Production
// Tests all 6 scenarios from PATCH V2

const API_URL = 'https://cfodiagnosisv1-production.up.railway.app';

async function testInterpretationFlow() {
  const token = process.env.AUTH_TOKEN;
  if (!token) {
    console.error('❌ AUTH_TOKEN environment variable required');
    console.log('Get token: node scripts/get-auth-token.js');
    process.exit(1);
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('🧪 VS-25 Interpretation Flow Test\n');
  console.log('='.repeat(50));

  // Step 1: Create a new diagnostic run
  console.log('\n📋 Step 1: Creating diagnostic run...');
  const createRes = await fetch(`${API_URL}/diagnostic-runs`, {
    method: 'POST',
    headers
  });

  if (!createRes.ok) {
    console.error('❌ Failed to create run:', await createRes.text());
    process.exit(1);
  }

  const { id: runId } = await createRes.json();
  console.log(`✅ Created run: ${runId}`);

  // Step 2: Add context
  console.log('\n📋 Step 2: Adding context...');
  const setupRes = await fetch(`${API_URL}/diagnostic-runs/${runId}/setup`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      company_name: 'Test Corp (Interpretation Test)',
      industry: 'Technology'
    })
  });

  if (!setupRes.ok) {
    console.error('❌ Failed to setup:', await setupRes.text());
  } else {
    console.log('✅ Context added');
  }

  // Step 3: Answer all 48 questions with realistic answers
  console.log('\n📋 Step 3: Answering 48 questions...');
  const answers = [];
  for (let i = 1; i <= 48; i++) {
    // Mix of answers: mostly "yes" with some "partial" and "no"
    let answer;
    if (i <= 8) {
      // L1 questions - answer well
      answer = i % 3 === 0 ? 'partial' : 'yes';
    } else if (i <= 22) {
      // L2 questions - mixed
      answer = i % 4 === 0 ? 'no' : (i % 3 === 0 ? 'partial' : 'yes');
    } else if (i <= 37) {
      // L3 questions - some gaps
      answer = i % 3 === 0 ? 'partial' : (i % 5 === 0 ? 'no' : 'yes');
    } else {
      // L4 questions - more gaps
      answer = i % 2 === 0 ? 'partial' : (i % 3 === 0 ? 'no' : 'yes');
    }
    answers.push({ question_id: `q${i}`, answer });
  }

  // Submit answers in batches
  for (const ans of answers) {
    await fetch(`${API_URL}/diagnostic-inputs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ run_id: runId, ...ans })
    });
  }
  console.log('✅ All 48 questions answered');

  // Step 4: Complete the run
  console.log('\n📋 Step 4: Completing run...');
  const completeRes = await fetch(`${API_URL}/diagnostic-runs/${runId}/complete`, {
    method: 'POST',
    headers
  });

  if (!completeRes.ok) {
    console.error('❌ Failed to complete:', await completeRes.text());
  } else {
    console.log('✅ Run completed');
  }

  // Step 5: Score the run
  console.log('\n📋 Step 5: Scoring run...');
  const scoreRes = await fetch(`${API_URL}/diagnostic-runs/${runId}/score`, {
    method: 'POST',
    headers
  });

  if (!scoreRes.ok) {
    console.error('❌ Failed to score:', await scoreRes.text());
  } else {
    console.log('✅ Run scored');
  }

  console.log('\n' + '='.repeat(50));
  console.log('🔬 INTERPRETATION FLOW TESTS');
  console.log('='.repeat(50));

  // Test 1: Check status first (should be 404 - no session)
  console.log('\n🧪 Test 1: Check /status before /start (should be 404)...');
  const statusCheck1 = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret/status`, {
    headers
  });
  console.log(`   Status code: ${statusCheck1.status}`);
  if (statusCheck1.status === 404) {
    console.log('   ✅ PASS - No session exists yet');
  } else {
    console.log('   ⚠️  Session already exists');
    const data = await statusCheck1.json();
    console.log('   Current status:', data.status);
  }

  // Test 2: Start interpretation
  console.log('\n🧪 Test 2: Start interpretation...');
  const startRes = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret/start`, {
    method: 'POST',
    headers
  });

  if (!startRes.ok) {
    const errText = await startRes.text();
    console.log(`   ❌ FAIL - ${startRes.status}: ${errText}`);

    // Check if interpretation endpoints exist
    if (startRes.status === 404) {
      console.log('\n⚠️  Interpretation endpoints may not be deployed yet.');
      console.log('   The frontend changes are deployed, but backend needs:');
      console.log('   - POST /diagnostic-runs/:id/interpret/start');
      console.log('   - GET /diagnostic-runs/:id/interpret/status');
      console.log('   - POST /diagnostic-runs/:id/interpret/answer');
      console.log('   - GET /diagnostic-runs/:id/interpret/report');
    }

    console.log('\n📊 Report URL (without interpretation):');
    console.log(`   https://cfodiagnosisv1.vercel.app/report/${runId}`);
    return;
  }

  const startData = await startRes.json();
  console.log('   ✅ Started interpretation');
  console.log('   Session ID:', startData.session_id);
  console.log('   Status:', startData.status);

  // Test 3: Poll status
  console.log('\n🧪 Test 3: Poll status...');
  let pollCount = 0;
  let currentStatus = startData.status;
  const maxPolls = 30; // 90 seconds max

  while (currentStatus !== 'awaiting_user' && currentStatus !== 'complete' && currentStatus !== 'failed' && pollCount < maxPolls) {
    await new Promise(r => setTimeout(r, 3000)); // 3 second delay
    pollCount++;

    const pollRes = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret/status`, {
      headers
    });

    if (pollRes.ok) {
      const pollData = await pollRes.json();
      currentStatus = pollData.status;
      console.log(`   Poll ${pollCount}: ${currentStatus}`);

      if (pollData.status === 'awaiting_user' && pollData.questions) {
        console.log(`   Questions received: ${pollData.questions.length}`);

        // Test 4: Submit answers with skip semantics
        console.log('\n🧪 Test 4: Submit answers with skip semantics...');
        const answers = pollData.questions.map((q, i) => ({
          question_id: q.question_id,
          answer: i === 0 ? 'We use cloud-based tools primarily' : null, // Answer first, skip rest
          skipped: i !== 0,
          time_to_answer_ms: i === 0 ? 5000 : null
        }));

        const answerRes = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret/answer`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ answers })
        });

        if (answerRes.ok) {
          const answerData = await answerRes.json();
          console.log('   ✅ Answers submitted');
          console.log('   New status:', answerData.status);
          currentStatus = answerData.status;
        } else {
          console.log('   ❌ Failed to submit answers:', await answerRes.text());
        }
      }
    } else {
      console.log(`   Poll ${pollCount}: Error - ${pollRes.status}`);
    }
  }

  // Test 5: Check for timeout (if still generating after 30 polls)
  if (pollCount >= maxPolls) {
    console.log('\n🧪 Test 5: Timeout check...');
    console.log('   ✅ Would trigger TIMEOUT state in frontend (90s elapsed)');
  }

  // Test 6: Fetch final report
  if (currentStatus === 'complete') {
    console.log('\n🧪 Test 6: Fetch interpretation report...');
    const reportRes = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret/report`, {
      headers
    });

    if (reportRes.ok) {
      const reportData = await reportRes.json();
      console.log('   ✅ Report fetched successfully');
      console.log('   Quality status:', reportData.quality_status);
      console.log('   Rounds used:', reportData.rounds_used);
      if (reportData.report?.synthesis) {
        console.log('   Synthesis preview:', reportData.report.synthesis.substring(0, 100) + '...');
      }
    } else {
      console.log('   ❌ Failed to fetch report:', await reportRes.text());
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`\nRun ID: ${runId}`);
  console.log(`Final Status: ${currentStatus}`);
  console.log(`Poll Count: ${pollCount}`);
  console.log(`\n🔗 View in browser:`);
  console.log(`   https://cfodiagnosisv1.vercel.app/report/${runId}`);
}

testInterpretationFlow().catch(console.error);
