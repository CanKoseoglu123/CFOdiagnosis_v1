/**
 * VS-32a: Precompute AI Interpretation Input
 *
 * Builds the AIInterpretationInput object by fetching run data,
 * computing maturity/scores, and assembling evidence IDs.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { SpecRegistry } from '../specs/registry';
import { calculateMaturityV2 } from '../maturity/engine';
import { calculateObjectiveScores } from '../scoring/objectiveScoring';
import { AIInterpretationInput } from './types';

// Use the inline type from AIInterpretationInput for objectives
type InterpObjectiveScore = AIInterpretationInput['objectives'][number];

// Types for database records
interface RunRecord {
  id: string;
  status: string;
  spec_version: string;
  context: {
    version?: string;
    company_name?: string;
    company?: { name?: string; industry?: string };
    pillar?: { ftes?: number; pain_points?: string[]; systems?: string[] };
    industry?: string;
  } | null;
  calibration: {
    importance_map?: Record<string, number>;
    locked?: string[];
  } | null;
}

interface InputRecord {
  question_id: string;
  value: string;
}

// Internal objective score structure from scoring module
interface ComputedObjectiveScore {
  objective_id: string;
  objective_name: string;
  level: number;
  score: number;
  status: 'green' | 'yellow' | 'red';
  failed_criticals: string[];
}

export async function precomputeInput(
  supabase: SupabaseClient,
  runId: string
): Promise<AIInterpretationInput> {
  // 1. Fetch run with context and calibration
  const { data: run, error: runError } = await supabase
    .from('diagnostic_runs')
    .select('id, status, spec_version, context, calibration')
    .eq('id', runId)
    .single();

  if (runError || !run) {
    throw new Error(`Run not found: ${runId}`);
  }

  const typedRun = run as RunRecord;

  if (typedRun.status !== 'completed') {
    throw new Error(`Run must be completed before interpretation`);
  }

  // 2. Fetch inputs (answers)
  const { data: inputs, error: inputsError } = await supabase
    .from('diagnostic_inputs')
    .select('question_id, value')
    .eq('run_id', runId);

  if (inputsError) {
    throw new Error(`Failed to fetch inputs: ${inputsError.message}`);
  }

  const typedInputs = (inputs ?? []) as InputRecord[];

  // 3. Load spec
  let spec;
  try {
    console.log('[VS-32c Precompute] Loading spec version:', typedRun.spec_version);
    spec = SpecRegistry.get(typedRun.spec_version);
  } catch (err) {
    console.error('[VS-32c Precompute] Failed to load spec:', typedRun.spec_version, err);
    throw new Error(`Failed to load spec (version: ${typedRun.spec_version}): ${err}`);
  }

  // 4. Calculate maturity using calculateMaturityV2
  // Note: value is passed directly (can be boolean, 'N/A', null, string)
  const maturityResult = calculateMaturityV2({
    answers: typedInputs.map((i: InputRecord) => ({
      question_id: i.question_id,
      value: i.value as boolean | 'N/A' | null | undefined,
    })),
    questions: spec.questions.map((q: { id: string; text: string; level?: number }) => ({
      id: q.id,
      text: q.text,
      level: q.level ?? 1,
    })),
  });

  // 6. Calculate objective scores
  const diagnosticInputs = typedInputs.map((i) => ({
    question_id: i.question_id,
    value: i.value,
  }));

  const objectiveScores = calculateObjectiveScores(spec, diagnosticInputs) as ComputedObjectiveScore[];

  // 7. Extract context data
  const context = typedRun.context || {};
  const companyName = context.company?.name || context.company_name || 'Unknown Company';
  const industry = context.company?.industry || context.industry || 'Unknown Industry';
  const financeTeamSize = context.pillar?.ftes ?? null;
  const painPoints = context.pillar?.pain_points ?? null;

  // 8. Get calibration importance map
  const importanceMap = typedRun.calibration?.importance_map || {};

  // 9. Build objectives array with importance
  const objectives: InterpObjectiveScore[] = objectiveScores.map((obj) => {
    const rawImportance = importanceMap[obj.objective_id];
    const importance: 1 | 2 | 3 | 4 | 5 =
      rawImportance === 1 || rawImportance === 2 || rawImportance === 3 ||
      rawImportance === 4 || rawImportance === 5
        ? rawImportance
        : 3;
    return {
      id: obj.objective_id,
      name: obj.objective_name,
      score: obj.score,
      has_critical_failure: obj.failed_criticals.length > 0,
      importance,
    };
  });

  // 10. Build failed gates list
  const failedGates: AIInterpretationInput['failed_gates'] = [];
  if (maturityResult.capped && maturityResult.blocking_evidence_ids) {
    // Parse blocking evidence to identify which level failed
    const blockingLevel = maturityResult.blocking_level || maturityResult.actual_level;
    const blockingQuestions = maturityResult.blocking_evidence_ids
      .filter((id: string) => id.startsWith('q_'))
      .map((id: string) => {
        const qId = id.replace('q_', '');
        const question = spec.questions.find((q) => q.id === qId);
        return {
          id: qId,
          title: question?.text || qId,
        };
      });

    if (blockingQuestions.length > 0) {
      failedGates.push({
        level: blockingLevel,
        blocking_questions: blockingQuestions,
      });
    }
  }

  // 11. Build critical failures list
  const criticalFailures: AIInterpretationInput['critical_failures'] = [];
  objectiveScores.forEach((obj) => {
    obj.failed_criticals.forEach((qId: string) => {
      const question = spec.questions.find((q) => q.id === qId);
      criticalFailures.push({
        question_id: qId,
        question_title: question?.text || qId,
        objective_name: obj.objective_name,
      });
    });
  });

  // 12. Build priority misalignments (high importance but low score)
  const priorityMisalignments: AIInterpretationInput['priority_misalignments'] = [];
  objectives.forEach((obj) => {
    // High importance (4-5) but low score (<40)
    if (obj.importance >= 4 && obj.score < 40) {
      priorityMisalignments.push({
        objective_name: obj.name,
        importance: obj.importance,
        score: obj.score,
      });
    }
  });

  // 13. Build top strengths and weaknesses
  const sortedByScore = [...objectives].sort((a, b) => b.score - a.score);
  const topStrengths = sortedByScore
    .filter((obj) => obj.score >= 60)
    .slice(0, 3)
    .map((obj) => ({ objective_name: obj.name, score: obj.score }));

  const topWeaknesses = sortedByScore
    .filter((obj) => obj.score < 60)
    .reverse()
    .slice(0, 3)
    .map((obj) => ({ objective_name: obj.name, score: obj.score }));

  // 14. Build available evidence list
  const availableEvidence = buildEvidenceList(
    maturityResult,
    objectiveScores,
    objectives,
    spec
  );

  // 15. Build diagnostic_answers for VS-32c
  const diagnosticAnswers = typedInputs.map((input) => {
    const question = spec.questions.find((q) => q.id === input.question_id);
    return {
      question_id: input.question_id,
      question_text: question?.text || input.question_id,
      answer: String(input.value),
    };
  });

  // 16. Return AIInterpretationInput
  return {
    run_id: runId,
    pillar_id: 'fpa',
    pillar_name: 'FP&A',
    company_name: companyName,
    industry: industry,
    finance_team_size: financeTeamSize,
    pain_points: painPoints,

    // VS-32c: Diagnostic answers for critic context
    diagnostic_answers: diagnosticAnswers,

    execution_score: maturityResult.execution_score,
    maturity_level: maturityResult.actual_level as 1 | 2 | 3 | 4,
    level_name: maturityResult.actual_label,
    capped: maturityResult.capped,
    capped_by: maturityResult.capped_by || [],

    objectives: objectives,
    failed_gates: failedGates,
    critical_failures: criticalFailures,
    priority_misalignments: priorityMisalignments,
    top_strengths: topStrengths,
    top_weaknesses: topWeaknesses,

    available_evidence: availableEvidence,
  };
}

/**
 * Builds the list of evidence IDs that the AI can cite.
 */
