// Migrated from dist/tests/vs20-qa.test.js — Dynamic Action Engine Tests
// Tests objective-based action derivation: priority logic, deduplication, coverage

import { describe, test, expect } from 'vitest';
import { deriveActionsFromObjectives } from './deriveFromObjectives';

const TEST_SPEC: any = {
  version: 'v2.6.4-test',
  pillars: [{ id: 'fpa', name: 'Financial Planning & Analysis', weight: 1 }],
  objectives: [
    { id: 'obj_budget', pillar_id: 'fpa', level: 1, name: 'Budget Foundation', description: 'Establish budget process', action_id: 'act_budget' },
    { id: 'obj_forecast', pillar_id: 'fpa', level: 2, name: 'Forecasting', description: 'Implement forecasting', action_id: 'act_forecast' },
    { id: 'obj_advanced', pillar_id: 'fpa', level: 3, name: 'Advanced Planning', description: 'Advanced capabilities', action_id: 'act_advanced' },
  ],
  questions: [
    { id: 'q1_critical', pillar: 'fpa', weight: 1, text: 'Do you have a budget?', is_critical: true, objective_id: 'obj_budget', level: 1 },
    { id: 'q2_normal', pillar: 'fpa', weight: 1, text: 'Do you have forecasts?', is_critical: false, objective_id: 'obj_forecast', level: 2 },
    { id: 'q3_normal', pillar: 'fpa', weight: 1, text: 'Driver-based planning?', is_critical: false, objective_id: 'obj_advanced', level: 3 },
  ],
  maturityGates: [
    { level: 0, label: 'Ad-hoc', required_evidence_ids: [] },
    { level: 1, label: 'Emerging', required_evidence_ids: ['q1_critical'] },
    { level: 2, label: 'Defined', required_evidence_ids: ['q2_normal'] },
    { level: 3, label: 'Managed', required_evidence_ids: ['q3_normal'] },
  ],
  actions: [
    { id: 'act_budget', title: 'Establish Budget', description: 'Create a formal budget process', rationale: 'Budgeting is fundamental', priority: 'critical' },
    { id: 'act_forecast', title: 'Implement Forecasting', description: 'Create rolling forecasts', rationale: 'Forecasts enable planning', priority: 'high' },
    { id: 'act_advanced', title: 'Advanced Planning', description: 'Implement driver-based planning', rationale: 'Advanced capabilities', priority: 'medium' },
  ],
};

