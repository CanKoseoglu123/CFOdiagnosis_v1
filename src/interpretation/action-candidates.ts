/**
 * VS-32d: Action Candidates Builder
 *
 * Builds a list of candidate actions from diagnostic gaps (questions with "No" answers).
 * Sorted by priority: critical first, then gate blockers, then by objective score ascending.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { CandidateAction } from './types';

interface SpecQuestion {
  id: string;
  title?: string;
  text?: string;
  practice_id: string;
  is_critical?: boolean;
  is_gate_question?: boolean;
  level: number;
  expert_action?: {
    title: string;
    recommendation: string;
  };
}

interface SpecPractice {
  id: string;
  objective_id: string;
}

interface SpecObjective {
  id: string;
  name: string;
}

interface Spec {
  questions: SpecQuestion[];
  practices: SpecPractice[];
  objectives: SpecObjective[];
}

export async function buildCandidateActions(
  supabase: SupabaseClient,
  runId: string,
  spec: Spec,
  objectiveScores: Record<string, number>
): Promise<CandidateAction[]> {
  // Get run with answers
  const { data: run, error } = await supabase
    .from('diagnostic_runs')
    .select('*, inputs:diagnostic_inputs(*)')
    .eq('id', runId)
    .single();

  if (error || !run) {
    throw new Error(`Failed to load run: ${error?.message}`);
  }

  // Find all "No" answers (gaps)
  const gaps: CandidateAction[] = [];

  for (const input of (run.inputs || [])) {
    // Check for "No" answers - value can be 'a', 'b', 'c', 'd' or boolean
    const value = input.value;
    const isNo = value === 'a' || value === false || value === 'no';

    if (!isNo) continue;

    const question = spec.questions.find((q: SpecQuestion) => q.id === input.question_id);
    if (!question) continue;

    const practice = spec.practices.find((p: SpecPractice) => p.id === question.practice_id);
    const objective = practice
      ? spec.objectives.find((o: SpecObjective) => o.id === practice.objective_id)
      : null;

    gaps.push({
      question_id: input.question_id,
      question_title: question.title || question.text || input.question_id,
      objective_id: objective?.id || '',
      objective_name: objective?.name || '',
      objective_score: objectiveScores[objective?.id || ''] || 0,
      expert_action: {
        title: question.expert_action?.title || `Address ${question.title || question.text}`,
        recommendation: question.expert_action?.recommendation ||
          `Implement improvements for: ${question.title || question.text}`,
      },
      is_critical: question.is_critical || false,
      is_gate_blocker: question.is_gate_question || false,
      level: question.level || 1,
    });
  }

  // Sort: Critical first, then gate blockers, then by objective score ascending
  gaps.sort((a, b) => {
    if (a.is_critical !== b.is_critical) return a.is_critical ? -1 : 1;
    if (a.is_gate_blocker !== b.is_gate_blocker) return a.is_gate_blocker ? -1 : 1;
    return a.objective_score - b.objective_score;
  });

  return gaps;
}

export function computeObjectiveScoresFromInputs(
  inputs: Array<{ question_id: string; value: any }>,
  spec: Spec
): Record<string, number> {
  const objectiveScores: Record<string, number> = {};
  const objectiveCounts: Record<string, { yes: number; total: number }> = {};

  for (const input of inputs) {
    const question = spec.questions.find((q: SpecQuestion) => q.id === input.question_id);
    if (!question) continue;

    const practice = spec.practices.find((p: SpecPractice) => p.id === question.practice_id);
    if (!practice) continue;

    const objectiveId = practice.objective_id;
    if (!objectiveCounts[objectiveId]) {
      objectiveCounts[objectiveId] = { yes: 0, total: 0 };
    }

    objectiveCounts[objectiveId].total++;

    // Check for "Yes" answers
    const value = input.value;
    const isYes = value === 'c' || value === 'd' || value === true || value === 'yes';
    if (isYes) {
      objectiveCounts[objectiveId].yes++;
    }
  }

  for (const [objId, counts] of Object.entries(objectiveCounts)) {
    objectiveScores[objId] = counts.total > 0
      ? Math.round((counts.yes / counts.total) * 100)
      : 0;
  }

  return objectiveScores;
}
