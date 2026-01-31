/**
 * VS-32: Precompute - Builds interpretation input from diagnostic run
 */

import crypto from 'crypto';
import { InterpretationInput, InterpretationInputSchema } from './types';
import { buildReport, DiagnosticInput } from '../../reports/builder';
import { aggregateResults, Spec as AggSpec } from '../../results/aggregate';
import { SpecRegistry } from '../../specs/registry';
import { toAggregateSpec } from '../../specs/toAggregateSpec';
import { Spec } from '../../specs/types';
import { normalizeContext } from '../../utils/contextAdapter';  // VS26
import { readFileSync } from 'fs';
import { join } from 'path';
import { getServiceClient } from '../../lib/supabase';
import { Classification } from '../../utils/targetCalculation';
import { CompanyContext } from '../../specs/schemas';

export async function precompute(runId: string): Promise<InterpretationInput> {
  // Fetch run separately (avoids join issues)
  const { data: run, error: runError } = await getServiceClient()
    .from('diagnostic_runs')
    .select('*')
    .eq('id', runId)
    .maybeSingle();

  if (runError) {
    console.error('[precompute] Run query error:', runError);
    throw new Error(`Failed to fetch run: ${runError.message}`);
  }

  if (!run) {
    throw new Error(`Run not found: ${runId}`);
  }

  // Fetch inputs separately
  const { data: diagnosticInputs, error: inputsError } = await getServiceClient()
    .from('diagnostic_inputs')
    .select('question_id, value')
    .eq('run_id', runId);

  if (inputsError) {
    console.error('[precompute] Inputs query error:', inputsError);
    throw new Error(`Failed to fetch inputs: ${inputsError.message}`);
  }

  // Attach inputs to run object for compatibility
  run.diagnostic_inputs = diagnosticInputs || [];

  const pillarId = run.pillar_id || 'fpa';
  const spec = SpecRegistry.getDefault();

  // Transform diagnostic_inputs to the format expected by aggregateResults/buildReport
  // value is boolean: true=yes, false=no, null=skipped
  const inputs: DiagnosticInput[] = (run.diagnostic_inputs || []).map((di: { question_id: string; value: boolean | null }) => ({
    question_id: di.question_id,
    value: di.value,
  }));

  // Use existing scoring logic via aggregateResults + buildReport
  const aggregateSpec = toAggregateSpec(spec);
  const aggregateResult = aggregateResults(aggregateSpec, inputs.map(i => ({
    question_id: i.question_id,
    score: i.value === true ? 1 : 0,
  })));

  // VS26: Extract pillar context for pain point boosting
  const normalizedCtx = normalizeContext(run.context);
  const pillarContext = normalizedCtx.pillar ? {
    pain_points: normalizedCtx.pillar.pain_points || undefined,
    tools: normalizedCtx.pillar.tools_with_effectiveness || undefined,
  } : null;

  // VS-27f: Fetch company profile classification for targets (optional)
  let classification: Classification | null = null;
  let companyContext: CompanyContext | null = null;
  if (run.company_profile_id) {
    const { data: profile } = await getServiceClient()
      .from('company_profiles')
      .select('context, classification')
      .eq('id', run.company_profile_id)
      .single();

    if (profile?.classification) {
      classification = profile.classification;
      companyContext = profile.context || {};
    }
  }

  const report = buildReport({
    run_id: runId,
    spec,
    aggregateResult,
    inputs,
    calibration: run.calibration || null,
    pillarContext,  // VS26: Pass pillar context for pain point boosting
    classification,
    companyContext,
  });

  // Extract objectives with their importance from calibration
  const importanceMap = run.calibration?.importance_map || {};
  const objectives = (report.objectives || []).map((obj: { objective_id: string; objective_name: string; score: number; overridden: boolean }) => ({
    id: obj.objective_id,
    name: obj.objective_name,
    score: Math.round(obj.score ?? 0),
    importance: importanceMap[obj.objective_id] ?? 3,
    has_critical: obj.overridden ?? false,
  }));

  // Build evidence list
  const evidence_ids = buildEvidenceList(report, objectives);

  // Find priority misalignments: high importance (>=4) but low score (<50)
  type ObjData = { id: string; name: string; score: number; importance: number; has_critical: boolean };
  const priority_misalignments = objectives
    .filter((o: ObjData) => o.importance >= 4 && o.score < 50)
    .map((o: ObjData) => ({
      objective_name: o.name,
      importance: o.importance,
      score: o.score,
    }));

  // Build critical failures list
  const critical_failures = ((report.critical_risks || []) as any[])
    .filter((r) => r.user_answer !== true) // Risk is when NOT answered true
    .map((r) => {
      const question = (spec.questions as any[]).find((q) => q.id === r.evidence_id);
      const objective = ((report.objectives || []) as any[]).find((o) =>
        (spec.questions as any[]).some((q) => q.id === r.evidence_id && q.objective_id === o.objective_id)
      );
      return {
        question_id: r.evidence_id,
        question_title: r.expert_action?.title || question?.text || r.evidence_id,
        objective_name: objective?.objective_name || r.pillar_name || 'Unknown',
      };
    });

  // Build failed gates list
  const failed_gates: Array<{ level: number; blocking_questions: string[] }> = [];
  if (report.maturity_v2?.blocking_level) {
    failed_gates.push({
      level: report.maturity_v2.blocking_level,
      blocking_questions: report.maturity_v2.blocking_evidence_ids || [],
    });
  }

  // Get company context
  const context = run.context || {};
  const company_name = context.company?.name || context.company_name || 'The organization';
  const industry = context.company?.industry || context.industry || 'Not specified';

  // VS-38: Extract pain points from pillar context
  const pain_points = pillarContext?.pain_points || [];

  // VS-38: Extract weak practices from maturity footprint
  const weak_practices = extractWeakPractices(report, objectives);

  // VS-38: Load persona targets from targetMatrix.json
  const persona_targets = extractPersonaTargets(classification, objectives);

  const input: InterpretationInput = {
    pillar_id: pillarId,
    run_id: runId,
    company_name,
    industry,

    overall_score: Math.round(report.maturity_v2?.execution_score ?? report.overall_score ?? 0),
    maturity_level: report.maturity_v2?.actual_level ?? report.maturity?.achieved_level ?? 1,
    maturity_name: getLevelName(report.maturity_v2?.actual_level ?? report.maturity?.achieved_level ?? 1),
    is_capped: report.maturity_v2?.capped ?? false,
    capped_by: report.maturity_v2?.capped_by ?? [],

    objectives,
    critical_failures,
    failed_gates,
    priority_misalignments,
    evidence_ids,

    // VS-38: Enriched context
    pain_points: pain_points.length > 0 ? pain_points : undefined,
    weak_practices: weak_practices.length > 0 ? weak_practices : undefined,
    persona_targets: persona_targets.length > 0 ? persona_targets : undefined,
  };

  // Validate - fail fast if bad data
  const validation = InterpretationInputSchema.safeParse(input);
  if (!validation.success) {
    throw new Error(`Precompute validation failed: ${validation.error.message}`);
  }

  return validation.data;
}

