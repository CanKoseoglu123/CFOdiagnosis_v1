// VS-25 Complete Interpretation Flow Test
const API_URL = 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6Im9XTFJlL3lEWkJZdmxqVXMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL29jeXhsb25ncWN5anBmcW9kZ2lkLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIyN2E5N2RmNC0xMzIzLTQ4YzAtYjAyNi05ZTcxNDkwYjkwNmUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY2NjY3MzMwLCJpYXQiOjE3NjY2NjM3MzAsImVtYWlsIjoia29zZW9nbHVjYW5AZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6Imtvc2VvZ2x1Y2FuQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJDYW4iLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6IjI3YTk3ZGY0LTEzMjMtNDhjMC1iMDI2LTllNzE0OTBiOTA2ZSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzY2NjYzNzMwfV0sInNlc3Npb25faWQiOiJmZTA5NTEwMy00N2Q2LTQ1Y2YtOThhNy0xMzRmMWRhYWQyNTYiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.yLERdsICfAw1FF4bn3mvAwcOlCJQbRigYHKWS_HAnOM';

const headers = {
  'Authorization': 'Bearer ' + TOKEN,
  'Content-Type': 'application/json'
};

async function main() {
  console.log('🧪 VS-25 Interpretation Flow - Complete Test\n');

  // Step 1: Get spec for question IDs
  console.log('📋 Getting spec...');
  const specRes = await fetch(`${API_URL}/api/spec`);
  const spec = await specRes.json();
  const questionIds = spec.questions.map(q => q.id);
  console.log(`   Found ${questionIds.length} questions\n`);

  // Step 2: Create run
  console.log('📋 Creating diagnostic run...');
  const createRes = await fetch(`${API_URL}/diagnostic-runs`, {
    method: 'POST',
    headers
  });
  const createData = await createRes.json();
  const runId = createData.id;
  console.log(`   ✅ Run ID: ${runId}\n`);

  // Step 3: Add context
  console.log('📋 Adding context...');
  await fetch(`${API_URL}/diagnostic-runs/${runId}/setup`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ company_name: 'VS-25 Test Corp', industry: 'Technology' })
  });
  console.log('   ✅ Context added\n');

  // Step 4: Answer all questions
  console.log('📋 Answering 48 questions...');
  for (const qid of questionIds) {
    const rand = Math.random();
    const answer = rand > 0.3 ? 'yes' : (rand > 0.1 ? 'partial' : 'no');
    await fetch(`${API_URL}/diagnostic-inputs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ run_id: runId, question_id: qid, answer })
    });
  }
  console.log('   ✅ All questions answered\n');

  // Step 5: Complete
  console.log('📋 Completing run...');
  const completeRes = await fetch(`${API_URL}/diagnostic-runs/${runId}/complete`, {
    method: 'POST',
    headers
  });
  if (!completeRes.ok) {
    console.log('   ❌ Failed:', await completeRes.text());
    return;
  }
  console.log('   ✅ Run completed\n');

  // Step 6: Score
  console.log('📋 Scoring run...');
  const scoreRes = await fetch(`${API_URL}/diagnostic-runs/${runId}/score`, {
    method: 'POST',
    headers
  });
  if (!scoreRes.ok) {
    console.log('   ❌ Failed:', await scoreRes.text());
    return;
  }
  console.log('   ✅ Run scored\n');

  console.log('═'.repeat(50));
  console.log('🔬 INTERPRETATION FLOW TESTS');
  console.log('═'.repeat(50));

  // Test 1: Status check before start
  console.log('\n🧪 Test 1: Check /status before /start (should be 404)');
  const statusCheck = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret/status`, { headers });
  console.log(`   Response: ${statusCheck.status}`);
  if (statusCheck.status === 404) {
    console.log('   ✅ PASS - No session exists');
  } else {
    console.log('   ⚠️  Session exists:', await statusCheck.text());
  }

  // Test 2: Start interpretation
  console.log('\n🧪 Test 2: Start interpretation');
  const startRes = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret/start`, {
    method: 'POST',
    headers
  });
  console.log(`   Response: ${startRes.status}`);

  if (startRes.status === 404) {
    console.log('   ⚠️  Backend interpretation endpoints not deployed yet');
    console.log('\n📊 View report (without AI interpretation):');
    console.log(`   https://cfodiagnosisv1.vercel.app/report/${runId}`);
    console.log('\n   The frontend components are deployed and ready.');
    console.log('   When backend VS-25 endpoints are deployed, the');
    console.log('   "Generate Insights" button will become functional.');
    return;
  }

  if (!startRes.ok) {
    console.log('   ❌ Failed:', await startRes.text());
    return;
  }

  const startData = await startRes.json();
  console.log('   ✅ Started');
  console.log(`   Session: ${startData.session_id}`);
  console.log(`   Status: ${startData.status}`);

  // Continue with polling and other tests if start succeeded...
  if (startData.status === 'awaiting_user' && startData.questions) {
    console.log(`   Questions: ${startData.questions.length}`);

    // Test skip semantics
    console.log('\n🧪 Test 3: Submit with skip semantics');
    const answers = startData.questions.map((q, i) => ({
      question_id: q.question_id,
      answer: i === 0 ? 'Test answer for first question' : null,
      skipped: i !== 0,
      time_to_answer_ms: i === 0 ? 5000 : null
    }));

    console.log('   Submitting with skipped: true for questions 2+');
    const answerRes = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret/answer`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ answers })
    });
    console.log(`   Response: ${answerRes.status}`);
    if (answerRes.ok) {
      const answerData = await answerRes.json();
      console.log('   ✅ Answers accepted');
      console.log(`   New status: ${answerData.status}`);
    }
  }

  console.log('\n═'.repeat(50));
  console.log('📊 Report URL:');
  console.log(`   https://cfodiagnosisv1.vercel.app/report/${runId}`);
}

main().catch(console.error);
