/**
 * Executive Commentary Fallback
 *
 * Template-based fallback for executive sections when AI fails heuristics.
 * Uses input data to generate data-driven content without AI.
 */

import { ExecutiveSection } from './executive-generator';
import { ExecutiveCommentaryInput } from './executive-prompt';

const LEVEL_NAMES: Record<number, string> = {
  1: 'Emerging',
  2: 'Defined',
  3: 'Managed',
  4: 'Optimized',
};

export function generateExecutiveFallback(
  input: ExecutiveCommentaryInput
): ExecutiveSection[] {
  return [
    {
      id: 'current_state',
      title: 'Current State',
      content: buildCurrentStateFallback(input),
    },
    {
      id: 'actions_committed',
      title: 'Actions Committed',
      content: buildActionsCommittedFallback(input),
    },
    {
      id: 'projected_state',
      title: 'Projected State & Path Forward',
      content: buildProjectedStateFallback(input),
    },
  ];
}

function buildCurrentStateFallback(input: ExecutiveCommentaryInput): string {
  const strengths = input.objectives
    .filter(o => o.current_score >= 65)
    .map(o => o.name);
  const gaps = input.objectives
    .filter(o => o.current_score < 50 && o.importance >= 4)
    .map(o => o.name);

  const strengthsText = strengths.length > 0
    ? `Established capability in ${strengths.slice(0, 2).join(' and ')}.`
    : 'The function is building foundational capabilities across objectives.';

  const gapsText = gaps.length > 0
    ? ` Key gaps in ${gaps.slice(0, 2).join(' and ')} motivated the action plan.`
    : '';

  const criticalText = (input.critical_failures_resolved + input.critical_failures_remaining) > 0
    ? ` ${input.critical_failures_resolved + input.critical_failures_remaining} critical gate requirements were identified.`
    : '';

  return `${input.company_name} operates at Level ${input.current_level} (${input.current_level_name}) with an execution score of ${input.current_score}%. ${strengthsText}${gapsText}${criticalText}`;
}

function buildActionsCommittedFallback(input: ExecutiveCommentaryInput): string {
  const timelineText = `${input.action_counts['6m']} near-term, ${input.action_counts['12m']} mid-term, and ${input.action_counts['24m']} long-term`;

  const topActionsText = input.action_plan.length > 0
    ? ` The highest-impact initiatives target ${input.action_plan.slice(0, 2).map(a => a.objective_name).join(' and ')}.`
    : '';

  const painPointsText = input.pain_points_addressed.length > 0
    ? ` This plan directly addresses ${input.pain_points_addressed.slice(0, 2).join(' and ')}.`
    : '';

  const criticalText = input.critical_failures_resolved > 0
    ? ` ${input.critical_failures_resolved} critical gate requirement${input.critical_failures_resolved > 1 ? 's' : ''} will be resolved.`
    : '';

  return `The action plan commits ${input.action_counts.total} initiatives across ${timelineText} horizons.${topActionsText}${painPointsText}${criticalText}`;
}

function buildProjectedStateFallback(input: ExecutiveCommentaryInput): string {
  const scoreImprovement = input.projected_score - input.current_score;
  const levelAdvancement = input.projected_level > input.current_level;

  const projectionText = levelAdvancement
    ? `Full execution will advance ${input.company_name} from Level ${input.current_level} to Level ${input.projected_level} (${input.projected_level_name}), with the execution score rising from ${input.current_score}% to ${input.projected_score}%.`
    : `Full execution will raise the execution score from ${input.current_score}% to ${input.projected_score}% (+${scoreImprovement} points), strengthening the path toward Level ${input.current_level + 1} (${LEVEL_NAMES[input.current_level + 1] || 'Advanced'}).`;

  const remainingText = input.pain_points_remaining.length > 0
    ? ` Remaining opportunities for future phases include ${input.pain_points_remaining.slice(0, 2).join(' and ')}.`
    : '';

  return `${projectionText}${remainingText}`;
}
