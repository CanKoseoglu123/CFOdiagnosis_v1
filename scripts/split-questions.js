/**
 * Split questions.json into three theme-based files and sort according to QUESTION_SORTING_PRINCIPLES.md
 *
 * Sorting rules:
 * 1. By Objective (in theme order)
 * 2. By Practice within Objective (logical flow sequence)
 * 3. By Maturity Level within Practice (L1 → L2 → L3 → L4)
 */

const fs = require('fs');
const path = require('path');

// Load source files
const contentDir = path.join(__dirname, '../content');
const questions = JSON.parse(fs.readFileSync(path.join(contentDir, 'questions.json'), 'utf8'));
const practices = JSON.parse(fs.readFileSync(path.join(contentDir, 'practices.json'), 'utf8'));
const objectives = JSON.parse(fs.readFileSync(path.join(contentDir, 'objectives.json'), 'utf8'));

// Build lookup maps
const practiceToObjective = {};
practices.forEach(p => {
  practiceToObjective[p.id] = p.objective_id;
});

const objectiveToTheme = {};
objectives.forEach(o => {
  objectiveToTheme[o.id] = o.theme_id;
});

// Define sorting order from QUESTION_SORTING_PRINCIPLES.md
const OBJECTIVE_ORDER = {
  // Foundation (1-3)
  'obj_budget_discipline': 1,
  'obj_financial_controls': 2,
  'obj_performance_monitoring': 3,
  // Future (4-6)
  'obj_forecasting_agility': 4,
  'obj_driver_based_planning': 5,
  'obj_scenario_modeling': 6,
  // Intelligence (7-9)
  'obj_strategic_influence': 7,
  'obj_decision_support': 8,
  'obj_operational_excellence': 9
};

// Practice order within each objective (from QUESTION_SORTING_PRINCIPLES.md)
const PRACTICE_ORDER = {
  // Budget Discipline: Annual Budget Cycle → Budget Ownership → Policy & Governance
  'prac_annual_budget_cycle': 1,
  'prac_budget_ownership': 2,
  'prac_policy_&_governance': 3,
  // Financial Controls: Chart of Accounts → Approval Workflows → Month-End Rigor
  'prac_chart_of_accounts': 1,
  'prac_approval_workflows': 2,
  'prac_month_end_rigor': 3,
  // Performance Monitoring: Management Reporting → Budget vs Actuals → Variance Investigation
  'prac_management_reporting': 1,
  'prac_budget_vs_actuals': 2,
  'prac_variance_investigation': 3,
  // Forecasting Agility: Rolling Forecast Cadence → Cash Flow Visibility → Collaborative Systems
  'prac_rolling_forecast_cadence': 1,
  'prac_cash_flow_visibility': 2,
  'prac_collaborative_systems': 3,
  // Driver-Based Planning: Operational Drivers → Dynamic Targets → Continuous Planning
  'prac_operational_drivers': 1,
  'prac_dynamic_targets': 2,
  'prac_continuous_planning': 3,
  // Scenario Modeling: Rapid What-If → Multi-Scenario Management → Stress Testing
  'prac_rapid_what_if_capability': 1,
  'prac_multi_scenario_management': 2,
  'prac_stress_testing': 3,
  // Strategic Influence: Commercial Partnership → Strategic Alignment → Investment Rigor → Board-Level Impact
  'prac_commercial_partnership': 1,
  'prac_strategic_alignment': 2,
  'prac_investment_rigor': 3,
  'prac_board_level_impact': 4,
  // Decision Support: Data Visualization → Self-Service Analytics → Predictive Analytics
  'prac_data_visualization': 1,
  'prac_self_service_analytics': 2,
  'prac_predictive_analytics': 3,
  // Operational Excellence: Process Automation → Service Level Agreements
  'prac_process_automation': 1,
  'prac_service_level_agreements': 2
};

// Get theme for a question
function getTheme(question) {
  const objectiveId = practiceToObjective[question.practice_id];
  return objectiveToTheme[objectiveId];
}

// Get objective for a question
function getObjective(question) {
  return practiceToObjective[question.practice_id];
}

// Sort function
function sortQuestions(questionsList) {
  return questionsList.sort((a, b) => {
    const objA = getObjective(a);
    const objB = getObjective(b);

    // 1. Sort by Objective order
    const objOrderA = OBJECTIVE_ORDER[objA] || 99;
    const objOrderB = OBJECTIVE_ORDER[objB] || 99;
    if (objOrderA !== objOrderB) return objOrderA - objOrderB;

    // 2. Sort by Practice order within objective
    const pracOrderA = PRACTICE_ORDER[a.practice_id] || 99;
    const pracOrderB = PRACTICE_ORDER[b.practice_id] || 99;
    if (pracOrderA !== pracOrderB) return pracOrderA - pracOrderB;

    // 3. Sort by Maturity Level within practice (L1 → L4)
    return a.maturity_level - b.maturity_level;
  });
}

// Split questions by theme
const foundation = [];
const future = [];
const intelligence = [];

questions.questions.forEach(q => {
  const theme = getTheme(q);
  switch (theme) {
    case 'foundation':
      foundation.push(q);
      break;
    case 'future':
      future.push(q);
      break;
    case 'intelligence':
      intelligence.push(q);
      break;
    default:
      console.error(`Unknown theme for question ${q.id}: ${theme}`);
  }
});

// Sort each theme's questions
const sortedFoundation = sortQuestions(foundation);
const sortedFuture = sortQuestions(future);
const sortedIntelligence = sortQuestions(intelligence);

// Create output files
const version = questions.version;

const foundationFile = {
  version,
  pillar: 'fpa',
  theme: 'foundation',
  questions: sortedFoundation
};

const futureFile = {
  version,
  pillar: 'fpa',
  theme: 'future',
  questions: sortedFuture
};

const intelligenceFile = {
  version,
  pillar: 'fpa',
  theme: 'intelligence',
  questions: sortedIntelligence
};

// Write files
fs.writeFileSync(
  path.join(contentDir, 'questions-foundation.json'),
  JSON.stringify(foundationFile, null, 2)
);

fs.writeFileSync(
  path.join(contentDir, 'questions-future.json'),
  JSON.stringify(futureFile, null, 2)
);

fs.writeFileSync(
  path.join(contentDir, 'questions-intelligence.json'),
  JSON.stringify(intelligenceFile, null, 2)
);

// Summary
console.log('Questions split and sorted successfully!');
console.log(`Foundation: ${sortedFoundation.length} questions`);
console.log(`Future: ${sortedFuture.length} questions`);
console.log(`Intelligence: ${sortedIntelligence.length} questions`);
console.log(`Total: ${sortedFoundation.length + sortedFuture.length + sortedIntelligence.length} questions`);

// Print sorting order for verification
console.log('\n=== Foundation Questions Order ===');
sortedFoundation.forEach(q => {
  const obj = getObjective(q);
  console.log(`${q.id} | L${q.maturity_level} | ${obj} | ${q.practice_id}`);
});

console.log('\n=== Future Questions Order ===');
sortedFuture.forEach(q => {
  const obj = getObjective(q);
  console.log(`${q.id} | L${q.maturity_level} | ${obj} | ${q.practice_id}`);
});

console.log('\n=== Intelligence Questions Order ===');
sortedIntelligence.forEach(q => {
  const obj = getObjective(q);
  console.log(`${q.id} | L${q.maturity_level} | ${obj} | ${q.practice_id}`);
});
