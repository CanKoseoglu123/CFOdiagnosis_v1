// Create 20 test cases: 12 edge cases + 8 normal companies
// Usage: AUTH_TOKEN="your-token" node scripts/create-test-cases.js

const API = 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;

if (!TOKEN) {
  console.error('AUTH_TOKEN environment variable required');
  process.exit(1);
}

const fs = require('fs');
const path = require('path');
const contentDir = path.join(__dirname, '..', 'content');
const questionFiles = [
  'questions-foundation.json',
  'questions-future.json',
  'questions-intelligence.json'
];
const questions = [];
for (const fileName of questionFiles) {
  const fileData = JSON.parse(fs.readFileSync(path.join(contentDir, fileName), 'utf8'));
  questions.push(...fileData.questions);
}

const L1 = questions.filter(q => q.maturity_level === 1).map(q => q.id);
const L2 = questions.filter(q => q.maturity_level === 2).map(q => q.id);
const L3 = questions.filter(q => q.maturity_level === 3).map(q => q.id);
const L4 = questions.filter(q => q.maturity_level === 4).map(q => q.id);
const CRITICAL = questions.filter(q => q.is_critical).map(q => q.id);
const ALL = questions.map(q => q.id);

// Test case definitions
const TEST_CASES = [
  // === 12 EDGE CASES ===
  {
    name: 'Edge: Tiny Startup - All No',
    type: 'edge',
    company: {
      name: 'TinyTech Startup',
      industry: 'saas',
      revenue_range: 'under_50m',
      employee_count: '1_50',
      finance_ftes: '1_10',
      legal_entities: '1_3',
      finance_structure: 'centralized',
      ownership_structure: 'family_owned',
      change_appetite: 'optimize'
    },
    pillar: {
      tools: ['excel'],
      team_size: '1_3',
      forecast_frequency: 'annual',
      budget_process: ['top_down'],
      pain_points: ['data_wrangling', 'bandwidth']
    },
    yesQuestions: [] // All No
  },
  {
    name: 'Edge: Enterprise Champion - All Yes',
    type: 'edge',
    company: {
      name: 'Global Enterprise Corp',
      industry: 'manufacturing',
      revenue_range: 'over_500m',
      employee_count: 'over_1000',
      finance_ftes: 'over_50',
      legal_entities: 'over_25',
      finance_structure: 'hybrid',
      ownership_structure: 'listed',
      change_appetite: 'transform'
    },
    pillar: {
      tools: ['anaplan', 'powerbi', 'tableau'],
      team_size: 'over_50',
      forecast_frequency: 'rolling',
      budget_process: ['hybrid', 'driver_based'],
      pain_points: []
    },
    yesQuestions: ALL // All Yes
  },
  {
    name: 'Edge: Critical Failures Only',
    type: 'edge',
    company: {
      name: 'Risk Corp Ltd',
      industry: 'fintech',
      revenue_range: '100m_250m',
      employee_count: '201_1000',
      finance_ftes: '21_35',
      legal_entities: '4_10',
      finance_structure: 'decentralized',
      ownership_structure: 'pe_backed',
      change_appetite: 'standardize'
    },
    pillar: {
      tools: ['excel', 'datarails'],
      team_size: '4_10',
      forecast_frequency: 'quarterly',
      budget_process: ['bottom_up'],
      pain_points: ['forecast_accuracy', 'tech_fragmentation']
    },
    yesQuestions: ALL.filter(q => !CRITICAL.includes(q)) // Fail all critical
  },
  {
    name: 'Edge: L1 Only Pass',
    type: 'edge',
    company: {
      name: 'Emerging Finance Co',
      industry: 'retail',
      revenue_range: '50m_100m',
      employee_count: '51_200',
      finance_ftes: '1_10',
      legal_entities: '1_3',
      finance_structure: 'centralized',
      ownership_structure: 'family_owned',
      change_appetite: 'optimize'
    },
    pillar: {
      tools: ['excel'],
      team_size: '1_3',
      forecast_frequency: 'quarterly',
      budget_process: ['top_down'],
      pain_points: ['data_wrangling', 'budget_cycle']
    },
    yesQuestions: L1 // Only L1 Yes
  },
  {
    name: 'Edge: L1+L2 Border',
    type: 'edge',
    company: {
      name: 'Border Case Inc',
      industry: 'services',
      revenue_range: '50m_100m',
      employee_count: '51_200',
      finance_ftes: '10_20',
      legal_entities: '4_10',
      finance_structure: 'centralized',
      ownership_structure: 'corporate_subsidiary',
      change_appetite: 'standardize'
    },
    pillar: {
      tools: ['excel', 'powerbi'],
      team_size: '4_10',
      forecast_frequency: 'monthly',
      budget_process: ['hybrid'],
      pain_points: ['partner_engagement']
    },
    yesQuestions: [...L1, ...L2.slice(0, Math.floor(L2.length / 2))] // L1 + half L2
  },
  {
    name: 'Edge: PE Transform Pressure',
    type: 'edge',
    company: {
      name: 'PE Portfolio Alpha',
      industry: 'consumer_goods',
      revenue_range: '100m_250m',
      employee_count: '201_1000',
      finance_ftes: '21_35',
      legal_entities: '11_25',
      finance_structure: 'hybrid',
      ownership_structure: 'pe_backed',
      change_appetite: 'transform'
    },
    pillar: {
      tools: ['vena', 'powerbi'],
      team_size: '11_25',
      forecast_frequency: 'monthly',
      budget_process: ['hybrid', 'driver_based'],
      pain_points: ['forecast_accuracy', 'scenario_planning', 'realtime_visibility']
    },
    yesQuestions: [...L1, ...L2, ...L3.slice(0, 5)] // L1+L2 + some L3
  },
  {
    name: 'Edge: Decentralized Chaos',
    type: 'edge',
    company: {
      name: 'Fragmented Holdings',
      industry: 'media',
      revenue_range: 'over_500m',
      employee_count: 'over_1000',
      finance_ftes: 'over_50',
      legal_entities: 'over_25',
      finance_structure: 'decentralized',
      ownership_structure: 'corporate_subsidiary',
      change_appetite: 'optimize'
    },
    pillar: {
      tools: ['excel', 'adaptive', 'tableau'],
      team_size: '26_50',
      forecast_frequency: 'quarterly',
      budget_process: ['bottom_up'],
      pain_points: ['tech_fragmentation', 'data_silos', 'communication']
    },
    yesQuestions: [...L1, ...L2.slice(0, 3)] // Mixed low maturity
  },
  {
    name: 'Edge: Single Entity Simplicity',
    type: 'edge',
    company: {
      name: 'Lean Operations Ltd',
      industry: 'saas',
      revenue_range: '50m_100m',
      employee_count: '51_200',
      finance_ftes: '1_10',
      legal_entities: '1_3',
      finance_structure: 'centralized',
      ownership_structure: 'family_owned',
      change_appetite: 'optimize'
    },
    pillar: {
      tools: ['jirav'],
      team_size: '1_3',
      forecast_frequency: 'monthly',
      budget_process: ['hybrid'],
      pain_points: ['bandwidth']
    },
    yesQuestions: [...L1, ...L2, ...L3] // Strong but no L4
  },
  {
    name: 'Edge: Healthcare Compliance Focus',
    type: 'edge',
    company: {
      name: 'MedTech Compliance Corp',
      industry: 'healthcare',
      revenue_range: '100m_250m',
      employee_count: '201_1000',
      finance_ftes: '21_35',
      legal_entities: '4_10',
      finance_structure: 'centralized',
      ownership_structure: 'listed',
      change_appetite: 'standardize'
    },
    pillar: {
      tools: ['oracle_epm', 'powerbi'],
      team_size: '11_25',
      forecast_frequency: 'monthly',
      budget_process: ['hybrid', 'zero_based'],
      pain_points: ['budget_cycle', 'realtime_visibility']
    },
    yesQuestions: [...L1, ...L2, ...L3.slice(0, 10)] // Strong L1-L2, partial L3
  },
  {
    name: 'Edge: Zero Finance Team',
    type: 'edge',
    company: {
      name: 'Bootstrap Ventures',
      industry: 'saas',
      revenue_range: 'under_50m',
      employee_count: '1_50',
      finance_ftes: '1_10',
      legal_entities: '1_3',
      finance_structure: 'centralized',
      ownership_structure: 'family_owned',
      change_appetite: 'optimize'
    },
    pillar: {
      tools: ['excel'],
      team_size: '1_3',
      forecast_frequency: 'annual',
      budget_process: ['top_down'],
      pain_points: ['data_wrangling', 'bandwidth', 'forecast_accuracy']
    },
    yesQuestions: L1.slice(0, 5) // Barely any
  },
  {
    name: 'Edge: All Pain Points',
    type: 'edge',
    company: {
      name: 'Troubled Transformation Inc',
      industry: 'retail',
      revenue_range: '100m_250m',
      employee_count: '201_1000',
      finance_ftes: '10_20',
      legal_entities: '11_25',
      finance_structure: 'decentralized',
      ownership_structure: 'pe_backed',
      change_appetite: 'transform'
    },
    pillar: {
      tools: ['excel', 'powerbi'],
      team_size: '4_10',
      forecast_frequency: 'quarterly',
      budget_process: ['bottom_up'],
      pain_points: ['data_wrangling', 'forecast_accuracy', 'partner_engagement', 'budget_cycle', 'bandwidth', 'tech_fragmentation', 'scenario_planning', 'communication', 'realtime_visibility', 'data_silos']
    },
    yesQuestions: [...L1, ...L2.slice(0, 5)] // L1 + some L2
  },
  {
    name: 'Edge: Listed Public Co',
    type: 'edge',
    company: {
      name: 'PublicCo International',
      industry: 'manufacturing',
      revenue_range: 'over_500m',
      employee_count: 'over_1000',
      finance_ftes: 'over_50',
      legal_entities: 'over_25',
      finance_structure: 'hybrid',
      ownership_structure: 'listed',
      change_appetite: 'standardize'
    },
    pillar: {
      tools: ['sap_sac', 'anaplan', 'tableau'],
      team_size: 'over_50',
      forecast_frequency: 'monthly',
      budget_process: ['hybrid', 'driver_based'],
      pain_points: ['realtime_visibility', 'data_silos']
    },
    yesQuestions: [...L1, ...L2, ...L3, ...L4.slice(0, 8)] // Near champion
  },

  // === 8 NORMAL MIDDLE-FIELD CASES ===
  {
    name: 'Normal: Mid-Market Manufacturing',
    type: 'normal',
    company: {
      name: 'Midwest Manufacturing Co',
      industry: 'manufacturing',
      revenue_range: '100m_250m',
      employee_count: '201_1000',
      finance_ftes: '21_35',
      legal_entities: '4_10',
      finance_structure: 'hybrid',
      ownership_structure: 'family_owned',
      change_appetite: 'standardize'
    },
    pillar: {
      tools: ['excel', 'powerbi'],
      team_size: '4_10',
      forecast_frequency: 'monthly',
      budget_process: ['hybrid'],
      pain_points: ['forecast_accuracy', 'budget_cycle']
    },
    yesQuestions: [...L1, ...L2, ...L3.slice(0, 8)]
  },
  {
    name: 'Normal: Growth SaaS',
    type: 'normal',
    company: {
      name: 'CloudScale Software',
      industry: 'saas',
      revenue_range: '50m_100m',
      employee_count: '51_200',
      finance_ftes: '10_20',
      legal_entities: '1_3',
      finance_structure: 'centralized',
      ownership_structure: 'pe_backed',
      change_appetite: 'transform'
    },
    pillar: {
      tools: ['datarails', 'powerbi'],
      team_size: '4_10',
      forecast_frequency: 'monthly',
      budget_process: ['driver_based'],
      pain_points: ['forecast_accuracy', 'scenario_planning']
    },
    yesQuestions: [...L1, ...L2, ...L3.slice(0, 12)]
  },
  {
    name: 'Normal: Professional Services Firm',
    type: 'normal',
    company: {
      name: 'Advisory Partners LLP',
      industry: 'services',
      revenue_range: '100m_250m',
      employee_count: '201_1000',
      finance_ftes: '10_20',
      legal_entities: '4_10',
      finance_structure: 'centralized',
      ownership_structure: 'family_owned',
      change_appetite: 'optimize'
    },
    pillar: {
      tools: ['excel', 'adaptive'],
      team_size: '4_10',
      forecast_frequency: 'quarterly',
      budget_process: ['bottom_up'],
      pain_points: ['partner_engagement', 'bandwidth']
    },
    yesQuestions: [...L1, ...L2]
  },
  {
    name: 'Normal: Regional Retail Chain',
    type: 'normal',
    company: {
      name: 'FreshMart Retail Group',
      industry: 'retail',
      revenue_range: '100m_250m',
      employee_count: '201_1000',
      finance_ftes: '10_20',
      legal_entities: '4_10',
      finance_structure: 'hybrid',
      ownership_structure: 'family_owned',
      change_appetite: 'standardize'
    },
    pillar: {
      tools: ['excel', 'powerbi'],
      team_size: '4_10',
      forecast_frequency: 'monthly',
      budget_process: ['hybrid'],
      pain_points: ['data_wrangling', 'realtime_visibility']
    },
    yesQuestions: [...L1, ...L2, ...L3.slice(0, 5)]
  },
  {
    name: 'Normal: Fintech Scale-up',
    type: 'normal',
    company: {
      name: 'PayFlow Technologies',
      industry: 'fintech',
      revenue_range: '50m_100m',
      employee_count: '51_200',
      finance_ftes: '10_20',
      legal_entities: '1_3',
      finance_structure: 'centralized',
      ownership_structure: 'pe_backed',
      change_appetite: 'transform'
    },
    pillar: {
      tools: ['pigment', 'looker'],
      team_size: '4_10',
      forecast_frequency: 'rolling',
      budget_process: ['driver_based'],
      pain_points: ['scenario_planning', 'forecast_accuracy']
    },
    yesQuestions: [...L1, ...L2, ...L3, ...L4.slice(0, 5)]
  },
  {
    name: 'Normal: Consumer Goods Mid-Size',
    type: 'normal',
    company: {
      name: 'HomeStyle Products Inc',
      industry: 'consumer_goods',
      revenue_range: '100m_250m',
      employee_count: '201_1000',
      finance_ftes: '21_35',
      legal_entities: '4_10',
      finance_structure: 'hybrid',
      ownership_structure: 'corporate_subsidiary',
      change_appetite: 'standardize'
    },
    pillar: {
      tools: ['vena', 'tableau'],
      team_size: '11_25',
      forecast_frequency: 'monthly',
      budget_process: ['hybrid'],
      pain_points: ['budget_cycle', 'communication']
    },
    yesQuestions: [...L1, ...L2, ...L3.slice(0, 10)]
  },
  {
    name: 'Normal: Healthcare Provider',
    type: 'normal',
    company: {
      name: 'Regional Health Systems',
      industry: 'healthcare',
      revenue_range: '100m_250m',
      employee_count: '201_1000',
      finance_ftes: '21_35',
      legal_entities: '4_10',
      finance_structure: 'centralized',
      ownership_structure: 'family_owned',
      change_appetite: 'optimize'
    },
    pillar: {
      tools: ['excel', 'adaptive'],
      team_size: '4_10',
      forecast_frequency: 'quarterly',
      budget_process: ['bottom_up', 'zero_based'],
      pain_points: ['data_wrangling', 'tech_fragmentation']
    },
    yesQuestions: [...L1, ...L2]
  },
  {
    name: 'Normal: Auto Supplier',
    type: 'normal',
    company: {
      name: 'Precision Auto Parts',
      industry: 'automotive',
      revenue_range: '100m_250m',
      employee_count: '201_1000',
      finance_ftes: '10_20',
      legal_entities: '4_10',
      finance_structure: 'hybrid',
      ownership_structure: 'corporate_subsidiary',
      change_appetite: 'standardize'
    },
    pillar: {
      tools: ['excel', 'sap_sac'],
      team_size: '4_10',
      forecast_frequency: 'monthly',
      budget_process: ['hybrid'],
      pain_points: ['forecast_accuracy', 'data_silos']
    },
    yesQuestions: [...L1, ...L2, ...L3.slice(0, 7)]
  }
];

