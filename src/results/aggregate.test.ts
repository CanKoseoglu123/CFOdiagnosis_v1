// Migrated from dist/tests/vs5-qa.test.js — Aggregation Engine Tests
// Tests: missing scores, weight defaults, divide-by-zero, rounding, deterministic, isolation

import { describe, test, expect } from 'vitest';
import { aggregateResults } from './aggregate';
import { toAggregateSpec } from '../specs/toAggregateSpec';

const SINGLE_PILLAR_SPEC = {
  pillars: [
    {
      id: 'liquidity',
      questions: [
        { id: 'q1', weight: 1 },
        { id: 'q2', weight: 2 },
        { id: 'q3', weight: 1 },
      ],
    },
  ],
};

const MULTI_PILLAR_SPEC = {
  pillars: [
    {
      id: 'liquidity',
      questions: [
        { id: 'liq_1', weight: 1 },
        { id: 'liq_2', weight: 1 },
      ],
    },
    {
      id: 'fpa',
      questions: [
        { id: 'fpa_1', weight: 2 },
        { id: 'fpa_2', weight: 1 },
      ],
    },
  ],
};

const NO_WEIGHT_SPEC = {
  pillars: [
    {
      id: 'test',
      questions: [{ id: 'q1' }, { id: 'q2' }],
    },
  ],
};

const EMPTY_PILLAR_SPEC = {
  pillars: [
    {
      id: 'empty',
      questions: [] as any[],
    },
  ],
};

describe('aggregateResults (VS5)', () => {
  test('missing score rows excluded from denominator', () => {
    const scores = [
      { question_id: 'q1', score: 1.0 },
      { question_id: 'q3', score: 0.5 },
    ];
    const result = aggregateResults(SINGLE_PILLAR_SPEC as any, scores);
    expect(result.pillars[0].score).toBeCloseTo(0.75, 2);
    expect(result.pillars[0].scored_questions).toBe(2);
    expect(result.pillars[0].weight_sum).toBe(2);
  });

  test('weight defaults to 1', () => {
    const scores = [
      { question_id: 'q1', score: 1.0 },
      { question_id: 'q2', score: 0.0 },
    ];
    const result = aggregateResults(NO_WEIGHT_SPEC as any, scores);
    expect(result.pillars[0].score).toBeCloseTo(0.5, 2);
    expect(result.pillars[0].weight_sum).toBe(2);
  });

  test('empty pillar returns null score', () => {
    const result = aggregateResults(EMPTY_PILLAR_SPEC as any, []);
    expect(result.pillars[0].score).toBeNull();
    expect(result.overall_score).toBeNull();
  });

  test('pillar with no matching scores returns null', () => {
    const scores = [{ question_id: 'unknown', score: 1.0 }];
    const result = aggregateResults(SINGLE_PILLAR_SPEC as any, scores);
    expect(result.pillars[0].score).toBeNull();
  });

  test('1/3 rounds to 0.33', () => {
    const spec = {
      pillars: [
        {
          id: 'test',
          questions: [
            { id: 'q1', weight: 1 },
            { id: 'q2', weight: 1 },
            { id: 'q3', weight: 1 },
          ],
        },
      ],
    };
    const scores = [
      { question_id: 'q1', score: 1.0 },
      { question_id: 'q2', score: 0.0 },
      { question_id: 'q3', score: 0.0 },
    ];
    const result = aggregateResults(spec as any, scores);
    expect(result.pillars[0].score).toBe(0.33);
  });

  test('2/3 rounds to 0.67', () => {
    const spec = {
      pillars: [
        {
          id: 'test',
          questions: [
            { id: 'q1', weight: 1 },
            { id: 'q2', weight: 1 },
            { id: 'q3', weight: 1 },
          ],
        },
      ],
    };
    const scores = [
      { question_id: 'q1', score: 1.0 },
      { question_id: 'q2', score: 1.0 },
      { question_id: 'q3', score: 0.0 },
    ];
    const result = aggregateResults(spec as any, scores);
    expect(result.pillars[0].score).toBe(0.67);
  });

  test('deterministic output', () => {
    const scores = [
      { question_id: 'liq_1', score: 0.8 },
      { question_id: 'liq_2', score: 0.6 },
      { question_id: 'fpa_1', score: 1.0 },
      { question_id: 'fpa_2', score: 0.5 },
    ];
    const result1 = aggregateResults(MULTI_PILLAR_SPEC as any, scores);
    const result2 = aggregateResults(MULTI_PILLAR_SPEC as any, scores);
    const result3 = aggregateResults(MULTI_PILLAR_SPEC as any, scores);
    expect(result1).toEqual(result2);
    expect(result2).toEqual(result3);
  });

  test('pillar isolation', () => {
    const scores = [
      { question_id: 'liq_1', score: 1.0 },
      { question_id: 'liq_2', score: 1.0 },
      { question_id: 'fpa_1', score: 0.0 },
      { question_id: 'fpa_2', score: 0.0 },
    ];
    const result = aggregateResults(MULTI_PILLAR_SPEC as any, scores);
    expect(result.pillars[0].score).toBe(1.0);
    expect(result.pillars[1].score).toBe(0.0);
  });

  test('overall score calculation', () => {
    const scores = [
      { question_id: 'liq_1', score: 0.8 },
      { question_id: 'liq_2', score: 0.6 },
      { question_id: 'fpa_1', score: 1.0 },
      { question_id: 'fpa_2', score: 0.5 },
    ];
    const result = aggregateResults(MULTI_PILLAR_SPEC as any, scores);
    expect(result.pillars[0].score).toBe(0.7);
    expect(result.pillars[1].score).toBe(0.83);
    expect(result.overall_score).toBe(0.78);
  });
});

describe('toAggregateSpec adapter (VS5)', () => {
  test('converts full spec to aggregate spec', () => {
    const fullSpec: any = {
      version: 'v2.6.4',
      questions: [
        { id: 'annual_revenue', pillar: 'liquidity', weight: 1, text: 'Annual revenue?', is_critical: false },
        { id: 'cash_reserves', pillar: 'liquidity', weight: 2, text: 'Cash reserves?', is_critical: false },
        { id: 'forecast_accuracy', pillar: 'fpa', weight: 1, text: 'Forecast accuracy?', is_critical: false },
      ],
      pillars: [
        { id: 'liquidity', name: 'Liquidity', weight: 1 },
        { id: 'fpa', name: 'FP&A', weight: 1 },
      ],
      maturityGates: [],
      actions: [],
    };
    const aggregateSpec = toAggregateSpec(fullSpec);
    expect(aggregateSpec.pillars.length).toBe(2);
    expect(aggregateSpec.pillars[0].questions.length).toBe(2);
    expect(aggregateSpec.pillars[1].questions.length).toBe(1);
    expect(aggregateSpec.pillars[0].questions[0].id).toBe('annual_revenue');
    expect(aggregateSpec.pillars[0].questions[1].weight).toBe(2);
  });
});
