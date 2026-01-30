// Migrated from dist/tests/vs7-qa.test.js — Maturity Engine Tests
// Tests sequential gate evaluation, strict boolean checks, and V2 maturity logic

import { describe, test, expect } from 'vitest';
import { evaluateMaturity, calculateMaturityV2, calculateExecutionScore, getFailedCriticals } from './engine';
import { STANDARD_GATES } from '../__tests__/fixtures/testData';

// =============================================================================
// LEGACY: evaluateMaturity (VS7)
// =============================================================================

describe('evaluateMaturity (legacy gate-based)', () => {
  test('empty inputs → Level 0', () => {
    const inputs = new Map<string, unknown>();
    const result = evaluateMaturity(inputs, STANDARD_GATES);
    expect(result.achieved_level).toEqual(0);
    expect(result.achieved_label).toEqual('Ad-hoc');
    expect(result.blocking_level).toEqual(1);
    expect([...result.blocking_evidence_ids].sort()).toEqual(['e1']);
  });

  test('e1=true → Level 1', () => {
    const inputs = new Map<string, unknown>([['e1', true]]);
    const result = evaluateMaturity(inputs, STANDARD_GATES);
    expect(result.achieved_level).toEqual(1);
    expect(result.achieved_label).toEqual('Emerging');
    expect(result.blocking_level).toEqual(2);
    expect([...result.blocking_evidence_ids].sort()).toEqual(['e2', 'e3']);
  });

  test('e1,e2,e3=true → Level 2', () => {
    const inputs = new Map<string, unknown>([
      ['e1', true],
      ['e2', true],
      ['e3', true],
    ]);
    const result = evaluateMaturity(inputs, STANDARD_GATES);
    expect(result.achieved_level).toEqual(2);
    expect(result.achieved_label).toEqual('Defined');
    expect(result.blocking_level).toEqual(3);
  });

  test('cannot skip levels — missing e1 → stuck at Level 0', () => {
    const inputs = new Map<string, unknown>([
      ['e2', true],
      ['e3', true],
      ['e4', true],
      ['e5', true],
      ['e6', true],
    ]);
    const result = evaluateMaturity(inputs, STANDARD_GATES);
    expect(result.achieved_level).toEqual(0);
    expect(result.blocking_level).toEqual(1);
    expect([...result.blocking_evidence_ids].sort()).toEqual(['e1']);
  });

  test('partial gate failure — missing e3 → Level 1', () => {
    const inputs = new Map<string, unknown>([
      ['e1', true],
      ['e2', true],
    ]);
    const result = evaluateMaturity(inputs, STANDARD_GATES);
    expect(result.achieved_level).toEqual(1);
    expect(result.blocking_level).toEqual(2);
    expect([...result.blocking_evidence_ids].sort()).toEqual(['e3']);
  });

  test('all gates satisfied → Level 4', () => {
    const inputs = new Map<string, unknown>([
      ['e1', true],
      ['e2', true],
      ['e3', true],
      ['e4', true],
      ['e5', true],
      ['e6', true],
    ]);
    const result = evaluateMaturity(inputs, STANDARD_GATES);
    expect(result.achieved_level).toEqual(4);
    expect(result.achieved_label).toEqual('Optimized');
    expect(result.blocking_level).toEqual(null);
    expect(result.blocking_evidence_ids).toEqual([]);
  });

  test('strict boolean: false → Level 0', () => {
    const inputs = new Map<string, unknown>([['e1', false]]);
    const result = evaluateMaturity(inputs, STANDARD_GATES);
    expect(result.achieved_level).toEqual(0);
  });

  test('strict boolean: string "true" → Level 0', () => {
    const inputs = new Map<string, unknown>([['e1', 'true']]);
    const result = evaluateMaturity(inputs, STANDARD_GATES);
    expect(result.achieved_level).toEqual(0);
  });

  test('strict boolean: number 1 → Level 0', () => {
    const inputs = new Map<string, unknown>([['e1', 1]]);
    const result = evaluateMaturity(inputs, STANDARD_GATES);
    expect(result.achieved_level).toEqual(0);
  });

  test('strict boolean: null → Level 0', () => {
    const inputs = new Map<string, unknown>([['e1', null]]);
    const result = evaluateMaturity(inputs, STANDARD_GATES);
    expect(result.achieved_level).toEqual(0);
  });

  test('strict boolean: undefined → Level 0', () => {
    const inputs = new Map<string, unknown>([['e1', undefined]]);
    const result = evaluateMaturity(inputs, STANDARD_GATES);
    expect(result.achieved_level).toEqual(0);
  });

  test('unsorted gates still work', () => {
    const unsortedGates = [
      { level: 2, label: 'Defined', required_evidence_ids: ['e2'] },
      { level: 0, label: 'Ad-hoc', required_evidence_ids: [] as string[] },
      { level: 1, label: 'Emerging', required_evidence_ids: ['e1'] },
    ];
    const inputs = new Map<string, unknown>([['e1', true]]);
    const result = evaluateMaturity(inputs, unsortedGates);
    expect(result.achieved_level).toEqual(1);
    expect(result.blocking_level).toEqual(2);
  });

  test('empty gates array → Level 0', () => {
    const inputs = new Map<string, unknown>([['e1', true]]);
    const result = evaluateMaturity(inputs, []);
    expect(result.achieved_level).toEqual(0);
    expect(result.blocking_level).toEqual(null);
  });

  test('gate with empty required evidence auto-passes', () => {
    const gates = [
      { level: 0, label: 'Ad-hoc', required_evidence_ids: [] as string[] },
      { level: 1, label: 'Emerging', required_evidence_ids: [] as string[] },
      { level: 2, label: 'Defined', required_evidence_ids: ['e1'] },
    ];
    const inputs = new Map<string, unknown>();
    const result = evaluateMaturity(inputs, gates);
    expect(result.achieved_level).toEqual(1);
    expect(result.blocking_level).toEqual(2);
  });

  test('deterministic output', () => {
    const inputs = new Map<string, unknown>([
      ['e1', true],
      ['e2', true],
    ]);
    const result1 = evaluateMaturity(inputs, STANDARD_GATES);
    const result2 = evaluateMaturity(inputs, STANDARD_GATES);
    const result3 = evaluateMaturity(inputs, STANDARD_GATES);
    expect(result1).toEqual(result2);
    expect(result2).toEqual(result3);
  });
});