function buildEvidenceList(
  maturityResult: ReturnType<typeof calculateMaturityV2>,
  objectiveScores: ComputedObjectiveScore[],
  objectives: InterpObjectiveScore[],
  spec: ReturnType<typeof SpecRegistry.get>
): string[] {
  const evidence: string[] = [];

  // Add objective evidence
  objectiveScores.forEach((obj) => {
    evidence.push(`obj_${obj.objective_id.toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
  });

  // Add practice evidence (from spec)
  if (spec.practices) {
    spec.practices.forEach((p) => {
      evidence.push(`prac_${p.id.toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
    });
  }

  // Add question evidence (from answers that were provided)
  spec.questions.forEach((q) => {
    evidence.push(`q_${q.id.toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
  });

  // Add gate evidence
  for (let level = 1; level <= 4; level++) {
    const passed = level <= maturityResult.actual_level;
    evidence.push(`gate_L${level}_${passed ? 'passed' : 'failed'}`);
  }

  // Add score evidence
  for (let level = 1; level <= 4; level++) {
    evidence.push(`score_L${level}`);
  }

  // Add critical failure evidence
  objectiveScores.forEach((obj) => {
    obj.failed_criticals.forEach((qId: string) => {
      evidence.push(`critical_${qId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
    });
  });

  // Add importance evidence
  objectives.forEach((obj) => {
    evidence.push(`imp_${obj.id.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${obj.importance}`);
  });

  // Add context evidence
  evidence.push('ctx_company_profile');
  evidence.push('ctx_industry_benchmark');
  evidence.push('ctx_maturity_model');

  return evidence;
}
