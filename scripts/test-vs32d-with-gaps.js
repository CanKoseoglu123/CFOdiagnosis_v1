/**
 * VS-32d: Test Action Planning with Gaps
 */

const API = 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;
const RUN_ID = process.env.RUN_ID || '5e051981-2ae8-441c-b268-971f99aec7a0';

async function completeAndTest() {
  console.log('=== VS-32d Action Planning Test (With Gaps) ===\n');

  // Complete the run
  console.log('1. Completing run...');
  const completeRes = await fetch(API + '/diagnostic-runs/' + RUN_ID + '/complete', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + TOKEN,
      'Content-Type': 'application/json'
    }
  });
  console.log('   Complete status:', completeRes.status);
  if (!completeRes.ok) {
    const errText = await completeRes.text();
    console.log('   Complete error:', errText);
    // Continue anyway - might already be completed
  }

  // Check status
  console.log('\n2. Checking run status...');
  const runRes = await fetch(API + '/diagnostic-runs/' + RUN_ID, {
    headers: { 'Authorization': 'Bearer ' + TOKEN }
  });
  const run = await runRes.json();
  console.log('   Run status:', run.status);
  console.log('   Company:', run.context?.company?.name || 'N/A');
  console.log('   Inputs count:', run.inputs?.length || 0);

  if (run.status !== 'completed' && run.status !== 'locked') {
    console.log('\n   ERROR: Run is not completed, cannot proceed');
    return;
  }

  // Generate action plan
  console.log('\n3. Generating action proposal (AI)...');
  console.log('   This may take 10-30 seconds...');

  const generateRes = await fetch(API + '/diagnostic-runs/' + RUN_ID + '/action-plan/generate', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      target_maturity_level: 3,
      bandwidth: 'moderate',
      priority_focus: ['critical_gaps', 'forecast_accuracy'],
      team_size_override: 5
    })
  });

  console.log('   Generate status:', generateRes.status);

  if (!generateRes.ok) {
    const errText = await generateRes.text();
    console.log('   Error:', errText.slice(0, 500));
    return;
  }

  const proposal = await generateRes.json();
  console.log('   Tokens used:', proposal.tokensUsed || 0);

  console.log('\n=== AI-Generated Proposal ===');

  if (proposal.proposal) {
    console.log('\nNarrative:');
    if (proposal.proposal.narrative) {
      console.log('  Situation:', (proposal.proposal.narrative.situation || '').slice(0, 150) + '...');
      console.log('  Challenge:', (proposal.proposal.narrative.challenge || '').slice(0, 150) + '...');
      console.log('  Approach:', (proposal.proposal.narrative.approach || '').slice(0, 150) + '...');
    }

    console.log('\nActions:', proposal.proposal.actions?.length || 0);
    if (proposal.proposal.actions && proposal.proposal.actions.length > 0) {
      proposal.proposal.actions.slice(0, 5).forEach((a, i) => {
        console.log('  [' + (i + 1) + '] ' + a.action_title);
        console.log('      Question ID: ' + a.question_id);
        console.log('      Timeline: ' + a.timeline + ', Critical: ' + a.is_critical + ', Gate: ' + a.is_gate_blocker);
        if (a.rationale) {
          console.log('      Why:', (a.rationale.why || '').slice(0, 80) + '...');
        }
      });
      if (proposal.proposal.actions.length > 5) {
        console.log('  ... and', proposal.proposal.actions.length - 5, 'more actions');
      }
    }

    console.log('\nSummary:');
    if (proposal.proposal.summary) {
      console.log('  Total actions:', proposal.proposal.summary.total_actions);
      console.log('  By timeline:', JSON.stringify(proposal.proposal.summary.by_timeline));
      console.log('  Critical:', proposal.proposal.summary.addresses_critical);
      console.log('  Gate blockers:', proposal.proposal.summary.unlocks_gates);
    }
  }

  console.log('\n=== SUCCESS ===');
  console.log('View report at: https://cfodiagnosisv1.vercel.app/report/' + RUN_ID);
}

completeAndTest().catch(e => console.error('Error:', e.message));