function getLevelName(level: number): string {
  const names: Record<number, string> = {
    1: 'Emerging',
    2: 'Defined',
    3: 'Managed',
    4: 'Optimized',
  };
  return names[level] || 'Unknown';
}

function buildEvidenceList(report: any, objectives: any[]): string[] {
  const evidence: string[] = [];

  evidence.push('score_overall');
  evidence.push(`level_${report.maturity_v2?.actual_level ?? report.maturity?.achieved_level ?? 1}`);
  evidence.push(report.maturity_v2?.capped ? 'cap_active' : 'cap_none');
  evidence.push('path_optimization');

  for (const obj of objectives) {
    evidence.push(`obj_${obj.id}`);
  }

  for (const c of report.critical_risks || []) {
    if (c.user_answer !== true) {
      evidence.push(`critical_${c.evidence_id}`);
    }
  }

  if (report.maturity_v2?.blocking_level) {
    evidence.push(`gate_L${report.maturity_v2.blocking_level}_blocked`);
  }

  return [...new Set(evidence)]; // Remove duplicates
}

/**
 * VS-38: Extract weak practices from maturity footprint
 * Practices with evidence_state !== 'proven' in objectives scoring <60%
 * Limited to 3 per objective, 9 total
 */
function extractWeakPractices(
  report: any,
  objectives: Array<{ id: string; name: string; score: number }>
): Array<{ objective_name: string; practice_name: string; evidence_state: 'proven' | 'partial' | 'not_proven' }> {
  const footprint = report.maturity_footprint;
  if (!footprint?.levels) return [];

  // Build a flat list of all practices with their evidence state
  const allPractices: Array<{ practice: any; level: number }> = [];
  for (const level of footprint.levels) {
    for (const practice of level.practices || []) {
      allPractices.push({ practice, level: level.level });
    }
  }

  // Get objectives scoring <60%
  const weakObjectiveIds = new Set(
    objectives.filter(o => o.score < 60).map(o => o.id)
  );

  if (weakObjectiveIds.size === 0) return [];

  // We need to map practices back to objectives — practices have objective_id on the spec level
  // The footprint practices don't carry objective_id, so we need the spec
  const spec = SpecRegistry.getDefault();
  const practiceSpecs = (spec.practices || []) as Array<{ id: string; objective_id: string }>;
  const practiceToObjective = new Map(practiceSpecs.map(p => [p.id, p.objective_id]));

  // Build objective name map
  const objectiveNameMap = new Map(objectives.map(o => [o.id, o.name]));

  const result: Array<{ objective_name: string; practice_name: string; evidence_state: 'proven' | 'partial' | 'not_proven' }> = [];
  const perObjectiveCount = new Map<string, number>();

  for (const { practice } of allPractices) {
    if (practice.evidence_state === 'proven') continue;
    if (practice.is_not_assessed) continue;

    const objectiveId = practiceToObjective.get(practice.id);
    if (!objectiveId || !weakObjectiveIds.has(objectiveId)) continue;

    const count = perObjectiveCount.get(objectiveId) || 0;
    if (count >= 3) continue;

    const objectiveName = objectiveNameMap.get(objectiveId) || objectiveId;
    result.push({
      objective_name: objectiveName,
      practice_name: practice.title,
      evidence_state: practice.evidence_state,
    });

    perObjectiveCount.set(objectiveId, count + 1);
    if (result.length >= 9) break;
  }

  return result;
}

