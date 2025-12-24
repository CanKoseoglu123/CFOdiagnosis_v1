/**
 * VS-25 Interpretation Layer Test Script
 *
 * Tests the interpretation API endpoints:
 * 1. POST /interpret/start - Start interpretation
 * 2. GET /interpret/status - Poll status
 * 3. POST /interpret/answer - Submit answers
 * 4. GET /interpret/report - Get final report
 * 5. POST /interpret/feedback - Submit rating
 *
 * Usage: AUTH_TOKEN="..." node scripts/test-vs25-interpretation.js [runId]
 */

const API_URL = process.env.API_URL || 'https://cfodiagnosisv1-production.up.railway.app';
const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.error('Error: AUTH_TOKEN environment variable required');
  console.log('Usage: AUTH_TOKEN="your-jwt-token" node scripts/test-vs25-interpretation.js [runId]');
  process.exit(1);
}

const runId = process.argv[2];

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testInterpretation(testRunId) {
  console.log('\n========================================');
  console.log('VS-25: Interpretation Layer Test');
  console.log('========================================\n');
  console.log('Run ID:', testRunId);
  console.log('API URL:', API_URL);
  console.log('');

  // Step 1: Start interpretation
  console.log('Step 1: Starting interpretation...');
  const startRes = await fetchAPI(`/diagnostic-runs/${testRunId}/interpret/start`, {
    method: 'POST',
  });

  if (startRes.status !== 200 && startRes.status !== 202) {
    console.error('FAIL: Start interpretation failed');
    console.error('Status:', startRes.status);
    console.error('Response:', JSON.stringify(startRes.data, null, 2));
    return;
  }

  console.log('Response status:', startRes.status);
  console.log('Session ID:', startRes.data.session_id);
  console.log('Status:', startRes.data.status);

  if (startRes.data.status === 'awaiting_user') {
    console.log('\nQuestions received:');
    (startRes.data.questions || []).forEach((q, i) => {
      console.log(`  ${i + 1}. ${q.question}`);
      if (q.options) {
        q.options.forEach(opt => console.log(`     - ${opt}`));
      }
    });

    // Step 2: Submit answers
    console.log('\nStep 2: Submitting answers...');
    const answers = (startRes.data.questions || []).map(q => ({
      question_id: q.question_id,
      answer: q.options ? q.options[0] : 'Test answer from script',
      time_to_answer_ms: 5000,
    }));

    const answerRes = await fetchAPI(`/diagnostic-runs/${testRunId}/interpret/answer`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });

    console.log('Answer response status:', answerRes.status);
    console.log('Status:', answerRes.data.status);

    if (answerRes.data.status === 'complete') {
      console.log('\nInterpretation complete!');
      displayReport(answerRes.data.report);
    }
  } else if (startRes.data.status === 'complete') {
    console.log('\nInterpretation already complete!');
    displayReport(startRes.data.report);
  } else {
    // Step 3: Poll for status
    console.log('\nStep 3: Polling for status...');
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await sleep(2000);
      attempts++;

      const statusRes = await fetchAPI(`/diagnostic-runs/${testRunId}/interpret/status`);
      console.log(`  Poll ${attempts}: Status = ${statusRes.data.status}`);

      if (statusRes.data.status === 'awaiting_user') {
        console.log('\n  Questions received during poll!');
        // Could submit answers here
        break;
      } else if (statusRes.data.status === 'complete') {
        console.log('\n  Interpretation complete!');
        displayReport(statusRes.data.report);
        break;
      } else if (statusRes.data.status === 'failed') {
        console.error('\n  Interpretation failed!');
        break;
      }
    }
  }

  // Step 4: Get final report
  console.log('\nStep 4: Fetching final report...');
  const reportRes = await fetchAPI(`/diagnostic-runs/${testRunId}/interpret/report`);

  if (reportRes.status === 200 && reportRes.data) {
    console.log('Report retrieved successfully!');
    displayReport(reportRes.data);
  } else if (reportRes.status === 404) {
    console.log('No report found yet (expected if interpretation not complete)');
  }

  // Step 5: Submit feedback
  console.log('\nStep 5: Submitting feedback...');
  const feedbackRes = await fetchAPI(`/diagnostic-runs/${testRunId}/interpret/feedback`, {
    method: 'POST',
    body: JSON.stringify({
      rating: 5,
      feedback: 'Great insights from the test script!',
    }),
  });

  console.log('Feedback response status:', feedbackRes.status);
  console.log('Response:', feedbackRes.data.message || JSON.stringify(feedbackRes.data));

  console.log('\n========================================');
  console.log('Test Complete');
  console.log('========================================\n');
}

function displayReport(report) {
  if (!report) {
    console.log('No report data');
    return;
  }

  console.log('\n--- Interpretation Report ---');
  console.log('Session ID:', report.session_id);
  console.log('Quality Status:', report.quality_status);
  console.log('Rounds Used:', report.rounds_used);
  console.log('Word Count:', report.word_count);

  if (report.report) {
    console.log('\nSynthesis:');
    console.log(report.report.synthesis?.substring(0, 200) + '...');

    console.log('\nPriority Rationale:');
    console.log(report.report.priority_rationale?.substring(0, 200) + '...');

    console.log('\nKey Insight:');
    console.log(report.report.key_insight);
  }

  if (report.heuristic_warnings?.length > 0) {
    console.log('\nWarnings:', report.heuristic_warnings);
  }
}

// If runId provided, test that specific run
// Otherwise, create a test run first
async function main() {
  if (runId) {
    await testInterpretation(runId);
  } else {
    console.log('Creating a test diagnostic run first...');

    // Create a new run
    const createRes = await fetchAPI('/diagnostic-runs', { method: 'POST' });
    if (createRes.status !== 201 && createRes.status !== 200) {
      console.error('Failed to create test run:', createRes.data);
      return;
    }

    const newRunId = createRes.data.id;
    console.log('Created run:', newRunId);

    // Setup context
    const setupRes = await fetchAPI(`/diagnostic-runs/${newRunId}/setup`, {
      method: 'POST',
      body: JSON.stringify({
        company_name: 'VS-25 Test Company',
        industry: 'Technology',
      }),
    });
    console.log('Setup completed:', setupRes.status === 200 ? 'OK' : 'FAIL');

    // Answer all questions with YES
    console.log('Answering all 48 questions...');
    const specRes = await fetchAPI('/api/spec');
    const questions = specRes.data.questions || [];

    for (const q of questions) {
      await fetchAPI('/diagnostic-inputs', {
        method: 'POST',
        body: JSON.stringify({
          run_id: newRunId,
          question_id: q.id,
          value: true, // Answer YES to all
        }),
      });
    }
    console.log('All questions answered');

    // Complete the run
    const completeRes = await fetchAPI(`/diagnostic-runs/${newRunId}/complete`, {
      method: 'POST',
    });
    console.log('Run completed:', completeRes.status === 200 ? 'OK' : 'FAIL');

    // Score the run
    const scoreRes = await fetchAPI(`/diagnostic-runs/${newRunId}/score`, {
      method: 'POST',
    });
    console.log('Run scored:', scoreRes.status === 200 ? 'OK' : 'FAIL');

    // Now test interpretation
    await testInterpretation(newRunId);
  }
}

main().catch(console.error);
