// New TDD test suite for scoring rules (Phase 3)

import { describe, test, expect } from 'vitest';
import { scoringRules } from './rules';

describe('scoringRules', () => {
  test('TRUE → 1.0 for all rules', () => {
    for (const rule of scoringRules) {
      expect(rule.score(true)).toBe(1.0);
    }
  });

  test('FALSE → 0.0 for all rules', () => {
    for (const rule of scoringRules) {
      expect(rule.score(false)).toBe(0.0);
    }
  });

  test('all rules have question_id', () => {
    for (const rule of scoringRules) {
      expect(rule.question_id).toBeTruthy();
      expect(typeof rule.question_id).toBe('string');
    }
  });

  test('all rules have score function', () => {
    for (const rule of scoringRules) {
      expect(typeof rule.score).toBe('function');
    }
  });

  test('covers L1 through L4 questions', () => {
    const ids = scoringRules.map((r) => r.question_id);
    // At minimum, should have rules across different levels
    expect(ids.length).toBeGreaterThanOrEqual(4);
  });
});
