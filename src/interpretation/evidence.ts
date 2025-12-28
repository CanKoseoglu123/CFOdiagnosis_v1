/**
 * VS-32: Evidence ID Validation and Taxonomy
 *
 * All AI-generated content must cite evidence using namespaced IDs.
 * This module validates evidence IDs and provides helper functions.
 */

import { EvidenceId, EvidenceNamespace } from './pillars/types';

// ============================================================
// EVIDENCE ID PATTERNS
// ============================================================

/**
 * Regex patterns for each evidence namespace.
 */
export const EVIDENCE_PATTERNS: Record<EvidenceNamespace, RegExp> = {
  'obj_': /^obj_[a-z_]+$/,           // obj_forecasting, obj_variance_analysis
  'prac_': /^prac_[a-z_]+$/,         // prac_driver_based, prac_rolling_forecast
  'q_': /^q_[a-z]+_l\d+_q\d+$/,      // q_fpa_l2_q03, q_fpa_l1_q01
  'gate_': /^gate_l\d+_(passed|failed)$/, // gate_l2_passed, gate_l3_failed
  'score_': /^score_[a-z_]+$/,       // score_overall, score_level_3, score_execution
  'critical_': /^critical_[a-z]+_l\d+_q\d+$/, // critical_fpa_l1_q01
  'imp_': /^imp_[a-z_]+=\d$/,        // imp_forecasting=5, imp_budgeting=3
  'ctx_': /^ctx_[a-z_]+$/,           // ctx_industry, ctx_company_name, ctx_team_size
  'clarifier_': /^clarifier_round\d+_q\d+$/, // clarifier_round1_q1
};

/**
 * Human-readable labels for evidence namespaces.
 */
export const EVIDENCE_LABELS: Record<EvidenceNamespace, string> = {
  'obj_': 'Objective Score',
  'prac_': 'Practice Score',
  'q_': 'Question Response',
  'gate_': 'Maturity Gate',
  'score_': 'Aggregate Score',
  'critical_': 'Critical Question',
  'imp_': 'Importance Calibration',
  'ctx_': 'Context Field',
  'clarifier_': 'Clarifier Response',
};

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

/**
 * Extract namespace from an evidence ID.
 * @returns Namespace or null if invalid
 */
export function extractNamespace(evidenceId: string): EvidenceNamespace | null {
  const namespaces: EvidenceNamespace[] = [
    'obj_', 'prac_', 'q_', 'gate_', 'score_',
    'critical_', 'imp_', 'ctx_', 'clarifier_'
  ];

  for (const ns of namespaces) {
    if (evidenceId.startsWith(ns)) {
      return ns;
    }
  }

  return null;
}

/**
 * Validate a single evidence ID.
 * @returns EvidenceId object if valid, null if invalid
 */
export function validateEvidenceId(evidenceId: string): EvidenceId | null {
  const namespace = extractNamespace(evidenceId);
  if (!namespace) return null;

  const pattern = EVIDENCE_PATTERNS[namespace];
  if (!pattern.test(evidenceId)) return null;

  return {
    namespace,
    identifier: evidenceId.slice(namespace.length),
    raw: evidenceId,
  };
}

/**
 * Validate multiple evidence IDs.
 * @returns Array of valid EvidenceId objects
 */
export function validateEvidenceIds(evidenceIds: string[]): {
  valid: EvidenceId[];
  invalid: string[];
} {
  const valid: EvidenceId[] = [];
  const invalid: string[] = [];

  for (const id of evidenceIds) {
    const validated = validateEvidenceId(id);
    if (validated) {
      valid.push(validated);
    } else {
      invalid.push(id);
    }
  }

  return { valid, invalid };
}

/**
 * Extract all evidence IDs from text.
 * Looks for bracketed evidence like [obj_forecasting] or inline mentions.
 */
export function extractEvidenceFromText(text: string): string[] {
  const evidenceIds: Set<string> = new Set();

  // Pattern for bracketed evidence: [evidence_id]
  const bracketPattern = /\[([a-z_]+_[a-z0-9_=]+)\]/gi;
  let match;

  while ((match = bracketPattern.exec(text)) !== null) {
    const id = match[1].toLowerCase();
    if (validateEvidenceId(id)) {
      evidenceIds.add(id);
    }
  }

  // Pattern for inline evidence mentions
  const inlinePatterns = [
    /\b(obj_[a-z_]+)\b/gi,
    /\b(prac_[a-z_]+)\b/gi,
    /\b(q_[a-z]+_l\d+_q\d+)\b/gi,
    /\b(gate_l\d+_(?:passed|failed))\b/gi,
    /\b(score_[a-z_]+)\b/gi,
    /\b(critical_[a-z]+_l\d+_q\d+)\b/gi,
    /\b(imp_[a-z_]+=\d)\b/gi,
    /\b(ctx_[a-z_]+)\b/gi,
    /\b(clarifier_round\d+_q\d+)\b/gi,
  ];

  for (const pattern of inlinePatterns) {
    while ((match = pattern.exec(text)) !== null) {
      const id = match[1].toLowerCase();
      if (validateEvidenceId(id)) {
        evidenceIds.add(id);
      }
    }
  }

  return Array.from(evidenceIds);
}

