// src/maturity/footprint.ts
// VS-23: Maturity Footprint Computation
// Evidence state and focus next prioritization

import { FPA_PRACTICES, Practice, EvidenceState, LEVEL_NAMES } from '../specs/practices';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface Question {
  id: string;
  is_critical?: boolean;
  [key: string]: unknown;
}

export interface Answer {
  question_id: string;
  value: boolean | string | null;
}

export interface PracticeWithEvidence {
  id: string;
  title: string;
  description: string;
  maturity_level: number;
  theme_id: string;
  evidence_state: EvidenceState;
  has_critical: boolean;  // Computed from questions at runtime
  gap_score: number;      // 0 = proven, 1 = not_proven
}

export interface LevelSummary {
  level: 1 | 2 | 3 | 4;
  name: string;
  practices: PracticeWithEvidence[];
  proven_count: number;
  partial_count: number;
  total_count: number;
}

export interface FocusItem {
  practice_id: string;
  practice_title: string;
  level: number;
  priority_score: number;
  reason: 'critical_gap' | 'foundation_gap' | 'optimization_gap';
}

export interface MaturityFootprint {
  levels: LevelSummary[];
  focus_next: FocusItem[];
  summary_text: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Core Computation Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute evidence state for a practice based on answers
 * - proven: 100% YES
 * - partial: 50-99% YES
 * - not_proven: <50% YES or no applicable answers
 */
export function computeEvidenceState(
  practice: Practice,
  answers: Answer[]
): EvidenceState {
  // Get answers for this practice's questions
  const practiceAnswers = answers.filter(a =>
    practice.question_ids.includes(a.question_id)
  );

  // Filter out N/A answers
  const applicable = practiceAnswers.filter(a =>
    a.value !== 'N/A' && a.value !== null && a.value !== undefined
  );

  if (applicable.length === 0) {
    return 'not_proven';
  }

  // Count YES answers (true or 'YES')
  const yesCount = applicable.filter(a =>
    a.value === true || a.value === 'YES'
  ).length;

  const coverage = yesCount / applicable.length;

  if (coverage >= 1.0) return 'proven';
  if (coverage >= 0.5) return 'partial';
  return 'not_proven';
}

/**
 * Check if a practice contains any critical questions
 * Critical is evaluated at runtime from questions, NOT stored on practice
 */
export function practiceHasCritical(
  practice: Practice,
  questions: Question[]
): boolean {
  return practice.question_ids.some(qid => {
    const question = questions.find(q => q.id === qid);
    return question?.is_critical === true;
  });
}

/**
 * Compute gap score for prioritization
 * 0 = proven (no gap), 0.5 = partial, 1 = not_proven (full gap)
 */
function computeGapScore(evidenceState: EvidenceState): number {
  switch (evidenceState) {
    case 'proven': return 0;
    case 'partial': return 0.5;
    case 'not_proven': return 1;
    default: return 1;
  }
}

/**
 * Build practice with evidence state attached
 */
function buildPracticeWithEvidence(
  practice: Practice,
  answers: Answer[],
  questions: Question[]
): PracticeWithEvidence {
  const evidenceState = computeEvidenceState(practice, answers);

  return {
    id: practice.id,
    title: practice.title,
    description: practice.description,
    maturity_level: practice.maturity_level,
    theme_id: practice.theme_id,
    evidence_state: evidenceState,
    has_critical: practiceHasCritical(practice, questions),
    gap_score: computeGapScore(evidenceState)
  };
}

/**
 * Compute Focus Next: Top 3 gaps by priority
 * Priority = levelWeight × gapScore × criticalBoost
 */
export function computeFocusNext(
  practices: PracticeWithEvidence[]
): FocusItem[] {
  // Filter to gaps only (not proven)
  const gaps = practices.filter(p => p.evidence_state !== 'proven');

  // Score each gap
  const scored = gaps.map(p => {
    // Level weight: L1=4, L2=3, L3=2, L4=1 (lower levels more important)
    const levelWeight = 5 - p.maturity_level;

    // Critical gaps get 2x boost
    const criticalBoost = p.has_critical ? 2 : 1;

    // Priority score
    const score = levelWeight * p.gap_score * criticalBoost;

    // Determine reason
    let reason: 'critical_gap' | 'foundation_gap' | 'optimization_gap';
    if (p.has_critical) {
      reason = 'critical_gap';
    } else if (p.maturity_level <= 2) {
      reason = 'foundation_gap';
    } else {
      reason = 'optimization_gap';
    }

    return {
      practice_id: p.id,
      practice_title: p.title,
      level: p.maturity_level,
      priority_score: score,
      reason
    };
  });

  // Sort by priority (descending) and take top 3
  return scored
    .sort((a, b) => b.priority_score - a.priority_score)
    .slice(0, 3);
}

/**
 * Generate dynamic summary text based on footprint pattern
 */
function generateSummaryText(levels: LevelSummary[]): string {
  const l1 = levels.find(l => l.level === 1);
  const l2 = levels.find(l => l.level === 2);
  const l3 = levels.find(l => l.level === 3);
  const l4 = levels.find(l => l.level === 4);

  const l1Complete = l1 && l1.proven_count === l1.total_count;
  const l2Complete = l2 && l2.proven_count === l2.total_count;
  const l3Complete = l3 && l3.proven_count === l3.total_count;
  const l4Complete = l4 && l4.proven_count === l4.total_count;

  const l3HasProgress = l3 && l3.proven_count > 0;
  const l2HasGaps = l2 && l2.proven_count < l2.total_count;
  const l1HasGaps = l1 && l1.proven_count < l1.total_count;

  // Uneven footprint: L3 progress but L2 gaps
  if (l3HasProgress && l2HasGaps) {
    return 'Your footprint is uneven: L3 planning capabilities exist, but L2 reliability gaps block scale.';
  }

  // All complete
  if (l1Complete && l2Complete && l3Complete && l4Complete) {
    return 'Exceptional maturity across all levels. Focus on continuous improvement.';
  }

  // L1+L2 complete, working on L3
  if (l1Complete && l2Complete && !l3Complete) {
    return 'Strong foundation. Focus on L3 capabilities to advance to Managed level.';
  }

  // L1 complete, L2 in progress
  if (l1Complete && !l2Complete) {
    return 'Foundation established. Build L2 discipline to unlock consistent execution.';
  }

  // L1 gaps remain
  if (l1HasGaps) {
    return 'Foundation gaps remain. Address L1 basics before advancing to higher levels.';
  }

  // Default
  return 'Mixed maturity profile. Focus on critical gaps to unlock the next level.';
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Builder Function
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build complete maturity footprint from answers
 */
export function buildMaturityFootprint(
  answers: Answer[],
  questions: Question[]
): MaturityFootprint {
  // Build practices with evidence
  const practicesWithEvidence = FPA_PRACTICES.map(p =>
    buildPracticeWithEvidence(p, answers, questions)
  );

  // Group by level
  const levels: LevelSummary[] = [1, 2, 3, 4].map(levelNum => {
    const levelPractices = practicesWithEvidence.filter(
      p => p.maturity_level === levelNum
    );

    return {
      level: levelNum as 1 | 2 | 3 | 4,
      name: LEVEL_NAMES[levelNum] || `Level ${levelNum}`,
      practices: levelPractices,
      proven_count: levelPractices.filter(p => p.evidence_state === 'proven').length,
      partial_count: levelPractices.filter(p => p.evidence_state === 'partial').length,
      total_count: levelPractices.length
    };
  });

  // Compute focus next
  const focusNext = computeFocusNext(practicesWithEvidence);

  // Generate summary
  const summaryText = generateSummaryText(levels);

  return {
    levels,
    focus_next: focusNext,
    summary_text: summaryText
  };
}