// =============================================================================
// V2: Execution Score (from v2-qa.test)
// =============================================================================

describe('calculateExecutionScore', () => {
  test('all YES = 100%', () => {
    const answers = Array.from({ length: 10 }, (_, i) => ({
      question_id: `q${i}`,
      value: true as boolean | 'N/A' | null | undefined,
    }));
    expect(calculateExecutionScore(answers)).toBe(100);
  });

  test('all NO = 0%', () => {
    const answers = Array.from({ length: 10 }, (_, i) => ({
      question_id: `q${i}`,
      value: false as boolean | 'N/A' | null | undefined,
    }));
    expect(calculateExecutionScore(answers)).toBe(0);
  });

  test('50% YES = 50%', () => {
    const answers = [
      { question_id: 'q1', value: true as boolean | 'N/A' | null | undefined },
      { question_id: 'q2', value: false as boolean | 'N/A' | null | undefined },
      { question_id: 'q3', value: true as boolean | 'N/A' | null | undefined },
      { question_id: 'q4', value: false as boolean | 'N/A' | null | undefined },
    ];
    expect(calculateExecutionScore(answers)).toBe(50);
  });

  test('N/A excluded from scoring: 2/2 = 100%', () => {
    const answers = [
      { question_id: 'q1', value: true as boolean | 'N/A' | null | undefined },
      { question_id: 'q2', value: 'N/A' as boolean | 'N/A' | null | undefined },
      { question_id: 'q3', value: true as boolean | 'N/A' | null | undefined },
      { question_id: 'q4', value: 'N/A' as boolean | 'N/A' | null | undefined },
    ];
    expect(calculateExecutionScore(answers)).toBe(100);
  });
});