// ============================================================
// EVIDENCE BUILDING HELPERS
// ============================================================

/**
 * Build an objective evidence ID.
 */
export function buildObjectiveEvidenceId(objectiveName: string): string {
  return `obj_${objectiveName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '')}`;
}

/**
 * Build a practice evidence ID.
 */
export function buildPracticeEvidenceId(practiceName: string): string {
  return `prac_${practiceName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '')}`;
}

/**
 * Build a question evidence ID.
 */
export function buildQuestionEvidenceId(pillar: string, level: number, questionNum: number): string {
  return `q_${pillar.toLowerCase()}_l${level}_q${String(questionNum).padStart(2, '0')}`;
}

/**
 * Build a gate evidence ID.
 */
export function buildGateEvidenceId(level: number, passed: boolean): string {
  return `gate_l${level}_${passed ? 'passed' : 'failed'}`;
}

/**
 * Build a score evidence ID.
 */
export function buildScoreEvidenceId(scoreType: string): string {
  return `score_${scoreType.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '')}`;
}

/**
 * Build a critical question evidence ID.
 */
export function buildCriticalEvidenceId(pillar: string, level: number, questionNum: number): string {
  return `critical_${pillar.toLowerCase()}_l${level}_q${String(questionNum).padStart(2, '0')}`;
}

/**
 * Build an importance evidence ID.
 */
export function buildImportanceEvidenceId(objectiveName: string, importance: number): string {
  const objKey = objectiveName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '');
  return `imp_${objKey}=${importance}`;
}

/**
 * Build a context evidence ID.
 */
export function buildContextEvidenceId(fieldName: string): string {
  return `ctx_${fieldName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '')}`;
}

/**
 * Build a clarifier evidence ID.
 */
export function buildClarifierEvidenceId(round: number, questionNum: number): string {
  return `clarifier_round${round}_q${questionNum}`;
}

// ============================================================
// EVIDENCE REQUIREMENT CHECKING
// ============================================================

/**
 * Check if text has minimum required evidence citations.
 */
export function hasMinimumEvidence(
  text: string,
  minCount: number,
  requiredTypes?: EvidenceNamespace[]
): {
  hasMinimum: boolean;
  actualCount: number;
  missingTypes: EvidenceNamespace[];
} {
  const evidenceIds = extractEvidenceFromText(text);
  const validated = validateEvidenceIds(evidenceIds);

  const foundTypes = new Set(validated.valid.map(e => e.namespace));
  const missingTypes: EvidenceNamespace[] = [];

  if (requiredTypes) {
    for (const type of requiredTypes) {
      if (!foundTypes.has(type)) {
        missingTypes.push(type);
      }
    }
  }

  return {
    hasMinimum: validated.valid.length >= minCount && missingTypes.length === 0,
    actualCount: validated.valid.length,
    missingTypes,
  };
}

/**
 * Generate human-readable evidence summary.
 */
export function summarizeEvidence(evidenceIds: string[]): string {
  const validated = validateEvidenceIds(evidenceIds);
  const byType: Record<string, number> = {};

  for (const ev of validated.valid) {
    const label = EVIDENCE_LABELS[ev.namespace];
    byType[label] = (byType[label] || 0) + 1;
  }

  const parts = Object.entries(byType)
    .map(([label, count]) => `${count} ${label}${count > 1 ? 's' : ''}`)
    .join(', ');

  if (validated.invalid.length > 0) {
    return `${parts} (${validated.invalid.length} invalid IDs)`;
  }

  return parts || 'No evidence cited';
}

// ============================================================
// EVIDENCE COVERAGE ANALYSIS
// ============================================================

/**
 * Analyze evidence coverage across sections.
 */
export function analyzeEvidenceCoverage(
  sections: Record<string, string>,
  requiredEvidence: string[]
): {
  coverage: number;
  found: string[];
  missing: string[];
  bySection: Record<string, string[]>;
} {
  const allFound: Set<string> = new Set();
  const bySection: Record<string, string[]> = {};

  for (const [sectionName, text] of Object.entries(sections)) {
    const evidence = extractEvidenceFromText(text);
    bySection[sectionName] = evidence;
    evidence.forEach(e => allFound.add(e));
  }

  const found = requiredEvidence.filter(e => allFound.has(e));
  const missing = requiredEvidence.filter(e => !allFound.has(e));

  return {
    coverage: requiredEvidence.length > 0
      ? (found.length / requiredEvidence.length) * 100
      : 100,
    found,
    missing,
    bySection,
  };
}
