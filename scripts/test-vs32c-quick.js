// scripts/test-vs32c-quick.js
// Quick VS-32c interpretation test using existing completed run
// Usage: AUTH_TOKEN="..." node scripts/test-vs32c-quick.js

const API = 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;

if (!TOKEN) {
  console.error('ERROR: Set AUTH_TOKEN environment variable');
  process.exit(1);
}

async function test() {
  console.log('=== VS-32c Quick Test ===\n');

  // Step 1: Find a completed run
  console.log('1. Finding completed run...');
  const runsRes = await fetch(API + '/diagnostic-runs', {
    headers: { 'Authorization': 'Bearer ' + TOKEN }
  });

  if (!runsRes.ok) {
    console.log('   Failed to list runs:', runsRes.status);
    return;
  }

  const runs = await runsRes.json();
  const completed = runs.filter(r => r.status === 'completed' || r.status === 'locked');

  if (completed.length === 0) {
    console.log('   No completed runs found');
    return;
  }

  const runId = completed[0].id;
  console.log('   Using run:', runId);
  console.log('   Company:', completed[0].context?.company?.name || 'N/A');

  // Step 2: Start interpretation with restart=true
  console.log('\n2. Starting interpretation (restart=true)...');
  const startRes = await fetch(API + '/diagnostic-runs/' + runId + '/interpret/start', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ restart: true })
  });

  console.log('   Status:', startRes.status);
  const startText = await startRes.text();
  console.log('   Response:', startText.slice(0, 500));

  if (!startRes.ok) {
    console.log('   FAILED to start');
    return;
  }

  const startData = JSON.parse(startText);
  console.log('   Session ID:', startData.session_id);
  console.log('   Initial status:', startData.status);

  // Step 3: Poll for completion (max 2 minutes)
  console.log('\n3. Polling for completion...');
  let attempts = 0;
  const maxAttempts = 60; // 2 min
  let lastStatus = startData.status;

  while (attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 2000));
    attempts++;

    const statusRes = await fetch(API + '/diagnostic-runs/' + runId + '/interpret/status', {
      headers: { 'Authorization': 'Bearer ' + TOKEN }
    });

    const statusData = await statusRes.json();

    if (statusData.status !== lastStatus) {
      console.log('   [' + attempts + '] Status: ' + statusData.status +
        (statusData.loop_round ? ' (round ' + statusData.loop_round + ')' : ''));
      lastStatus = statusData.status;
    } else {
      process.stdout.write('.');
    }

    // Handle awaiting_answers - auto-skip for testing
    if (statusData.status === 'awaiting_answers' && statusData.pending_questions?.length > 0) {
      console.log('\n   >>> ' + statusData.pending_questions.length + ' clarifying questions');
      console.log('   >>> Auto-skipping for test...');

      const skipAnswers = statusData.pending_questions.map(q => ({
        question_id: q.question_id,
        question_text: q.question_text,
        answer: null,
        skipped: true
      }));

      await fetch(API + '/diagnostic-runs/' + runId + '/interpret/answer', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers: skipAnswers })
      });
      continue;
    }

    if (['completed', 'complete', 'failed', 'force_finalized'].includes(statusData.status)) {
      break;
    }
  }

  // Step 4: Get report
  console.log('\n\n4. Fetching report...');
  const reportRes = await fetch(API + '/diagnostic-runs/' + runId + '/interpret/report', {
    headers: { 'Authorization': 'Bearer ' + TOKEN }
  });

  if (reportRes.ok) {
    const report = await reportRes.json();
    console.log('   Quality:', report.quality_status);
    console.log('   Rounds:', report.rounds_used);
    console.log('   Sections:', (report.sections || []).length);

    if (report.sections?.length > 0) {
      console.log('\n   --- Sections ---');
      report.sections.forEach((s, i) => {
        console.log('   [' + (i+1) + '] ' + (s.id || 'unknown') + ': ' + (s.content || '').slice(0, 60) + '...');
      });
    } else if (report.report?.synthesis) {
      console.log('\n   Synthesis:', report.report.synthesis.slice(0, 200) + '...');
    }

    console.log('\n=== SUCCESS ===');
    console.log('Report URL: https://cfodiagnosisv1.vercel.app/report/' + runId);
  } else {
    console.log('   Failed:', reportRes.status);
  }
}

test().catch(e => console.error('Error:', e.message));
