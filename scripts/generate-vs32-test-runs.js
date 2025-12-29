// generate-vs32-test-runs.js
// Creates 20 test runs for VS-32 interpretation testing
// 10 edge cases + 10 normal cases

const API = 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;

if (!TOKEN) {
  console.error('ERROR: Set AUTH_TOKEN environment variable');
  process.exit(1);
}

// Test case definitions
const TEST_CASES = [
  // ===== EDGE CASES (10) =====
  {
    name: 'Edge 1: All L1 Critical Failures',
    type: 'edge',
    company: { name: 'CriticalFail Corp', industry: 'manufacturing', revenue_range: '10m_50m', employee_count: '51_200', finance_structure: 'centralized', change_appetite: 'maintain' },
    answerPattern: 'all_a_l1',  // All 'a' answers for L1 (worst)
    description: 'Tests urgent tonality with critical failures'
  },
  {
    name: 'Edge 2: Perfect L1-L2, Zero L3-L4',
    type: 'edge',
    company: { name: 'Plateau Inc', industry: 'saas', revenue_range: '50m_250m', employee_count: '201_1000', finance_structure: 'hybrid', change_appetite: 'standardize' },
    answerPattern: 'perfect_l1l2_zero_l3l4',
    description: 'Tests level ceiling messaging'
  },
  {
    name: 'Edge 3: Minimal Answers (5 only)',
    type: 'edge',
    company: { name: 'Sparse Data LLC', industry: 'services', revenue_range: '1m_10m', employee_count: '11_50', finance_structure: 'outsourced', change_appetite: 'maintain' },
    answerPattern: 'minimal_5',
    description: 'Tests low-data quality handling'
  },
  {
    name: 'Edge 4: All Skipped Except Criticals',
    type: 'edge',
    company: { name: 'Critical Only GmbH', industry: 'manufacturing', revenue_range: '250m_1b', employee_count: '1001_5000', finance_structure: 'centralized', change_appetite: 'transform' },
    answerPattern: 'only_criticals',
    description: 'Tests critical-only scoring path'
  },
  {
    name: 'Edge 5: Maximum Score (All C answers)',
    type: 'edge',
    company: { name: 'Champion Enterprises', industry: 'saas', revenue_range: '1b_plus', employee_count: '5000_plus', finance_structure: 'hybrid', change_appetite: 'transform' },
    answerPattern: 'all_c',
    description: 'Tests celebration tonality'
  },
  {
    name: 'Edge 6: Alternating A/C Pattern',
    type: 'edge',
    company: { name: 'Inconsistent Corp', industry: 'retail', revenue_range: '50m_250m', employee_count: '201_1000', finance_structure: 'decentralized', change_appetite: 'standardize' },
    answerPattern: 'alternating_ac',
    description: 'Tests inconsistent maturity messaging'
  },
  {
    name: 'Edge 7: Strong L1, Weak Everything Else',
    type: 'edge',
    company: { name: 'Foundation Only Ltd', industry: 'healthcare', revenue_range: '10m_50m', employee_count: '51_200', finance_structure: 'centralized', change_appetite: 'maintain' },
    answerPattern: 'strong_l1_weak_rest',
    description: 'Tests foundation-focused recommendations'
  },
  {
    name: 'Edge 8: No Company Context',
    type: 'edge',
    company: { name: '', industry: 'other', revenue_range: 'under_1m', employee_count: '1_10', finance_structure: 'outsourced', change_appetite: 'maintain' },
    answerPattern: 'random_mix',
    description: 'Tests minimal context handling'
  },
  {
    name: 'Edge 9: Very Long Company Name',
    type: 'edge',
    company: { name: 'The Extremely Long Named International Financial Services Corporation of North America and European Holdings Group Limited Partnership', industry: 'financial_services', revenue_range: '1b_plus', employee_count: '5000_plus', finance_structure: 'decentralized', change_appetite: 'transform' },
    answerPattern: 'mostly_b',
    description: 'Tests long text handling'
  },
  {
    name: 'Edge 10: L4 Perfect, L1 Failing',
    type: 'edge',
    company: { name: 'Backwards Maturity Inc', industry: 'technology', revenue_range: '250m_1b', employee_count: '1001_5000', finance_structure: 'hybrid', change_appetite: 'transform' },
    answerPattern: 'l4_perfect_l1_fail',
    description: 'Tests inverted maturity pattern'
  },

  // ===== NORMAL CASES (10) =====
  {
    name: 'Normal 1: Typical SMB SaaS',
    type: 'normal',
    company: { name: 'CloudMetrics SaaS', industry: 'saas', revenue_range: '10m_50m', employee_count: '51_200', finance_structure: 'centralized', change_appetite: 'standardize' },
    answerPattern: 'realistic_l2',
    description: 'Typical Level 2 company'
  },
  {
    name: 'Normal 2: Mid-Market Manufacturing',
    type: 'normal',
    company: { name: 'PrecisionParts Manufacturing', industry: 'manufacturing', revenue_range: '50m_250m', employee_count: '201_1000', finance_structure: 'hybrid', change_appetite: 'standardize' },
    answerPattern: 'realistic_l2_l3',
    description: 'Manufacturing at L2-L3 boundary'
  },
  {
    name: 'Normal 3: Growth-Stage Startup',
    type: 'normal',
    company: { name: 'RocketGrowth Technologies', industry: 'saas', revenue_range: '1m_10m', employee_count: '11_50', finance_structure: 'outsourced', change_appetite: 'transform' },
    answerPattern: 'startup_l1',
    description: 'Early stage startup at L1'
  },
  {
    name: 'Normal 4: Enterprise Healthcare',
    type: 'normal',
    company: { name: 'HealthFirst Medical Group', industry: 'healthcare', revenue_range: '250m_1b', employee_count: '1001_5000', finance_structure: 'centralized', change_appetite: 'standardize' },
    answerPattern: 'enterprise_l3',
    description: 'Enterprise at solid L3'
  },
  {
    name: 'Normal 5: Retail Chain',
    type: 'normal',
    company: { name: 'RetailMax Stores', industry: 'retail', revenue_range: '50m_250m', employee_count: '201_1000', finance_structure: 'decentralized', change_appetite: 'maintain' },
    answerPattern: 'realistic_l2',
    description: 'Retail company at L2'
  },
  {
    name: 'Normal 6: Professional Services',
    type: 'normal',
    company: { name: 'Apex Consulting Group', industry: 'services', revenue_range: '10m_50m', employee_count: '51_200', finance_structure: 'hybrid', change_appetite: 'standardize' },
    answerPattern: 'realistic_l2_l3',
    description: 'Consulting firm L2-L3'
  },
  {
    name: 'Normal 7: Financial Services Firm',
    type: 'normal',
    company: { name: 'Sterling Capital Partners', industry: 'financial_services', revenue_range: '50m_250m', employee_count: '51_200', finance_structure: 'centralized', change_appetite: 'transform' },
    answerPattern: 'enterprise_l3',
    description: 'FinServ at L3'
  },
  {
    name: 'Normal 8: Technology Scale-up',
    type: 'normal',
    company: { name: 'DataFlow Analytics', industry: 'technology', revenue_range: '10m_50m', employee_count: '51_200', finance_structure: 'hybrid', change_appetite: 'transform' },
    answerPattern: 'realistic_l2_l3',
    description: 'Tech company scaling up'
  },
  {
    name: 'Normal 9: Large Enterprise',
    type: 'normal',
    company: { name: 'GlobalCorp Industries', industry: 'manufacturing', revenue_range: '1b_plus', employee_count: '5000_plus', finance_structure: 'decentralized', change_appetite: 'standardize' },
    answerPattern: 'enterprise_l3_l4',
    description: 'Large enterprise L3-L4'
  },
  {
    name: 'Normal 10: Mid-Market Services',
    type: 'normal',
    company: { name: 'ServicePro Solutions', industry: 'services', revenue_range: '50m_250m', employee_count: '201_1000', finance_structure: 'hybrid', change_appetite: 'standardize' },
    answerPattern: 'realistic_l2',
    description: 'Services company at L2'
  }
];

