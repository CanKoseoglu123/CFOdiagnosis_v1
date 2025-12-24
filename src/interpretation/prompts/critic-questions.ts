/**
 * VS-25: Critic Questions Prompt (Call 2)
 *
 * AI2 generates clarifying questions for prioritized gaps.
 */

import { CriticQuestionsInput } from '../types';

export function buildCriticQuestionsPrompt(input: CriticQuestionsInput): string {
  const gapsList = input.prioritized_gaps
    .map(
      (g) => `
- Gap: ${g.description}
  Why needed: ${g.why_needed || 'To improve specificity'}
  Objective: ${g.objective_id}
  Priority Score: ${g.priority_score}
`
    )
    .join('\n');

  return `
You are generating clarifying questions to fill specific gaps.

═══════════════════════════════════════════════════════════════════
GAPS TO FILL (already prioritized)
═══════════════════════════════════════════════════════════════════

${gapsList}

═══════════════════════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════════════════════

1. One question per gap
2. Prefer MCQ when possible (faster for user)
3. Free text only when MCQ can't capture nuance
4. Each question must be answerable in <30 seconds
5. Keep questions specific and direct
6. MCQ options should be mutually exclusive and cover common cases

═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON only)
═══════════════════════════════════════════════════════════════════

{
  "questions": [
    {
      "question_id": "q_1",
      "gap_id": "gap_1",
      "objective_id": "obj_...",
      "question": "The question text",
      "type": "mcq" | "free_text",
      "options": ["Option A", "Option B", "Option C", "Option D"] | null,
      "max_length": 150 | null
    }
  ]
}
`.trim();
}
