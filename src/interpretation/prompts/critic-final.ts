/**
 * VS-25: Critic Final Prompt
 *
 * AI2 gives final polish feedback before publication.
 */

import { CriticFinalInput } from '../types';

export function buildCriticFinalPrompt(input: CriticFinalInput): string {
  const draftJson = JSON.stringify(input.draft, null, 2);

  return `
You are giving final polish feedback before publication.

═══════════════════════════════════════════════════════════════════
THE DRAFT
═══════════════════════════════════════════════════════════════════

${draftJson}

═══════════════════════════════════════════════════════════════════
CHECK FOR
═══════════════════════════════════════════════════════════════════

1. FLOW: Does it read naturally?
2. SHARPNESS: Any hedging or filler to cut?
3. IMPACT: Does the opening hook?
4. CLARITY: Any confusing phrases?

═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON only)
═══════════════════════════════════════════════════════════════════

{
  "ready": true | false,
  "edits": [
    {
      "location": "synthesis, sentence 2",
      "issue": "What's wrong",
      "fix": "How to fix it"
    }
  ]
}

If ready to publish with no edits: { "ready": true, "edits": [] }
`.trim();
}
