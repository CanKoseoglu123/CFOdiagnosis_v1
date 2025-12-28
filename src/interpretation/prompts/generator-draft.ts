/**
 * VS-25: Generator Draft Prompt
 *
 * AI1 creates the initial draft with [NEED: x] markers for missing info.
 */

import { GeneratorInput } from '../types';

export function buildGeneratorDraftPrompt(input: GeneratorInput): string {
  const cappedInfo = input.capped
    ? `Yes, by: ${input.capped_by_titles.join(', ')}`
    : 'No';

  const objectivesList = input.objectives
    .map(
      (o) =>
        `- ${o.name}: ${o.score}% ${o.has_critical_failure ? '[CRITICAL]' : ''}`
    )
    .join('\n');

  const initiativesList = input.top_initiatives
    .map((i) => `- [${i.priority}] ${i.title}: ${i.recommendation}`)
    .join('\n');

  return `
You are writing a sharp, contextual analysis for a finance leader.

═══════════════════════════════════════════════════════════════════
CORE RULES (MANDATORY)
═══════════════════════════════════════════════════════════════════

1. CONTEXT ONLY: Every sentence must reference THIS company's specifics.
   DO NOT write generic statements that apply to any company.

2. NO SCORE DESCRIPTIONS: The user can see the numbers.
   DO NOT say "Your score is 35%".
   DO say "Your 3-person team managing 5 revenue streams explains why..."

3. SHARP & SHORT: ~200 words total. <25 words per sentence average.
   NO hedging words: "could", "might", "perhaps", "it may be beneficial"
   USE direct statements: "Finance must..." not "It would be advisable..."

   ALLOWED (causal, not hedging):
   - "This limits your ability to..."
   - "This creates risk when..."
   - "This prevents you from..."
   - "This means that..."

4. MARK GAPS: Where you lack info to be specific, mark: [NEED: specific info]

═══════════════════════════════════════════════════════════════════
WHAT YOU KNOW ABOUT THIS COMPANY
═══════════════════════════════════════════════════════════════════

Company: ${input.company_name}
Industry: ${input.industry}
Team Size: ${input.team_size || '[NEED: FP&A team size]'}
Pain Points: ${input.pain_points?.join('; ') || '[NEED: stated pain points]'}
Systems: ${input.systems || '[NEED: current tools/systems]'}

═══════════════════════════════════════════════════════════════════
DIAGNOSTIC RESULTS (ABSOLUTE TRUTH — DO NOT DISPUTE)
═══════════════════════════════════════════════════════════════════

Execution Score: ${input.execution_score}%
Maturity Level: ${input.maturity_level} (${input.level_name})
Capped: ${cappedInfo}

Objectives:
${objectivesList}

═══════════════════════════════════════════════════════════════════
TONALITY INSTRUCTIONS (FOLLOW EXACTLY)
═══════════════════════════════════════════════════════════════════

${input.tonality_instructions}

Failure to follow tonality will result in a rejected draft.

═══════════════════════════════════════════════════════════════════
TOP INITIATIVES (What actions we're explaining)
═══════════════════════════════════════════════════════════════════

${initiativesList}

═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON only, no markdown)
═══════════════════════════════════════════════════════════════════

{
  "synthesis": "3-4 sentences: What the pattern means for THIS company",
  "priority_rationale": "2-3 sentences: Why the top actions matter for YOU",
  "key_insight": "1-2 sentences: The sharpest, most specific observation",
  "gaps_marked": ["list of [NEED: x] markers used, if any"]
}

TOTAL OUTPUT: ~200 words. Be sharp. Be specific. No filler.
`.trim();
}
