// generate-20-test-reports.js
// Creates 20 test cases covering edge cases for report generation
// Usage: AUTH_TOKEN="..." node scripts/generate-20-test-reports.js

const API = 'https://cfodiagnosisv1-production.up.railway.app';
const FRONTEND = 'https://cfodiagnosisv1.vercel.app';
const TOKEN = process.env.AUTH_TOKEN;

if (!TOKEN) {
  console.error('ERROR: Set AUTH_TOKEN environment variable');
  process.exit(1);
}

// Load actual question IDs from content
const { questions: QUESTIONS_DATA } = require('../content/questions.json');

// Organize questions by level
const QUESTIONS_BY_LEVEL = {
  1: QUESTIONS_DATA.filter(q => q.id.includes('_l1_')),
  2: QUESTIONS_DATA.filter(q => q.id.includes('_l2_')),
  3: QUESTIONS_DATA.filter(q => q.id.includes('_l3_')),
  4: QUESTIONS_DATA.filter(q => q.id.includes('_l4_'))
};

const ALL_QUESTION_IDS = QUESTIONS_DATA.map(q => q.id);

// Critical questions (based on is_critical flag or known IDs)
const CRITICAL_L1 = QUESTIONS_BY_LEVEL[1].filter(q => q.is_critical).map(q => q.id);
const CRITICAL_L2 = QUESTIONS_BY_LEVEL[2].filter(q => q.is_critical).map(q => q.id);

// If no is_critical flag, use first 4 of each level as critical
const CRITICAL_QUESTIONS = {
  L1: CRITICAL_L1.length > 0 ? CRITICAL_L1 : QUESTIONS_BY_LEVEL[1].slice(0, 4).map(q => q.id),
  L2: CRITICAL_L2.length > 0 ? CRITICAL_L2 : QUESTIONS_BY_LEVEL[2].slice(0, 4).map(q => q.id)
};

const ALL_CRITICAL = [...CRITICAL_QUESTIONS.L1, ...CRITICAL_QUESTIONS.L2];

console.log(`Loaded ${ALL_QUESTION_IDS.length} questions`);
console.log(`  L1: ${QUESTIONS_BY_LEVEL[1].length}, L2: ${QUESTIONS_BY_LEVEL[2].length}`);
console.log(`  L3: ${QUESTIONS_BY_LEVEL[3].length}, L4: ${QUESTIONS_BY_LEVEL[4].length}`);
console.log(`  Critical L1: ${CRITICAL_QUESTIONS.L1.length}, L2: ${CRITICAL_QUESTIONS.L2.length}`);

// ═══════════════════════════════════════════════════════════════════════════════
// TEST CASE DEFINITIONS - 20 cases covering top 10 edge cases
// ═══════════════════════════════════════════════════════════════════════════════

