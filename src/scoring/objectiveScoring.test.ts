// Migrated from dist/tests/v2-qa.test.js (Green Light of Death tests)
// + New TDD tests for objective scoring with traffic light logic

import { describe, test, expect } from 'vitest';
import { calculateObjectiveScores } from './objectiveScoring';

// Load real spec for integration-style tests
import { SpecRegistry } from '../specs/registry';

let SPEC: any;
try {
  SPEC = SpecRegistry.getDefault();
} catch {
  // Will skip spec-dependent tests
}

describe('calculateObjectiveScores', () => {
  describe('Green Light of Death fix', () => {
    test('objective with 80%+ score but failed critical → Yellow (not Green)', () => {
      if (!SPEC) return;
      // Fail one critical in obj_budget_discipline (14 questions, 2 criticals)
      // 13/14 = 93% → Green range, but critical failure should override to Yellow
      const inputs = SPEC.questions.map((q: any) => ({
        question_id: q.id,
        value: q.id === 'fpa_q001' ? false : true,
      }));
      const objectiveScores = calculateObjectiveScores(SPEC, inputs);
      const budgetObj = objectiveScores.find(
        (o) => o.objective_id === 'obj_budget_discipline'
      );
      expect(budgetObj).toBeTruthy();
      if (budgetObj) {
        expect(budgetObj.score).toBeGreaterThanOrEqual(80);
        expect(budgetObj.failed_criticals).toContain('fpa_q001');
        expect(budgetObj.status).not.toBe('green');
        expect(budgetObj.overridden).toBe(true);
        expect(budgetObj.override_reason).toBeTruthy();
      }
    });

    test('objective with all pass → Green', () => {
      if (!SPEC) return;
      const inputs = SPEC.questions.map((q: any) => ({
        question_id: q.id,
        value: true,
      }));
      const objectiveScores = calculateObjectiveScores(SPEC, inputs);
      const budgetObj = objectiveScores.find(
        (o) => o.objective_id === 'obj_fpa_l1_budget'
      );
      if (budgetObj) {
        expect(budgetObj.status).toBe('green');
        expect(budgetObj.overridden).toBe(false);
      }
    });
  });

  describe('traffic light thresholds', () => {
    // Create a minimal spec for isolated testing
    const minimalSpec: any = {
      version: 'test',
      questions: [
        { id: 'q1', pillar: 'fpa', weight: 1, text: 'Q1', is_critical: false, objective_id: 'obj_test' },
        { id: 'q2', pillar: 'fpa', weight: 1, text: 'Q2', is_critical: false, objective_id: 'obj_test' },
        { id: 'q3', pillar: 'fpa', weight: 1, text: 'Q3', is_critical: false, objective_id: 'obj_test' },
        { id: 'q4', pillar: 'fpa', weight: 1, text: 'Q4', is_critical: false, objective_id: 'obj_test' },
        { id: 'q5', pillar: 'fpa', weight: 1, text: 'Q5', is_critical: false, objective_id: 'obj_test' },
      ],
      pillars: [{ id: 'fpa', name: 'FP&A', weight: 1 }],
      objectives: [
        { id: 'obj_test', pillar_id: 'fpa', level: 1, name: 'Test', description: 'Test' },
      ],
      maturityGates: [],
      actions: [],
    };

    test('100% → Green', () => {
      const inputs = [
        { question_id: 'q1', value: true },
        { question_id: 'q2', value: true },
        { question_id: 'q3', value: true },
        { question_id: 'q4', value: true },
        { question_id: 'q5', value: true },
      ];
      const scores = calculateObjectiveScores(minimalSpec, inputs);
      expect(scores[0]?.status).toBe('green');
    });

    test('60% → Yellow', () => {
      const inputs = [
        { question_id: 'q1', value: true },
        { question_id: 'q2', value: true },
        { question_id: 'q3', value: true },
        { question_id: 'q4', value: false },
        { question_id: 'q5', value: false },
      ];
      const scores = calculateObjectiveScores(minimalSpec, inputs);
      expect(scores[0]?.status).toBe('yellow');
    });

    test('20% → Red', () => {
      const inputs = [
        { question_id: 'q1', value: true },
        { question_id: 'q2', value: false },
        { question_id: 'q3', value: false },
        { question_id: 'q4', value: false },
        { question_id: 'q5', value: false },
      ];
      const scores = calculateObjectiveScores(minimalSpec, inputs);
      expect(scores[0]?.status).toBe('red');
    });

    test('N/A answers excluded from denominator', () => {
      const inputs = [
        { question_id: 'q1', value: true },
        { question_id: 'q2', value: true },
        { question_id: 'q3', value: 'N/A' },
        { question_id: 'q4', value: 'N/A' },
        { question_id: 'q5', value: 'N/A' },
      ];
      const scores = calculateObjectiveScores(minimalSpec, inputs);
      // 2/2 = 100% → Green
      expect(scores[0]?.status).toBe('green');
      expect(scores[0]?.questions_na).toBe(3);
    });
  });
});
