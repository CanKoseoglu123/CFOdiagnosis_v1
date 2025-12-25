// Generate 20 test reports with various answer patterns
// Usage: AUTH_TOKEN="your-token" node scripts/generate-test-reports.js

const API = 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;

if (!TOKEN) {
  console.error('AUTH_TOKEN environment variable required');
  process.exit(1);
}

// Load questions to know IDs
const fs = require('fs');
const path = require('path');
const questions = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'content', 'questions.json'), 'utf8')
).questions;

// Question IDs by level
const L1_QUESTIONS = questions.filter(q => q.maturity_level === 1).map(q => q.id);
const L2_QUESTIONS = questions.filter(q => q.maturity_level === 2).map(q => q.id);
const L3_QUESTIONS = questions.filter(q => q.maturity_level === 3).map(q => q.id);
const L4_QUESTIONS = questions.filter(q => q.maturity_level === 4).map(q => q.id);
const CRITICAL_QUESTIONS = questions.filter(q => q.is_critical).map(q => q.id);
const ALL_QUESTIONS = questions.map(q => q.id);

// Test case definitions
const TEST_CASES = [
  // Maturity Level Cases
  { name: 'Level 4 Champion', description: 'All Yes - Maximum maturity', pattern: { yes: ALL_QUESTIONS } },
  { name: 'Level 1 Emerging', description: 'All No - Minimum maturity', pattern: { yes: [] } },
  { name: 'Level 2 Foundation', description: 'L1 Yes, rest No', pattern: { yes: L1_QUESTIONS } },
  { name: 'Level 3 Developing', description: 'L1+L2 Yes, rest No', pattern: { yes: [...L1_QUESTIONS, ...L2_QUESTIONS] } },
  { name: 'Level 3 Strong', description: 'L1+L2+L3 Yes, L4 No', pattern: { yes: [...L1_QUESTIONS, ...L2_QUESTIONS, ...L3_QUESTIONS] } },

  // Critical Question Cases
  { name: 'Critical Miss All', description: 'Only critical questions failed', pattern: { yes: ALL_QUESTIONS.filter(q => !CRITICAL_QUESTIONS.includes(q)) } },
  { name: 'Critical Pass All', description: 'Only critical questions passed', pattern: { yes: CRITICAL_QUESTIONS } },
  { name: 'Critical L1 Miss', description: 'L1 criticals failed, rest passed', pattern: { yes: ALL_QUESTIONS.filter(q => !questions.find(qn => qn.id === q && qn.maturity_level === 1 && qn.is_critical)) } },
  { name: 'Critical L2 Miss', description: 'L2 criticals failed, rest passed', pattern: { yes: ALL_QUESTIONS.filter(q => !questions.find(qn => qn.id === q && qn.maturity_level === 2 && qn.is_critical)) } },

  // Industry-Specific Cases
  { name: 'SaaS Company', description: 'SaaS industry, mixed answers', industry: 'saas', pattern: { yes: [...L1_QUESTIONS, ...L2_QUESTIONS.slice(0, 7)] } },
  { name: 'Manufacturing Firm', description: 'Manufacturing, L1-L2 strong', industry: 'manufacturing', pattern: { yes: [...L1_QUESTIONS, ...L2_QUESTIONS] } },
  { name: 'Retail Chain', description: 'Retail, emerging stage', industry: 'retail', pattern: { yes: L1_QUESTIONS.slice(0, 5) } },
  { name: 'Professional Services', description: 'Services, mature finance', industry: 'services', pattern: { yes: [...L1_QUESTIONS, ...L2_QUESTIONS, ...L3_QUESTIONS.slice(0, 10)] } },
  { name: 'Fintech Startup', description: 'Fintech, advanced analytics', industry: 'fintech', pattern: { yes: [...L1_QUESTIONS, ...L2_QUESTIONS, ...L3_QUESTIONS, ...L4_QUESTIONS.slice(0, 5)] } },

  // Size-Based Cases
  { name: 'Small Company', description: 'Under $10M revenue, basic', revenue: 'under_10m', pattern: { yes: L1_QUESTIONS.slice(0, 6) } },
  { name: 'Mid-Market', description: '$50M-$250M, developing', revenue: '50m_250m', pattern: { yes: [...L1_QUESTIONS, ...L2_QUESTIONS.slice(0, 8)] } },
  { name: 'Enterprise', description: 'Over $250M, mature', revenue: 'over_250m', pattern: { yes: [...L1_QUESTIONS, ...L2_QUESTIONS, ...L3_QUESTIONS] } },

  // Edge Cases
  { name: 'Random 50%', description: '50% random answers', pattern: { yes: ALL_QUESTIONS.filter(() => Math.random() > 0.5) } },
  { name: 'Alternating', description: 'Every other question Yes', pattern: { yes: ALL_QUESTIONS.filter((_, i) => i % 2 === 0) } },
  // Note: Partial completion test removed - API requires all 48 questions
];

