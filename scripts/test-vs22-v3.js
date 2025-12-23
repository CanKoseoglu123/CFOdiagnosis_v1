// test-vs22-v3.js
// Tests VS-22 v3: Executive Summary, gap titles in Critical Risks

const API_BASE = 'https://cfodiagnosisv1-production.up.railway.app';
const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.error('Usage: AUTH_TOKEN=<token> node scripts/test-vs22-v3.js');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

async function test() {
  console.log('=== VS-22 v3 Production Test ===\n');

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
    body: JSON.stringify({ company_name: 'VS22-v3 Test Corp', industry: 'Technology' })
  });
  console.log('   Context saved\n');

  // 3. Get spec
  console.log('3. Fetching spec...');
  const specRes = await fetch(`${API_BASE}/api/spec`);
  const spec = await specRes.json();
  console.log(`   Version: ${spec.version}`);
  console.log(`   Questions: ${spec.questions.length}\n`);

  // 4. Submit answers - fail some criticals to test gap titles
  console.log('4. Submitting answers...');
  const failIds = new Set([
    'fpa_l1_q01', // L1 critical - Should show "Implement Annual Budget Cycle"
    'fpa_l1_q02', // L1 critical - Should show "Establish Full P&L Budget"
    'fpa_l2_q01', // L2 critical - Should show BvA related gap
  ]);

  for (const q of spec.questions) {
    const value = !failIds.has(q.id);
    await fetch(`${API_BASE}/diagnostic-inputs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ run_id: runId, question_id: q.id, value })
    });
  }
  console.log(`   Submitted ${spec.questions.length} answers (${failIds.size} failures)\n`);

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

  // 7. Verify VS-22 v3 fields
  console.log('\n=== VS-22 v3 Verification ===\n');

  // Check critical_risks have expert_action
  const risks = report.critical_risks || [];
  console.log(`7a. Critical Risks: ${risks.length} found`);

  if (risks.length > 0) {
    console.log('\n    Critical Risk Details:');
    risks.forEach((risk, i) => {
      const hasExpertAction = !!risk.expert_action;
      const gapTitle = risk.expert_action?.title || 'N/A';
      const level = risk.level || 'N/A';
      console.log(`    ${i + 1}. Question: ${risk.evidence_id}`);
      console.log(`       Has expert_action: ${hasExpertAction ? 'YES' : 'NO'}`);
      console.log(`       Gap Title: ${gapTitle}`);
      console.log(`       Level: ${level}`);
      console.log(`       Recommendation: ${risk.expert_action?.recommendation?.substring(0, 50) || 'N/A'}...`);
      console.log('');
    });
  }

  // Check maturity_v2
  const maturityV2 = report.maturity_v2;
  console.log(`7b. maturity_v2:`);
  console.log(`    Execution score: ${maturityV2?.execution_score}%`);
  console.log(`    Potential level: ${maturityV2?.potential_level}`);
  console.log(`    Actual level: ${maturityV2?.actual_level}`);
  console.log(`    Capped: ${maturityV2?.capped}`);
  console.log(`    Capped by: ${maturityV2?.capped_by?.join(', ') || 'N/A'}`);

  // Check objectives
  const objectives = report.objectives || [];
  console.log(`\n7c. Objectives: ${objectives.length} found`);

  // Summary
  console.log('\n=== Summary ===\n');
  const checks = [
    ['Critical risks have expert_action', risks.every(r => r.expert_action)],
    ['Critical risks have level', risks.every(r => typeof r.level === 'number')],
    ['Gap titles are actionable (not question text)', risks.every(r => r.expert_action?.title && !r.expert_action.title.includes('?'))],
    ['maturity_v2 present', !!maturityV2],
    ['objectives present', objectives.length > 0],
  ];

  let passed = 0, failed = 0;
  checks.forEach(([name, result]) => {
    console.log(`${result ? 'PASS' : 'FAIL'} ${name}`);
    if (result) passed++; else failed++;
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  console.log(`\n📋 Report URL: https://cfodiagnosisv1.vercel.app/report/${runId}`);

  if (failed > 0) {
    process.exit(1);
  }
}

test().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
