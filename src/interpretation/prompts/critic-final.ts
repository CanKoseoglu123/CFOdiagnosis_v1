/**
 * VS-32: Critic Final Prompt
 *
 * AI2 gives final polish feedback before publication.
 * Validates against pillar config forbidden patterns and quality standards.
 */

import { OverviewSections } from '../types';
import { PillarInterpretationConfig, GoldenOutputPattern } from '../pillars/types';

export interface CriticFinalInput {
  draft: OverviewSections;
  pillar_config?: PillarInterpretationConfig;
}

/**
 * Format golden output requirements for final validation.
 */
function formatFinalValidation(
  goldenOutputs?: Record<string, GoldenOutputPattern>
): string {
  if (!goldenOutputs) {
    return 'Standard quality checks only.';
  }

  return Object.entries(goldenOutputs)
    .map(([sectionId, pattern]) => {
      const p = pattern as GoldenOutputPattern;
      return `${sectionId}: min ${p.min_evidence_count} evidence IDs, types: ${p.required_evidence_types.join(', ')}`;
    })
    .join('\n');
}

export function buildCriticFinalPrompt(input: CriticFinalInput): string {
  const draftJson = JSON.stringify(input.draft, null, 2);

  const forbiddenPatterns = input.pillar_config?.pillar_forbidden_patterns || [];
  const goldenRequirements = formatFinalValidation(
    input.pillar_config?.golden_outputs
  );

  return `
You are performing final quality validation before publication.

═══════════════════════════════════════════════════════════════════
THE DRAFT TO VALIDATE
═══════════════════════════════════════════════════════════════════

${draftJson}

═══════════════════════════════════════════════════════════════════
SECTION REQUIREMENTS
═══════════════════════════════════════════════════════════════════

${goldenRequirements}

═══════════════════════════════════════════════════════════════════
FORBIDDEN PATTERNS (Flag any matches as critical edits)
═══════════════════════════════════════════════════════════════════

${forbiddenPatterns.length > 0 ? forbiddenPatterns.map((p) => `- "${p}"`).join('\n') : 'None configured.'}

═══════════════════════════════════════════════════════════════════
VALIDATION CHECKLIST
═══════════════════════════════════════════════════════════════════

1. FLOW
   - Does each section read naturally?
   - Are transitions between ideas smooth?

2. SHARPNESS
   - Any hedging or filler to cut? ("might", "could", "perhaps")
   - Any vague statements that need precision?

3. EVIDENCE INTEGRITY
   - Are all evidence IDs properly formatted [xxx_yyy]?
   - Are there claims without evidence?
   - Are gaps_marked empty (all filled)?

4. FORBIDDEN PATTERN CHECK
   - Any matches to forbidden patterns above?
   - Any hallucinated statistics or benchmarks?

5. IMPACT
   - Does the executive_summary hook immediately?
   - Is priority_rationale compelling?

6. WORD COUNT
   - Is total output ~300 words or less?
   - Are sentences under 25 words average?

═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON only)
═══════════════════════════════════════════════════════════════════

{
  "ready": true | false,
  "edits": [
    {
      "location": "section_name, sentence N",
      "issue": "What's wrong",
      "fix": "Specific fix to apply",
      "severity": "critical" | "recommended" | "minor"
    }
  ],
  "evidence_audit": {
    "total_evidence_ids": 0,
    "missing_required_types": [],
    "sections_below_minimum": []
  },
  "forbidden_matches": ["list any forbidden pattern matches found"]
}

DECISION RULES:
- If ANY forbidden pattern match: ready = false
- If ANY section below minimum evidence: ready = false
- If gaps_marked is not empty: ready = false
- Otherwise: ready = true (minor edits can be applied)

If ready to publish with no edits: { "ready": true, "edits": [], "evidence_audit": {...}, "forbidden_matches": [] }
`.trim();
}
