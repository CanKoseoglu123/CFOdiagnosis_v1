// VS-25 Complete Interpretation Flow Test - Fixed
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

  // Step 4: Answer all questions (using 'value' as boolean)
  console.log('📋 Answering 48 questions...');
  let answered = 0;
  for (const qid of questionIds) {
    const value = Math.random() > 0.3;  // Boolean: true ~70%, false ~30%
    const inputRes = await fetch(`${API_URL}/diagnostic-inputs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ run_id: runId, question_id: qid, value })
    });
    if (inputRes.ok) answered++;
  }
  console.log(`   ✅ ${answered}/${questionIds.length} questions answered\n`);

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
    const data = await statusCheck.json();
    console.log('   Session exists:', data.status);
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
    const errText = await startRes.text();
    console.log('   ❌ Failed:', errText);
    console.log('\n📊 Report URL:');
    console.log(`   https://cfodiagnosisv1.vercel.app/report/${runId}`);
    return;
  }

  const startData = await startRes.json();
  console.log('   ✅ Started');
  console.log(`   Session: ${startData.session_id}`);
  console.log(`   Status: ${startData.status}`);

  if (startData.questions) {
    console.log(`   Questions: ${startData.questions.length}`);
  }

  console.log('\n═'.repeat(50));
  console.log('📊 Report URL:');
  console.log(`   https://cfodiagnosisv1.vercel.app/report/${runId}`);
}

main().catch(console.error);