async function createTestRun(testCase, index) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`
  };

  try {
    // 1. Create diagnostic run
    const createRes = await fetch(`${API}/diagnostic-runs`, {
      method: 'POST',
      headers
    });

    if (!createRes.ok) {
      throw new Error(`Create failed: ${await createRes.text()}`);
    }

    const run = await createRes.json();
    console.log(`[${index + 1}/${TEST_CASES.length}] Created run ${run.id} for "${testCase.name}"`);

    // 2. Save context
    const company = {
      name: `Test ${index + 1}: ${testCase.name}`,
      industry: testCase.industry || 'saas',
      revenue_range: testCase.revenue || '50m_250m',
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
      throw new Error(`Setup failed: ${await setupRes.text()}`);
    }

    // 3. Submit answers
    // API expects: { run_id, question_id, value } where value is boolean (true/false)
    const answeredQuestions = testCase.pattern.answered || ALL_QUESTIONS;
    const yesQuestions = testCase.pattern.yes || [];

    for (const questionId of answeredQuestions) {
      const value = yesQuestions.includes(questionId) ? true : false;

      const inputRes = await fetch(`${API}/diagnostic-inputs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          run_id: run.id,
          question_id: questionId,
          value
        })
      });

      if (!inputRes.ok) {
        throw new Error(`Failed to save answer for ${questionId}: ${await inputRes.text()}`);
      }
    }

    // 4. Complete the run
    const completeRes = await fetch(`${API}/diagnostic-runs/${run.id}/complete`, {
      method: 'POST',
      headers
    });

    if (!completeRes.ok) {
      throw new Error(`Complete failed: ${await completeRes.text()}`);
    }

    // 5. Calculate scores (ignore "already exists" error)
    const scoreRes = await fetch(`${API}/diagnostic-runs/${run.id}/score`, {
      method: 'POST',
      headers
    });
    // Don't check scoreRes.ok - it may error if scores already exist

    // 6. Fetch the report (which has the calculated scores)
    const reportRes = await fetch(`${API}/diagnostic-runs/${run.id}/report`, {
      headers
    });

    if (!reportRes.ok) {
      throw new Error(`Report failed: ${await reportRes.text()}`);
    }

    const reportData = await reportRes.json();

    // API returns: overall_score (0-1 scale), maturity.achieved_level
    return {
      runId: run.id,
      name: testCase.name,
      description: testCase.description,
      overallScore: Math.round((reportData.overall_score || 0) * 100),
      maturityLevel: reportData.maturity?.achieved_level || 1,
      url: `https://cfodiagnosisv1.vercel.app/report/${run.id}`
    };
  } catch (err) {
    console.error(`   Failed: ${err.message}`);
    return { name: testCase.name, error: err.message };
  }
}

async function main() {
  console.log(`=== Generating ${TEST_CASES.length} Test Reports ===\n`);
  console.log('Using API:', API);
  console.log('Questions loaded:', questions.length);
  console.log('');

  const results = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const result = await createTestRun(TEST_CASES[i], i);
    results.push(result);

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n=== Test Reports Created ===\n');

  // Summary table
  console.log('| # | Name | Score | Level | URL |');
  console.log('|---|------|-------|-------|-----|');

  results.forEach((r, i) => {
    if (r.error) {
      console.log(`| ${i + 1} | ${r.name} | ERROR | - | ${r.error} |`);
    } else {
      console.log(`| ${i + 1} | ${r.name} | ${r.overallScore}% | L${r.maturityLevel} | ${r.url} |`);
    }
  });

  // Save to file
  const outputPath = path.join(__dirname, '..', 'test-reports.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);
}

main().catch(console.error);
