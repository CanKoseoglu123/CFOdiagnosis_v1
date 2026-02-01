/**
 * Executive Commentary Heuristic Validation
 *
 * Simplified heuristic runner for executive sections.
 * No evidence tag requirement (executive sections don't use evidence tags).
 */

import { HeuristicResult, HeuristicViolation } from './types';
import { ExecutiveSection } from './executive-generator';
import { ExecutiveCommentaryInput } from './executive-prompt';

// Executive sections expected
const EXPECTED_SECTION_IDS = ['current_state', 'actions_committed', 'projected_state'];
const MAX_WORDS_PER_SECTION = 150;
const HARD_WORD_LIMIT = 200;

// Forbidden phrases (subset of pillar pack + executive-specific)
const FORBIDDEN_PHRASES = [
  'your score is',
  'you scored',
  'based on your responses',
  'the assessment shows',
  'room for improvement',
  'opportunities to enhance',
  'areas for development',
  'it is recommended',
  'you may want to consider',
  'best-in-class',
  'world-class',
  'digital transformation journey',
];

export function runExecutiveHeuristics(
  sections: ExecutiveSection[],
  input: ExecutiveCommentaryInput
): HeuristicResult {
  const violations: HeuristicViolation[] = [];

  // Section count check
  if (sections.length !== EXPECTED_SECTION_IDS.length) {
    violations.push({
      rule: 'section_count',
      section_id: null,
      message: `Expected ${EXPECTED_SECTION_IDS.length} sections, got ${sections.length}`,
      severity: 'error',
    });
  }

  // Check each expected section exists
  for (const expectedId of EXPECTED_SECTION_IDS) {
    if (!sections.find(s => s.id === expectedId)) {
      violations.push({
        rule: 'missing_section',
        section_id: expectedId,
        message: `Missing required section: ${expectedId}`,
        severity: 'error',
      });
    }
  }

  for (const section of sections) {
    // Empty content check
    if (!section.content?.trim()) {
      violations.push({
        rule: 'empty_content',
        section_id: section.id,
        message: 'Empty content',
        severity: 'error',
      });
      continue;
    }

    const contentLower = section.content.toLowerCase();

    // Forbidden phrase check
    for (const phrase of FORBIDDEN_PHRASES) {
      if (contentLower.includes(phrase.toLowerCase())) {
        violations.push({
          rule: 'forbidden_phrase',
          section_id: section.id,
          message: `Contains: "${phrase}"`,
          severity: 'error',
        });
      }
    }

    // Word count check (soft limit)
    const wordCount = section.content.split(/\s+/).length;
    if (wordCount > MAX_WORDS_PER_SECTION) {
      violations.push({
        rule: 'word_count',
        section_id: section.id,
        message: `${wordCount} words (max ${MAX_WORDS_PER_SECTION})`,
        severity: 'warning',
      });
    }

    // Hard word limit
    if (wordCount > HARD_WORD_LIMIT) {
      violations.push({
        rule: 'word_count_hard',
        section_id: section.id,
        message: `${wordCount} words exceeds hard limit of ${HARD_WORD_LIMIT}`,
        severity: 'error',
      });
    }

    // Score contradiction check for executive sections
    const scoreViolation = checkExecutiveScoreContradiction(section, input);
    if (scoreViolation) violations.push(scoreViolation);
  }

  return {
    passed: violations.filter(v => v.severity === 'error').length === 0,
    violations,
  };
}

/**
 * Check that percentage claims in executive sections match actual data
 */
function checkExecutiveScoreContradiction(
  section: ExecutiveSection,
  input: ExecutiveCommentaryInput
): HeuristicViolation | null {
  const matches = section.content.match(/(\d{1,3})%/g);
  if (!matches) return null;

  // Known thresholds that may be referenced
  const KNOWN_THRESHOLDS = [40, 65, 85, 100];

  for (const match of matches) {
    const claimed = parseInt(match);
    if (claimed < 20 || claimed > 100) continue;

    // Check against current/projected scores
    if (Math.abs(claimed - input.current_score) <= 3) continue;
    if (Math.abs(claimed - input.projected_score) <= 3) continue;

    // Check against objective scores
    const matchesObj = input.objectives.some(
      o => Math.abs(claimed - o.current_score) <= 3 || Math.abs(claimed - o.projected_score) <= 3
    );
    if (matchesObj) continue;

    // Allow known maturity thresholds
    if (KNOWN_THRESHOLDS.some(t => Math.abs(claimed - t) <= 5)) continue;

    return {
      rule: 'score_hallucination',
      section_id: section.id,
      message: `Claims ${claimed}% - not in actual data`,
      severity: 'error',
    };
  }

  return null;
}
