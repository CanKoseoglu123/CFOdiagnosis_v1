/**
 * VS-32: Critic Questions Prompt
 *
 * AI2 generates clarifying questions for prioritized gaps.
 * CRITICAL: Yes/No questions preferred (70%), MCQ when needed, free text as last resort.
 */

import { CriticQuestionsInput, InterpretationQuestion } from '../types';
import { formatExemplarsForPrompt } from '../pillars/fpa/question-exemplars';

/**
 * Format questions already asked to avoid repetition.
 */
function formatPreviousQuestions(questions?: InterpretationQuestion[]): string {
  if (!questions || questions.length === 0) {
    return 'None yet.';
  }
  return questions
    .map((q) => `- "${q.question}" (${q.type})`)
    .join('\n');
}

export function buildCriticQuestionsPrompt(input: CriticQuestionsInput): string {
  const gapsList = input.prioritized_gaps
    .map(
      (g) => `
- Gap ID: ${g.gap_id}
  Description: ${g.description}
  Why needed: ${g.why_needed || 'To improve specificity'}
  Objective: ${g.objective_id}
  Priority Score: ${g.priority_score}
  Related Evidence: ${g.related_evidence_ids?.join(', ') || 'None'}
`
    )
    .join('\n');

  const previousQuestions = formatPreviousQuestions(input.questions_asked_so_far);
  const budget = input.questions_budget ?? 3;

  // Include pillar-specific question exemplars if available
  const exemplarGuidance = input.pillar_config
    ? formatExemplarsForPrompt()
    : '';

  return `
You are generating clarifying questions to fill specific gaps in the report.

═══════════════════════════════════════════════════════════════════
CRITICAL QUESTION RULES (MANDATORY)
═══════════════════════════════════════════════════════════════════

1. PREFER YES/NO QUESTIONS (70% of all questions)
   Yes/No questions are faster for users and easier to analyze.
   Only use MCQ when the answer requires choosing between distinct options.

2. NEVER REPEAT DIAGNOSTIC QUESTIONS
   The user already answered diagnostic assessment questions.
   Your questions should gather NEW context, not re-validate answers.

3. EXPLAIN THE RATIONALE
   Each question MUST include WHY it is being asked.
   This helps the user understand the value of answering.

4. ONE TOPIC PER QUESTION
   Avoid compound questions. Ask about ONE thing at a time.

5. KEEP QUESTIONS SHORT
   Maximum 25 words per question.

═══════════════════════════════════════════════════════════════════
GAPS TO FILL (already prioritized by importance)
═══════════════════════════════════════════════════════════════════

${gapsList}

═══════════════════════════════════════════════════════════════════
QUESTIONS ALREADY ASKED (DO NOT REPEAT)
═══════════════════════════════════════════════════════════════════

${previousQuestions}

═══════════════════════════════════════════════════════════════════
BUDGET: Generate up to ${budget} questions
═══════════════════════════════════════════════════════════════════

${exemplarGuidance}

═══════════════════════════════════════════════════════════════════
QUESTION TYPE GUIDANCE
═══════════════════════════════════════════════════════════════════

YES/NO (preferred - use for 70% of questions):
- "Is your FP&A team able to dedicate at least 20% of their time to new initiatives?"
- "Does your organization update the forecast at least quarterly?"
- "Has your organization completed a finance transformation in the past 2 years?"

MCQ (use when distinct options are needed):
- "What best describes your team's current bandwidth for improvement initiatives?"
  Options must be:
  - Mutually exclusive
  - Exhaustive (cover main cases)
  - Include "Other" as final option
  - Maximum 4 options + Other

FREE TEXT (last resort - only when nuance is required):
- Use sparingly
- Set max_length to 150 characters
- Only for complex context that can't be captured otherwise

═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON only)
═══════════════════════════════════════════════════════════════════

{
  "questions": [
    {
      "question_id": "clarifier_1",
      "gap_id": "gap_1",
      "objective_id": "obj_...",
      "question": "The question text (max 25 words)",
      "type": "yes_no" | "mcq" | "free_text",
      "options": ["Option A", "Option B", "Option C", "Other"] | null,
      "max_length": 150 | null,
      "rationale": "Why this question helps improve the report",
      "resolves_evidence_ids": ["ctx_...", "prac_..."]
    }
  ]
}

REMEMBER:
- At least 70% of questions should be "yes_no" type
- Each question must have a rationale
- Never repeat diagnostic questions
- Maximum ${budget} questions total
`.trim();
}
