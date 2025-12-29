/**
 * VS-32a: Single-Call Generator Prompt
 * VS-32b: Retry prompt for heuristic failures
 *
 * Builds the prompt for GPT-4o to generate a 5-section overview report
 * in a single API call.
 */

import { AIInterpretationInput, VS32bHeuristicViolation } from '../types';
import { formatViolationsForRetry } from '../validation/heuristics';

export function buildGeneratorPrompt(input: AIInterpretationInput): string {
  const objectivesList = input.objectives
    .map(o => `- ${o.name}: ${o.score}% | Importance: ${o.importance}/5${o.has_critical_failure ? ' [CRITICAL]' : ''}`)
    .join('\n');

  return `
You are a senior FP&A transformation consultant writing an executive summary.

ABSOLUTE RULES:
1. Every statement must cite evidence_ids from the available list
2. Never invent facts — only interpret what the diagnostic proves
3. Don't say "Your score is 45%" — explain what it MEANS
4. Sharp, direct consulting voice. No hedging ("may want to consider")
5. Each section: max 120 words, max 4 sentences prose OR max 6 bullets
6. If no issue exists for a section, say "No material issue identified."

FORBIDDEN PHRASES:
- "your score is" / "you scored"
- "the assessment shows" / "based on your responses"
- "room for improvement" / "opportunities to enhance"
- "it is recommended" / "you may want to consider"

COMPANY CONTEXT:
Company: ${input.company_name}
Industry: ${input.industry}
Team Size: ${input.finance_team_size || 'Unknown'}
Pain Points: ${input.pain_points?.join('; ') || 'Not specified'}

DIAGNOSTIC RESULTS (ABSOLUTE TRUTH — do not contradict):
Execution Score: ${input.execution_score}%
Maturity Level: ${input.maturity_level} (${input.level_name})
Capped: ${input.capped ? 'Yes, by: ' + input.capped_by.join(', ') : 'No'}

OBJECTIVES (sorted by score, lowest first):
${objectivesList}

CRITICAL FAILURES:
${input.critical_failures.length ? input.critical_failures.map(c => `- ${c.question_title} (${c.objective_name})`).join('\n') : 'None'}

FAILED GATES:
${input.failed_gates.length ? input.failed_gates.map(g => `- Level ${g.level}: ${g.blocking_questions.map(q => q.title).join(', ')}`).join('\n') : 'All gates passed'}

PRIORITY MISALIGNMENTS (high importance but low score):
${input.priority_misalignments.length ? input.priority_misalignments.map(m => `- ${m.objective_name}: Importance ${m.importance}/5 but score ${m.score}%`).join('\n') : 'None'}

AVAILABLE EVIDENCE IDs (cite ONLY from this list):
${input.available_evidence.join(', ')}

OUTPUT FORMAT — Return valid JSON with exactly 5 sections:
{
  "sections": [
    {
      "id": "execution_snapshot",
      "title": "Execution & Maturity Snapshot",
      "content": "Your prose here...",
      "format": "prose",
      "evidence_ids": ["score_L2", "gate_L2_failed"]
    },
    {
      "id": "priority_alignment",
      "title": "Priority vs Reality",
      "content": "...",
      "format": "prose",
      "evidence_ids": ["obj_forecasting", "imp_forecasting_5"]
    },
    {
      "id": "strengths_weaknesses",
      "title": "Structural Strengths & Weaknesses",
      "content": "...",
      "format": "bullets",
      "bullets": ["Strength: ...", "Weakness: ..."],
      "evidence_ids": ["obj_budget_discipline", "obj_scenario_modeling"]
    },
    {
      "id": "next_level_unlock",
      "title": "Next-Level Unlock",
      "content": "...",
      "format": "prose",
      "evidence_ids": ["gate_L2_failed", "critical_fpa_l1_q03"]
    },
    {
      "id": "capacity_check",
      "title": "Capacity & Feasibility",
      "content": "...",
      "format": "prose",
      "evidence_ids": ["ctx_team_size"]
    }
  ]
}
`.trim();
}

/**
 * VS-32b: Build retry prompt with violations to fix.
 * Used when first attempt fails heuristic checks.
 */
export function buildRetryPrompt(
  input: AIInterpretationInput,
  violations: VS32bHeuristicViolation[]
): string {
  const basePrompt = buildGeneratorPrompt(input);
  const violationList = formatViolationsForRetry(violations);

  return `
${basePrompt}

CRITICAL: Your previous response had these errors that must be fixed:
${violationList}

Fix ALL of these issues in your response. Do not repeat these mistakes.
`.trim();
}
