/**
 * VS-32d: Full Flow Test - Planning Context + AI Generation
 */

const API = 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;
const RUN_ID = process.env.RUN_ID || '607f51da-3f40-441d-8fa7-a763b78f31fd';

async function testFullFlow() {
  console.log('=== VS-32d Full Flow Test ===\n');
  console.log('Run ID:', RUN_ID);

  // Step 1: Check run status
  console.log('\n1. Checking run status...');
  const runRes = await fetch(API + '/diagnostic-runs/' + RUN_ID, {
    headers: { 'Authorization': 'Bearer ' + TOKEN }
  });

  if (!runRes.ok) {
    console.log('   Error:', await runRes.text());
    return;
  }

  const run = await runRes.json();
  console.log('   Status:', run.status);
  console.log('   Company:', run.context?.company?.name || 'N/A');
  console.log('   Inputs:', run.inputs?.length || 0);

  // Count gaps
  const gaps = (run.inputs || []).filter(i =>
    i.value === false || i.value === 'a' || i.value === 'no'
  );
  console.log('   Gaps (false answers):', gaps.length);

  if (gaps.length === 0) {
    console.log('\n   WARNING: No gaps detected. AI will return "maintain" proposal.');
  }

  // Step 2: Save planning context (wizard data)
  console.log('\n2. Saving planning context...');
  const contextRes = await fetch(API + '/diagnostic-runs/' + RUN_ID + '/planning-context', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      target_maturity_level: 3,
      bandwidth: 'moderate',
      priority_focus: ['critical_gaps', 'quick_wins'],
      team_size_override: 5
    })
  });

  console.log('   Status:', contextRes.status);
  if (!contextRes.ok) {
    console.log('   Error:', await contextRes.text());
    return;
  }
  console.log('   Planning context saved!');

  // Step 3: Call AI generation
  console.log('\n3. Generating action plan (AI)...');
  const genRes = await fetch(API + '/diagnostic-runs/' + RUN_ID + '/action-plan/generate', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + TOKEN,
      'Content-Type': 'application/json'
    }
  });

  console.log('   Status:', genRes.status);
  if (!genRes.ok) {
    const errText = await genRes.text();
    console.log('   Error:', errText);
    return;
  }

  const proposal = await genRes.json();
  console.log('\n=== AI Proposal Result ===');
  console.log('Type:', proposal.proposal_type);
  console.log('Generated at:', proposal.generated_at);

  if (proposal.proposal_type === 'maintain') {
    console.log('\nMaintain proposal (no gaps):');
    console.log('  Message:', proposal.message);
  } else {
    console.log('\nAction proposal:');
    console.log('  Total actions:', proposal.actions?.length || 0);
    console.log('  Quick wins:', proposal.quick_wins?.length || 0);
    console.log('  Critical gaps:', proposal.critical_gaps?.length || 0);

    if (proposal.actions?.length > 0) {
      console.log('\nSample actions (first 3):');
      proposal.actions.slice(0, 3).forEach((a, i) => {
        console.log('  [' + (i + 1) + '] ' + a.question_id);
        console.log('      Title: ' + (a.title || 'N/A'));
        console.log('      Priority: ' + (a.priority || 'N/A'));
        console.log('      Timeline: ' + (a.timeline || 'N/A'));
      });
    }

    if (proposal.summary) {
      console.log('\nSummary:', proposal.summary.slice(0, 200) + '...');
    }
  }

  console.log('\n=== Test Complete ===');
  console.log('View in UI: https://cfodiagnosisv1.vercel.app/report/' + RUN_ID);
}

testFullFlow().catch(e => console.error('Error:', e.message));
