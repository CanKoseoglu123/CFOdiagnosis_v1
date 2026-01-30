// New TDD test suite for gates module (Phase 3)
// Verifies gates load correctly from SSOT and match spec requirements

import { describe, test, expect } from 'vitest';
import {
  L1_CRITICALS,
  L2_CRITICALS,
  ALL_CRITICALS,
  SCORE_THRESHOLDS,
  LEVEL_NAMES,
} from './index';

describe('Gates SSOT (content/gates.json)', () => {
  test('L1_CRITICALS is a non-empty array', () => {
    expect(Array.isArray(L1_CRITICALS)).toBe(true);
    expect(L1_CRITICALS.length).toBeGreaterThan(0);
  });

  test('L2_CRITICALS is a non-empty array', () => {
    expect(Array.isArray(L2_CRITICALS)).toBe(true);
    expect(L2_CRITICALS.length).toBeGreaterThan(0);
  });

  test('ALL_CRITICALS = L1 + L2', () => {
    expect(ALL_CRITICALS.length).toBe(L1_CRITICALS.length + L2_CRITICALS.length);
    for (const id of L1_CRITICALS) {
      expect(ALL_CRITICALS).toContain(id);
    }
    for (const id of L2_CRITICALS) {
      expect(ALL_CRITICALS).toContain(id);
    }
  });

  test('L1 has 3 critical questions', () => {
    expect(L1_CRITICALS.length).toBe(3);
  });

  test('L2 has 5 critical questions', () => {
    expect(L2_CRITICALS.length).toBe(5);
  });

  test('8 total criticals', () => {
    expect(ALL_CRITICALS.length).toBe(8);
  });

  test('no duplicate critical IDs', () => {
    const unique = new Set(ALL_CRITICALS);
    expect(unique.size).toBe(ALL_CRITICALS.length);
  });

  test('all critical IDs are strings', () => {
    for (const id of ALL_CRITICALS) {
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    }
  });
});

describe('Score thresholds', () => {
  test('LEVEL_2 threshold matches spec (40)', () => {
    expect(SCORE_THRESHOLDS.LEVEL_2).toBe(40);
  });

  test('LEVEL_3 threshold matches spec (65)', () => {
    expect(SCORE_THRESHOLDS.LEVEL_3).toBe(65);
  });

  test('LEVEL_4 threshold matches spec (85)', () => {
    expect(SCORE_THRESHOLDS.LEVEL_4).toBe(85);
  });

  test('thresholds are ascending', () => {
    expect(SCORE_THRESHOLDS.LEVEL_2).toBeLessThan(SCORE_THRESHOLDS.LEVEL_3);
    expect(SCORE_THRESHOLDS.LEVEL_3).toBeLessThan(SCORE_THRESHOLDS.LEVEL_4);
  });
});

describe('Level names', () => {
  test('LEVEL_NAMES has entries for levels 1-4', () => {
    expect(LEVEL_NAMES[1]).toBeTruthy();
    expect(LEVEL_NAMES[2]).toBeTruthy();
    expect(LEVEL_NAMES[3]).toBeTruthy();
    expect(LEVEL_NAMES[4]).toBeTruthy();
  });

  test('level names are strings', () => {
    for (const [, name] of Object.entries(LEVEL_NAMES)) {
      expect(typeof name).toBe('string');
    }
  });
});
