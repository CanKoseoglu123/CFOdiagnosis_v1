/**
 * VS-32 AI Interpretation Test
 * Tests the simplified interpretation flow
 */

const API_URL = process.env.API_URL || 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;

if (!TOKEN) {
  console.error('Missing AUTH_TOKEN environment variable');
  console.log('Usage: AUTH_TOKEN=<token> node scripts/test-vs32-interpretation.js');
  process.exit(1);
}

async function test() {
  console.log('=== VS-32 AI Interpretation Test ===\n');
  console.log('API URL:', API_URL);

  // Use a run ID from env or find/create one
  let runId = process.env.RUN_ID;

  if (!runId) {
    // Create a new run and set it up
    console.log('\n1. Creating a new diagnostic run...');
    const createRes = await fetch(`${API_URL}/diagnostic-runs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!createRes.ok) {
      console.log('   Failed to create run:', createRes.status);
      const text = await createRes.text();
      console.log('   Response:', text.substring(0, 500));
      return;
    }

    const run = await createRes.json();
    runId = run.id;
    console.log('   Created run:', runId);

    // Setup the run with basic context
    console.log('   Setting up context...');
    const setupRes = await fetch(`${API_URL}/diagnostic-runs/${runId}/setup`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        company: {
          name: 'VS-32 Test Corp',
          industry: 'saas',
          revenue_range: '50m_250m',
          employee_count: '201_1000',
          finance_structure: 'hybrid',
          change_appetite: 'transform'
        },
        pillar: {
          ftes: 6,
          systems: ['excel', 'powerbi', 'adaptive'],
          complexity: { business_units: 4, currencies: 3, legal_entities: 5 },
          pain_points: ['long_cycles', 'lack_insights']
        }
      })
    });

    if (!setupRes.ok) {
      console.log('   Setup failed:', await setupRes.text());
    }

    // Submit MCQ answers
    console.log('   Submitting MCQ answers...');
    const questions = [
      // L1 questions - mix of yes/no to create variety
      { q: 'fpa_l1_q01', a: 'a' }, // yes
      { q: 'fpa_l1_q02', a: 'b' }, // no
      { q: 'fpa_l1_q03', a: 'a' }, // yes
      { q: 'fpa_l1_q04', a: 'a' }, // yes (critical)
      { q: 'fpa_l1_q05', a: 'a' }, // yes (critical)
      { q: 'fpa_l1_q06', a: 'b' }, // no
      { q: 'fpa_l1_q07', a: 'a' }, // yes
      { q: 'fpa_l1_q08', a: 'a' }, // yes (critical)
      { q: 'fpa_l1_q09', a: 'a' }, // yes (critical)
      // L2 questions
      { q: 'fpa_l2_q01', a: 'a' },
      { q: 'fpa_l2_q02', a: 'b' },
      { q: 'fpa_l2_q03', a: 'a' },
      { q: 'fpa_l2_q04', a: 'a' },
      { q: 'fpa_l2_q05', a: 'b' },
      // L3 questions
      { q: 'fpa_l3_q01', a: 'a' },
      { q: 'fpa_l3_q02', a: 'b' },
      { q: 'fpa_l3_q03', a: 'a' },
    ];

    for (const { q, a } of questions) {
      await fetch(`${API_URL}/diagnostic-inputs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          run_id: runId,
          question_id: q,
          answer_option_id: a,
          skipped: false
        })
      });
    }

    // Complete and score the run
    console.log('   Completing and scoring...');
    await fetch(`${API_URL}/diagnostic-runs/${runId}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}` }
    });

    const scoreRes = await fetch(`${API_URL}/diagnostic-runs/${runId}/score`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}` }
    });

    if (scoreRes.ok) {
      const scoreData = await scoreRes.json();
      console.log('   Score:', scoreData.overall_score, '- Level:', scoreData.maturity_level);
    }
  } else {
    console.log('\n1. Using provided run ID:', runId);
  }

  // Step 2: Test interpret-v32 status endpoint
  console.log('\n2. Checking interpretation status...');
  const statusRes = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret-v32/status`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });

  console.log('   Status response:', statusRes.status, statusRes.statusText);

  if (!statusRes.ok) {
    const text = await statusRes.text();
    console.log('   Error response:', text.substring(0, 1000));

    // Check if it's a 404 - route not found
    if (statusRes.status === 404 || text.includes('<!DOCTYPE')) {
      console.log('\n   *** Route not deployed! ***');
      console.log('   The /interpret-v32 routes may not be deployed yet.');
      console.log('   Check if the latest code was pushed and Railway deployed it.');
    }
    return;
  }

  const statusData = await statusRes.json();
  console.log('   Status:', JSON.stringify(statusData, null, 2));

  // Step 3: If no report exists, start interpretation
  if (statusData.status === 'none' || statusData.status === 'failed') {
    console.log('\n3. Starting interpretation...');
    const startRes = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret-v32`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Start response:', startRes.status, startRes.statusText);

    if (!startRes.ok) {
      const text = await startRes.text();
      console.log('   Error:', text.substring(0, 500));
      return;
    }

    const startData = await startRes.json();
    console.log('   Started:', JSON.stringify(startData, null, 2));

    // Step 4: Poll for completion
    console.log('\n4. Polling for completion (max 60s)...');
    const startTime = Date.now();
    const timeout = 60000;

    while (Date.now() - startTime < timeout) {
      await new Promise(r => setTimeout(r, 3000));

      const pollRes = await fetch(`${API_URL}/diagnostic-runs/${runId}/interpret-v32/status`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });

      if (!pollRes.ok) {
        console.log('   Poll failed:', pollRes.status);
        continue;
      }

      const pollData = await pollRes.json();
      console.log('   Poll status:', pollData.status);

      if (pollData.status === 'completed') {
        console.log('\n=== SUCCESS ===');
        console.log('Sections:', pollData.report?.sections?.length || 0);
        console.log('Used fallback:', pollData.report?.used_fallback);
        console.log('\nFirst section preview:');
        if (pollData.report?.sections?.[0]) {
          console.log('  Title:', pollData.report.sections[0].title);
          console.log('  Content:', pollData.report.sections[0].content?.substring(0, 200) + '...');
        }
        return;
      }

      if (pollData.status === 'failed') {
        console.log('\n=== FAILED ===');
        console.log('Error:', pollData.report?.error_message);
        return;
      }
    }

    console.log('\n=== TIMEOUT ===');
    console.log('Generation took too long');

  } else if (statusData.status === 'completed') {
    console.log('\n=== EXISTING REPORT ===');
    console.log('Sections:', statusData.report?.sections?.length || 0);
    console.log('Used fallback:', statusData.report?.used_fallback);
    console.log('Can regenerate:', statusData.can_regenerate);

    if (statusData.report?.sections?.[0]) {
      console.log('\nFirst section:');
      console.log('  Title:', statusData.report.sections[0].title);
      console.log('  Content:', statusData.report.sections[0].content?.substring(0, 300) + '...');
    }
  } else if (statusData.status === 'generating') {
    console.log('\n=== ALREADY GENERATING ===');
    console.log('Wait for it to complete');
  }
}

test().catch(err => {
  console.error('Test error:', err.message);
  console.error(err.stack);
});