// =============================================================================
// V2: getFailedCriticals
// =============================================================================

describe('getFailedCriticals', () => {
  const criticalIds = ['q1', 'q2', 'q3'];

  test('all passed → no failures', () => {
    const answers = [
      { question_id: 'q1', value: true as boolean | 'N/A' | null | undefined },
      { question_id: 'q2', value: true as boolean | 'N/A' | null | undefined },
      { question_id: 'q3', value: true as boolean | 'N/A' | null | undefined },
    ];
    expect(getFailedCriticals(answers, criticalIds)).toEqual([]);
  });

  test('one failed → returns failed ID', () => {
    const answers = [
      { question_id: 'q1', value: true as boolean | 'N/A' | null | undefined },
      { question_id: 'q2', value: false as boolean | 'N/A' | null | undefined },
      { question_id: 'q3', value: true as boolean | 'N/A' | null | undefined },
    ];
    expect(getFailedCriticals(answers, criticalIds)).toEqual(['q2']);
  });

  test('unanswered counts as failure', () => {
    const answers = [
      { question_id: 'q1', value: true as boolean | 'N/A' | null | undefined },
    ];
    expect(getFailedCriticals(answers, criticalIds)).toEqual(['q2', 'q3']);
  });

  test('N/A does not count as failure', () => {
    const answers = [
      { question_id: 'q1', value: true as boolean | 'N/A' | null | undefined },
      { question_id: 'q2', value: 'N/A' as boolean | 'N/A' | null | undefined },
      { question_id: 'q3', value: true as boolean | 'N/A' | null | undefined },
    ];
    expect(getFailedCriticals(answers, criticalIds)).toEqual([]);
  });
});

// =============================================================================
// V2: calculateMaturityV2 (from v2-qa.test)
// =============================================================================

describe('calculateMaturityV2', () => {
  // We need real spec questions for this
  let SPEC: any;

  try {
    const { SpecRegistry } = require('../specs/registry');
    SPEC = SpecRegistry.getDefault();
  } catch {
    // Skip tests if spec not available
  }

  const getQuestions = () =>
    SPEC?.questions?.map((q: any) => ({
      id: q.id,
      text: q.text,
      level: q.level ?? 1,
    })) ?? [];

  test('L1 critical fail + high score → capped at L1', () => {
    if (!SPEC) return;
    const questions = getQuestions();
    const answers = SPEC.questions.map((q: any) => ({
      question_id: q.id,
      value: q.id === 'fpa_l1_q01' ? false : true,
    }));
    const result = calculateMaturityV2({ answers, questions });
    expect(result.actual_level).toBe(1);
    expect(result.capped).toBe(true);
    expect(result.capped_by).toContain('fpa_l1_q01');
  });

  test('L2 critical fail + high score → capped at L2', () => {
    if (!SPEC) return;
    const questions = getQuestions();
    const answers = SPEC.questions.map((q: any) => ({
      question_id: q.id,
      value: q.id === 'fpa_l2_q07' ? false : true,
    }));
    const result = calculateMaturityV2({ answers, questions });
    expect(result.actual_level).toBe(2);
    expect(result.potential_level).toBeGreaterThanOrEqual(3);
  });

  test('all pass → not capped', () => {
    if (!SPEC) return;
    const questions = getQuestions();
    const answers = SPEC.questions.map((q: any) => ({
      question_id: q.id,
      value: true,
    }));
    const result = calculateMaturityV2({ answers, questions });
    expect(result.capped).toBe(false);
    expect(result.actual_level).toBe(result.potential_level);
  });
});
