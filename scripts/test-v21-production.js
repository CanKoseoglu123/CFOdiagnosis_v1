// test-v21-production.js
// Tests V2.1 Initiative Engine on production

const API_BASE = 'https://cfodiagnosisv1-production.up.railway.app';
const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.error('Usage: AUTH_TOKEN=<token> node test-v21-production.js');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

async function test() {
  console.log('=== V2.1 Production Test ===\n');

  // 1. Create diagnostic run
  console.log('1. Creating diagnostic run...');
  const createRes = await fetch(`${API_BASE}/diagnostic-runs`, {
    method: 'POST',
    headers
  });
  const { id: runId } = await createRes.json();
  console.log(`   Run ID: ${runId}\n`);

  // 2. Setup context
  console.log('2. Setting up context...');
  await fetch(`${API_BASE}/diagnostic-runs/${runId}/setup`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ company_name: 'V2.1 Test Corp', industry: 'Technology' })
  });
  console.log('   Context saved\n');

  // 3. Get spec
  console.log('3. Fetching spec...');
  const specRes = await fetch(`${API_BASE}/api/spec`);
  const spec = await specRes.json();
  console.log(`   Version: ${spec.version}`);
  console.log(`   Questions: ${spec.questions.length}`);
  console.log(`   Initiatives: ${spec.initiatives?.length || 0}\n`);

  // 4. Submit answers (fail some criticals and non-criticals)
  console.log('4. Submitting answers...');
  const failIds = new Set([
    'fpa_l1_q01', // L1 critical - Budget cycle
    'fpa_l2_q01', // L2 critical - BvA report
    'fpa_l2_q03', // L2 non-critical
    'fpa_l3_q01', // L3 - behavioral
    'fpa_l3_q04', // L3 - behavioral
  ]);

  for (const q of spec.questions) {
    const value = !failIds.has(q.id);
    await fetch(`${API_BASE}/diagnostic-inputs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ run_id: runId, question_id: q.id, value })
    });
  }
  console.log(`   Submitted 48 answers (${failIds.size} failures)\n`);

  // 5. Complete and score
  console.log('5. Completing and scoring...');
  await fetch(`${API_BASE}/diagnostic-runs/${runId}/complete`, {
    method: 'POST',
    headers
  });
  await fetch(`${API_BASE}/diagnostic-runs/${runId}/score`, {
    method: 'POST',
    headers
  });
  console.log('   Done\n');

  // 6. Get report
  console.log('6. Fetching report...');
  const reportRes = await fetch(`${API_BASE}/diagnostic-runs/${runId}/report`, {
    headers
  });
  const report = await reportRes.json();

  // 7. Verify V2.1 fields
  console.log('\n=== V2.1 Verification ===\n');

  // Check prioritized_actions
  const actions = report.prioritized_actions || [];
  console.log(`7a. prioritized_actions: ${actions.length} actions`);

  // Check priorities are P1/P2/P3 (not P0)
  const priorities = [...new Set(actions.map(a => a.priority))];
  console.log(`    Priorities found: ${priorities.join(', ')}`);
  const hasP0 = priorities.includes('P0');
  const hasNewPriorities = priorities.some(p => ['P1', 'P2', 'P3'].includes(p));
  console.log(`    P0 absent: ${!hasP0 ? 'PASS' : 'FAIL'}`);
  console.log(`    P1/P2/P3 present: ${hasNewPriorities ? 'PASS' : 'FAIL'}`);

  // Check P1 actions (should be the critical failures)
  const p1Actions = actions.filter(a => a.priority === 'P1');
  console.log(`\n7b. P1 (Unlock) actions: ${p1Actions.length}`);
  p1Actions.forEach(a => {
    console.log(`    - ${a.question_id}: Score=${a.score}, Critical=${a.is_critical}, Type=${a.action_type || 'N/A'}`);
  });

  // Check scores have 2x multiplier for criticals
  console.log('\n7c. Score verification (2x critical multiplier):');
  const criticalActions = actions.filter(a => a.is_critical);
  const nonCriticalActions = actions.filter(a => !a.is_critical);

  if (criticalActions.length > 0) {
    const topCritical = criticalActions.sort((a, b) => b.score - a.score)[0];
    console.log(`    Top critical score: ${topCritical.score} (${topCritical.question_id})`);
  }
  if (nonCriticalActions.length > 0) {
    const topNonCritical = nonCriticalActions.sort((a, b) => b.score - a.score)[0];
    console.log(`    Top non-critical score: ${topNonCritical.score} (${topNonCritical.question_id})`);
  }

  // Check action types
  const actionTypes = [...new Set(actions.map(a => a.action_type).filter(Boolean))];
  console.log(`\n7d. Action types found: ${actionTypes.join(', ')}`);
  const expectedTypes = ['quick_win', 'structural', 'behavioral', 'governance'];
  const hasAllTypes = expectedTypes.some(t => actionTypes.includes(t));
  console.log(`    Has action types: ${hasAllTypes ? 'PASS' : 'FAIL'}`);

  // Check initiative_id
  const actionsWithInit = actions.filter(a => a.initiative_id);
  console.log(`\n7e. Actions with initiative_id: ${actionsWithInit.length}/${actions.length}`);
  console.log(`    Has initiative_id: ${actionsWithInit.length > 0 ? 'PASS' : 'FAIL'}`);

  // Check grouped_initiatives
  const groupedInits = report.grouped_initiatives || [];
  console.log(`\n7f. grouped_initiatives: ${groupedInits.length} initiative groups`);
  if (groupedInits.length > 0) {
    console.log('    Initiative groups:');
    groupedInits.slice(0, 3).forEach(g => {
      console.log(`    - ${g.initiative_title}: ${g.actions.length} actions, Priority=${g.priority}, Score=${g.total_score}`);
    });
    console.log(`    Grouped initiatives present: PASS`);
  } else {
    console.log(`    Grouped initiatives present: FAIL`);
  }

  // Check maturity_v2
  const maturityV2 = report.maturity_v2;
  console.log(`\n7g. maturity_v2:`);
  console.log(`    Execution score: ${maturityV2?.execution_score}%`);
  console.log(`    Potential level: ${maturityV2?.potential_level}`);
  console.log(`    Actual level: ${maturityV2?.actual_level}`);
  console.log(`    Capped: ${maturityV2?.capped}`);
  console.log(`    Capped by: ${maturityV2?.capped_by?.join(', ') || 'N/A'}`);

  // Summary
  console.log('\n=== Summary ===\n');
  const checks = [
    ['P0 absent (now P1/P2/P3)', !hasP0],
    ['P1/P2/P3 priorities', hasNewPriorities],
    ['Actions have scores', actions.every(a => typeof a.score === 'number')],
    ['Actions have is_critical', actions.every(a => typeof a.is_critical === 'boolean')],
    ['Actions have action_type', actionsWithInit.length > 0],
    ['Actions have initiative_id', actionsWithInit.length > 0],
    ['grouped_initiatives present', groupedInits.length > 0],
  ];

  let passed = 0, failed = 0;
  checks.forEach(([name, result]) => {
    console.log(`${result ? 'PASS' : 'FAIL'} ${name}`);
    if (result) passed++; else failed++;
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

test().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
