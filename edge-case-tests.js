// Edge Case Tests for Report QA
const API_BASE = 'https://cfodiagnosisv1-production.up.railway.app';
const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.error('Usage: AUTH_TOKEN=<token> node edge-case-tests.js');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

// Test scenarios
const SCENARIOS = [
  {
    name: 'Perfect Score (100%)',
    description: 'All 48 questions YES - should be Level 4 Optimized',
    answers: () => true, // All YES
  },
  {
    name: 'Total Failure (0%)',
    description: 'All 48 questions NO - should be Level 1 with all criticals failed',
    answers: () => false, // All NO
  },
  {
    name: 'Critical Only Pass',
    description: 'Only 8 critical questions YES, rest NO - tests gate logic',
    answers: (q) => q.is_critical === true,
  },
  {
    name: 'L1+L2 Criticals Only',
    description: 'Pass L1+L2 criticals, fail everything else - should cap at L2',
    answers: (q) => q.is_critical && q.level <= 2,
  },
  {
    name: 'High Score But L1 Critical Fail',
    description: 'Answer YES to 47/48, but NO to first L1 critical - should cap at L1',
    answers: (q) => q.id !== 'fpa_l1_q01',
  },
];

async function fetchSpec() {
  const res = await fetch(`${API_BASE}/api/spec`);
  return res.json();
}

async function createRun() {
  const res = await fetch(`${API_BASE}/diagnostic-runs`, {
    method: 'POST',
    headers
  });
  return res.json();
}

async function setupContext(runId, scenario) {
  await fetch(`${API_BASE}/diagnostic-runs/${runId}/setup`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      company_name: `Test: ${scenario.name}`,
      industry: 'QA Testing'
    })
  });
}

async function submitAnswers(runId, questions, answerFn) {
  let yesCount = 0;
  for (const q of questions) {
    const value = answerFn(q);
    if (value) yesCount++;
    await fetch(`${API_BASE}/diagnostic-inputs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ run_id: runId, question_id: q.id, value })
    });
  }
  return yesCount;
}

async function completeAndScore(runId) {
  await fetch(`${API_BASE}/diagnostic-runs/${runId}/complete`, {
    method: 'POST',
    headers
  });
  await fetch(`${API_BASE}/diagnostic-runs/${runId}/score`, {
    method: 'POST',
    headers
  });
}

async function getReport(runId) {
  const res = await fetch(`${API_BASE}/diagnostic-runs/${runId}/report`, { headers });
  return res.json();
}

async function runScenario(scenario, questions, index) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST ${index + 1}: ${scenario.name}`);
  console.log(`${scenario.description}`);
  console.log('='.repeat(60));

  // Create run
  const run = await createRun();
  console.log(`Run ID: ${run.id}`);

  // Setup context
  await setupContext(run.id, scenario);

  // Submit answers
  const yesCount = await submitAnswers(run.id, questions, scenario.answers);
  console.log(`Answers: ${yesCount}/48 YES`);

  // Complete and score
  await completeAndScore(run.id);

  // Get report
  const report = await getReport(run.id);
  const m = report.maturity_v2;

  console.log(`\nRESULTS:`);
  console.log(`  Execution Score: ${m.execution_score}%`);
  console.log(`  Potential Level: ${m.potential_level} (${m.potential_label})`);
  console.log(`  Actual Level: ${m.actual_level} (${m.level_name})`);
  console.log(`  Capped: ${m.is_capped}`);
  if (m.is_capped && m.capped_by?.length > 0) {
    console.log(`  Capped By: ${m.capped_by.join(', ')}`);
  }
  console.log(`  Critical Risks: ${report.critical_risks?.length || 0}`);
  console.log(`  Actions: ${report.prioritized_actions?.length || 0}`);

  // Priority breakdown
  const p1 = report.prioritized_actions?.filter(a => a.priority === 'P1').length || 0;
  const p2 = report.prioritized_actions?.filter(a => a.priority === 'P2').length || 0;
  const p3 = report.prioritized_actions?.filter(a => a.priority === 'P3').length || 0;
  console.log(`  P1/P2/P3: ${p1}/${p2}/${p3}`);

  // Initiative groups
  const groups = report.grouped_initiatives?.length || 0;
  console.log(`  Initiative Groups: ${groups}`);

  console.log(`\n  Report URL: https://cfodiagnosisv1.vercel.app/report/${run.id}`);

  return {
    name: scenario.name,
    runId: run.id,
    score: m.execution_score,
    potentialLevel: m.potential_level,
    actualLevel: m.actual_level,
    isCapped: m.is_capped,
    criticalRisks: report.critical_risks?.length || 0,
    actions: report.prioritized_actions?.length || 0,
    p1, p2, p3
  };
}

async function main() {
  console.log('='.repeat(60));
  console.log('EDGE CASE TEST SUITE');
  console.log('='.repeat(60));

  // Fetch spec
  const spec = await fetchSpec();
  const questions = spec.questions;
  console.log(`Loaded ${questions.length} questions from spec ${spec.version}`);

  // Run all scenarios
  const results = [];
  for (let i = 0; i < SCENARIOS.length; i++) {
    const result = await runScenario(SCENARIOS[i], questions, i);
    results.push(result);
  }

  // Summary table
  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('Scenario                      | Score | Potential | Actual | Capped | Risks | P1/P2/P3');
  console.log('-'.repeat(95));
  for (const r of results) {
    const name = r.name.padEnd(29);
    const score = `${r.score}%`.padStart(5);
    const potential = `L${r.potentialLevel}`.padStart(9);
    const actual = `L${r.actualLevel}`.padStart(6);
    const capped = r.isCapped ? 'YES' : 'NO';
    const risks = `${r.criticalRisks}`.padStart(5);
    const priorities = `${r.p1}/${r.p2}/${r.p3}`;
    console.log(`${name} | ${score} | ${potential} | ${actual} | ${capped.padStart(6)} | ${risks} | ${priorities}`);
  }

  console.log(`\nAll report URLs:`);
  for (const r of results) {
    console.log(`  ${r.name}: https://cfodiagnosisv1.vercel.app/report/${r.runId}`);
  }
}

main().catch(console.error);
