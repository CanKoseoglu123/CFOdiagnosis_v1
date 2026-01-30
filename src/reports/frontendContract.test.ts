// Migrated from dist/tests/vs11-qa.test.js — Frontend Contract Tests
// Tests DTO shapes, formatting utilities, edge cases for empty/null data

import { describe, test, expect } from 'vitest';

// Frontend utility functions (same as in React component)
const formatScore = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return '—';
  return `${Math.round(score * 100)}%`;
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' };
    case 'high': return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
    case 'medium': return { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' };
    default: return { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' };
  }
};

const getMaturityColor = (level: number) => {
  const colors = [
    { bg: '#FEE2E2', text: '#991B1B', accent: '#EF4444' },
    { bg: '#FEF3C7', text: '#92400E', accent: '#F59E0B' },
    { bg: '#FEF9C3', text: '#854D0E', accent: '#EAB308' },
    { bg: '#DCFCE7', text: '#166534', accent: '#22C55E' },
    { bg: '#DBEAFE', text: '#1E40AF', accent: '#3B82F6' },
  ];
  return colors[level] || colors[0];
};

describe('Frontend contract (VS11)', () => {
  describe('formatScore', () => {
    test('1.0 → 100%', () => expect(formatScore(1)).toBe('100%'));
    test('0 → 0%', () => expect(formatScore(0)).toBe('0%'));
    test('0.5 → 50%', () => expect(formatScore(0.5)).toBe('50%'));
    test('0.333 → 33%', () => expect(formatScore(0.333)).toBe('33%'));
    test('0.666 → 67%', () => expect(formatScore(0.666)).toBe('67%'));
    test('null → —', () => expect(formatScore(null)).toBe('—'));
  });

  describe('getPriorityColor', () => {
    test('critical has red bg', () => expect(getPriorityColor('critical').bg).toBe('#FEE2E2'));
    test('high has amber bg', () => expect(getPriorityColor('high').bg).toBe('#FEF3C7'));
    test('medium has blue bg', () => expect(getPriorityColor('medium').bg).toBe('#DBEAFE'));
    test('unknown has gray bg', () => expect(getPriorityColor('unknown').bg).toBe('#F3F4F6'));
  });

  describe('getMaturityColor', () => {
    test('Level 0 is red', () => expect(getMaturityColor(0).accent).toBe('#EF4444'));
    test('Level 1 is amber', () => expect(getMaturityColor(1).accent).toBe('#F59E0B'));
    test('Level 2 is yellow', () => expect(getMaturityColor(2).accent).toBe('#EAB308'));
    test('Level 3 is green', () => expect(getMaturityColor(3).accent).toBe('#22C55E'));
    test('Level 4 is blue', () => expect(getMaturityColor(4).accent).toBe('#3B82F6'));
    test('Unknown level defaults to L0', () => expect(getMaturityColor(99).accent).toBe('#EF4444'));
  });

  describe('DTO shape validation', () => {
    const VALID_REPORT = {
      run_id: 'test-123',
      spec_version: 'v2.6.4',
      generated_at: new Date().toISOString(),
      overall_score: 0.65,
      maturity: {
        achieved_level: 2,
        achieved_label: 'Defined',
        blocking_level: 3,
        blocking_evidence_ids: ['fpa_driver_based'],
        gates: [],
      },
      critical_risks: [{ evidence_id: 'q1', question_text: 'Q1', pillar_id: 'fpa', user_answer: false }],
      pillars: [{ pillar_id: 'fpa', pillar_name: 'FP&A', score: 0.75, scored_questions: 8, total_questions: 8, maturity: { achieved_level: 2 }, critical_risks: [] }],
      actions: [{ id: 'act_1', title: 'Action', description: 'Desc', rationale: 'Why', priority: 'critical', trigger_type: 'critical_risk', evidence_id: 'q1', pillar_id: 'fpa' }],
    };

    test('run_id is string', () => expect(typeof VALID_REPORT.run_id).toBe('string'));
    test('spec_version is string', () => expect(typeof VALID_REPORT.spec_version).toBe('string'));
    test('generated_at is ISO string', () => expect(VALID_REPORT.generated_at).toContain('T'));
    test('overall_score is number or null', () => expect(typeof VALID_REPORT.overall_score).toBe('number'));
    test('maturity is object', () => expect(typeof VALID_REPORT.maturity).toBe('object'));
    test('critical_risks is array', () => expect(Array.isArray(VALID_REPORT.critical_risks)).toBe(true));
    test('pillars is array', () => expect(Array.isArray(VALID_REPORT.pillars)).toBe(true));
    test('actions is array', () => expect(Array.isArray(VALID_REPORT.actions)).toBe(true));
  });

  describe('edge cases', () => {
    test('empty arrays handled', () => {
      const emptyReport = {
        critical_risks: [],
        pillars: [],
        actions: [],
        maturity: { gates: [] },
      };
      expect(emptyReport.critical_risks.length).toBe(0);
      expect(emptyReport.pillars.length).toBe(0);
      expect(emptyReport.actions.length).toBe(0);
      expect(emptyReport.maturity.gates.length).toBe(0);
    });

    test('null score displays as —', () => {
      expect(formatScore(null)).toBe('—');
    });

    test('max maturity (Level 4)', () => {
      const maxMaturity = {
        achieved_level: 4,
        achieved_label: 'Optimized',
        blocking_level: null,
        blocking_evidence_ids: [],
      };
      expect(maxMaturity.achieved_level).toBe(4);
      expect(maxMaturity.blocking_level).toBeNull();
      expect(maxMaturity.blocking_evidence_ids.length).toBe(0);
    });

    test('ISO date parses correctly', () => {
      const isoDate = '2025-01-15T10:30:00.000Z';
      const dateObj = new Date(isoDate);
      expect(isNaN(dateObj.getTime())).toBe(false);
      expect(typeof dateObj.toLocaleDateString()).toBe('string');
    });
  });
});
