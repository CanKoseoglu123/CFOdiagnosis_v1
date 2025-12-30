/**
 * VS-32: Heuristics - Code-based validation of AI output
 */

import { OverviewSection, InterpretationInput, HeuristicResult, HeuristicViolation } from './types';
import { PillarPack } from '../pillars/registry';

export function runHeuristics(
  sections: OverviewSection[],
  input: InterpretationInput,
  pack: PillarPack
): HeuristicResult {
  const violations: HeuristicViolation[] = [];

  // Section count
  if (sections.length !== pack.sections.length) {
    violations.push({
      rule: 'section_count',
      section_id: null,
      message: `Expected ${pack.sections.length} sections, got ${sections.length}`,
      severity: 'error',
    });
  }

  for (const section of sections) {
    const config = pack.sections.find(s => s.id === section.id);
    if (!config) continue;

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

    // Forbidden phrases
    for (const phrase of pack.forbidden_phrases) {
      if (contentLower.includes(phrase.toLowerCase())) {
        violations.push({
          rule: 'forbidden_phrase',
          section_id: section.id,
          message: `Contains: "${phrase}"`,
          severity: 'error',
        });
      }
    }

    // Word count (with grace margin)
    const wordCount = section.content.split(/\s+/).length;
    if (wordCount > config.max_words + 30) {
      violations.push({
        rule: 'word_count',
        section_id: section.id,
        message: `${wordCount} words (max ${config.max_words})`,
        severity: 'warning',
      });
    }

    // Evidence tags
    const tags = section.content.match(/\[\[([^\]]+)\]\]/g) || [];
    if (tags.length === 0) {
      violations.push({
        rule: 'no_evidence',
        section_id: section.id,
        message: 'No [[evidence]] tags found',
        severity: 'error',
      });
    } else {
      for (const tag of tags) {
        const id = tag.replace(/\[\[|\]\]/g, '');
        if (!input.evidence_ids.includes(id)) {
          violations.push({
            rule: 'invalid_evidence',
            section_id: section.id,
            message: `Invalid evidence: ${id}`,
            severity: 'error',
          });
        }
      }
    }

    // Score contradiction check
    const scoreViolation = checkScoreContradiction(section, input);
    if (scoreViolation) violations.push(scoreViolation);
  }

  return {
    passed: violations.filter(v => v.severity === 'error').length === 0,
    violations,
  };
}

function checkScoreContradiction(
  section: OverviewSection,
  input: InterpretationInput
): HeuristicViolation | null {
  const matches = section.content.match(/(\d{1,3})%/g);
  if (!matches) return null;

  for (const match of matches) {
    const claimed = parseInt(match);
    if (claimed < 20 || claimed > 100) continue;

    // Check if near actual overall score
    if (Math.abs(claimed - input.overall_score) <= 3) continue;

    // Check objectives
    const matchesObj = input.objectives.some(o => Math.abs(claimed - o.score) <= 3);
    if (matchesObj) continue;

    return {
      rule: 'score_hallucination',
      section_id: section.id,
      message: `Claims ${claimed}% - not in actual data`,
      severity: 'error',
    };
  }

  return null;
}
