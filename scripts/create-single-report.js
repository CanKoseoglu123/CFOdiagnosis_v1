// Create a single diagnostic run with mid-level score for design review
// Usage: AUTH_TOKEN="your-token" node scripts/create-single-report.js

const API = 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;

if (!TOKEN) {
  console.error('AUTH_TOKEN environment variable required');
  process.exit(1);
}

// Load questions
const fs = require('fs');
const path = require('path');
const questions = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'content', 'questions.json'), 'utf8')
).questions;

const L1 = questions.filter(q => q.maturity_level === 1).map(q => q.id);
const L2 = questions.filter(q => q.maturity_level === 2).map(q => q.id);
const L3 = questions.filter(q => q.maturity_level === 3).map(q => q.id);
const L4 = questions.filter(q => q.maturity_level === 4).map(q => q.id);
const ALL = questions.map(q => q.id);

// Mid-level pattern: L1 + L2 Yes, L3 + L4 No
const YES_QUESTIONS = [...L1, ...L2];

async function createMidLevelReport() {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`
  };

  console.log('=== Creating Mid-Level Report for Design Review ===\n');
  console.log('Questions loaded:', questions.length);
  console.log('L1:', L1.length, '| L2:', L2.length, '| L3:', L3.length, '| L4:', L4.length);
  console.log('Will answer YES to:', YES_QUESTIONS.length, '| NO to:', ALL.length - YES_QUESTIONS.length);
  console.log('');

  // 1. Create run
  console.log('1. Creating diagnostic run...');
  const createRes = await fetch(`${API}/diagnostic-runs`, {
    method: 'POST',
    headers
  });

  if (!createRes.ok) {
    console.error('   Failed:', await createRes.text());
    return;
  }

  const run = await createRes.json();
  console.log('   Run ID:', run.id);

  // 2. Save context
  console.log('\n2. Saving company context...');
  const company = {
    name: 'Acme Manufacturing Corp',
    industry: 'manufacturing',
    revenue_range: '50m_250m',
    employee_count: '201_1000',
    finance_structure: 'hybrid',
    ownership_structure: 'pe_backed',
    change_appetite: 'standardize'
  };

  const pillar = {
    tools: ['excel', 'powerbi'],
    team_size: '4_10',
    forecast_frequency: 'monthly',
    budget_process: ['hybrid'],
    pain_points: ['long_cycles', 'lack_insights']
  };

  const setupRes = await fetch(`${API}/diagnostic-runs/${run.id}/setup`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ company, pillar })
  });

  if (!setupRes.ok) {
    console.error('   Setup failed:', await setupRes.text());
  } else {
    console.log('   Context saved OK');
  }

  // 3. Submit answers
  console.log('\n3. Submitting answers...');
  let saved = 0;
  for (const questionId of ALL) {
    const value = YES_QUESTIONS.includes(questionId);

    const inputRes = await fetch(`${API}/diagnostic-inputs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        run_id: run.id,
        question_id: questionId,
        value
      })
    });

    if (inputRes.ok) {
      saved++;
    } else {
      console.error(`   Failed to save ${questionId}:`, await inputRes.text());
    }
  }
  console.log(`   Saved ${saved}/${ALL.length} answers`);

  // 4. Complete run
  console.log('\n4. Completing run...');
  const completeRes = await fetch(`${API}/diagnostic-runs/${run.id}/complete`, {
    method: 'POST',
    headers
  });

  if (!completeRes.ok) {
    console.error('   Complete failed:', await completeRes.text());
    return;
  }
  console.log('   Run completed');

  // 5. Calculate scores
  console.log('\n5. Calculating scores...');
  const scoreRes = await fetch(`${API}/diagnostic-runs/${run.id}/score`, {
    method: 'POST',
    headers
  });

  // 6. Get report
  console.log('\n6. Fetching report...');
  const reportRes = await fetch(`${API}/diagnostic-runs/${run.id}/report`, {
    headers
  });

  if (!reportRes.ok) {
    console.error('   Report failed:', await reportRes.text());
    return;
  }

  const report = await reportRes.json();
  console.log('   Overall Score:', Math.round((report.overall_score || 0) * 100) + '%');
  console.log('   Maturity Level:', report.maturity?.achieved_level || 'N/A');
  console.log('   Level Name:', report.maturity?.level_name || 'N/A');

  // Output URL
  console.log('\n===========================================');
  console.log('REPORT READY! Open in browser:');
  console.log('');
  console.log(`https://cfodiagnosisv1.vercel.app/report/${run.id}`);
  console.log('');
  console.log('===========================================');
}

createMidLevelReport().catch(console.error);
