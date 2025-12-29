/**
 * VS-32b: Quality Heuristics Layer
 *
 * Code-based validation of Generator output.
 * Catches hallucinations without AI complexity.
 *
 * RED = Must fix (retry)
 * YELLOW = Warning (proceed with flag)
 */

import {
  OverviewSection,
  AIInterpretationInput,
  VS32bHeuristicResult,
  VS32bHeuristicViolation,
} from '../types';
import { validateAllEvidence } from '../evidence';

// Forbidden phrases that indicate weak consulting voice or hallucination
const FORBIDDEN_PHRASES = [
  'your score is',
  'you scored',
  'your organization scored',
  'the assessment shows',
  'based on your responses',
  'the diagnostic indicates',
  'room for improvement',
  'opportunities to enhance',
  'areas for development',
  'it is recommended',
  'you may want to consider',
  'you might want to',
  'could potentially',
];

/**
 * Run all heuristic checks on generated sections.
 * Returns pass/fail status with detailed violations.
 */
export function runHeuristics(
  sections: OverviewSection[],
  input: AIInterpretationInput
): VS32bHeuristicResult {
  const violations: VS32bHeuristicViolation[] = [];

  // Check section count (must be exactly 5)
  if (sections.length !== 5) {
    violations.push({
      section_id: null,
      rule: 'section_count',
      message: `Expected 5 sections, got ${sections.length}`,
      severity: 'red',
    });
  }

  for (const section of sections) {
    // Empty content check
    if (!section.content || section.content.trim().length === 0) {
      violations.push({
        section_id: section.id,
        rule: 'empty_content',
        message: 'Section has no content',
        severity: 'red',
      });
      continue;
    }

    const contentLower = section.content.toLowerCase();

    // Forbidden phrases check
    for (const phrase of FORBIDDEN_PHRASES) {
      if (contentLower.includes(phrase.toLowerCase())) {
        violations.push({
          section_id: section.id,
          rule: 'forbidden_phrase',
          message: `Contains forbidden phrase: "${phrase}"`,
          severity: 'red',
        });
      }
    }

    // Evidence validation
    if (!section.evidence_ids || section.evidence_ids.length === 0) {
      violations.push({
        section_id: section.id,
        rule: 'no_evidence',
        message: 'Section has no evidence IDs',
        severity: 'red',
      });
    } else {
      const { valid, invalid } = validateAllEvidence(
        section.evidence_ids,
        input.available_evidence
      );
      if (!valid) {
        violations.push({
          section_id: section.id,
          rule: 'invalid_evidence',
          message: `Invalid evidence IDs: ${invalid.join(', ')}`,
          severity: 'red',
        });
      }
    }

    // Word count check (max 150 words per section)
    const wordCount = section.content.split(/\s+/).length;
    if (wordCount > 150) {
      violations.push({
        section_id: section.id,
        rule: 'word_count',
        message: `Section has ${wordCount} words (max 150)`,
        severity: 'yellow',
      });
    }

    // Score contradiction check
    const scoreViolation = checkScoreContradiction(section, input);
    if (scoreViolation) {
      violations.push(scoreViolation);
    }

    // Level contradiction check
    const levelViolation = checkLevelContradiction(section, input);
    if (levelViolation) {
      violations.push(levelViolation);
    }
  }

  const red_count = violations.filter((v) => v.severity === 'red').length;
  const yellow_count = violations.filter((v) => v.severity === 'yellow').length;

  return {
    passed: red_count === 0,
    violations,
    red_count,
    yellow_count,
  };
}

/**
 * Check for score contradictions.
 * AI claiming a different score than actual results.
 */
function checkScoreContradiction(
  section: OverviewSection,
  input: AIInterpretationInput
): VS32bHeuristicViolation | null {
  // Look for percentage claims
  const percentMatches = section.content.match(/(\d{1,3})%/g);
  if (!percentMatches) return null;

  for (const match of percentMatches) {
    const claimedScore = parseInt(match.replace('%', ''), 10);

    // Check if claiming execution score
    if (
      section.content.toLowerCase().includes('execution') &&
      Math.abs(claimedScore - input.execution_score) > 5
    ) {
      // Allow 5% tolerance for rounding language
      const diff = Math.abs(claimedScore - input.execution_score);
      if (diff > 15) {
        return {
          section_id: section.id,
          rule: 'score_contradiction',
          message: `Claims ${claimedScore}% but actual execution score is ${input.execution_score}%`,
          severity: 'red',
        };
      }
    }

    // Check objective scores
    for (const obj of input.objectives) {
      if (section.content.toLowerCase().includes(obj.name.toLowerCase())) {
        if (Math.abs(claimedScore - obj.score) > 15) {
          return {
            section_id: section.id,
            rule: 'score_contradiction',
            message: `Claims ${obj.name} is ${claimedScore}% but actual is ${obj.score}%`,
            severity: 'red',
          };
        }
      }
    }
  }

  return null;
}

/**
 * Check for maturity level contradictions.
 * AI claiming a different level than actual results.
 */
function checkLevelContradiction(
  section: OverviewSection,
  input: AIInterpretationInput
): VS32bHeuristicViolation | null {
  const content = section.content.toLowerCase();

  // Look for level claims
  const levelPatterns = [/level\s*(\d)/gi, /l(\d)\s/gi, /maturity.*?(\d)/gi];

  for (const pattern of levelPatterns) {
    // Reset lastIndex for each pattern
    pattern.lastIndex = 0;
    const matches = [...content.matchAll(pattern)];

    for (const match of matches) {
      const claimedLevel = parseInt(match[1], 10);
      if (
        claimedLevel >= 1 &&
        claimedLevel <= 4 &&
        claimedLevel !== input.maturity_level
      ) {
        // Check context - might be talking about "reaching Level 3"
        const startIdx = Math.max(0, (match.index ?? 0) - 20);
        const endIdx = Math.min(content.length, (match.index ?? 0) + 30);
        const surroundingText = content.substring(startIdx, endIdx);

        // Skip if talking about target/goal/reach
        if (surroundingText.match(/reach|target|goal|toward|to level|unlock/i)) {
          continue;
        }

        return {
          section_id: section.id,
          rule: 'level_contradiction',
          message: `Claims Level ${claimedLevel} but actual maturity is Level ${input.maturity_level}`,
          severity: 'red',
        };
      }
    }
  }

  return null;
}

/**
 * Format violations for retry prompt.
 * Only includes RED violations that must be fixed.
 */
export function formatViolationsForRetry(
  violations: VS32bHeuristicViolation[]
): string {
  const redViolations = violations.filter((v) => v.severity === 'red');
  if (redViolations.length === 0) return '';

  return redViolations
    .map((v) => `- ${v.section_id || 'General'}: ${v.message}`)
    .join('\n');
}
