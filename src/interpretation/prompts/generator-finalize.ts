/**
 * VS-25: Generator Finalize Prompt
 *
 * AI1 applies final polish feedback from critic.
 */

import { DraftReport, CriticFinalOutput } from '../types';

export function buildGeneratorFinalizePrompt(
  draft: DraftReport,
  feedback: CriticFinalOutput
): string {
  const draftJson = JSON.stringify(draft, null, 2);
  const editsJson = JSON.stringify(feedback.edits, null, 2);

  return `
You are applying final polish edits to a draft report.

═══════════════════════════════════════════════════════════════════
CURRENT DRAFT
═══════════════════════════════════════════════════════════════════

${draftJson}

═══════════════════════════════════════════════════════════════════
EDITS TO APPLY
═══════════════════════════════════════════════════════════════════

${editsJson}

═══════════════════════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════════════════════

1. Apply each edit as specified
2. Maintain the overall structure
3. Keep word count under 300
4. Ensure smooth flow after edits
5. Do NOT add new content — only refine what's there

═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON only)
═══════════════════════════════════════════════════════════════════

{
  "synthesis": "...",
  "priority_rationale": "...",
  "key_insight": "..."
}
`.trim();
}