async function createTestCase(testCase, index) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`
  };

  // 1. Create run
  const createRes = await fetch(`${API}/diagnostic-runs`, {
    method: 'POST',
    headers
  });

  if (!createRes.ok) {
    console.error(`[${index + 1}] Failed to create run:`, await createRes.text());
    return null;
  }

  const run = await createRes.json();

  // 2. Save context
  await fetch(`${API}/diagnostic-runs/${run.id}/setup`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      company: testCase.company,
      pillar: testCase.pillar
    })
  });

  // 3. Submit answers
  for (const questionId of ALL) {
    const value = testCase.yesQuestions.includes(questionId);
    await fetch(`${API}/diagnostic-inputs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        run_id: run.id,
        question_id: questionId,
        value
      })
    });
  }

  // 4. Complete run
  await fetch(`${API}/diagnostic-runs/${run.id}/complete`, {
    method: 'POST',
    headers
  });

  // 5. Calculate scores
  await fetch(`${API}/diagnostic-runs/${run.id}/score`, {
    method: 'POST',
    headers
  });

  return {
    id: run.id,
    name: testCase.name,
    type: testCase.type,
    company: testCase.company.name,
    url: `https://cfodiagnosisv1.vercel.app/report/${run.id}`
  };
}

async function main() {
  console.log('=== Creating 20 Test Cases ===\n');
  console.log('Questions loaded:', questions.length);
  console.log('L1:', L1.length, '| L2:', L2.length, '| L3:', L3.length, '| L4:', L4.length);
  console.log('Critical:', CRITICAL.length);
  console.log('\n');

  const results = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i];
    process.stdout.write(`[${i + 1}/${TEST_CASES.length}] ${testCase.name}... `);

    const result = await createTestCase(testCase, i);
    if (result) {
      results.push(result);
      console.log('OK');
    } else {
      console.log('FAILED');
    }
  }

  console.log('\n\n========================================');
  console.log('TEST CASES CREATED');
  console.log('========================================\n');

  console.log('=== EDGE CASES (12) ===\n');
  results.filter(r => r.type === 'edge').forEach((r, i) => {
    console.log(`${i + 1}. ${r.name}`);
    console.log(`   Company: ${r.company}`);
    console.log(`   ${r.url}\n`);
  });

  console.log('\n=== NORMAL CASES (8) ===\n');
  results.filter(r => r.type === 'normal').forEach((r, i) => {
    console.log(`${i + 1}. ${r.name}`);
    console.log(`   Company: ${r.company}`);
    console.log(`   ${r.url}\n`);
  });

  console.log('\n=== URL LIST ===\n');
  results.forEach(r => console.log(r.url));
}

main().catch(console.error);
