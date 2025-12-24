/**
 * VS-25: Generator Rewrite Prompt
 *
 * AI1 rewrites the draft with new information from user answers.
 */

import { RewriteInput, QuestionAnswer } from '../types';

export function buildGeneratorRewritePrompt(input: RewriteInput): string {
  const previousDraftJson = JSON.stringify(input.previous_draft, null, 2);

  // Add confidence notes to answers
  const answersWithConfidence = input.answers
    .map((a) => {
      const confidenceNote =
        a.confidence === 'low'
          ? ' [USER ANSWERED QUICKLY - TREAT WITH SKEPTICISM IF CONTRADICTS OTHER DATA]'
          : '';
      return `Q: ${a.question}\nA: ${a.answer}${confidenceNote}`;
    })
    .join('\n\n');

  return `
You are rewriting a draft with new information from the user.

═══════════════════════════════════════════════════════════════════
PREVIOUS DRAFT
═══════════════════════════════════════════════════════════════════

${previousDraftJson}

═══════════════════════════════════════════════════════════════════
USER'S ANSWERS
═══════════════════════════════════════════════════════════════════

${answersWithConfidence}

═══════════════════════════════════════════════════════════════════
REWRITE RULES
═══════════════════════════════════════════════════════════════════

1. PRESERVE INTENT, NOT STRUCTURE
   If the user's answer contradicts a premise, rewrite the sentence completely.
   Do not jam new info into old sentence structures.

2. WEAVE NATURALLY
   Reference answers: "You mentioned..." or "Given your situation with..."

3. REMOVE ALL [NEED: x] MARKERS
   Replace with actual information from answers.

4. STAY SHARP
   ~200 words. <25 words per sentence. No hedging.

═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON only)
═══════════════════════════════════════════════════════════════════

{
  "synthesis": "...",
  "priority_rationale": "...",
  "key_insight": "...",
  "gaps_marked": []
}
`.trim();
}
