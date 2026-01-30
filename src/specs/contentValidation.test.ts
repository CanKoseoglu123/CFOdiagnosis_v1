// Migrated from dist/tests/vs9-qa.test.js — Content Validation Tests
// Tests spec internal consistency: required fields, references, gates, distributions

import { describe, test, expect } from 'vitest';
import { SpecRegistry } from './registry';

let SPEC: any;
try {
  SPEC = SpecRegistry.getDefault();
} catch {
  // Will skip tests if spec not available
}

describe('Content validation (VS9)', () => {
  test('spec is loadable', () => {
    expect(SPEC).toBeTruthy();
  });

  describe('spec structure', () => {
    test('has version', () => {
      if (!SPEC) return;
      expect(SPEC.version).toBeTruthy();
    });

    test('has pillars', () => {
      if (!SPEC) return;
      expect(SPEC.pillars.length).toBeGreaterThan(0);
    });

    test('has questions', () => {
      if (!SPEC) return;
      expect(SPEC.questions.length).toBeGreaterThan(0);
    });

    test('has 5 maturity levels (0-4)', () => {
      if (!SPEC) return;
      expect(SPEC.maturityGates.length).toBe(5);
    });

    test('has actions', () => {
      if (!SPEC) return;
      expect(SPEC.actions.length).toBeGreaterThan(0);
    });

    test('has objectives', () => {
      if (!SPEC) return;
      expect(SPEC.objectives).toBeTruthy();
      expect(SPEC.objectives.length).toBeGreaterThan(0);
    });
  });

  describe('question completeness', () => {
    test('all questions have required fields', () => {
      if (!SPEC) return;
      for (const q of SPEC.questions) {
        expect(q.id.length).toBeGreaterThan(0);
        expect(q.pillar.length).toBeGreaterThan(0);
        expect(q.text.length).toBeGreaterThan(0);
        expect(typeof q.weight).toBe('number');
      }
    });
  });

  describe('referential integrity', () => {
    test('all questions reference valid pillars', () => {
      if (!SPEC) return;
      const pillarIds = new Set(SPEC.pillars.map((p: any) => p.id));
      for (const q of SPEC.questions) {
        expect(pillarIds.has(q.pillar)).toBe(true);
      }
    });

    test('all questions reference valid objectives (VS20)', () => {
      if (!SPEC) return;
      const objectiveIds = new Set(SPEC.objectives?.map((o: any) => o.id) || []);
      for (const q of SPEC.questions) {
        if (q.objective_id) {
          expect(objectiveIds.has(q.objective_id)).toBe(true);
        }
      }
    });

    test('all maturity gate evidence exists as questions', () => {
      if (!SPEC) return;
      const questionIds = new Set(SPEC.questions.map((q: any) => q.id));
      for (const gate of SPEC.maturityGates) {
        for (const evidenceId of gate.required_evidence_ids) {
          expect(questionIds.has(evidenceId)).toBe(true);
        }
      }
    });
  });

  describe('maturity gates', () => {
    test('gates are sequential (0, 1, 2, 3, 4)', () => {
      if (!SPEC) return;
      const sorted = [...SPEC.maturityGates].sort((a: any, b: any) => a.level - b.level);
      for (let i = 0; i < sorted.length; i++) {
        expect(sorted[i].level).toBe(i);
      }
    });
  });

  describe('content summary (v2.9.0 — 97-question FP&A)', () => {
    test('97 FP&A questions', () => {
      if (!SPEC) return;
      const fpaQuestions = SPEC.questions.filter((q: any) => q.pillar === 'fpa');
      expect(fpaQuestions.length).toBe(97);
    });

    test('11 critical questions (L1: 6, L2: 5)', () => {
      if (!SPEC) return;
      const criticals = SPEC.questions.filter((q: any) => q.is_critical);
      expect(criticals.length).toBe(11);
    });

    test('8 actions', () => {
      if (!SPEC) return;
      expect(SPEC.actions.length).toBe(8);
    });

    test('9 objectives', () => {
      if (!SPEC) return;
      expect(SPEC.objectives.length).toBe(9);
    });
  });

  describe('question distribution', () => {
    test('L1=17, L2=34, L3=29, L4=17', () => {
      if (!SPEC) return;
      expect(SPEC.questions.filter((q: any) => q.level === 1).length).toBe(17);
      expect(SPEC.questions.filter((q: any) => q.level === 2).length).toBe(34);
      expect(SPEC.questions.filter((q: any) => q.level === 3).length).toBe(29);
      expect(SPEC.questions.filter((q: any) => q.level === 4).length).toBe(17);
    });

    test('critical distribution: L1=6, L2=5, L3=0, L4=0', () => {
      if (!SPEC) return;
      expect(SPEC.questions.filter((q: any) => q.level === 1 && q.is_critical).length).toBe(6);
      expect(SPEC.questions.filter((q: any) => q.level === 2 && q.is_critical).length).toBe(5);
      expect(SPEC.questions.filter((q: any) => q.level === 3 && q.is_critical).length).toBe(0);
      expect(SPEC.questions.filter((q: any) => q.level === 4 && q.is_critical).length).toBe(0);
    });

    test('objectives per level', () => {
      if (!SPEC) return;
      expect(SPEC.objectives.filter((o: any) => o.level === 1).length).toBe(2);
      expect(SPEC.objectives.filter((o: any) => o.level === 2).length).toBe(2);
      expect(SPEC.objectives.filter((o: any) => o.level === 3).length).toBe(3);
      expect(SPEC.objectives.filter((o: any) => o.level === 4).length).toBe(2);
    });
  });

  describe('objective & action completeness', () => {
    test('all objectives have required fields', () => {
      if (!SPEC) return;
      for (const obj of SPEC.objectives) {
        expect(obj.id.length).toBeGreaterThan(0);
        expect(obj.pillar_id.length).toBeGreaterThan(0);
        expect(typeof obj.level).toBe('number');
        expect(obj.name.length).toBeGreaterThan(0);
        expect(obj.description.length).toBeGreaterThan(0);
        expect(obj.action_id).toBeTruthy();
      }
    });

    test('all actions have required fields', () => {
      if (!SPEC) return;
      for (const a of SPEC.actions) {
        expect(a.id.length).toBeGreaterThan(0);
        expect(a.title.length).toBeGreaterThan(0);
        expect(a.description.length).toBeGreaterThan(20);
        expect(a.rationale.length).toBeGreaterThan(20);
        expect(['critical', 'high', 'medium']).toContain(a.priority);
      }
    });
  });
});
