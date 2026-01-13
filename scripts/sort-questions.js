const fs = require('fs');
const path = require('path');

// Load data - questions are now split into three theme files
const contentDir = path.join(__dirname, '..', 'content');
const questionFiles = [
  { name: 'questions-foundation.json', theme: 'foundation' },
  { name: 'questions-future.json', theme: 'future' },
  { name: 'questions-intelligence.json', theme: 'intelligence' }
];
const practicesPath = path.join(contentDir, 'practices.json');
const practices = JSON.parse(fs.readFileSync(practicesPath));

// Define sort orders
const objectiveOrder = [
  'obj_budget_discipline',
  'obj_financial_controls',
  'obj_performance_monitoring',
  'obj_forecasting_agility',
  'obj_driver_based_planning',
  'obj_scenario_modeling',
  'obj_strategic_influence',
  'obj_decision_support',
  'obj_operational_excellence'
];

const practiceOrderByObjective = {
  'obj_budget_discipline': ['prac_annual_budget_cycle', 'prac_budget_ownership', 'prac_policy_&_governance'],
  'obj_financial_controls': ['prac_chart_of_accounts', 'prac_approval_workflows', 'prac_month_end_rigor'],
  'obj_performance_monitoring': ['prac_management_reporting', 'prac_budget_vs_actuals', 'prac_variance_investigation'],
  'obj_forecasting_agility': ['prac_rolling_forecast_cadence', 'prac_cash_flow_visibility', 'prac_collaborative_systems'],
  'obj_driver_based_planning': ['prac_operational_drivers', 'prac_dynamic_targets', 'prac_continuous_planning'],
  'obj_scenario_modeling': ['prac_rapid_what_if_capability', 'prac_multi_scenario_management', 'prac_stress_testing'],
  'obj_strategic_influence': ['prac_commercial_partnership', 'prac_strategic_alignment', 'prac_investment_rigor', 'prac_board_level_impact'],
  'obj_decision_support': ['prac_data_visualization', 'prac_self_service_analytics', 'prac_predictive_analytics'],
  'obj_operational_excellence': ['prac_process_automation', 'prac_service_level_agreements']
};

// Build flat practice order
const practiceOrder = [];
objectiveOrder.forEach(obj => {
  practiceOrderByObjective[obj].forEach(prac => practiceOrder.push(prac));
});

// Sort function for questions
function sortQuestions(questions) {
  return [...questions].sort((a, b) => {
    // 1. By practice (which implies objective order)
    const pracA = practiceOrder.indexOf(a.practice_id);
    const pracB = practiceOrder.indexOf(b.practice_id);
    if (pracA !== pracB) return pracA - pracB;

    // 2. By maturity level
    if (a.maturity_level !== b.maturity_level) return a.maturity_level - b.maturity_level;

    // 3. By question ID (extract number)
    const numA = parseInt(a.id.match(/q(\d+)/)?.[1] || '0');
    const numB = parseInt(b.id.match(/q(\d+)/)?.[1] || '0');
    return numA - numB;
  });
}

// Process each theme file separately
let totalSorted = 0;
for (const { name: fileName } of questionFiles) {
  const filePath = path.join(contentDir, fileName);
  const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const questions = fileData.questions;

  const sorted = sortQuestions(questions);

  // Write result
  const output = { version: fileData.version, pillar: fileData.pillar, questions: sorted };
  fs.writeFileSync(filePath, JSON.stringify(output, null, 2));

  console.log(`Sorted ${sorted.length} questions in ${fileName}`);
  console.log('  First 3:', sorted.slice(0, 3).map(q => q.id + ' (' + q.practice_id + ', L' + q.maturity_level + ')').join('\n           '));
  console.log('  Last 3:', sorted.slice(-3).map(q => q.id + ' (' + q.practice_id + ', L' + q.maturity_level + ')').join('\n          '));
  console.log('');

  totalSorted += sorted.length;
}

console.log('Total sorted:', totalSorted, 'questions across', questionFiles.length, 'files');