describe('deriveActionsFromObjectives (VS20)', () => {
  test('critical risk → HIGH priority', () => {
    const criticalRisks = [{
      evidence_id: 'q1_critical',
      question_text: 'Do you have a budget?',
      pillar_id: 'fpa',
      pillar_name: 'FP&A',
      severity: 'CRITICAL',
      user_answer: false,
    }];
    const maturity = {
      achieved_level: 0, achieved_label: 'Ad-hoc',
      blocking_level: 1, blocking_evidence_ids: ['q1_critical'],
      gates: TEST_SPEC.maturityGates,
    };
    const inputs = [
      { question_id: 'q1_critical', value: false },
      { question_id: 'q2_normal', value: true },
      { question_id: 'q3_normal', value: true },
    ];
    const actions = deriveActionsFromObjectives(TEST_SPEC, inputs, criticalRisks as any, maturity);
    expect(actions.length).toBe(1);
    expect(actions[0]?.objective_id).toBe('obj_budget');
    expect(actions[0]?.derived_priority).toBe('HIGH');
    expect(actions[0]?.trigger_reason).toBe('critical_risk');
  });

  test('maturity blocker → HIGH priority', () => {
    const maturity = {
      achieved_level: 1, achieved_label: 'Emerging',
      blocking_level: 2, blocking_evidence_ids: ['q2_normal'],
      gates: TEST_SPEC.maturityGates,
    };
    const inputs = [
      { question_id: 'q1_critical', value: true },
      { question_id: 'q2_normal', value: false },
      { question_id: 'q3_normal', value: true },
    ];
    const actions = deriveActionsFromObjectives(TEST_SPEC, inputs, [], maturity);
    expect(actions.length).toBe(1);
    expect(actions[0]?.objective_id).toBe('obj_forecast');
    expect(actions[0]?.derived_priority).toBe('HIGH');
    expect(actions[0]?.trigger_reason).toBe('maturity_blocker');
  });

  test('all objectives satisfied → no actions', () => {
    const maturity = {
      achieved_level: 3, achieved_label: 'Managed',
      blocking_level: null, blocking_evidence_ids: [] as string[],
      gates: TEST_SPEC.maturityGates,
    };
    const inputs = [
      { question_id: 'q1_critical', value: true },
      { question_id: 'q2_normal', value: true },
      { question_id: 'q3_normal', value: true },
    ];
    const actions = deriveActionsFromObjectives(TEST_SPEC, inputs, [], maturity);
    expect(actions.length).toBe(0);
  });

  test('action contains objective info', () => {
    const criticalRisks = [{
      evidence_id: 'q1_critical',
      question_text: 'Do you have a budget?',
      pillar_id: 'fpa', pillar_name: 'FP&A',
      severity: 'CRITICAL', user_answer: false,
    }];
    const maturity = {
      achieved_level: 0, achieved_label: 'Ad-hoc',
      blocking_level: 1, blocking_evidence_ids: ['q1_critical'],
      gates: TEST_SPEC.maturityGates,
    };
    const inputs = [
      { question_id: 'q1_critical', value: false },
      { question_id: 'q2_normal', value: true },
      { question_id: 'q3_normal', value: true },
    ];
    const actions = deriveActionsFromObjectives(TEST_SPEC, inputs, criticalRisks as any, maturity);
    expect(actions.length).toBeGreaterThan(0);
    const action = actions[0];
    expect(action.id).toBe('act_budget');
    expect(action.objective_id).toBe('obj_budget');
    expect(action.objective_name).toBe('Budget Foundation');
    expect(action.title).toBe('Establish Budget');
    expect(action.description.length).toBeGreaterThan(0);
    expect(action.rationale.length).toBeGreaterThan(0);
    expect(action.pillar_id).toBe('fpa');
    expect(action.level).toBe(1);
  });

  test('no objectives in spec → empty actions', () => {
    const noObjectivesSpec = { ...TEST_SPEC, objectives: undefined };
    const actions = deriveActionsFromObjectives(
      noObjectivesSpec, [], [],
      { achieved_level: 0, achieved_label: 'Ad-hoc', blocking_level: null, blocking_evidence_ids: [], gates: [] }
    );
    expect(actions.length).toBe(0);
  });

  test('deduplication — same objective triggered by critical risk AND maturity blocker', () => {
    const criticalRisks = [{
      evidence_id: 'q1_critical',
      question_text: 'Do you have a budget?',
      pillar_id: 'fpa', pillar_name: 'FP&A',
      severity: 'CRITICAL', user_answer: false,
    }];
    const maturity = {
      achieved_level: 0, achieved_label: 'Ad-hoc',
      blocking_level: 1, blocking_evidence_ids: ['q1_critical'],
      gates: TEST_SPEC.maturityGates,
    };
    const inputs = [
      { question_id: 'q1_critical', value: false },
      { question_id: 'q2_normal', value: true },
      { question_id: 'q3_normal', value: true },
    ];
    const actions = deriveActionsFromObjectives(TEST_SPEC, inputs, criticalRisks as any, maturity);
    const budgetActions = actions.filter((a) => a.objective_id === 'obj_budget');
    expect(budgetActions.length).toBe(1);
    expect(budgetActions[0]?.trigger_reason).toBe('critical_risk');
  });

  test('deterministic output', () => {
    const criticalRisks = [{
      evidence_id: 'q1_critical',
      question_text: 'Do you have a budget?',
      pillar_id: 'fpa', pillar_name: 'FP&A',
      severity: 'CRITICAL', user_answer: false,
    }];
    const maturity = {
      achieved_level: 0, achieved_label: 'Ad-hoc',
      blocking_level: 1, blocking_evidence_ids: ['q1_critical'],
      gates: TEST_SPEC.maturityGates,
    };
    const inputs = [
      { question_id: 'q1_critical', value: false },
      { question_id: 'q2_normal', value: true },
      { question_id: 'q3_normal', value: true },
    ];
    const run1 = deriveActionsFromObjectives(TEST_SPEC, inputs, criticalRisks as any, maturity);
    const run2 = deriveActionsFromObjectives(TEST_SPEC, inputs, criticalRisks as any, maturity);
    expect(run1).toEqual(run2);
  });
});
