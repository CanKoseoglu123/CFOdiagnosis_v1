// Migrated from dist/tests/vs8-qa.test.js — Actions Engine (Legacy) Tests
// Tests critical risk → actions, maturity blockers → actions, deduplication, priority sorting

import { describe, test, expect } from 'vitest';
import { buildReport } from '../reports/index';

const TEST_SPEC: any = {
  version: 'test',
  questions: [
    { id: 'has_cfo', pillar: 'liquidity', weight: 1, text: 'Do you have a CFO?', is_critical: true, trigger_action_id: 'act_hire_cfo' },
    { id: 'has_budget', pillar: 'fpa', weight: 1, text: 'Do you have a budget process?', is_critical: false, trigger_action_id: 'act_create_budget' },
    { id: 'no_action_defined', pillar: 'fpa', weight: 1, text: 'Some question without action', is_critical: true },
  ],
  pillars: [
    { id: 'liquidity', name: 'Liquidity', weight: 1 },
    { id: 'fpa', name: 'FP&A', weight: 1 },
  ],
  maturityGates: [
    { level: 0, label: 'Ad-hoc', required_evidence_ids: [] },
    { level: 1, label: 'Emerging', required_evidence_ids: ['has_cfo'] },
    { level: 2, label: 'Defined', required_evidence_ids: ['has_budget'] },
  ],
  actions: [
    { id: 'act_hire_cfo', title: 'Appoint a CFO', description: 'Hire a CFO to lead finance.', rationale: 'Financial leadership is essential.', priority: 'critical' },
    { id: 'act_create_budget', title: 'Establish Budget Process', description: 'Create an annual budget process.', rationale: 'Budgets enable planning.', priority: 'high' },
  ],
};

const TEST_AGGREGATE = {
  overall_score: 0.5,
  pillars: [
    { pillar_id: 'liquidity', score: 0.5, weight_sum: 1, scored_questions: 1 },
    { pillar_id: 'fpa', score: 0.5, weight_sum: 2, scored_questions: 2 },
  ],
};

describe('Actions via buildReport (VS8)', () => {
  test('critical risk triggers action', () => {
    const report = buildReport({
      run_id: 'test', spec: TEST_SPEC, aggregateResult: TEST_AGGREGATE,
      inputs: [
        { question_id: 'has_cfo', value: false },
        { question_id: 'has_budget', value: true },
      ],
    });
    expect(report.actions.length).toBe(1);
    expect(report.actions[0].id).toBe('act_hire_cfo');
    expect(report.actions[0].trigger_type).toBe('critical_risk');
    expect(report.actions[0].priority).toBe('critical');
  });

  test('maturity blocker triggers action', () => {
    const report = buildReport({
      run_id: 'test', spec: TEST_SPEC, aggregateResult: TEST_AGGREGATE,
      inputs: [
        { question_id: 'has_cfo', value: true },
        { question_id: 'has_budget', value: false },
      ],
    });
    const budgetAction = report.actions.find((a) => a.id === 'act_create_budget');
    expect(budgetAction).toBeTruthy();
    expect(budgetAction?.trigger_type).toBe('maturity_blocker');
  });

  test('deduplication — same evidence is risk + blocker', () => {
    const report = buildReport({
      run_id: 'test', spec: TEST_SPEC, aggregateResult: TEST_AGGREGATE,
      inputs: [
        { question_id: 'has_cfo', value: false },
        { question_id: 'has_budget', value: true },
      ],
    });
    const cfoActions = report.actions.filter((a) => a.id === 'act_hire_cfo');
    expect(cfoActions.length).toBe(1);
    expect(cfoActions[0].trigger_type).toBe('critical_risk');
  });

  test('priority sorting: critical before high', () => {
    const report = buildReport({
      run_id: 'test', spec: TEST_SPEC, aggregateResult: TEST_AGGREGATE,
      inputs: [
        { question_id: 'has_cfo', value: false },
        { question_id: 'has_budget', value: false },
      ],
    });
    expect(report.actions.length).toBe(2);
    expect(report.actions[0].priority).toBe('critical');
    expect(report.actions[1].priority).toBe('high');
  });

  test('missing action definition → graceful skip', () => {
    const report = buildReport({
      run_id: 'test', spec: TEST_SPEC, aggregateResult: TEST_AGGREGATE,
      inputs: [
        { question_id: 'has_cfo', value: true },
        { question_id: 'has_budget', value: true },
        { question_id: 'no_action_defined', value: false },
      ],
    });
    expect(report.actions.length).toBe(0);
    expect(report.critical_risks.length).toBe(1);
  });

  test('no triggers → empty actions', () => {
    const report = buildReport({
      run_id: 'test', spec: TEST_SPEC, aggregateResult: TEST_AGGREGATE,
      inputs: [
        { question_id: 'has_cfo', value: true },
        { question_id: 'has_budget', value: true },
      ],
    });
    expect(report.actions.length).toBe(0);
  });

  test('action contains full details', () => {
    const report = buildReport({
      run_id: 'test', spec: TEST_SPEC, aggregateResult: TEST_AGGREGATE,
      inputs: [{ question_id: 'has_cfo', value: false }],
    });
    const action = report.actions[0];
    expect(action.id).toBe('act_hire_cfo');
    expect(action.title).toBe('Appoint a CFO');
    expect(action.description).toBe('Hire a CFO to lead finance.');
    expect(action.rationale).toBe('Financial leadership is essential.');
    expect(action.evidence_id).toBe('has_cfo');
    expect(action.pillar_id).toBe('liquidity');
  });

  test('actions is array in DTO', () => {
    const report = buildReport({
      run_id: 'test', spec: TEST_SPEC, aggregateResult: TEST_AGGREGATE,
      inputs: [{ question_id: 'has_cfo', value: false }],
    });
    expect(Array.isArray(report.actions)).toBe(true);
    expect('actions' in report).toBe(true);
  });

  test('deterministic output', () => {
    const input = {
      run_id: 'test', spec: TEST_SPEC, aggregateResult: TEST_AGGREGATE,
      inputs: [
        { question_id: 'has_cfo', value: false },
        { question_id: 'has_budget', value: false },
      ],
    };
    const report1 = buildReport(input);
    const report2 = buildReport(input);
    expect(report1.actions).toEqual(report2.actions);
  });
});
