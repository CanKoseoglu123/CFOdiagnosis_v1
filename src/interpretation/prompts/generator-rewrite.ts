/**
 * VS-32: Generator Rewrite Prompt
 *
 * AI1 rewrites the draft incorporating clarifier answers.
 * Uses clarifier_ evidence IDs to track answer integration.
 */

import { QuestionAnswer, OverviewSections } from '../types';
import { PillarInterpretationConfig } from '../pillars/types';

export interface RewriteInput {
  previous_draft: OverviewSections;
  answers: QuestionAnswer[];
  round_number: number;
  pillar_config?: PillarInterpretationConfig;
}

/**
 * Format answers with evidence IDs for traceability.
 */
function formatAnswersWithEvidence(answers: QuestionAnswer[]): string {
  return answers
    .map((a, i) => {
      const evidenceId = `clarifier_${i + 1}`;
      const confidenceNote =
        a.confidence === 'low'
          ? ' [LOW CONFIDENCE - user answered quickly]'
          : '';
      return `[${evidenceId}] Q: ${a.question}
A: ${a.answer}${confidenceNote}`;
    })
    .join('\n\n');
}

/**
 * Extract gaps that were marked in previous draft.
 */
function formatGapsToFill(draft: OverviewSections): string {
  if (!draft.gaps_marked || draft.gaps_marked.length === 0) {
    return 'None - all gaps were already filled.';
  }
  return draft.gaps_marked.map((g) => `- ${g}`).join('\n');
}

export function buildGeneratorRewritePrompt(input: RewriteInput): string {
  const previousDraftJson = JSON.stringify(input.previous_draft, null, 2);
  const answersWithEvidence = formatAnswersWithEvidence(input.answers);
  const gapsToFill = formatGapsToFill(input.previous_draft);

  const forbiddenPatterns = input.pillar_config?.pillar_forbidden_patterns || [];

  return `
You are rewriting a draft report with new information from clarifying questions.

═══════════════════════════════════════════════════════════════════
CRITICAL RULES (MANDATORY)
═══════════════════════════════════════════════════════════════════

1. INTEGRATE ANSWERS NATURALLY
   Reference with: "You mentioned..." or "Given your [answer]..."
   Add [clarifier_N] evidence IDs where you use each answer.

2. FILL ALL [NEED: x] GAPS
   Replace every gap marker with actual information from answers.
   If an answer doesn't fully address a gap, mark remaining uncertainty.

3. PRESERVE EVIDENCE CHAIN
   Keep all existing [obj_], [prac_], [score_] evidence IDs.
   ADD [clarifier_] IDs for newly integrated information.

4. MAINTAIN STRUCTURE
   Keep the 5-section format exactly as provided.
   Only change content within sections, not the structure.

5. STAY SHARP
   ~300 words total. <25 words per sentence. No hedging.

═══════════════════════════════════════════════════════════════════
PREVIOUS DRAFT (Round ${input.round_number - 1})
═══════════════════════════════════════════════════════════════════

${previousDraftJson}

═══════════════════════════════════════════════════════════════════
GAPS TO FILL
═══════════════════════════════════════════════════════════════════

${gapsToFill}

═══════════════════════════════════════════════════════════════════
USER'S ANSWERS (Use [clarifier_N] to reference)
═══════════════════════════════════════════════════════════════════

${answersWithEvidence}

═══════════════════════════════════════════════════════════════════
FORBIDDEN PATTERNS (Do NOT use)
═══════════════════════════════════════════════════════════════════

${forbiddenPatterns.length > 0 ? forbiddenPatterns.map((p) => `- "${p}"`).join('\n') : 'None configured.'}

═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON only)
═══════════════════════════════════════════════════════════════════

{
  "executive_summary": "Updated with [clarifier_] evidence where answers apply",
  "current_state": "Updated with new specifics from answers",
  "critical_risks": "Updated if answers change risk assessment",
  "opportunities": "Updated with clarified priorities",
  "priority_rationale": "Updated to reflect answer insights",
  "evidence_ids_used": ["list ALL evidence IDs including new clarifier_ ones"],
  "gaps_marked": ["list any remaining [NEED: x] markers, should be fewer or zero"]
}

GOAL: The rewrite should be MORE specific than the original, not just patched.
`.trim();
}
