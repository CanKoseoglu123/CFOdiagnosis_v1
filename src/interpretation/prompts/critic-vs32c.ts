/**
 * VS-32c: Critic Prompt Builder
 *
 * Builds the prompt for the Critic agent that:
 * 1. Compares draft to golden output patterns
 * 2. Finds context gaps
 * 3. Generates targeted Yes/No questions (not from a fixed bank)
 * 4. Provides rewrite instructions
 */

import {
  VS32cAIInterpretationInput,
  OverviewSection,
} from '../types';
import { FPA_GOLDEN_OUTPUTS } from '../pillars/fpa/golden-outputs';
import { FPA_QUESTION_EXEMPLARS, formatExemplarsForPrompt } from '../pillars/fpa/question-exemplars';

/**
 * Build the VS-32c Critic prompt
 */
export function buildVS32cCriticPrompt(
  input: VS32cAIInterpretationInput,
  draft: OverviewSection[]
): string {
  const diagnosticAnswersList = input.diagnostic_answers
    .map((a) => `[${a.question_id}] "${a.question_text}" → ${a.answer}`)
    .join('\n');

  const goldenRequirements = Object.entries(FPA_GOLDEN_OUTPUTS)
    .map(
      ([id, pattern]) => `
### ${id.toUpperCase()}
Required evidence types: ${pattern.required_evidence_types.join(', ')}
Min evidence: ${pattern.min_evidence_count}

GOOD (match this):
${pattern.exemplar_insights.map((e) => `• "${e}"`).join('\n')}

BAD (reject this):
${pattern.anti_patterns.map((a) => `• "${a}"`).join('\n')}
`
    )
    .join('\n');

  const questionExemplars = formatExemplarsForPrompt();

  return `
You are a quality reviewer comparing an AI draft against golden standards.

TASK:
1. Identify gaps in the draft (structural, quality, or context)
2. For context gaps that need user input: GENERATE targeted questions
3. For quality/structural gaps: provide rewrite instructions

THE DRAFT:
${JSON.stringify(draft, null, 2)}

GOLDEN STANDARDS:
${goldenRequirements}

═══════════════════════════════════════════════════════════════════════════════
DIAGNOSTIC ANSWERS — DO NOT RE-ASK THESE
═══════════════════════════════════════════════════════════════════════════════

The user already answered ${input.diagnostic_answers.length} questions:
${diagnosticAnswersList}

═══════════════════════════════════════════════════════════════════════════════
CLARIFYING QUESTION RULES
═══════════════════════════════════════════════════════════════════════════════

FORMAT PREFERENCE:
1. YES/NO strongly preferred (matches diagnostic UX)
2. MCQ only when binary is insufficient
3. NEVER free text

BEFORE GENERATING ANY QUESTION, CHECK:
✗ Was this asked in the diagnostic? → Don't ask
✗ Can answer be inferred from diagnostic? → Don't ask
✗ Is this rephrasing a diagnostic question? → Don't ask

VIOLATION EXAMPLES:
Diagnostic: "Do you have documented variance analysis?" → No
WRONG: "Are variance thresholds defined?" (we know no process exists)
RIGHT: "Is establishing variance analysis a priority for next 6 months?"

Diagnostic: "Do you use driver-based forecasting?" → No
WRONG: "Are operational drivers linked to forecast?" (same question)
RIGHT: "Is the barrier to driver-based forecasting data, tools, or skills?"

REQUIRED FIELDS FOR EACH QUESTION:
- question_id: unique ID like "clarify_001"
- gap_id: which gap this addresses
- question_text: the question
- question_type: "yes_no" or "mcq"
- options: only if MCQ, last can be "Other"
- context_field: what context this fills
- rationale: how answer improves the draft
- related_diagnostic_questions: which diagnostic Qs are related
- why_not_covered: why diagnostic didn't capture this

MAX 3 QUESTIONS. Quality over quantity.

QUESTION STYLE EXAMPLES:
${questionExemplars}

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

{
  "gaps": [
    {
      "gap_id": "gap_001",
      "section_id": "execution_snapshot",
      "gap_type": "context",
      "description": "Draft mentions execution challenges but doesn't explain why",
      "fixable_by": "clarifying_question"
    }
  ],
  "overall_quality": "yellow",
  "rewrite_instructions": [
    "Section strengths_weaknesses: Add specific objective scores"
  ],
  "generated_questions": [
    {
      "question_id": "clarify_001",
      "gap_id": "gap_001",
      "question_text": "Is your FP&A team able to take on improvement projects alongside day-to-day operations?",
      "question_type": "yes_no",
      "context_field": "team_bandwidth",
      "rationale": "Will explain execution gap and enable capacity-aware recommendations",
      "related_diagnostic_questions": ["fpa_l1_q03"],
      "why_not_covered": "Diagnostic assesses process maturity, not team bandwidth"
    }
  ]
}

Output valid JSON only.
`.trim();
}

/**
 * Build VS-32c Rewrite prompt that incorporates clarifier answers
 */
export function buildVS32cRewritePrompt(
  input: VS32cAIInterpretationInput,
  previousDraft: OverviewSection[],
  rewriteInstructions: string[],
  basePrompt: string
): string {
  const clarifierContext =
    input.clarifier_answers && input.clarifier_answers.length > 0
      ? input.clarifier_answers
          .map((a) => `Q: ${a.question_text}\nA: ${a.answer}`)
          .join('\n\n')
      : 'None';

  return `
${basePrompt}

═══════════════════════════════════════════════════════════════════════════════
PREVIOUS DRAFT (improve this)
═══════════════════════════════════════════════════════════════════════════════

${JSON.stringify(previousDraft, null, 2)}

═══════════════════════════════════════════════════════════════════════════════
REWRITE INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

${rewriteInstructions.length > 0 ? rewriteInstructions.map((r, i) => `${i + 1}. ${r}`).join('\n') : 'No specific instructions - incorporate new context into relevant sections.'}

═══════════════════════════════════════════════════════════════════════════════
NEW CONTEXT FROM USER (incorporate into relevant sections)
═══════════════════════════════════════════════════════════════════════════════

${clarifierContext}

OUTPUT: Improved JSON with all 5 sections.
`.trim();
}
