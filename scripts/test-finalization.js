// Test finalization flow
const API = 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;

async function findAndFinalize() {
  console.log('=== Testing Finalization Flow ===\n');

  // Get all runs
  const runsRes = await fetch(API + '/diagnostic-runs', {
    headers: { Authorization: 'Bearer ' + TOKEN }
  });
  const runs = await runsRes.json();

  // Find a completed run that's not finalized
  const completedRuns = runs.filter(r => r.status === 'completed' && !r.finalized_at);
  console.log('Completed (not finalized) runs:', completedRuns.length);

  if (completedRuns.length === 0) {
    console.log('No completed runs available for finalization test');
    return;
  }

  // Use the first completed run
  const runId = completedRuns[0].id;
  const companyName = completedRuns[0].context?.company?.name || 'Unknown';
  console.log('Using run:', runId);
  console.log('Company:', companyName);

  // First, add some action items with timelines and owners (required for finalization)
  console.log('\n1. Adding action items with timelines and owners...');

  // Get the spec to find question IDs
  const specRes = await fetch(API + '/api/spec');
  const spec = await specRes.json();

  // Add 3 action items
  const questionsToAdd = spec.questions.slice(0, 3);
  for (const q of questionsToAdd) {
    await fetch(API + '/diagnostic-runs/' + runId + '/action-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + TOKEN
      },
      body: JSON.stringify({
        question_id: q.id,
        timeline: '6m',
        assigned_owner: 'Finance Director'
      })
    });
    console.log('   Added action:', q.id);
  }

  // Verify action plan
  const planRes = await fetch(API + '/diagnostic-runs/' + runId + '/action-plan', {
    headers: { Authorization: 'Bearer ' + TOKEN }
  });
  const plan = await planRes.json();
  console.log('   Total actions:', plan.length);

  // Now finalize
  console.log('\n2. Finalizing run...');
  const finalizeRes = await fetch(API + '/diagnostic-runs/' + runId + '/finalize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + TOKEN
    }
  });

  if (!finalizeRes.ok) {
    const error = await finalizeRes.text();
    console.log('   Finalization failed:', finalizeRes.status, error);
    return;
  }

  const result = await finalizeRes.json();
  console.log('   Finalized at:', result.finalized_at);
  console.log('   Action snapshot items:', result.action_plan_snapshot?.length);

  console.log('\n=== SUCCESS ===');
  console.log('Report URL:', 'https://cfodiagnosisv1.vercel.app/report/' + runId);
  console.log('Executive URL:', 'https://cfodiagnosisv1.vercel.app/report/' + runId + '/executive');
  console.log('\nThe report should auto-redirect to executive view!');
}

findAndFinalize().catch(console.error);