const TEST_CASES = [
  // EDGE CASE 1: Extreme Scores
  { id: 1, name: 'All YES - Champion (100%)', company: { name: 'Champion Corp', industry: 'saas' }, pattern: 'all_yes' },
  { id: 2, name: 'All NO - Baseline (0%)', company: { name: 'Baseline Inc', industry: 'manufacturing' }, pattern: 'all_no' },

  // EDGE CASE 2: Critical Question Patterns
  { id: 3, name: 'All Critical FAIL', company: { name: 'Critical Fail Ltd', industry: 'services' }, pattern: 'critical_all_fail' },
  { id: 4, name: 'All Critical PASS', company: { name: 'Critical Pass Co', industry: 'retail' }, pattern: 'critical_all_pass' },
  { id: 5, name: 'Half Critical FAIL', company: { name: 'Half Critical LLC', industry: 'healthcare' }, pattern: 'critical_half_fail' },

  // EDGE CASE 3: Maturity Level Boundaries
  { id: 6, name: 'L1 Only (Emerging)', company: { name: 'Emerging Startup', industry: 'saas' }, pattern: 'l1_only' },
  { id: 7, name: 'L1+L2 (Defined)', company: { name: 'Defined Corp', industry: 'fintech' }, pattern: 'l1_l2_only' },
  { id: 8, name: 'L1+L2+L3 (Managed)', company: { name: 'Managed Systems', industry: 'technology' }, pattern: 'l1_l2_l3_only' },

  // EDGE CASE 4: Threshold Boundaries
  { id: 9, name: 'Score ~40% (L2 Threshold)', company: { name: 'Threshold 40 Inc', industry: 'manufacturing' }, pattern: 'threshold_40' },
  { id: 10, name: 'Score ~65% (L3 Threshold)', company: { name: 'Threshold 65 Co', industry: 'services' }, pattern: 'threshold_65' },
  { id: 11, name: 'Score ~85% (L4 Threshold)', company: { name: 'Threshold 85 Ltd', industry: 'saas' }, pattern: 'threshold_85' },

  // EDGE CASE 5: Sparse/Partial Answers
  { id: 12, name: 'Sparse - Only 10 Answers', company: { name: 'Sparse Data Inc', industry: 'retail' }, pattern: 'sparse_10' },
  { id: 13, name: 'Skip Pattern - Alternating', company: { name: 'Alternating LLC', industry: 'healthcare' }, pattern: 'alternating' },

  // EDGE CASE 6: Objective Imbalance
  { id: 14, name: 'Foundation Strong Only', company: { name: 'Foundation First', industry: 'manufacturing' }, pattern: 'foundation_strong' },
  { id: 15, name: 'Intelligence Strong Only', company: { name: 'Analytics Pro', industry: 'technology' }, pattern: 'intelligence_strong' },

  // EDGE CASE 7: Industry Variations
  { id: 16, name: 'SaaS Medium Performer', company: { name: 'CloudMetrics SaaS', industry: 'saas' }, pattern: 'medium_60' },
  { id: 17, name: 'Manufacturing Medium Performer', company: { name: 'Industrial Dynamics', industry: 'manufacturing' }, pattern: 'medium_60' },

  // EDGE CASE 8: Critical + Level Combinations
  { id: 18, name: 'L1 Critical Fail Only', company: { name: 'L1 Critical Issue', industry: 'fintech' }, pattern: 'l1_critical_fail' },
  { id: 19, name: 'L2 Critical Fail Only', company: { name: 'L2 Critical Issue', industry: 'services' }, pattern: 'l2_critical_fail' },

  // EDGE CASE 9 & 10: Realistic Patterns
  { id: 20, name: 'Realistic Mid-Market', company: { name: 'MidMarket Dynamics', industry: 'retail' }, pattern: 'realistic_midmarket' }
];

// ═══════════════════════════════════════════════════════════════════════════════
// ANSWER PATTERN GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════

