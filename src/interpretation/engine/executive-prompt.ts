/**
 * VS-45: Executive Report AI Commentary Prompt
 *
 * Generates a 3-section narrative for the finalized Executive Report:
 * 1. Current State - Diagnosis snapshot
 * 2. Actions Committed - Pain points addressed by action plan
 * 3. Projected State & Path Forward - Expected outcomes + remaining opportunities
 *
 * Tone: Optimistic, execution-validation. Assumes committed actions will deliver.
 */

export interface ExecutiveCommentaryInput {
  // Company context
  company_name: string;
  industry?: string;

  // Current state (diagnosis)
  current_score: number;
  current_level: number;
  current_level_name: string;

  // Projected state (after actions)
  projected_score: number;
  projected_level: number;
  projected_level_name: string;

  // Objectives with scores
  objectives: Array<{
    id: string;
    name: string;
    current_score: number;
    projected_score: number;
    importance: number;
    has_critical: boolean;
  }>;

  // Action plan snapshot (frozen at finalization)
  action_plan: Array<{
    question_id: string;
    question_title: string;
    objective_name: string;
    practice_name: string;
    timeline: '6m' | '12m' | '24m';
    assigned_owner: string;
    impact_score: number;
    is_critical: boolean;
  }>;

  // Pain points addressed vs remaining
  pain_points_addressed: string[];
  pain_points_remaining: string[];

  // Critical failures
  critical_failures_resolved: number;
  critical_failures_remaining: number;

  // Summary counts
  action_counts: {
    total: number;
    '6m': number;
    '12m': number;
    '24m': number;
  };
}

import { sanitizeForPrompt } from './sanitize';

