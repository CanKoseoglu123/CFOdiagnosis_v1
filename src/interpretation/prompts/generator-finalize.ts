/**
 * VS-32: Generator Finalize Prompt
 *
 * AI1 applies final polish edits from critic before publication.
 * Maintains 5-section OverviewSections structure and evidence chain.
 */

import { OverviewSections, CriticFinalOutput } from '../types';
import { PillarInterpretationConfig } from '../pillars/types';

export interface FinalizeInput {
  draft: OverviewSections;
  feedback: CriticFinalOutput;
  pillar_config?: PillarInterpretationConfig;
}

export function buildGeneratorFinalizePrompt(input: FinalizeInput): string {
  const draftJson = JSON.stringify(input.draft, null, 2);
  const editsJson = JSON.stringify(input.feedback.edits, null, 2);

  const forbiddenPatterns = input.pillar_config?.pillar_forbidden_patterns || [];

  return `
You are applying final polish edits to complete the report for publication.

═══════════════════════════════════════════════════════════════════
CRITICAL RULES (MANDATORY)
═══════════════════════════════════════════════════════════════════

1. APPLY EDITS PRECISELY
   Make each edit exactly as specified.
   Do not add new content — only refine what exists.

2. PRESERVE EVIDENCE IDS
   Keep all [obj_], [prac_], [score_], [clarifier_] evidence IDs.
   Do not remove or modify evidence references.

3. MAINTAIN 5-SECTION STRUCTURE
   executive_summary, current_state, critical_risks,
   opportunities, priority_rationale — no changes to structure.

4. FINAL QUALITY CHECK
   Ensure smooth flow after edits.
   Total output: ~300 words across all sections.
   No hedging words: "might", "could", "perhaps"

5. NO REMAINING GAPS
   All [NEED: x] markers must be filled.
   gaps_marked array should be empty in final output.

═══════════════════════════════════════════════════════════════════
CURRENT DRAFT
═══════════════════════════════════════════════════════════════════

${draftJson}

═══════════════════════════════════════════════════════════════════
EDITS TO APPLY
═══════════════════════════════════════════════════════════════════

${editsJson}

═══════════════════════════════════════════════════════════════════
FORBIDDEN PATTERNS (Ensure none appear in final output)
═══════════════════════════════════════════════════════════════════

${forbiddenPatterns.length > 0 ? forbiddenPatterns.map((p) => `- "${p}"`).join('\n') : 'None configured.'}

═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON only)
═══════════════════════════════════════════════════════════════════

{
  "executive_summary": "Polished final version",
  "current_state": "Polished final version",
  "critical_risks": "Polished final version",
  "opportunities": "Polished final version",
  "priority_rationale": "Polished final version",
  "evidence_ids_used": ["complete list of all evidence IDs in final text"],
  "gaps_marked": []
}

This is the FINAL output that will be published. Ensure quality is publication-ready.
`.trim();
}
