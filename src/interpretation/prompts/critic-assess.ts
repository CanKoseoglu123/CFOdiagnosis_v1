/**
 * VS-25: Critic Assess Prompt (Call 1)
 *
 * AI2 identifies gaps in the draft. Does NOT generate questions.
 */

import { CriticAssessInput } from '../types';
import { sanitizeGeneratorInput } from './sanitize';

export function buildCriticAssessPrompt(input: CriticAssessInput): string {
  // VS-Security: Sanitize user-provided inputs to prevent prompt injection
  const sanitizedContext = sanitizeGeneratorInput(input.context);

  const draftJson = JSON.stringify(input.draft, null, 2);
  const contextJson = JSON.stringify(
    {
      company_name: sanitizedContext.company_name,
      industry: sanitizedContext.industry,
      team_size: sanitizedContext.team_size,
      pain_points: sanitizedContext.pain_points,
      systems: sanitizedContext.systems,
      execution_score: input.context.execution_score,
      maturity_level: input.context.maturity_level,
      objectives: input.context.objectives.map((o) => ({
        id: o.id,
        name: o.name,
        score: o.score,
        has_critical_failure: o.has_critical_failure,
      })),
    },
    null,
    2
  );

  return `
You are identifying gaps in a draft report. Focus ONLY on what's missing.

═══════════════════════════════════════════════════════════════════
THE DRAFT
═══════════════════════════════════════════════════════════════════

${draftJson}

═══════════════════════════════════════════════════════════════════
COMPANY CONTEXT AVAILABLE
═══════════════════════════════════════════════════════════════════

${contextJson}

═══════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════

Identify specific gaps where the draft could be MORE contextual or specific.

Look for:
1. [NEED: x] markers that weren't filled
2. Generic statements that should reference company specifics
3. Recommendations that could be more tailored
4. Missing connections between pain points and findings

DO NOT:
- Judge quality (code does that)
- Generate questions (separate call)
- Rewrite anything

═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON only)
═══════════════════════════════════════════════════════════════════

{
  "gaps": [
    {
      "gap_id": "gap_1",
      "objective_id": "obj_...",
      "description": "What specific information is missing",
      "why_needed": "How this would improve the report"
    }
  ]
}

If no gaps found, return: { "gaps": [] }
`.trim();
}