// Question IDs by level (from content/questions.json)
// IMPORTANT: These IDs are non-sequential and must match exactly
const QUESTIONS = {
  l1: ['fpa_l1_q01', 'fpa_l1_q02', 'fpa_l1_q03', 'fpa_l1_q04', 'fpa_l1_q05', 'fpa_l1_q06', 'fpa_l1_q07', 'fpa_l1_q08', 'fpa_l1_q09'],
  l2: ['fpa_l2_q01', 'fpa_l2_q02', 'fpa_l2_q03', 'fpa_l2_q04', 'fpa_l2_q05', 'fpa_l2_q06', 'fpa_l2_q07', 'fpa_l2_q08', 'fpa_l2_q09', 'fpa_l2_q10', 'fpa_l2_q11', 'fpa_l2_q12', 'fpa_l2_q13', 'fpa_l2_q50', 'fpa_l2_q51'],
  l3: ['fpa_l3_q01', 'fpa_l3_q02', 'fpa_l3_q03', 'fpa_l3_q04', 'fpa_l3_q05', 'fpa_l3_q07', 'fpa_l3_q08', 'fpa_l3_q09', 'fpa_l3_q11', 'fpa_l3_q12', 'fpa_l3_q13', 'fpa_l3_q14', 'fpa_l3_q15', 'fpa_l3_q30', 'fpa_l3_q31', 'fpa_l3_q32', 'fpa_l3_q50', 'fpa_l3_q51', 'fpa_l3_q52', 'fpa_l3_q53', 'fpa_l3_q54'],
  l4: ['fpa_l4_q01', 'fpa_l4_q02', 'fpa_l4_q03', 'fpa_l4_q04', 'fpa_l4_q05', 'fpa_l4_q06', 'fpa_l4_q07', 'fpa_l4_q08', 'fpa_l4_q09', 'fpa_l4_q10', 'fpa_l4_q43', 'fpa_l4_q44', 'fpa_l4_q45', 'fpa_l4_q50', 'fpa_l4_q51'],
  // Critical questions: L1 (4) + L2 (4) = 8 total
  critical: ['fpa_l1_q01', 'fpa_l1_q02', 'fpa_l1_q05', 'fpa_l1_q09', 'fpa_l2_q01', 'fpa_l2_q02', 'fpa_l2_q06', 'fpa_l2_q07']
};

