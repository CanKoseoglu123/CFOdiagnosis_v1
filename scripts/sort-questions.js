const fs = require('fs');
const path = require('path');

// Load data
const questionsPath = path.join(__dirname, '..', 'content', 'questions.json');
const practicesPath = path.join(__dirname, '..', 'content', 'practices.json');

const questionsData = JSON.parse(fs.readFileSync(questionsPath));
const questions = questionsData.questions;
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

// Sort questions
const sorted = [...questions].sort((a, b) => {
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

// Write result
const output = { version: questionsData.version, pillar: questionsData.pillar, questions: sorted };
fs.writeFileSync(questionsPath, JSON.stringify(output, null, 2));

console.log('Sorted', sorted.length, 'questions');
console.log('First 5:', sorted.slice(0, 5).map(q => q.id + ' (' + q.practice_id + ', L' + q.maturity_level + ')').join('\n  '));
console.log('Last 5:', sorted.slice(-5).map(q => q.id + ' (' + q.practice_id + ', L' + q.maturity_level + ')').join('\n  '));
