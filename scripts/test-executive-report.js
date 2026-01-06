// Test Executive Report flow
const API = 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;

if (!TOKEN) {
  console.log('ERROR: AUTH_TOKEN environment variable not set');
  console.log('Run: node get-auth-token.js to get a fresh token');
  process.exit(1);
}

async function testExecutiveReport() {
  console.log('=== Testing Executive Report Flow ===\n');

  // 1. List runs to find a finalized one
  console.log('1. Finding finalized runs...');
  const runsRes = await fetch(API + '/diagnostic-runs', {
    headers: { Authorization: 'Bearer ' + TOKEN }
  });

  if (!runsRes.ok) {
    console.log('   Failed to list runs:', runsRes.status);
    return;
  }

  const runs = await runsRes.json();
  const finalizedRuns = runs.filter(r => r.finalized_at);
  console.log('   Total runs:', runs.length);
  console.log('   Finalized runs:', finalizedRuns.length);

  if (finalizedRuns.length === 0) {
    console.log('\n   No finalized runs found. Creating one...');

    // Create and complete a run quickly
    const createRes = await fetch(API + '/diagnostic-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN }
    });
    const newRun = await createRes.json();
    console.log('   Created run:', newRun.id);

    // Setup context
    await fetch(API + '/diagnostic-runs/' + newRun.id + '/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN },
      body: JSON.stringify({
        company: { name: 'Executive Test Corp', industry: 'saas', revenue_range: '50m_250m', change_appetite: 'transform' },
        pillar: { tools: [{ tool: 'excel', effectiveness: 'medium' }] }
      })
    });

    // Get spec and answer all questions
    const specRes = await fetch(API + '/api/spec');
    const spec = await specRes.json();

    for (const q of spec.questions) {
      await fetch(API + '/diagnostic-inputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN },
        body: JSON.stringify({
          run_id: newRun.id,
          question_id: q.id,
          answer_option_id: 'c',  // Mid-level answer
          skipped: false
        })
      });
    }
    console.log('   Answered', spec.questions.length, 'questions');

    // Complete and score
    await fetch(API + '/diagnostic-runs/' + newRun.id + '/complete', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + TOKEN }
    });
    await fetch(API + '/diagnostic-runs/' + newRun.id + '/score', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + TOKEN }
    });
    console.log('   Completed and scored');

    // Add action items
    const questionsForActions = spec.questions.slice(0, 3);
    for (const q of questionsForActions) {
      await fetch(API + '/diagnostic-runs/' + newRun.id + '/action-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN },
        body: JSON.stringify({
          question_id: q.id,
          timeline: '6m',
          assigned_owner: 'CFO'
        })
      });
    }
    console.log('   Added 3 action items');

    // Finalize
    const finalizeRes = await fetch(API + '/diagnostic-runs/' + newRun.id + '/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN }
    });
    const finalizeData = await finalizeRes.json();
    console.log('   Finalized:', finalizeData.finalized_at);

    finalizedRuns.push({ id: newRun.id, finalized_at: finalizeData.finalized_at });
  }

  // 2. Test fetching report for finalized run
  const testRun = finalizedRuns[0];
  console.log('\n2. Testing report fetch for run:', testRun.id);

  const reportRes = await fetch(API + '/diagnostic-runs/' + testRun.id + '/report', {
    headers: { Authorization: 'Bearer ' + TOKEN }
  });

  console.log('   Status:', reportRes.status);

  if (!reportRes.ok) {
    const errorText = await reportRes.text();
    console.log('   ERROR:', errorText);
    return;
  }

  const report = await reportRes.json();
  console.log('   Report loaded successfully!');
  console.log('   - Overall score:', report.overall_score);
  console.log('   - Maturity level:', report.maturity?.achieved_level);
  console.log('   - Finalized at:', report.finalized_at);
  console.log('   - Has context:', !!report.context);

  console.log('\n=== SUCCESS ===');
  console.log('Executive Report URL:');
  console.log('https://cfodiagnosisv1.vercel.app/report/' + testRun.id + '/executive');
}

testExecutiveReport().catch(console.error);