// Generate answers based on pattern
// IMPORTANT: Questions are BOOLEAN type - true=has capability, false=no capability
function generateAnswers(pattern) {
  const answers = [];
  const allQuestions = [...QUESTIONS.l1, ...QUESTIONS.l2, ...QUESTIONS.l3, ...QUESTIONS.l4];

  switch (pattern) {
    case 'all_a_l1':
      // All false for L1, skip rest (worst case L1)
      QUESTIONS.l1.forEach(q => answers.push({ q, v: false }));
      break;

    case 'perfect_l1l2_zero_l3l4':
      // Perfect L1/L2, no L3/L4
      QUESTIONS.l1.forEach(q => answers.push({ q, v: true }));
      QUESTIONS.l2.forEach(q => answers.push({ q, v: true }));
      // L3/L4 skipped (will be treated as false/0)
      break;

    case 'minimal_5':
      // Just 5 answers (partial responses)
      ['fpa_l1_q01', 'fpa_l1_q03', 'fpa_l2_q01', 'fpa_l2_q05', 'fpa_l3_q01'].forEach(q =>
        answers.push({ q, v: false })
      );
      break;

    case 'only_criticals':
      // Only answer critical questions (mixed results)
      QUESTIONS.critical.forEach((q, i) => answers.push({ q, v: i % 2 === 0 }));
      break;

    case 'all_c':
      // Perfect score - all capabilities present
      allQuestions.forEach(q => answers.push({ q, v: true }));
      break;

    case 'alternating_ac':
      // Alternating pattern
      allQuestions.forEach((q, i) => answers.push({ q, v: i % 2 === 1 }));
      break;

    case 'strong_l1_weak_rest':
      // Strong L1, weak everything else
      QUESTIONS.l1.forEach(q => answers.push({ q, v: true }));
      [...QUESTIONS.l2, ...QUESTIONS.l3, ...QUESTIONS.l4].forEach(q => answers.push({ q, v: false }));
      break;

    case 'random_mix':
      // Random true/false
      allQuestions.forEach(q => {
        answers.push({ q, v: Math.random() > 0.5 });
      });
      break;

    case 'mostly_b':
      // All false (conservative/no capabilities)
      allQuestions.forEach(q => answers.push({ q, v: false }));
      break;

    case 'l4_perfect_l1_fail':
      // Inverted: weak L1, strong L4
      QUESTIONS.l1.forEach(q => answers.push({ q, v: false }));
      QUESTIONS.l2.forEach(q => answers.push({ q, v: false }));
      QUESTIONS.l3.forEach(q => answers.push({ q, v: false }));
      QUESTIONS.l4.forEach(q => answers.push({ q, v: true }));
      break;

    case 'realistic_l2':
      // Strong L1, moderate L2 (some true), weak L3/L4
      QUESTIONS.l1.forEach(q => answers.push({ q, v: true }));
      QUESTIONS.l2.forEach((q, i) => answers.push({ q, v: i < 8 }));
      QUESTIONS.l3.slice(0, 5).forEach(q => answers.push({ q, v: false }));
      break;

    case 'realistic_l2_l3':
      // Progressing through L3
      QUESTIONS.l1.forEach(q => answers.push({ q, v: true }));
      QUESTIONS.l2.forEach(q => answers.push({ q, v: true }));
      QUESTIONS.l3.forEach((q, i) => answers.push({ q, v: i < 10 }));
      QUESTIONS.l4.slice(0, 3).forEach(q => answers.push({ q, v: false }));
      break;

    case 'startup_l1':
      // Early stage startup
      QUESTIONS.l1.forEach((q, i) => answers.push({ q, v: i < 5 }));
      QUESTIONS.l2.slice(0, 3).forEach(q => answers.push({ q, v: false }));
      break;

    case 'enterprise_l3':
      // Enterprise working on L3
      QUESTIONS.l1.forEach(q => answers.push({ q, v: true }));
      QUESTIONS.l2.forEach(q => answers.push({ q, v: true }));
      QUESTIONS.l3.forEach((q, i) => answers.push({ q, v: i < 15 }));
      QUESTIONS.l4.slice(0, 5).forEach(q => answers.push({ q, v: false }));
      break;

    case 'enterprise_l3_l4':
      // Enterprise at L3-L4 transition
      QUESTIONS.l1.forEach(q => answers.push({ q, v: true }));
      QUESTIONS.l2.forEach(q => answers.push({ q, v: true }));
      QUESTIONS.l3.forEach(q => answers.push({ q, v: true }));
      QUESTIONS.l4.forEach((q, i) => answers.push({ q, v: i < 8 }));
      break;

    default:
      // Default: all false (conservative)
      allQuestions.forEach(q => answers.push({ q, v: false }));
  }

  return answers;
}

