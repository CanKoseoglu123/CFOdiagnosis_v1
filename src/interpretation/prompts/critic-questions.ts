/**
 * VS-32: Critic Questions Prompt
 *
 * AI2 generates clarifying questions for prioritized gaps.
 * CRITICAL: Yes/No questions preferred (70%), MCQ when needed, free text as last resort.
 */

import { CriticQuestionsInput, InterpretationQuestion, DiagnosticData } from '../types';
import { formatExemplarsForPrompt } from '../pillars/fpa/question-exemplars';

/**
 * Format known context to prevent asking redundant questions.
 * VS-32 FIX: Expanded to include ALL diagnostic data points that should not be re-asked.
 */
function formatKnownContext(context?: DiagnosticData): string {
  if (!context) {
    return 'No context available.';
  }
  const parts: string[] = [];

  // Company setup data (already collected during company intake)
  if (context.company_name) parts.push(`- Company Name: ${context.company_name}`);
  if (context.industry) parts.push(`- Industry: ${context.industry}`);

  // Pillar setup data (already collected during pillar intake)
  if (context.team_size) parts.push(`- Finance Team Size: ${context.team_size} FTEs`);
  if (context.systems) parts.push(`- Current Systems: ${typeof context.systems === 'string' ? context.systems : (context.systems as string[]).join(', ')}`);
  if (context.pain_points?.length) parts.push(`- Pain Points: ${context.pain_points.join(', ')}`);

  // Diagnostic results (from assessment)
  if (context.execution_score !== undefined) parts.push(`- Execution Score: ${context.execution_score}%`);
  if (context.maturity_level !== undefined) parts.push(`- Maturity Level: L${context.maturity_level} (${context.level_name || 'Unknown'})`);
  if (context.capped) parts.push(`- Maturity Capped By: ${context.capped_by_titles?.join(', ') || 'Critical failures'}`);

  // Objective scores (diagnostic results)
  if (context.objectives?.length) {
    parts.push(`\n### Objective Performance (DO NOT ask about these):`);
    context.objectives.forEach((o) => {
      parts.push(`- ${o.name}: ${o.score}% (importance ${o.importance}/5)${o.has_critical_failure ? ' [CRITICAL FAILURE]' : ''}`);
    });
  }

  // Critical risks (identified from diagnostic)
  if (context.critical_risks?.length) {
    parts.push(`\n### Critical Risks Already Identified:`);
    context.critical_risks.forEach((r) => {
      parts.push(`- ${r.title}`);
    });
  }

  return parts.length > 0 ? parts.join('\n') : 'No context available.';
}

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

  // VS-32: Format known context to prevent redundant questions
  const knownContext = formatKnownContext(input.context);

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

6. NEVER ASK ABOUT KNOWN CONTEXT
   The information below is ALREADY KNOWN. Do NOT ask questions about it.

═══════════════════════════════════════════════════════════════════
KNOWN CONTEXT (DO NOT ASK ABOUT THIS)
═══════════════════════════════════════════════════════════════════

${knownContext}

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
