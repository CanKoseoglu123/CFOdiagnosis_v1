/**
 * VS-32a: Evidence Validation
 *
 * Validates that AI-generated evidence IDs conform to expected patterns
 * and exist in the available evidence pool.
 */

const EVIDENCE_PATTERNS: Record<string, RegExp> = {
  objective: /^obj_[a-z_]+$/,
  practice: /^prac_[a-z_]+$/,
  question: /^q_[a-z0-9_]+$/,
  gate: /^gate_L[1-4]_(passed|failed)$/,
  score: /^score_L[1-4]$/,
  critical: /^critical_[a-z0-9_]+$/,
  importance: /^imp_[a-z_]+_[1-5]$/,
  context: /^ctx_[a-z_]+$/,
};

export function validateEvidenceId(id: string): boolean {
  return Object.values(EVIDENCE_PATTERNS).some(pattern => pattern.test(id));
}

export function validateAllEvidence(
  ids: string[],
  availableEvidence: string[]
): { valid: boolean; invalid: string[] } {
  const invalid = ids.filter(id =>
    !validateEvidenceId(id) || !availableEvidence.includes(id)
  );
  return { valid: invalid.length === 0, invalid };
}