// Create a single test run
async function createTestRun(testCase, index) {
  const prefix = testCase.type === 'edge' ? 'E' : 'N';
  console.log(`\n[${prefix}${index + 1}] ${testCase.name}`);
  console.log(`    ${testCase.description}`);

  try {
    // 1. Create run
    const createRes = await fetch(API + '/diagnostic-runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + TOKEN
      }
    });

    if (!createRes.ok) {
      console.log('    FAILED: Could not create run');
      return null;
    }

    const run = await createRes.json();
    console.log(`    Run ID: ${run.id}`);

    // 2. Setup context
    const setupRes = await fetch(API + '/diagnostic-runs/' + run.id + '/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + TOKEN
      },
      body: JSON.stringify({
        company: testCase.company,
        pillar: {
          ftes: 5,
          systems: ['excel', 'powerbi'],
          complexity: { business_units: 3, currencies: 2, legal_entities: 4 },
          pain_points: ['long_cycles', 'lack_insights']
        }
      })
    });

    if (!setupRes.ok) {
      const errText = await setupRes.text();
      console.log('    FAILED: Setup failed -', setupRes.status, errText.slice(0, 300));
      return null;
    }

    // 3. Submit answers
    const answers = generateAnswers(testCase.answerPattern);
    console.log(`    Submitting ${answers.length} answers...`);

    for (const ans of answers) {
      await fetch(API + '/diagnostic-inputs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + TOKEN
        },
        body: JSON.stringify({
          run_id: run.id,
          question_id: ans.q,
          value: ans.v
        })
      });
    }

    // 4. Complete run
    const completeRes = await fetch(API + '/diagnostic-runs/' + run.id + '/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + TOKEN
      }
    });

    if (!completeRes.ok) {
      console.log('    FAILED: Complete failed');
      return null;
    }

    // 5. Start interpretation
    console.log('    Starting VS-32 interpretation...');
    const startRes = await fetch(API + '/diagnostic-runs/' + run.id + '/interpret/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + TOKEN
      }
    });

    if (!startRes.ok) {
      console.log('    FAILED: Interpretation start failed');
      return { id: run.id, name: testCase.name, type: testCase.type, interpreted: false };
    }

    const startData = await startRes.json();
    console.log(`    Session: ${startData.session_id}`);

    // 6. Poll for completion (max 2 minutes)
    let status = startData.status;
    let attempts = 0;
    const maxAttempts = 40; // 40 x 3s = 120s

    while (!['completed', 'complete', 'failed', 'force_finalized'].includes(status) && attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 3000));
      attempts++;

      const pollRes = await fetch(API + '/diagnostic-runs/' + run.id + '/interpret/status', {
        headers: { 'Authorization': 'Bearer ' + TOKEN }
      });

      const pollData = await pollRes.json();
      status = pollData.status;
      process.stdout.write('.');
    }

    console.log('');

    // 7. Get interpretation report
    const reportRes = await fetch(API + '/diagnostic-runs/' + run.id + '/interpret/report', {
      headers: { 'Authorization': 'Bearer ' + TOKEN }
    });

    if (reportRes.ok) {
      const report = await reportRes.json();
      const hasOverview = !!report.report?.overview;
      console.log(`    Quality: ${report.quality_status || 'N/A'}`);
      console.log(`    Rounds: ${report.rounds_used || 0}`);
      console.log(`    VS-32 Format: ${hasOverview ? 'YES' : 'NO (legacy)'}`);

      return {
        id: run.id,
        name: testCase.name,
        type: testCase.type,
        interpreted: true,
        quality: report.quality_status,
        hasVS32Format: hasOverview,
        url: `https://cfodiagnosisv1.vercel.app/report/${run.id}`
      };
    }

    return { id: run.id, name: testCase.name, type: testCase.type, interpreted: false };

  } catch (err) {
    console.log(`    ERROR: ${err.message}`);
    return null;
  }
}

