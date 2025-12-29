/**
 * VS-32d: Action Proposal Prompt Builder
 *
 * Builds the prompt for the AI action planner agent.
 */

import { AIInterpretationInput, PlanningContext, CapacityResult, CandidateAction } from '../types';

const PRIORITY_FOCUS_MAP: Record<string, string> = {
  'critical_gaps': 'Close critical control gaps (risk reduction)',
  'forecast_accuracy': 'Improve forecast accuracy (decision quality)',
  'efficiency': 'Reduce manual effort (efficiency gains)',
  'strategic': 'Better support strategic decisions (business influence)',
};

export function buildActionProposalPrompt(
  input: AIInterpretationInput,
  planning: PlanningContext,
  capacity: CapacityResult,
  candidates: CandidateAction[]
): string {
  const priorityList = planning.priority_focus
    .map(p => PRIORITY_FOCUS_MAP[p] || p)
    .join('\n• ');

  const criticalCount = candidates.filter(c => c.is_critical).length;
  const gateBlockerCount = candidates.filter(c => c.is_gate_blocker).length;

  return `
You are creating an action plan for ${input.company_name}.

═══════════════════════════════════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════════════════════════════════

1. SELECT ONLY from candidate actions below. Never invent actions.
2. RESPECT CAPACITY CAPS — Do not exceed:
   • 6-month: ${capacity.max_actions['6m']} actions
   • 12-month: ${capacity.max_actions['12m']} actions total (including 6m)
   • 24-month: ${capacity.max_actions['24m']} actions total (including 6m+12m)
3. PRIORITIZATION ORDER:
   a) Critical failures (must be in 6m)
   b) Gate blockers (should be in 6m or 12m)
   c) User's stated priority focus
   d) Lowest-scoring objectives
4. RATIONALE: Each action needs why_selected, why_this_timeline, expected_impact
5. NARRATIVE: Write consultant-style situation/challenge/approach/outcome

═══════════════════════════════════════════════════════════════════════════════
CONTEXT
═══════════════════════════════════════════════════════════════════════════════

Company: ${input.company_name}
Industry: ${input.industry}
Team Size: ${planning.team_size_override || input.finance_team_size || 'Unknown'}

Current Level: ${input.maturity_level} (${input.level_name})
Target Level: ${planning.target_maturity_level || 'Not specified'}
Bandwidth: ${planning.bandwidth || 'Not specified'}
Capacity Band: ${capacity.band}${capacity.assumed ? ' (assumed)' : ''}

Priority Focus:
• ${priorityList || 'None specified'}

Critical Failures: ${criticalCount}
Gate Blockers: ${gateBlockerCount}

═══════════════════════════════════════════════════════════════════════════════
CANDIDATE ACTIONS (select from these only)
═══════════════════════════════════════════════════════════════════════════════

${candidates.map((c, i) => `
${i + 1}. [${c.question_id}] ${c.expert_action.title}
   Objective: ${c.objective_name} (${c.objective_score}%)
   ${c.is_critical ? '⚠️ CRITICAL' : ''} ${c.is_gate_blocker ? '🔒 GATE BLOCKER L' + c.level : ''}
   Recommendation: ${c.expert_action.recommendation}
`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

{
  "narrative": {
    "situation": "Your FP&A function operates at Level ${input.maturity_level}...",
    "challenge": "To reach Level ${planning.target_maturity_level || input.maturity_level + 1} within 18 months...",
    "approach": "This plan sequences X actions across three horizons...",
    "expected_outcome": "Completing this plan positions you for..."
  },
  "actions": [
    {
      "question_id": "fpa_l1_q03",
      "action_title": "Establish Variance Analysis Process",
      "action_recommendation": "Document variance thresholds and escalation procedures...",
      "timeline": "6m",
      "rationale": {
        "why_selected": "Critical control gap blocking Level 2 certification",
        "why_this_timeline": "Must resolve before other improvements can stick",
        "expected_impact": "Removes L2 gate blocker, enables proactive issue detection"
      },
      "evidence_ids": ["critical_fpa_l1_q03", "gate_L2_failed"],
      "priority_rank": 1,
      "is_critical": true,
      "is_gate_blocker": true
    }
  ],
  "summary": {
    "total_actions": 8,
    "by_timeline": { "6m": 3, "12m": 3, "24m": 2 },
    "addresses_critical": 2,
    "unlocks_gates": 1
  }
}
`.trim();
}