function generateAnswers(pattern) {
  const answers = {};

  switch (pattern) {
    case 'all_yes':
      ALL_QUESTION_IDS.forEach(q => answers[q] = true);
      break;

    case 'all_no':
      ALL_QUESTION_IDS.forEach(q => answers[q] = false);
      break;

    case 'critical_all_fail':
      ALL_QUESTION_IDS.forEach(q => {
        answers[q] = !ALL_CRITICAL.includes(q);
      });
      break;

    case 'critical_all_pass':
      ALL_QUESTION_IDS.forEach(q => {
        answers[q] = ALL_CRITICAL.includes(q);
      });
      break;

    case 'critical_half_fail':
      const halfFail = [
        ...CRITICAL_QUESTIONS.L1.slice(0, 2),
        ...CRITICAL_QUESTIONS.L2.slice(0, 2)
      ];
      ALL_QUESTION_IDS.forEach(q => {
        answers[q] = !halfFail.includes(q);
      });
      break;

    case 'l1_only':
      ALL_QUESTION_IDS.forEach(q => {
        answers[q] = q.includes('_l1_');
      });
      break;

    case 'l1_l2_only':
      ALL_QUESTION_IDS.forEach(q => {
        answers[q] = q.includes('_l1_') || q.includes('_l2_');
      });
      break;

    case 'l1_l2_l3_only':
      ALL_QUESTION_IDS.forEach(q => {
        answers[q] = !q.includes('_l4_');
      });
      break;

    case 'threshold_40':
      const count40 = Math.floor(ALL_QUESTION_IDS.length * 0.4);
      ALL_QUESTION_IDS.forEach((q, i) => {
        answers[q] = i < count40;
      });
      CRITICAL_QUESTIONS.L1.forEach(q => answers[q] = true);
      break;

    case 'threshold_65':
      const count65 = Math.floor(ALL_QUESTION_IDS.length * 0.65);
      ALL_QUESTION_IDS.forEach((q, i) => {
        answers[q] = i < count65;
      });
      ALL_CRITICAL.forEach(q => answers[q] = true);
      break;

    case 'threshold_85':
      const count85 = Math.floor(ALL_QUESTION_IDS.length * 0.85);
      ALL_QUESTION_IDS.forEach((q, i) => {
        answers[q] = i < count85;
      });
      ALL_CRITICAL.forEach(q => answers[q] = true);
      break;

    case 'sparse_10':
      // Only answer first 10 questions
      ALL_QUESTION_IDS.slice(0, 10).forEach(q => answers[q] = true);
      break;

    case 'alternating':
      ALL_QUESTION_IDS.forEach((q, i) => {
        answers[q] = i % 2 === 0;
      });
      ALL_CRITICAL.forEach(q => answers[q] = true);
      break;

    case 'foundation_strong':
      ALL_QUESTION_IDS.forEach(q => {
        if (q.includes('_l1_') || q.includes('_l2_')) {
          answers[q] = true;
        } else {
          answers[q] = Math.random() < 0.3;
        }
      });
      break;

    case 'intelligence_strong':
      ALL_QUESTION_IDS.forEach(q => {
        if (q.includes('_l3_') || q.includes('_l4_')) {
          answers[q] = true;
        } else if (ALL_CRITICAL.includes(q)) {
          answers[q] = true;
        } else {
          answers[q] = Math.random() < 0.3;
        }
      });
      break;

    case 'medium_60':
      const count60 = Math.floor(ALL_QUESTION_IDS.length * 0.6);
      ALL_QUESTION_IDS.forEach((q, i) => {
        answers[q] = i < count60;
      });
      ALL_CRITICAL.forEach(q => answers[q] = true);
      break;

    case 'l1_critical_fail':
      ALL_QUESTION_IDS.forEach(q => {
        answers[q] = !CRITICAL_QUESTIONS.L1.includes(q);
      });
      break;

    case 'l2_critical_fail':
      ALL_QUESTION_IDS.forEach(q => {
        answers[q] = !CRITICAL_QUESTIONS.L2.includes(q);
      });
      // Keep L1 critical passing
      CRITICAL_QUESTIONS.L1.forEach(q => answers[q] = true);
      break;

    case 'realistic_midmarket':
      ALL_QUESTION_IDS.forEach(q => {
        if (q.includes('_l1_')) {
          answers[q] = Math.random() < 0.85;
        } else if (q.includes('_l2_')) {
          answers[q] = Math.random() < 0.70;
        } else if (q.includes('_l3_')) {
          answers[q] = Math.random() < 0.45;
        } else {
          answers[q] = Math.random() < 0.25;
        }
      });
      CRITICAL_QUESTIONS.L1.forEach(q => answers[q] = true);
      CRITICAL_QUESTIONS.L2.slice(0, 3).forEach(q => answers[q] = true);
      break;

    default:
      ALL_QUESTION_IDS.forEach(q => answers[q] = false);
  }

  return answers;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

async function createRun() {
  const res = await fetch(`${API}/diagnostic-runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    }
  });
  if (!res.ok) throw new Error(`Create run failed: ${res.status}`);
  return res.json();
}

async function saveSetup(runId, company) {
  const res = await fetch(`${API}/diagnostic-runs/${runId}/setup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    },
    body: JSON.stringify({
      company: {
        name: company.name,
        industry: company.industry,
        revenue_range: '50m_250m',
        employee_count: '201_1000',
        finance_structure: 'hybrid',
        change_appetite: 'standardize'
      },
      pillar: {
        ftes: 5,
        systems: ['excel', 'powerbi'],
        complexity: { business_units: 3, currencies: 2, legal_entities: 4 },
        pain_points: ['long_cycles', 'lack_insights']
      }
    })
  });
  if (!res.ok) throw new Error(`Setup failed: ${res.status}`);
  return res.json();
}

