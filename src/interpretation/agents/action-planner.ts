/**
 * VS-32d: Action Planner Agent
 *
 * Generates AI-powered action proposals based on diagnostic gaps and planning context.
 */

import OpenAI from 'openai';
import { SupabaseClient } from '@supabase/supabase-js';
import { buildActionProposalPrompt } from '../prompts/action-proposal';
import { ActionPlanProposalSchema } from '../schemas';
import { precomputeInput } from '../precompute';
import { buildCandidateActions, computeObjectiveScoresFromInputs } from '../action-candidates';
import { calculateCapacity } from '../capacity';
import { PlanningContext, ActionPlanProposal, CandidateAction } from '../types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateActionProposal(
  supabase: SupabaseClient,
  runId: string,
  planning: PlanningContext
): Promise<{ proposal: ActionPlanProposal; tokensUsed: number }> {
  // Get precomputed input for the run
  const input = await precomputeInput(supabase, runId);

  // Load spec from registry
  const { SpecRegistry } = await import('../../specs/registry');
  const spec = SpecRegistry.get('v2.9.0');

  // Get diagnostic inputs for objective score calculation
  const { data: runData } = await supabase
    .from('diagnostic_runs')
    .select('*, inputs:diagnostic_inputs(*)')
    .eq('id', runId)
    .single();

  const inputs = runData?.inputs || [];
  const objectiveScores = computeObjectiveScoresFromInputs(inputs, spec as any);

  // Build candidate actions from gaps
  const candidates = await buildCandidateActions(supabase, runId, spec as any, objectiveScores);

  if (candidates.length === 0) {
    // No gaps = create a "maintain" proposal
    return createMaintainProposal(input, planning);
  }

  const teamSize = planning.team_size_override || input.finance_team_size;
  const capacity = calculateCapacity(teamSize, planning.bandwidth);

  const prompt = buildActionProposalPrompt(input, planning, capacity, candidates);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 2500,
    messages: [
      {
        role: 'system',
        content: 'You are a senior finance transformation consultant creating an action plan. Output valid JSON only.',
      },
      { role: 'user', content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');

  const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
  const parsed = JSON.parse(jsonStr);
  const proposal = ActionPlanProposalSchema.parse(parsed);

  // Validate all selected question_ids exist in candidates
  const candidateIds = new Set(candidates.map((c: CandidateAction) => c.question_id));
  for (const action of proposal.actions) {
    if (!candidateIds.has(action.question_id)) {
      console.warn(`AI selected non-existent action: ${action.question_id}, removing`);
      // Remove invalid actions rather than throwing
      proposal.actions = proposal.actions.filter(a => candidateIds.has(a.question_id));
    }
  }

  // Validate capacity not exceeded (warn only)
  const counts = { '6m': 0, '12m': 0, '24m': 0 };
  for (const action of proposal.actions) {
    counts[action.timeline]++;
  }

  const cumulative6m = counts['6m'];
  const cumulative12m = counts['6m'] + counts['12m'];
  const cumulative24m = counts['6m'] + counts['12m'] + counts['24m'];

  if (cumulative6m > capacity.max_actions['6m']) {
    console.warn(`6m capacity exceeded: ${cumulative6m} > ${capacity.max_actions['6m']}`);
  }
  if (cumulative12m > capacity.max_actions['12m']) {
    console.warn(`12m capacity exceeded: ${cumulative12m} > ${capacity.max_actions['12m']}`);
  }

  // Update summary to match actual counts
  proposal.summary = {
    total_actions: proposal.actions.length,
    by_timeline: counts,
    addresses_critical: proposal.actions.filter(a => a.is_critical).length,
    unlocks_gates: proposal.actions.filter(a => a.is_gate_blocker).length,
  };

  return {
    proposal: {
      ...proposal,
      generated_at: new Date().toISOString(),
      model: 'gpt-4o',
    } as ActionPlanProposal,
    tokensUsed: response.usage?.total_tokens || 0,
  };
}

function createMaintainProposal(
  input: any,
  planning: PlanningContext
): { proposal: ActionPlanProposal; tokensUsed: number } {
  return {
    proposal: {
      narrative: {
        situation: `Your FP&A function operates at Level ${input.maturity_level} (${input.level_name}) with no identified gaps.`,
        challenge: 'The primary challenge is maintaining current performance while preparing for future growth.',
        approach: 'Focus on consolidation, documentation, and continuous improvement of existing processes.',
        expected_outcome: `Sustained Level ${input.maturity_level} performance with readiness for future advancement.`,
      },
      actions: [],
      summary: {
        total_actions: 0,
        by_timeline: { '6m': 0, '12m': 0, '24m': 0 },
        addresses_critical: 0,
        unlocks_gates: 0,
      },
      generated_at: new Date().toISOString(),
      model: 'none',
    },
    tokensUsed: 0,
  };
}
