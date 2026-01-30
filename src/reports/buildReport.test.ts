// Migrated from dist/tests/vs6-qa.test.js — Report Builder Tests
// Tests DTO shape, critical risks, maturity, pillar breakdown, VS19 silence rule

import { describe, test, expect } from 'vitest';
import { buildReport } from './index';

const TEST_SPEC: any = {
  version: 'v2.6.4-test',
  questions: [
    { id: 'q1_critical', pillar: 'liquidity', weight: 1, text: 'Do you have a CFO?', is_critical: true },
    { id: 'q2_normal', pillar: 'liquidity', weight: 2, text: 'What is your annual revenue?', is_critical: false },
    { id: 'q3_critical', pillar: 'fpa', weight: 1, text: 'Do you have a budget process?', is_critical: true },
  ],
  pillars: [
    { id: 'liquidity', name: 'Liquidity & Cash', weight: 1 },
    { id: 'fpa', name: 'FP&A', weight: 1 },
  ],
  maturityGates: [
    { level: 0, label: 'Ad-hoc', required_evidence_ids: [] },
    { level: 1, label: 'Emerging', required_evidence_ids: ['q1_critical'] },
    { level: 2, label: 'Defined', required_evidence_ids: ['q1_critical', 'q2_normal'] },
  ],
  actions: [],
};

const TEST_AGGREGATE = {
  overall_score: 0.75,
  pillars: [
    { pillar_id: 'liquidity', score: 0.8, weight_sum: 3, scored_questions: 2 },
    { pillar_id: 'fpa', score: 0.5, weight_sum: 1, scored_questions: 1 },
  ],
};

describe('buildReport (VS6)', () => {
  test('DTO has required fields', () => {
    const report = buildReport({
      run_id: 'test-run-123',
      spec: TEST_SPEC,
      aggregateResult: TEST_AGGREGATE,
      inputs: [],
    });
    expect(report.run_id).toBe('test-run-123');
    expect(report.spec_version).toBe('v2.6.4-test');
    expect(typeof report.generated_at).toBe('string');
    expect(report.generated_at).toContain('T');
    expect(report.overall_score).toBe(0.75);
    expect(report.pillars.length).toBe(2);
  });

  test('maturity at Level 0 with no inputs', () => {
    const report = buildReport({
      run_id: 'test',
      spec: TEST_SPEC,
      aggregateResult: TEST_AGGREGATE,
      inputs: [],
    });
    expect(report.maturity.achieved_level).toBe(0);
    expect(report.maturity.achieved_label).toBe('Ad-hoc');
    expect(report.maturity.gates.length).toBe(3);
  });

  test('no critical risks when all TRUE', () => {
    const report = buildReport({
      run_id: 'test',
      spec: TEST_SPEC,
      aggregateResult: TEST_AGGREGATE,
      inputs: [
        { question_id: 'q1_critical', value: true },
        { question_id: 'q2_normal', value: 1000000 },
        { question_id: 'q3_critical', value: true },
      ],
    });
    expect(report.critical_risks.length).toBe(0);
  });

  test('critical risks when FALSE', () => {
    const report = buildReport({
      run_id: 'test',
      spec: TEST_SPEC,
      aggregateResult: TEST_AGGREGATE,
      inputs: [
        { question_id: 'q1_critical', value: false },
        { question_id: 'q2_normal', value: 1000000 },
        { question_id: 'q3_critical', value: false },
      ],
    });
    expect(report.critical_risks.length).toBe(2);
    expect(report.critical_risks[0].evidence_id).toBe('q1_critical');
    expect(report.critical_risks[0].question_text).toBe('Do you have a CFO?');
    expect(report.critical_risks[0].user_answer).toBe(false);
    expect(report.critical_risks[0].pillar_id).toBe('liquidity');
  });

  test('non-boolean values trigger risks (VS19 silence rule)', () => {
    const report = buildReport({
      run_id: 'test',
      spec: TEST_SPEC,
      aggregateResult: TEST_AGGREGATE,
      inputs: [
        { question_id: 'q1_critical', value: 'no' },
        { question_id: 'q3_critical', value: null },
      ],
    });
    expect(report.critical_risks.length).toBe(2);
  });

  test('pillar report structure', () => {
    const report = buildReport({
      run_id: 'test',
      spec: TEST_SPEC,
      aggregateResult: TEST_AGGREGATE,
      inputs: [],
    });
    const liquidityPillar = report.pillars.find((p) => p.pillar_id === 'liquidity');
    expect(liquidityPillar).toBeTruthy();
    expect(liquidityPillar?.pillar_name).toBe('Liquidity & Cash');
    expect(liquidityPillar?.score).toBe(0.8);
    expect(liquidityPillar?.scored_questions).toBe(2);
    expect(liquidityPillar?.total_questions).toBe(2);
  });

  test('pillar-level critical risks', () => {
    const report = buildReport({
      run_id: 'test',
      spec: TEST_SPEC,
      aggregateResult: TEST_AGGREGATE,
      inputs: [
        { question_id: 'q1_critical', value: false },
        { question_id: 'q3_critical', value: true },
      ],
    });
    const liquidityPillar = report.pillars.find((p) => p.pillar_id === 'liquidity');
    const fpaPillar = report.pillars.find((p) => p.pillar_id === 'fpa');
    expect(liquidityPillar?.critical_risks.length).toBe(1);
    expect(fpaPillar?.critical_risks.length).toBe(0);
  });

  test('empty inputs = all critical questions are risks (VS19)', () => {
    const report = buildReport({
      run_id: 'test',
      spec: TEST_SPEC,
      aggregateResult: TEST_AGGREGATE,
      inputs: [],
    });
    expect(report.critical_risks.length).toBe(2);
    expect(report.pillars.length).toBeGreaterThan(0);
  });

  test('deterministic output', () => {
    const input = {
      run_id: 'test',
      spec: TEST_SPEC,
      aggregateResult: TEST_AGGREGATE,
      inputs: [{ question_id: 'q1_critical', value: false }],
    };
    const report1 = buildReport(input);
    const report2 = buildReport(input);
    const compare1 = { ...report1, generated_at: '' };
    const compare2 = { ...report2, generated_at: '' };
    expect(compare1).toEqual(compare2);
  });
});
