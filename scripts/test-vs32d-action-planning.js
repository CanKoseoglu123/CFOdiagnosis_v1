/**
 * VS-32d: Test Action Planning on Production
 */

const API = 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;
const RUN_ID = process.env.RUN_ID || '73dbc478-ffef-4bfa-9e43-b7ca0c9498a4';

async function testActionPlanning() {
  console.log('=== VS-32d Action Planning Test ===\n');

  // Step 1: Get the specific run
  console.log('1. Getting diagnostic run...');
  const runRes = await fetch(API + '/diagnostic-runs/' + RUN_ID, {
    headers: { 'Authorization': 'Bearer ' + TOKEN }
  });

  if (!runRes.ok) {
    console.log('   Failed to fetch run:', runRes.status);
    return;
  }

  const run = await runRes.json();
  console.log('   Run ID:', run.id);
  console.log('   Status:', run.status);
  console.log('   Company:', run.context?.company?.name || 'N/A');

  // Step 2: Save planning context
  console.log('\n2. Saving planning context...');
  const planningContext = {
    target_maturity_level: 3,
    bandwidth: 'moderate',
    priority_focus: ['critical_gaps', 'forecast_accuracy'],
    team_size_override: 5
  };

  const contextRes = await fetch(API + '/diagnostic-runs/' + run.id + '/planning-context', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(planningContext)
  });

  console.log('   Status:', contextRes.status);
  if (!contextRes.ok) {
    console.log('   Error:', await contextRes.text());
    return;
  }

  const contextData = await contextRes.json();
  console.log('   Saved:', JSON.stringify(contextData).slice(0, 200));

  // Step 3: Generate action proposal
  console.log('\n3. Generating action proposal (AI)...');
  console.log('   This may take 10-30 seconds...');

  const generateRes = await fetch(API + '/diagnostic-runs/' + run.id + '/action-plan/generate', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(planningContext)
  });

  console.log('   Status:', generateRes.status);

  if (!generateRes.ok) {
    const errorText = await generateRes.text();
    console.log('   Error:', errorText.slice(0, 500));
    return;
  }

  const proposal = await generateRes.json();
  console.log('   Tokens used:', proposal.tokensUsed || 0);

  if (proposal.proposal) {
    console.log('\n=== AI-Generated Proposal ===');
    console.log('Narrative:');
    if (proposal.proposal.narrative) {
      console.log('  Situation:', (proposal.proposal.narrative.situation || '').slice(0, 100) + '...');
      console.log('  Challenge:', (proposal.proposal.narrative.challenge || '').slice(0, 100) + '...');
      console.log('  Approach:', (proposal.proposal.narrative.approach || '').slice(0, 100) + '...');
      console.log('  Outcome:', (proposal.proposal.narrative.expected_outcome || '').slice(0, 100) + '...');
    }

    console.log('\nActions:', proposal.proposal.actions?.length || 0);
    if (proposal.proposal.actions) {
      proposal.proposal.actions.slice(0, 3).forEach((a, i) => {
        console.log('  [' + (i + 1) + '] ' + a.action_title);
        console.log('      Timeline: ' + a.timeline + ', Critical: ' + a.is_critical);
      });
      if (proposal.proposal.actions.length > 3) {
        console.log('  ... and', proposal.proposal.actions.length - 3, 'more actions');
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

  console.log('\n=== Test Complete ===');
  console.log('View full report at: https://cfodiagnosisv1.vercel.app/report/' + run.id);
}

testActionPlanning().catch(e => console.error('Error:', e.message));
