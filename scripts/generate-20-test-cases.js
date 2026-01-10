const API = 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;

const QUESTIONS = [
  // L1 Critical (5)
  'fpa_l1_q01', 'fpa_l1_q02', 'fpa_l1_q03', 'fpa_l1_q05', 'fpa_l1_q06',
  // L1 Non-critical (7)
  'fpa_l1_q04', 'fpa_l1_q07', 'fpa_l1_q08', 'fpa_l1_q09', 'fpa_l1_q10', 'fpa_l1_q11', 'fpa_l1_q12',
  // L2 Critical (4)
  'fpa_l2_q01', 'fpa_l2_q05', 'fpa_l2_q10', 'fpa_l2_q15',
  // L2 Non-critical (21)
  'fpa_l2_q02', 'fpa_l2_q03', 'fpa_l2_q04', 'fpa_l2_q06', 'fpa_l2_q07', 'fpa_l2_q08', 'fpa_l2_q09',
  'fpa_l2_q11', 'fpa_l2_q12', 'fpa_l2_q13', 'fpa_l2_q14', 'fpa_l2_q16', 'fpa_l2_q17', 'fpa_l2_q18',
  'fpa_l2_q19', 'fpa_l2_q20', 'fpa_l2_q21', 'fpa_l2_q22', 'fpa_l2_q23', 'fpa_l2_q24', 'fpa_l2_q25',
  // L3 Critical (1)
  'fpa_l3_q01',
  // L3 Non-critical (28)
  'fpa_l3_q02', 'fpa_l3_q03', 'fpa_l3_q04', 'fpa_l3_q05', 'fpa_l3_q06', 'fpa_l3_q07', 'fpa_l3_q08',
  'fpa_l3_q09', 'fpa_l3_q10', 'fpa_l3_q11', 'fpa_l3_q12', 'fpa_l3_q13', 'fpa_l3_q14', 'fpa_l3_q15',
  'fpa_l3_q16', 'fpa_l3_q17', 'fpa_l3_q18', 'fpa_l3_q19', 'fpa_l3_q20', 'fpa_l3_q21', 'fpa_l3_q22',
  'fpa_l3_q23', 'fpa_l3_q24', 'fpa_l3_q25', 'fpa_l3_q26', 'fpa_l3_q27', 'fpa_l3_q28', 'fpa_l3_q29',
  // L4 (13)
  'fpa_l4_q01', 'fpa_l4_q02', 'fpa_l4_q03', 'fpa_l4_q04', 'fpa_l4_q05', 'fpa_l4_q06', 'fpa_l4_q07',
  'fpa_l4_q08', 'fpa_l4_q09', 'fpa_l4_q10', 'fpa_l4_q11', 'fpa_l4_q12', 'fpa_l4_q13'
];

const L1_CRITICALS = ['fpa_l1_q01', 'fpa_l1_q02', 'fpa_l1_q03', 'fpa_l1_q05', 'fpa_l1_q06'];
const L2_CRITICALS = ['fpa_l2_q01', 'fpa_l2_q05', 'fpa_l2_q10', 'fpa_l2_q15'];
const L3_CRITICALS = ['fpa_l3_q01'];

// Test case definitions
const TEST_CASES = [
  // === EDGE CASES (10) ===
  { name: 'Edge 1: All No', pattern: () => 'a' },
  { name: 'Edge 2: All Yes', pattern: () => 'd' },
  { name: 'Edge 3: Only L1 criticals pass', pattern: (q) => L1_CRITICALS.includes(q) ? 'd' : 'a' },
  { name: 'Edge 4: Miss one L1 critical', pattern: (q) => q === 'fpa_l1_q01' ? 'a' : 'd' },
  { name: 'Edge 5: L1+L2 criticals only', pattern: (q) => [...L1_CRITICALS, ...L2_CRITICALS].includes(q) ? 'd' : 'a' },
  { name: 'Edge 6: All criticals fail', pattern: (q) => [...L1_CRITICALS, ...L2_CRITICALS, ...L3_CRITICALS].includes(q) ? 'a' : 'd' },
  { name: 'Edge 7: Alternating answers', pattern: (q, i) => i % 2 === 0 ? 'd' : 'a' },
  { name: 'Edge 8: Only L4 questions pass', pattern: (q) => q.startsWith('fpa_l4') ? 'd' : 'a' },
  { name: 'Edge 9: All partial (option b)', pattern: () => 'b' },
  { name: 'Edge 10: All mostly (option c)', pattern: () => 'c' },

  // === MIDFIELD CASES (10) ===
  { name: 'Mid 1: 50% random pass', pattern: (q, i) => i % 2 === 0 ? 'c' : 'b' },
  { name: 'Mid 2: L1-L2 pass, L3-L4 fail', pattern: (q) => q.startsWith('fpa_l1') || q.startsWith('fpa_l2') ? 'd' : 'a' },
  { name: 'Mid 3: L1 full, L2 partial', pattern: (q) => q.startsWith('fpa_l1') ? 'd' : q.startsWith('fpa_l2') ? 'c' : 'b' },
  { name: 'Mid 4: Criticals pass, non-criticals mixed', pattern: (q, i) => [...L1_CRITICALS, ...L2_CRITICALS, ...L3_CRITICALS].includes(q) ? 'd' : ['b', 'c'][i % 2] },
  { name: 'Mid 5: 70% pass rate', pattern: (q, i) => i % 10 < 7 ? 'd' : 'a' },
  { name: 'Mid 6: 30% pass rate', pattern: (q, i) => i % 10 < 3 ? 'd' : 'a' },
  { name: 'Mid 7: L1 full, rest partial', pattern: (q) => q.startsWith('fpa_l1') ? 'd' : 'b' },
  { name: 'Mid 8: Gradient decline', pattern: (q) => q.startsWith('fpa_l1') ? 'd' : q.startsWith('fpa_l2') ? 'c' : q.startsWith('fpa_l3') ? 'b' : 'a' },
  { name: 'Mid 9: Strong L1-L3, weak L4', pattern: (q) => q.startsWith('fpa_l4') ? 'b' : 'd' },
  { name: 'Mid 10: Random realistic', pattern: (q, i) => ['a', 'b', 'c', 'd'][(i * 7 + 3) % 4] }
];

async function createRun() {
  const res = await fetch(`${API}/diagnostic-runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` }
  });
  return res.json();
}

async function setupRun(runId, name) {
  await fetch(`${API}/diagnostic-runs/${runId}/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({
      company: { name, industry: 'saas', revenue_range: '100m_250m', change_appetite: 'standardize' },
      pillar: { tools: [{ tool: 'excel', effectiveness: 'medium' }] }
    })
  });
}

async function submitAnswers(runId, pattern) {
  for (let i = 0; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i];
    const answer = pattern(q, i);
    await fetch(`${API}/diagnostic-inputs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ run_id: runId, question_id: q, answer_option_id: answer, skipped: false })
    });
  }
}

async function completeAndScore(runId) {
  await fetch(`${API}/diagnostic-runs/${runId}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  await fetch(`${API}/diagnostic-runs/${runId}/score`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
}

async function main() {
  console.log('Generating 20 test scenarios...\n');
  const urls = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    const run = await createRun();
    await setupRun(run.id, tc.name);
    await submitAnswers(run.id, tc.pattern);
    await completeAndScore(run.id);
    urls.push(`https://cfodiagnosisv1.vercel.app/report/${run.id}`);
    process.stdout.write(`\r${i + 1}/20 complete`);
  }

  console.log('\n\n=== TEST SCENARIO URLs ===\n');
  urls.forEach(url => console.log(url));
}

main().catch(console.error);