async function saveAnswer(runId, questionId, value) {
  const res = await fetch(`${API}/diagnostic-inputs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    },
    body: JSON.stringify({
      run_id: runId,
      question_id: questionId,
      value: value  // true/false or the actual answer value
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Save answer failed for ${questionId}: ${res.status} - ${text}`);
  }
  return res.json();
}

async function completeRun(runId) {
  const res = await fetch(`${API}/diagnostic-runs/${runId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Complete failed: ${res.status} - ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function scoreRun(runId) {
  const res = await fetch(`${API}/diagnostic-runs/${runId}/score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    }
  });
  if (!res.ok) throw new Error(`Score failed: ${res.status}`);
  return res.json();
}

async function getReport(runId) {
  const res = await fetch(`${API}/diagnostic-runs/${runId}/report`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  if (!res.ok) throw new Error(`Report failed: ${res.status}`);
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN RUNNER
// ═══════════════════════════════════════════════════════════════════════════════

async function runTestCase(testCase) {
  const { id, name, company, pattern } = testCase;

  try {
    // 1. Create run
    const run = await createRun();
    if (!run.id) throw new Error('No run ID returned');

    // 2. Save setup
    await saveSetup(run.id, company);

    // 3. Generate and save answers
    const answers = generateAnswers(pattern);
    const questionIds = Object.keys(answers);

    let savedCount = 0;
    for (const qId of questionIds) {
      if (answers[qId] !== undefined) {
        try {
          await saveAnswer(run.id, qId, answers[qId]);
          savedCount++;
        } catch (err) {
          // Continue on individual answer failures
        }
      }
    }

    // 4. Complete run
    await completeRun(run.id);

    // 5. Score run
    await scoreRun(run.id);

    // 6. Get report
    const report = await getReport(run.id);

    return {
      success: true,
      runId: run.id,
      answeredCount: savedCount,
      score: report.overall_score,
      level: report.maturity?.achieved_level,
      url: `${FRONTEND}/report/${run.id}`
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║  CFO DIAGNOSTIC - 20 TEST CASE REPORT GENERATOR                              ║');
  console.log('║  Covering Top 10 Edge Cases                                                   ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log();
  console.log(`API: ${API}`);
  console.log(`Frontend: ${FRONTEND}`);
  console.log();

  const results = [];

  for (const testCase of TEST_CASES) {
    process.stdout.write(`[${testCase.id.toString().padStart(2, '0')}/20] ${testCase.name.padEnd(35)} `);

    const result = await runTestCase(testCase);
    results.push({ ...testCase, ...result });

    if (result.success) {
      console.log(`✅ Score: ${result.score}% Level: ${result.level}`);
    } else {
      console.log(`❌ FAILED: ${result.error}`);
    }

    // Small delay between tests
    await new Promise(r => setTimeout(r, 500));
  }

  // Summary
  console.log();
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('                              SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════════════════');

  const passed = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`Total: ${results.length} | Passed: ${passed.length} | Failed: ${failed.length}`);
  console.log();

  if (failed.length > 0) {
    console.log('FAILED TESTS:');
    failed.forEach(r => console.log(`  ❌ ${r.name}: ${r.error}`));
    console.log();
  }

  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('                           REPORT URLs (Open in Browser)');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log();

  passed.forEach(r => {
    console.log(`${r.id.toString().padStart(2)}. ${r.name}`);
    console.log(`    Score: ${r.score}% | Level: ${r.level}`);
    console.log(`    ${r.url}`);
    console.log();
  });

  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('Done! Open the URLs above in your browser to view the reports.');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
}

main().catch(console.error);