export function buildExecutiveCommentaryPrompt(input: ExecutiveCommentaryInput): string {
  const levelImprovement = input.projected_level - input.current_level;
  const scoreImprovement = input.projected_score - input.current_score;

  // Top 3 most impactful actions (by impact score)
  const topActions = [...input.action_plan]
    .sort((a, b) => b.impact_score - a.impact_score)
    .slice(0, 3);

  // Objectives with biggest improvement
  const biggestGains = [...input.objectives]
    .map(o => ({
      ...o,
      improvement: o.projected_score - o.current_score,
    }))
    .filter(o => o.improvement > 0)
    .sort((a, b) => b.improvement - a.improvement)
    .slice(0, 3);

  // Strengths (high score objectives)
  const strengths = input.objectives
    .filter(o => o.current_score >= 65)
    .map(o => o.name);

  // Gaps (low score objectives, especially high importance)
  const gaps = input.objectives
    .filter(o => o.current_score < 50 && o.importance >= 4)
    .map(o => o.name);

  return `You are writing executive commentary for a finalized FP&A Maturity Diagnostic report.

═══════════════════════════════════════════════════════════════════
CONTEXT
═══════════════════════════════════════════════════════════════════

Company: ${sanitizeForPrompt(input.company_name)}
${input.industry ? `Industry: ${sanitizeForPrompt(input.industry)}` : ''}

CURRENT STATE:
- Execution Score: ${input.current_score}%
- Maturity Level: L${input.current_level} (${input.current_level_name})
- Strengths: ${strengths.length > 0 ? strengths.join(', ') : 'Building foundational capabilities'}
- Key Gaps: ${gaps.length > 0 ? gaps.join(', ') : 'No critical gaps identified'}
- Critical Failures: ${input.critical_failures_resolved + input.critical_failures_remaining} total

PROJECTED STATE (after action plan execution):
- Execution Score: ${input.projected_score}% (+${scoreImprovement} points)
- Maturity Level: L${input.projected_level} (${input.projected_level_name})${levelImprovement > 0 ? ` — Level advancement!` : ''}
- Critical Failures Resolved: ${input.critical_failures_resolved} of ${input.critical_failures_resolved + input.critical_failures_remaining}

═══════════════════════════════════════════════════════════════════
ACTION PLAN COMMITTED (${input.action_counts.total} actions)
═══════════════════════════════════════════════════════════════════

Timeline breakdown:
- Near-term (6 months): ${input.action_counts['6m']} actions
- Mid-term (12 months): ${input.action_counts['12m']} actions
- Long-term (24 months): ${input.action_counts['24m']} actions

TOP 3 MOST IMPACTFUL ACTIONS:
${topActions.map((a, i) => `${i + 1}. ${a.question_title} (${a.objective_name}) — ${a.timeline}, Owner: ${a.assigned_owner}${a.is_critical ? ' [CRITICAL]' : ''}`).join('\n')}

OBJECTIVES WITH BIGGEST PROJECTED GAINS:
${biggestGains.map(o => `- ${o.name}: ${o.current_score}% → ${o.projected_score}% (+${o.improvement})`).join('\n')}

PAIN POINTS ADDRESSED BY THIS PLAN:
${input.pain_points_addressed.length > 0 ? input.pain_points_addressed.map(p => `- ${p}`).join('\n') : '- General capability improvement across FP&A function'}

REMAINING OPPORTUNITIES (for future phases):
${input.pain_points_remaining.length > 0 ? input.pain_points_remaining.map(p => `- ${p}`).join('\n') : '- Continue optimization of mature capabilities'}

═══════════════════════════════════════════════════════════════════
WRITING INSTRUCTIONS
═══════════════════════════════════════════════════════════════════

TONE: Optimistic, confident, execution-focused. This is a finalized plan — validate the choices made.
- Assume the committed actions WILL be executed successfully
- Frame projections as expected outcomes, not possibilities
- Be forward-looking: "will achieve" not "could achieve"

LANGUAGE RULES:
- Address as "you" or "${sanitizeForPrompt(input.company_name)}"
- Use active voice
- Be specific — reference actual objectives, actions, and numbers
- Scores ≥65%: "solid", "robust", "established", "mature"
- Scores <65%: "emerging", "developing", "foundational"
- Forbidden: "room for improvement", "opportunities to enhance", "it is recommended", "you may want to consider"

═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT — Generate exactly 3 sections as JSON array
═══════════════════════════════════════════════════════════════════

[
  {
    "id": "current_state",
    "title": "Current State",
    "content": "100-120 words. Summarize the diagnosis: overall maturity, key strengths, and the gaps that motivated the action plan. Set the baseline."
  },
  {
    "id": "actions_committed",
    "title": "Actions Committed",
    "content": "100-120 words. Highlight the action plan: what pain points are being addressed, the most impactful initiatives, and the strategic focus areas. Reference specific actions and owners where impactful."
  },
  {
    "id": "projected_state",
    "title": "Projected State & Path Forward",
    "content": "100-120 words. Describe the expected outcomes: score improvement, potential level advancement, resolved critical failures. End with remaining opportunities for future phases."
  }
]

Return ONLY valid JSON. No markdown wrapping. No explanation outside JSON.`;
}

/**
 * System prompt for executive commentary generation
 */
export function buildExecutiveSystemPrompt(): string {
  return `You are a senior finance transformation partner writing the executive summary for a CFO's finalized diagnostic report.

This is an execution validation document. The client has committed to their action plan. Your role is to:
1. Confirm the baseline (current state)
2. Validate their strategic choices (actions committed)
3. Project the expected outcomes with confidence (new state)

Write like a consulting partner presenting to a board. Be concise, specific, and confident.

TONE: Optimistic, forward-looking. Use "will achieve" not "could achieve".

LANGUAGE:
- Scores ≥65%: "solid", "robust", "established", "mature"
- Scores <65%: "emerging", "developing", "foundational"
- Forbidden: "room for improvement", "opportunities to enhance", "it is recommended"

OUTPUT: Valid JSON array only. No markdown. No preamble.`;
}
