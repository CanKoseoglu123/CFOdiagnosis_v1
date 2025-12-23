// test-initiative-titles.js
// Verifies High Value card shows initiative titles, not action names

const API_BASE = 'https://cfodiagnosisv1-production.up.railway.app';
const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.error('Usage: AUTH_TOKEN=<token> node scripts/test-initiative-titles.js');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

async function test() {
  console.log('=== Initiative Titles Test ===\n');

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
    body: JSON.stringify({ company_name: 'Initiative Test Corp', industry: 'Technology' })
  });

  // 3. Get spec
  const specRes = await fetch(`${API_BASE}/api/spec`);
  const spec = await specRes.json();

  // 4. Submit answers - fail some to generate actions
  console.log('3. Submitting answers (failing L1 criticals)...');
  const failIds = new Set([
    'fpa_l1_q01', // "Implement Annual Budget Cycle"
    'fpa_l1_q02', // "Extend Budget to Full P&L"
  ]);

  for (const q of spec.questions) {
    const value = !failIds.has(q.id);
    await fetch(`${API_BASE}/diagnostic-inputs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ run_id: runId, question_id: q.id, value })
    });
  }

  // 5. Complete and score
  console.log('4. Completing and scoring...');
  await fetch(`${API_BASE}/diagnostic-runs/${runId}/complete`, {
    method: 'POST',
    headers
  });
  await fetch(`${API_BASE}/diagnostic-runs/${runId}/score`, {
    method: 'POST',
    headers
  });

  // 6. Get report
  console.log('5. Fetching report...\n');
  const reportRes = await fetch(`${API_BASE}/diagnostic-runs/${runId}/report`, {
    headers
  });
  const report = await reportRes.json();

  // 7. Verify initiative vs action hierarchy
  console.log('=== Initiative vs Action Hierarchy ===\n');

  const initiatives = report.grouped_initiatives || [];
  console.log(`Found ${initiatives.length} initiatives:\n`);

  initiatives.slice(0, 3).forEach((init, i) => {
    console.log(`${i + 1}. INITIATIVE (Strategic Project):`);
    console.log(`   ID: ${init.initiative_id}`);
    console.log(`   Title: "${init.initiative_title}"`);
    console.log(`   Actions:`);
    (init.actions || []).slice(0, 2).forEach((action, j) => {
      console.log(`     ${j + 1}. "${action.action_title || action.action_text}"`);
    });
    console.log('');
  });

  // 8. Check critical risks
  console.log('=== Critical Risks (Gap Names) ===\n');
  const risks = report.critical_risks || [];
  risks.forEach((risk, i) => {
    console.log(`${i + 1}. Gap: "${risk.expert_action?.title || 'N/A'}"`);
    console.log(`   Question: ${risk.evidence_id}`);
  });

  // 9. Verify hierarchy correctness
  console.log('\n=== Verification ===\n');

  const budgetInit = initiatives.find(i => i.initiative_id === 'init_budget_discipline');
  const checks = [
    ['Initiative has title "Establish Budget Discipline"',
     budgetInit?.initiative_title === 'Establish Budget Discipline'],
    ['Initiative title !== action title',
     budgetInit?.initiative_title !== budgetInit?.actions?.[0]?.action_title],
    ['Actions have titles like "Implement Annual Budget Cycle"',
     budgetInit?.actions?.some(a => a.action_title?.includes('Budget'))],
  ];

  let passed = 0, failed = 0;
  checks.forEach(([name, result]) => {
    console.log(`${result ? 'PASS' : 'FAIL'} ${name}`);
    if (result) passed++; else failed++;
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  console.log(`\n📋 Report URL: https://cfodiagnosisv1.vercel.app/report/${runId}`);

  if (failed > 0) process.exit(1);
}

test().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
