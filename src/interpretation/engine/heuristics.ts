/**
 * VS-32: Heuristics - Code-based validation of AI output
 */

import { OverviewSection, InterpretationInput, HeuristicResult, HeuristicViolation, deriveTonality } from './types';
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

    // VS-38: Stricter word count — hard error at max + 50
    if (section.content?.trim() && config) {
      const wordCount = section.content.split(/\s+/).length;
      if (wordCount > config.max_words + 50) {
        violations.push({
          rule: 'word_count_hard',
          section_id: section.id,
          message: `${wordCount} words exceeds hard limit of ${config.max_words + 50} (max ${config.max_words} + 50 grace)`,
          severity: 'error',
        });
      }
    }
  }

  // VS-38: Tone-data alignment
  const tonality = deriveTonality(input.overall_score, input.critical_failures.length > 0);
  violations.push(...checkToneAlignment(sections, tonality));

  // VS-38: Cross-section coherence
  violations.push(...checkCrossSectionCoherence(sections, input));

  // VS-38: Content-data alignment
  violations.push(...checkContentDataAlignment(sections, input));

  return {
    passed: violations.filter(v => v.severity === 'error').length === 0,
    violations,
  };
}

/**
 * VS-38: Tone-data alignment
 * Celebrate tone should not use urgent language; urgent tone must mention critical failures
 */
function checkToneAlignment(
  sections: OverviewSection[],
  tonality: string
): HeuristicViolation[] {
  const violations: HeuristicViolation[] = [];
  const urgentPhrases = ['immediate attention', 'critical gap', 'must be resolved', 'urgent', 'failing'];
  const celebratoryPhrases = ['exceptional', 'outstanding', 'industry-leading', 'top-tier'];

  for (const section of sections) {
    if (!section.content) continue;
    const lower = section.content.toLowerCase();

    if (tonality === 'celebrate') {
      for (const phrase of urgentPhrases) {
        if (lower.includes(phrase)) {
          violations.push({
            rule: 'tone_mismatch',
            section_id: section.id,
            message: `Celebrate tone uses urgent language: "${phrase}"`,
            severity: 'warning',
          });
        }
      }
    }

    if (tonality === 'urgent' || tonality === 'remediate') {
      for (const phrase of celebratoryPhrases) {
        if (lower.includes(phrase)) {
          violations.push({
            rule: 'tone_mismatch',
            section_id: section.id,
            message: `${tonality} tone uses celebratory language: "${phrase}"`,
            severity: 'warning',
          });
        }
      }
    }
  }

  // Urgent tone must mention critical failures somewhere
  if (tonality === 'urgent') {
    const allContent = sections.map(s => s.content || '').join(' ').toLowerCase();
    const mentionsCritical = allContent.includes('critical') || allContent.includes('gate') || allContent.includes('blocker');
    if (!mentionsCritical) {
      violations.push({
        rule: 'tone_mismatch',
        section_id: null,
        message: 'Urgent tone but no mention of critical failures or gate blockers',
        severity: 'warning',
      });
    }
  }

  return violations;
}

/**
 * VS-38: Cross-section coherence
 * Same objective should not appear in both Strengths and Constraints
 */
function checkCrossSectionCoherence(
  sections: OverviewSection[],
  input: InterpretationInput
): HeuristicViolation[] {
  const violations: HeuristicViolation[] = [];
  const strengthsSection = sections.find(s => s.id === 'strengths');
  const constraintsSection = sections.find(s => s.id === 'constraints');

  if (!strengthsSection?.content || !constraintsSection?.content) return violations;

  const strengthsLower = strengthsSection.content.toLowerCase();
  const constraintsLower = constraintsSection.content.toLowerCase();

  for (const obj of input.objectives) {
    const nameLower = obj.name.toLowerCase();
    if (strengthsLower.includes(nameLower) && constraintsLower.includes(nameLower)) {
      violations.push({
        rule: 'cross_section_conflict',
        section_id: 'strengths',
        message: `"${obj.name}" appears in both Strengths and Constraints`,
        severity: 'warning',
      });
    }
  }

  return violations;
}

/**
 * VS-38: Content-data alignment
 * Strengths must not reference objectives <60%; Constraints should mention critical failure objectives
 */
function checkContentDataAlignment(
  sections: OverviewSection[],
  input: InterpretationInput
): HeuristicViolation[] {
  const violations: HeuristicViolation[] = [];
  const strengthsSection = sections.find(s => s.id === 'strengths');

  if (strengthsSection?.content) {
    const strengthsLower = strengthsSection.content.toLowerCase();
    const weakObjectives = input.objectives.filter(o => o.score < 60);
    for (const obj of weakObjectives) {
      if (strengthsLower.includes(obj.name.toLowerCase())) {
        violations.push({
          rule: 'content_data_misalignment',
          section_id: 'strengths',
          message: `Strengths references "${obj.name}" which scores ${obj.score}% (<60%)`,
          severity: 'warning',
        });
      }
    }
  }

  // Constraints should mention objectives with critical failures
  if (input.critical_failures.length > 0) {
    const constraintsSection = sections.find(s => s.id === 'constraints');
    if (constraintsSection?.content) {
      const constraintsLower = constraintsSection.content.toLowerCase();
      const criticalObjectives = [...new Set(input.critical_failures.map(c => c.objective_name))];
      const mentioned = criticalObjectives.filter(name => constraintsLower.includes(name.toLowerCase()));
      if (mentioned.length === 0) {
        violations.push({
          rule: 'content_data_misalignment',
          section_id: 'constraints',
          message: `Constraints does not mention any critical failure objectives: ${criticalObjectives.join(', ')}`,
          severity: 'warning',
        });
      }
    }
  }

  return violations;
}

// Known maturity thresholds that the LLM may reference as targets
const KNOWN_THRESHOLDS = [40, 65, 85, 100];

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

    // Allow known maturity thresholds (often referenced as targets, e.g. "advance to 65%+")
    if (KNOWN_THRESHOLDS.some(t => Math.abs(claimed - t) <= 5)) continue;

    // Allow persona target levels (converted to approximate percentages)
    if (input.persona_targets?.some(pt => Math.abs(claimed - pt.current_score) <= 3)) continue;

    return {
      rule: 'score_hallucination',
      section_id: section.id,
      message: `Claims ${claimed}% - not in actual data`,
      severity: 'error',
    };
  }

  return null;
}
