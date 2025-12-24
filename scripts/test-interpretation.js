/**
 * Test VS-25 Interpretation Endpoint
 *
 * Usage: AUTH_TOKEN=<token> node scripts/test-interpretation.js [runId]
 */

const API_BASE = 'https://cfodiagnosisv1-production.up.railway.app';

const AUTH_TOKEN = process.env.AUTH_TOKEN;
if (!AUTH_TOKEN) {
  console.error('Usage: AUTH_TOKEN=<token> node scripts/test-interpretation.js [runId]');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

async function createCompletedRun() {
  console.log('Creating new diagnostic run...');

  // Create run
  const createRes = await fetch(`${API_BASE}/diagnostic-runs`, {
    method: 'POST',
    headers
  });
  const runData = await createRes.json();
  console.log('Create response:', JSON.stringify(runData, null, 2));

  // Handle both {id} and {run: {id}} response formats
  const run = runData.run || runData;
  if (!run.id) {
    throw new Error(`Failed to create run: ${JSON.stringify(runData)}`);
  }
  console.log(`Created run: ${run.id}`);

  // Setup context
  await fetch(`${API_BASE}/diagnostic-runs/${run.id}/setup`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      company_name: 'Test Company for Interpretation',
      industry: 'Technology'
    })
  });
  console.log('Setup complete');

  // Get spec for questions
  const specRes = await fetch(`${API_BASE}/api/spec`);
  const spec = await specRes.json();

  // Answer all questions with Yes (true)
  console.log(`Answering ${spec.questions.length} questions...`);
  for (const q of spec.questions) {
    await fetch(`${API_BASE}/diagnostic-inputs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        run_id: run.id,
        question_id: q.id,
        value: true
      })
    });
  }
  console.log('All questions answered');

  // Complete the run
  await fetch(`${API_BASE}/diagnostic-runs/${run.id}/complete`, {
    method: 'POST',
    headers
  });
  console.log('Run completed');

  // Score the run
  await fetch(`${API_BASE}/diagnostic-runs/${run.id}/score`, {
    method: 'POST',
    headers
  });
  console.log('Run scored');

  return run.id;
}

async function testInterpretation(runId) {
  console.log(`\n=== Testing Interpretation for run: ${runId} ===\n`);

  // Start interpretation
  console.log('Calling POST /diagnostic-runs/:id/interpret/start ...');
  const startTime = Date.now();

  const res = await fetch(`${API_BASE}/diagnostic-runs/${runId}/interpret/start`, {
    method: 'POST',
    headers
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Response received in ${elapsed}s`);
  console.log(`Status: ${res.status}`);

  const data = await res.json();
  console.log('\nResponse:', JSON.stringify(data, null, 2));

  // If async, poll for status
  if (data.poll_url) {
    console.log('\n--- Polling for status ---');
    let status = data.status;
    let pollCount = 0;
    const maxPolls = 30; // Max 60 seconds

    while (status !== 'complete' && status !== 'failed' && status !== 'awaiting_user' && pollCount < maxPolls) {
      await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds
      pollCount++;

      const statusRes = await fetch(`${API_BASE}/diagnostic-runs/${runId}/interpret/status`, { headers });
      const statusData = await statusRes.json();
      status = statusData.status;
      console.log(`Poll ${pollCount}: status = ${status}`);

      if (status === 'complete' || status === 'awaiting_user') {
        console.log('\nFinal response:', JSON.stringify(statusData, null, 2));
        return statusData;
      }
    }

    if (pollCount >= maxPolls) {
      console.log('Timeout waiting for interpretation');
    }
  }

  // If we got questions, show them
  if (data.questions && data.questions.length > 0) {
    console.log('\n=== Questions for User ===');
    data.questions.forEach((q, i) => {
      console.log(`\n${i + 1}. ${q.question_text}`);
      if (q.options) {
        q.options.forEach((opt, j) => console.log(`   ${String.fromCharCode(65 + j)}. ${opt}`));
      }
    });
  }

  // If complete, show the report
  if (data.status === 'complete' && data.report) {
    console.log('\n=== Interpretation Report ===');
    console.log('Synthesis:', data.report.synthesis);
    console.log('Priority Rationale:', data.report.priority_rationale);
    console.log('Key Insight:', data.report.key_insight);
  }

  return data;
}

async function main() {
  try {
    let runId = process.argv[2];

    if (!runId) {
      // Create a new completed run for testing
      runId = await createCompletedRun();
    }

    // Test interpretation
    await testInterpretation(runId);

    console.log('\n=== Test Complete ===');
  } catch (error) {
    console.error('Error:', error.message);
    if (error.cause) console.error('Cause:', error.cause);
  }
}

main();
