/**
 * VS-32: Precompute - Builds interpretation input from diagnostic run
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { InterpretationInput, InterpretationInputSchema } from './types';
import { buildReport, DiagnosticInput } from '../../reports/builder';
import { aggregateResults, Spec as AggSpec } from '../../results/aggregate';
import { SpecRegistry } from '../../specs/registry';
import { toAggregateSpec } from '../../specs/toAggregateSpec';
import { Spec } from '../../specs/types';

// Supabase service client for background operations (bypasses RLS)
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function precompute(runId: string): Promise<InterpretationInput> {
  console.log('[precompute] Starting for run:', runId);
  console.log('[precompute] Service key set:', process.env.SUPABASE_SERVICE_KEY ? 'YES' : 'NO (using anon key fallback)');
  console.log('[precompute] Key length:', supabaseServiceKey?.length || 0);

  // Fetch run separately (avoids join issues)
  const { data: run, error: runError } = await supabase
    .from('diagnostic_runs')
    .select('*')
    .eq('id', runId)
    .maybeSingle();

  if (runError) {
    console.error('[precompute] Run query error:', runError);
    throw new Error(`Failed to fetch run: ${runError.message}`);
  }

  if (!run) {
    console.error('[precompute] Run not found for ID:', runId);
    throw new Error(`Run not found: ${runId}`);
  }

  console.log('[precompute] Found run, status:', run.status);

  // Fetch inputs separately
  const { data: diagnosticInputs, error: inputsError } = await supabase
    .from('diagnostic_inputs')
    .select('question_id, value')
    .eq('run_id', runId);

  if (inputsError) {
    console.error('[precompute] Inputs query error:', inputsError);
    throw new Error(`Failed to fetch inputs: ${inputsError.message}`);
  }

  // Attach inputs to run object for compatibility
  run.diagnostic_inputs = diagnosticInputs || [];
  console.log('[precompute] Found', run.diagnostic_inputs.length, 'inputs');

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
  const report = buildReport({
    run_id: runId,
    spec,
    aggregateResult,
    inputs,
    calibration: run.calibration || null,
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
