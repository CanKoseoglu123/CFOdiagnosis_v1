// Migrated from dist/tests/vs19-qa.test.js — Critical Risk Engine Tests
// Tests risk derivation: critical+FALSE=risk, critical+TRUE=no risk, silence=risk

import { describe, test, expect } from 'vitest';
import { deriveCriticalRisks } from './engine';

const TEST_PILLARS = [
  { id: 'fpa', name: 'Financial Planning & Analysis', weight: 1 },
  { id: 'controls', name: 'Internal Controls', weight: 1 },
];

const TEST_QUESTIONS = [
  {
    id: 'q_critical_1',
    pillar: 'fpa',
    weight: 2,
    text: 'Do you have an annual budget?',
    is_critical: true,
    level: 1,
  },
  {
    id: 'q_critical_2',
    pillar: 'controls',
    weight: 2,
    text: 'Do you perform bank reconciliations?',
    is_critical: true,
    level: 1,
  },
  {
    id: 'q_non_critical_1',
    pillar: 'fpa',
    weight: 1,
    text: 'Do you have variance analysis?',
    is_critical: false,
    level: 2,
  },
  {
    id: 'q_non_critical_2',
    pillar: 'controls',
    weight: 1,
    text: 'Do you have audit trails?',
    level: 2,
  },
];

const TEST_SPEC: any = {
  version: 'test',
  questions: TEST_QUESTIONS,
  pillars: TEST_PILLARS,
  maturityGates: [],
  actions: [],
};

describe('deriveCriticalRisks (VS19)', () => {
  test('critical + FALSE → risk generated', () => {
    const inputs = [
      { question_id: 'q_critical_1', value: false },
      { question_id: 'q_critical_2', value: true },
    ];
    const risks = deriveCriticalRisks(inputs, TEST_SPEC);
    expect(risks.length).toBe(1);
    expect(risks[0]?.questionId).toBe('q_critical_1');
    expect(risks[0]?.pillarId).toBe('fpa');
    expect(risks[0]?.pillarName).toBe('Financial Planning & Analysis');
    expect(risks[0]?.severity).toBe('CRITICAL');
  });

  test('critical + TRUE → no risk', () => {
    const inputs = [
      { question_id: 'q_critical_1', value: true },
      { question_id: 'q_critical_2', value: true },
    ];
    const risks = deriveCriticalRisks(inputs, TEST_SPEC);
    expect(risks.length).toBe(0);
  });

  test('critical + no answer → risk (silence rule)', () => {
    const inputs: any[] = [];
    const risks = deriveCriticalRisks(inputs, TEST_SPEC);
    expect(risks.length).toBe(2);
    const riskIds = risks.map((r) => r.questionId).sort();
    expect(riskIds).toEqual(['q_critical_1', 'q_critical_2']);
  });

  test('non-critical + FALSE → no risk', () => {
    const inputs = [
      { question_id: 'q_critical_1', value: true },
      { question_id: 'q_critical_2', value: true },
      { question_id: 'q_non_critical_1', value: false },
      { question_id: 'q_non_critical_2', value: false },
    ];
    const risks = deriveCriticalRisks(inputs, TEST_SPEC);
    expect(risks.length).toBe(0);
  });

  test('mixed scenario — only critical FALSE generates risk', () => {
    const inputs = [
      { question_id: 'q_critical_1', value: true },
      { question_id: 'q_critical_2', value: false },
      { question_id: 'q_non_critical_1', value: false },
    ];
    const risks = deriveCriticalRisks(inputs, TEST_SPEC);
    expect(risks.length).toBe(1);
    expect(risks[0]?.questionId).toBe('q_critical_2');
  });

  test('null/undefined values count as missing → risk', () => {
    const inputs = [
      { question_id: 'q_critical_1', value: null },
      { question_id: 'q_critical_2', value: undefined },
    ];
    const risks = deriveCriticalRisks(inputs as any, TEST_SPEC);
    expect(risks.length).toBe(2);
  });

  test('string values are invalid → risk', () => {
    const inputs = [
      { question_id: 'q_critical_1', value: 'yes' },
      { question_id: 'q_critical_2', value: 'true' },
    ];
    const risks = deriveCriticalRisks(inputs as any, TEST_SPEC);
    expect(risks.length).toBe(2);
  });

  test('deterministic output', () => {
    const inputs = [{ question_id: 'q_critical_1', value: false }];
    const run1 = deriveCriticalRisks(inputs, TEST_SPEC);
    const run2 = deriveCriticalRisks(inputs, TEST_SPEC);
    const run3 = deriveCriticalRisks(inputs, TEST_SPEC);
    expect(run1).toEqual(run2);
    expect(run2).toEqual(run3);
  });
});
