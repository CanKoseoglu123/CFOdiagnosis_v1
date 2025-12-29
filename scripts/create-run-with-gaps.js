/**
 * VS-32d: Create a test run WITH gaps (false answers) for action planning
 */

const API = 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;

// All 60 question IDs from spec v2.9.0 (extracted from questions.json)
const L1_QUESTIONS = [
  'fpa_l1_q01', 'fpa_l1_q02', 'fpa_l1_q03', 'fpa_l1_q04', 'fpa_l1_q05',
  'fpa_l1_q07', 'fpa_l1_q06', 'fpa_l1_q08', 'fpa_l1_q09'
];
const L2_QUESTIONS = [
  'fpa_l2_q12', 'fpa_l2_q50', 'fpa_l2_q13', 'fpa_l2_q51', 'fpa_l2_q04',
  'fpa_l2_q01', 'fpa_l2_q05', 'fpa_l2_q02', 'fpa_l2_q03', 'fpa_l2_q10',
  'fpa_l2_q07', 'fpa_l2_q08', 'fpa_l2_q06', 'fpa_l2_q09', 'fpa_l2_q11'
];
const L3_QUESTIONS = [
  'fpa_l3_q11', 'fpa_l3_q08', 'fpa_l3_q14', 'fpa_l3_q50', 'fpa_l3_q09',
  'fpa_l3_q51', 'fpa_l3_q15', 'fpa_l3_q30', 'fpa_l3_q52', 'fpa_l3_q32',
  'fpa_l3_q31', 'fpa_l3_q01', 'fpa_l3_q02', 'fpa_l3_q03', 'fpa_l3_q05',
  'fpa_l3_q04', 'fpa_l3_q53', 'fpa_l3_q54', 'fpa_l3_q13', 'fpa_l3_q12',
  'fpa_l3_q07'
];
const L4_QUESTIONS = [
  'fpa_l4_q10', 'fpa_l4_q09', 'fpa_l4_q45', 'fpa_l4_q08', 'fpa_l4_q04',
  'fpa_l4_q44', 'fpa_l4_q01', 'fpa_l4_q05', 'fpa_l4_q43', 'fpa_l4_q50',
  'fpa_l4_q02', 'fpa_l4_q03', 'fpa_l4_q06', 'fpa_l4_q07', 'fpa_l4_q51'
];

async function createRunWithGaps() {
  console.log('=== Creating Test Run WITH Gaps ===\n');

  // Step 1: Create run
  console.log('1. Creating run...');
  const createRes = await fetch(API + '/diagnostic-runs', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + TOKEN,
      'Content-Type': 'application/json'
    }
  });

  if (!createRes.ok) {
    console.log('   Error:', await createRes.text());
    return;
  }

  const run = await createRes.json();
  console.log('   Run ID:', run.id);

  // Step 2: Setup context
  console.log('\n2. Setting up context...');
  const setupRes = await fetch(API + '/diagnostic-runs/' + run.id + '/setup', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      company: {
        name: 'VS-32d Gap Test Corp',
        industry: 'saas',
        revenue_range: '50m_250m',
        employee_count: '201_1000',
        finance_structure: 'hybrid',
        change_appetite: 'transform'
      },
      pillar: {
        ftes: 8,
        systems: ['excel', 'powerbi', 'adaptive'],
        complexity: { business_units: 5, currencies: 3, legal_entities: 8 },
        pain_points: ['long_cycles', 'lack_insights', 'disconnected_tools']
      }
    })
  });
  console.log('   Setup:', setupRes.ok ? 'OK' : 'FAILED');

  // Step 3: Add inputs - mix of true/false to create gaps
  console.log('\n3. Adding inputs (with gaps)...');

  // Pattern: L1 mostly true (pass gates), L2 mix, L3 mostly false, L4 all false
  const answers = [
    // L1 - all true to pass critical gates (9 questions)
    ...L1_QUESTIONS.map(q => ({ question_id: q, value: true })),

    // L2 - mix: first 10 true, last 5 false (gaps) (15 questions)
    ...L2_QUESTIONS.slice(0, 10).map(q => ({ question_id: q, value: true })),
    ...L2_QUESTIONS.slice(10).map(q => ({ question_id: q, value: false })),

    // L3 - mostly false: first 5 true, rest false (21 questions)
    ...L3_QUESTIONS.slice(0, 5).map(q => ({ question_id: q, value: true })),
    ...L3_QUESTIONS.slice(5).map(q => ({ question_id: q, value: false })),

    // L4 - all false (15 questions)
    ...L4_QUESTIONS.map(q => ({ question_id: q, value: false }))
  ];

  console.log('   Total answers:', answers.length);
  console.log('   True (Yes):', answers.filter(a => a.value === true).length);
  console.log('   False (No/Gaps):', answers.filter(a => a.value === false).length);

  let savedCount = 0;
  for (const ans of answers) {
    const res = await fetch(API + '/diagnostic-inputs', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        run_id: run.id,
        question_id: ans.question_id,
        value: ans.value
      })
    });
    if (res.ok) savedCount++;
  }
  console.log('   Saved:', savedCount + '/' + answers.length);

  // Step 4: Complete run
  console.log('\n4. Completing run...');
  const completeRes = await fetch(API + '/diagnostic-runs/' + run.id + '/complete', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + TOKEN,
      'Content-Type': 'application/json'
    }
  });

  if (!completeRes.ok) {
    const errText = await completeRes.text();
    console.log('   Complete error:', errText);
    return;
  }

  console.log('   Complete:', completeRes.ok ? 'OK' : 'FAILED');

  // Step 5: Score the run
  console.log('\n5. Scoring run...');
  const scoreRes = await fetch(API + '/diagnostic-runs/' + run.id + '/score', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + TOKEN,
      'Content-Type': 'application/json'
    }
  });

  if (scoreRes.ok) {
    const scores = await scoreRes.json();
    console.log('   Overall score:', scores.overall_score);
    console.log('   Maturity level:', scores.maturity_level);
  }

  console.log('\n=== Run Created Successfully ===');
  console.log('Run ID:', run.id);
  console.log('\nTo test action planning, run:');
  console.log('RUN_ID=' + run.id + ' AUTH_TOKEN=$AUTH_TOKEN node scripts/test-vs32d-with-gaps.js');
}

createRunWithGaps().catch(e => console.error('Error:', e.message));
