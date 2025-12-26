// Create a diagnostic run with mid-level execution score for design review
const API = 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;

// L1 questions (9) - answer YES to all for passing gates
const L1_QUESTIONS = [
  'fpa_l1_q01', 'fpa_l1_q02', 'fpa_l1_q03', 'fpa_l1_q04', 'fpa_l1_q05',
  'fpa_l1_q06', 'fpa_l1_q07', 'fpa_l1_q08', 'fpa_l1_q09'
];

// L2 questions (15) - answer YES to about half
const L2_QUESTIONS_YES = [
  'fpa_l2_q01', 'fpa_l2_q02', 'fpa_l2_q03', 'fpa_l2_q04', 'fpa_l2_q05',
  'fpa_l2_q06', 'fpa_l2_q07', 'fpa_l2_q08'
];
const L2_QUESTIONS_NO = [
  'fpa_l2_q09', 'fpa_l2_q10', 'fpa_l2_q11', 'fpa_l2_q12', 'fpa_l2_q13',
  'fpa_l2_q50', 'fpa_l2_q51'
];

// L3 questions (21) - answer YES to some, NO to most
const L3_QUESTIONS_YES = [
  'fpa_l3_q01', 'fpa_l3_q02', 'fpa_l3_q03', 'fpa_l3_q04', 'fpa_l3_q05'
];
const L3_QUESTIONS_NO = [
  'fpa_l3_q07', 'fpa_l3_q08', 'fpa_l3_q09', 'fpa_l3_q11', 'fpa_l3_q12',
  'fpa_l3_q13', 'fpa_l3_q14', 'fpa_l3_q15', 'fpa_l3_q30', 'fpa_l3_q31',
  'fpa_l3_q32', 'fpa_l3_q50', 'fpa_l3_q51', 'fpa_l3_q52', 'fpa_l3_q53', 'fpa_l3_q54'
];

// L4 questions (15) - answer NO to all
const L4_QUESTIONS_NO = [
  'fpa_l4_q01', 'fpa_l4_q02', 'fpa_l4_q03', 'fpa_l4_q04', 'fpa_l4_q05',
  'fpa_l4_q06', 'fpa_l4_q07', 'fpa_l4_q08', 'fpa_l4_q09', 'fpa_l4_q10',
  'fpa_l4_q43', 'fpa_l4_q44', 'fpa_l4_q45', 'fpa_l4_q50', 'fpa_l4_q51'
];

async function createMidLevelReport() {
  console.log('=== Creating Mid-Level Execution Score Report ===\n');

  // Step 1: Create a new run
  console.log('1. Creating new diagnostic run...');
  const createRes = await fetch(API + '/diagnostic-runs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + TOKEN
    }
  });

  if (!createRes.ok) {
    console.log('   FAILED:', await createRes.text());
    return;
  }

  const run = await createRes.json();
  console.log('   Run ID:', run.id);

  // Step 2: Save setup context
  console.log('\n2. Saving company context...');
  const setupRes = await fetch(API + '/diagnostic-runs/' + run.id + '/setup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + TOKEN
    },
    body: JSON.stringify({
      company: {
        name: 'Acme Manufacturing Co.',
        industry: 'manufacturing',
        revenue_range: '50m_250m',
        employee_count: '201_1000',
        finance_structure: 'hybrid',
        change_appetite: 'standardize'
      },
      pillar: {
        ftes: 6,
        systems: ['excel', 'powerbi', 'netsuite'],
        complexity: { business_units: 4, currencies: 2, legal_entities: 3 },
        pain_points: ['long_cycles', 'lack_insights', 'manual_work']
      }
    })
  });

  if (!setupRes.ok) {
    console.log('   Setup failed:', await setupRes.text());
  } else {
    console.log('   Setup saved OK');
  }

  // Step 3: Submit answers
  console.log('\n3. Submitting MCQ answers...');

  // Helper function
  async function saveAnswer(questionId, answer) {
    const res = await fetch(API + '/diagnostic-inputs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + TOKEN
      },
      body: JSON.stringify({
        run_id: run.id,
        question_id: questionId,
        answer_option_id: answer,
        skipped: false
      })
    });
    return res.ok;
  }

  // Answer L1 questions (all YES)
  console.log('   L1 questions (all YES)...');
  for (const qId of L1_QUESTIONS) {
    await saveAnswer(qId, 'yes');
  }
  console.log('   L1: 9/9 answered YES');

  // Answer L2 questions (mixed)
  console.log('   L2 questions (mixed)...');
  for (const qId of L2_QUESTIONS_YES) {
    await saveAnswer(qId, 'yes');
  }
  for (const qId of L2_QUESTIONS_NO) {
    await saveAnswer(qId, 'no');
  }
  console.log('   L2: 8 YES, 7 NO');

  // Answer L3 questions (mostly NO)
  console.log('   L3 questions (mostly NO)...');
  for (const qId of L3_QUESTIONS_YES) {
    await saveAnswer(qId, 'yes');
  }
  for (const qId of L3_QUESTIONS_NO) {
    await saveAnswer(qId, 'no');
  }
  console.log('   L3: 5 YES, 16 NO');

  // Answer L4 questions (all NO)
  console.log('   L4 questions (all NO)...');
  for (const qId of L4_QUESTIONS_NO) {
    await saveAnswer(qId, 'no');
  }
  console.log('   L4: 0 YES, 15 NO');

  // Step 4: Complete the run
  console.log('\n4. Completing the run...');
  const completeRes = await fetch(API + '/diagnostic-runs/' + run.id + '/complete', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + TOKEN }
  });

  if (!completeRes.ok) {
    console.log('   Complete failed:', await completeRes.text());
  } else {
    console.log('   Run marked complete');
  }

  // Step 5: Score the run
  console.log('\n5. Calculating scores...');
  const scoreRes = await fetch(API + '/diagnostic-runs/' + run.id + '/score', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + TOKEN }
  });

  if (!scoreRes.ok) {
    console.log('   Score failed:', await scoreRes.text());
  } else {
    const scoreData = await scoreRes.json();
    console.log('   Overall Score:', scoreData.overall_score || 'N/A');
    console.log('   Maturity Level:', scoreData.maturity?.achieved_level || 'N/A');
  }

  // Step 6: Get report to verify
  console.log('\n6. Verifying report...');
  const reportRes = await fetch(API + '/diagnostic-runs/' + run.id + '/report', {
    headers: { 'Authorization': 'Bearer ' + TOKEN }
  });

  if (reportRes.ok) {
    const report = await reportRes.json();
    console.log('   Report Generated:');
    console.log('   - Overall Score:', report.overall_score);
    console.log('   - Maturity Level:', report.maturity?.achieved_level);
    console.log('   - Level Name:', report.maturity?.level_name);
  }

  // Output URLs
  console.log('\n=== REPORT READY ===');
  console.log('Open this URL in your browser:\n');
  console.log('https://cfodiagnosisv1.vercel.app/report/' + run.id);
  console.log('\n(Make sure you are logged in with the same account)');
}

createMidLevelReport().catch(console.error);
