/**
 * QA Test: Full Assessment Flow
 * Tests the entire user journey from run creation to report generation
 */

const API = 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;

if (!TOKEN) {
  console.error('ERROR: Set AUTH_TOKEN environment variable');
  process.exit(1);
}

// Question IDs will be fetched from the spec API
let ALL_QUESTIONS = [];

async function request(method, path, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API}${path}`, options);
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

async function fetchQuestionIds() {
  const res = await fetch(`${API}/api/spec`);
  const spec = await res.json();
  return spec.questions.map(q => q.id);
}

async function runFullTest() {
  console.log('=== QA TEST: Full Assessment Flow ===\n');
  console.log('API:', API);
  console.log('');

  // Fetch question IDs from spec
  console.log('Fetching question IDs from spec...');
  ALL_QUESTIONS = await fetchQuestionIds();
  console.log(`Found ${ALL_QUESTIONS.length} questions\n`);

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  function log(test, passed, details = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${test}${details ? ' - ' + details : ''}`);
    results.tests.push({ test, passed, details });
    if (passed) results.passed++;
    else results.failed++;
  }

  // Step 1: Create diagnostic run
  console.log('\n--- Step 1: Create Diagnostic Run ---');
  const createRes = await request('POST', '/diagnostic-runs');
  const runId = createRes.data?.id;
  log('Create run', createRes.ok && runId, runId ? `Run ID: ${runId}` : createRes.data?.error);

  if (!runId) {
    console.log('\nCannot continue without run ID');
    return results;
  }

  // Step 2: Save company context
  console.log('\n--- Step 2: Save Setup Context ---');
  const setupRes = await request('POST', `/diagnostic-runs/${runId}/setup`, {
    company: {
      name: 'QA Test Corp',
      industry: 'saas',
      revenue_range: '50m_250m',
      employee_count: '201_1000',
      finance_structure: 'hybrid',
      change_appetite: 'standardize',
    },
    pillar: {
      ftes: 5,
      systems: ['excel', 'powerbi'],
      complexity: { business_units: 3, currencies: 2, legal_entities: 4 },
      pain_points: ['long_cycles', 'lack_insights'],
    },
  });
  log('Save setup', setupRes.ok, setupRes.ok ? 'Context saved' : setupRes.data?.error);

  // Step 3: Submit ALL 60 answers (mixed yes/no pattern)
  console.log('\n--- Step 3: Submit All 60 Answers ---');
  let answersSubmitted = 0;
  let answersFailed = 0;

  for (let i = 0; i < ALL_QUESTIONS.length; i++) {
    const qId = ALL_QUESTIONS[i];
    // Mix of true/false answers - first 35 true, rest false (Level 2 maturity)
    // Validation expects boolean values, not strings
    const value = i < 35 ? true : false;

    const res = await request('POST', '/diagnostic-inputs', {
      run_id: runId,
      question_id: qId,
      value,
    });

    if (res.ok) {
      answersSubmitted++;
    } else {
      answersFailed++;
      if (answersFailed <= 3) {
        console.log(`   Warning: ${qId} failed - ${JSON.stringify(res.data)}`);
      }
    }

    // Progress indicator
    if ((i + 1) % 20 === 0) {
      console.log(`   Submitted ${i + 1}/${ALL_QUESTIONS.length} answers...`);
    }
  }
  log('Submit answers', answersFailed === 0, `${answersSubmitted}/${ALL_QUESTIONS.length} submitted`);

  // Step 4: Complete the run
  console.log('\n--- Step 4: Complete Run ---');
  const completeRes = await request('POST', `/diagnostic-runs/${runId}/complete`);
  log('Complete run', completeRes.ok, completeRes.ok ? 'Status: completed' : JSON.stringify(completeRes.data));

  // Step 5: Score the run
  console.log('\n--- Step 5: Score Run ---');
  const scoreRes = await request('POST', `/diagnostic-runs/${runId}/score`);
  log('Score run', scoreRes.ok && scoreRes.data?.overall_score !== undefined,
    scoreRes.ok ? `Overall: ${scoreRes.data?.overall_score}%` : scoreRes.data?.error);

  // Step 6: Get report
  console.log('\n--- Step 6: Get Report ---');
  const reportRes = await request('GET', `/diagnostic-runs/${runId}/report`);
  log('Get report', reportRes.ok && reportRes.data?.overall_score !== undefined,
    reportRes.ok ? `Maturity: Level ${reportRes.data?.maturity?.achieved_level}` : reportRes.data?.error);

  // Verify report structure
  if (reportRes.ok && reportRes.data) {
    const report = reportRes.data;
    log('Report has overall_score', report.overall_score !== undefined, String(report.overall_score));
    log('Report has maturity', !!report.maturity, report.maturity?.achieved_level);
    log('Report has objective_scores', Array.isArray(report.objective_scores),
      report.objective_scores?.length + ' objectives');
    log('Report has practice_results', Array.isArray(report.practice_results),
      report.practice_results?.length + ' practices');
    log('Report has critical_risks', Array.isArray(report.critical_risks),
      report.critical_risks?.length + ' risks');
    log('Report has initiatives', Array.isArray(report.initiatives),
      report.initiatives?.length + ' initiatives');
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Total:  ${results.passed + results.failed}`);
  console.log('');
  console.log(`Test Run ID: ${runId}`);
  console.log(`View Report: https://cfo-lens.com/report/${runId}`);

  return results;
}

runFullTest().catch(console.error);