// Main execution
async function main() {
  console.log('='.repeat(60));
  console.log('VS-32 Test Run Generator');
  console.log('Creating 20 test runs (10 edge + 10 normal)');
  console.log('='.repeat(60));

  const results = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const result = await createTestRun(TEST_CASES[i], i);
    if (result) {
      results.push(result);
    }

    // Small delay between runs
    await new Promise(r => setTimeout(r, 1000));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  const edgeCases = results.filter(r => r.type === 'edge');
  const normalCases = results.filter(r => r.type === 'normal');
  const interpreted = results.filter(r => r.interpreted);
  const vs32Format = results.filter(r => r.hasVS32Format);

  console.log(`\nTotal Created: ${results.length}/20`);
  console.log(`Edge Cases: ${edgeCases.length}/10`);
  console.log(`Normal Cases: ${normalCases.length}/10`);
  console.log(`Interpreted: ${interpreted.length}`);
  console.log(`VS-32 Format: ${vs32Format.length}`);

  console.log('\n--- EDGE CASES ---');
  edgeCases.forEach(r => {
    console.log(`${r.hasVS32Format ? 'OK' : 'XX'} ${r.name}`);
    console.log(`   ${r.url}`);
  });

  console.log('\n--- NORMAL CASES ---');
  normalCases.forEach(r => {
    console.log(`${r.hasVS32Format ? 'OK' : 'XX'} ${r.name}`);
    console.log(`   ${r.url}`);
  });

  console.log('\n--- ALL URLS ---');
  results.forEach(r => console.log(r.url));
}

main().catch(console.error);
