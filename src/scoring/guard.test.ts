// New TDD test suite for scoring guard (Phase 3)

import { describe, test, expect } from 'vitest';
import { assertNormalizedScore } from './guard';

describe('assertNormalizedScore', () => {
  test('accepts 0.0', () => {
    expect(() => assertNormalizedScore('q1', 0.0)).not.toThrow();
  });

  test('accepts 1.0', () => {
    expect(() => assertNormalizedScore('q1', 1.0)).not.toThrow();
  });

  test('accepts 0.5', () => {
    expect(() => assertNormalizedScore('q1', 0.5)).not.toThrow();
  });

  test('rejects negative score', () => {
    expect(() => assertNormalizedScore('q1', -0.1)).toThrow(
      'must be normalized 0.0–1.0'
    );
  });

  test('rejects score > 1.0', () => {
    expect(() => assertNormalizedScore('q1', 1.1)).toThrow(
      'must be normalized 0.0–1.0'
    );
  });

  test('rejects NaN', () => {
    expect(() => assertNormalizedScore('q1', NaN)).toThrow(
      'not a valid number'
    );
  });

  test('error message includes question_id', () => {
    expect(() => assertNormalizedScore('fpa_q01', -1)).toThrow('fpa_q01');
  });
});