/**
 * VS-38: Load persona targets from targetMatrix.json
 * Compares current objective scores to persona-specific target levels
 */
let _targetMatrix: any = null;
function loadTargetMatrix(): any {
  if (!_targetMatrix) {
    try {
      const raw = readFileSync(join(__dirname, '../../../content/targetMatrix.json'), 'utf-8');
      _targetMatrix = JSON.parse(raw);
    } catch (err) {
      console.error('[precompute] Failed to load targetMatrix.json:', err);
      _targetMatrix = {};
    }
  }
  return _targetMatrix;
}

function extractPersonaTargets(
  classification: any,
  objectives: Array<{ id: string; name: string; score: number }>
): Array<{ objective_name: string; current_score: number; target_level: number }> {
  const persona = classification?.persona;
  if (!persona) return [];

  const matrix = loadTargetMatrix();
  const targets = matrix?.objectiveTargets?.[persona];
  if (!targets) return [];

  return objectives
    .filter(o => targets[o.id] !== undefined)
    .map(o => ({
      objective_name: o.name,
      current_score: o.score,
      target_level: targets[o.id],
    }));
}

/**
 * Compute hash of inputs + calibration for regeneration control
 */
export function computeInputHash(run: any): string {
  const hashInput = {
    answers: (run.diagnostic_inputs || [])
      .sort((a: any, b: any) => a.question_id.localeCompare(b.question_id))
      .map((i: any) => `${i.question_id}:${i.value}`),
    calibration: run.calibration,
  };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(hashInput))
    .digest('hex')
    .substring(0, 16);
}
