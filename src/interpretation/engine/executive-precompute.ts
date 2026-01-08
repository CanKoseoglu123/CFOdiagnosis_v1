/**
 * VS-45: Executive Commentary Precompute
 *
 * Assembles all data needed for executive report AI commentary:
 * - Current state (score, level, objectives)
 * - Projected state (after actions)
 * - Pain points addressed vs remaining
 * - Top impactful actions
 */

import { createClient } from '@supabase/supabase-js';
import { SpecRegistry, DEFAULT_SPEC_VERSION } from '../../specs/registry';
import { normalizeContext } from '../../utils/contextAdapter';
import { PAIN_POINT_PRACTICE_MAP, calculateScore } from '../../actions/prioritizeActions';
import { PAIN_POINTS_LABELS, PainPoints } from '../../specs/schemas';
import { CalibrationData, PillarContext } from '../../actions/types';
import { ExecutiveCommentaryInput } from './executive-prompt';
import { Spec, SpecQuestion, SpecPractice, SpecObjective } from '../../specs/types';

// Supabase service client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Level names
const LEVEL_NAMES: Record<number, string> = {
  1: 'Emerging',
  2: 'Defined',
  3: 'Managed',
  4: 'Optimized',
};

interface ActionPlanItem {
  id: string;
  run_id: string;
  question_id: string;
  status: string;
  timeline: '6m' | '12m' | '24m' | null;
  assigned_owner: string | null;
}

interface ObjectiveScore {
  objective_id: string;
  objective_name: string;
  score: number;
  failed_criticals: string[];
}

/**
 * Precompute all data needed for executive commentary
 */
export async function precomputeExecutiveData(runId: string): Promise<ExecutiveCommentaryInput> {
  // Load spec
  const spec = SpecRegistry.get(DEFAULT_SPEC_VERSION);

  // Fetch run data
  const { data: run, error: runError } = await supabase
    .from('diagnostic_runs')
    .select('*')
    .eq('id', runId)
    .single();

  if (runError || !run) {
    throw new Error(`Failed to fetch run: ${runError?.message || 'Not found'}`);
  }

  // Fetch diagnostic inputs
  const { data: inputs } = await supabase
    .from('diagnostic_inputs')
    .select('question_id, value')
    .eq('run_id', runId);

  const inputMap = new Map<string, unknown>(
    (inputs || []).map((i: { question_id: string; value: unknown }) => [i.question_id, i.value])
  );

  // Normalize context
  const normalizedCtx = normalizeContext(run.context);

  // Extract key data
  const companyName = normalizedCtx.company?.name || 'Company';
  const industry = normalizedCtx.company?.industry;
  const calibration: CalibrationData | null = run.calibration;
  const actionPlanSnapshot: ActionPlanItem[] = run.action_plan_snapshot || [];
  const selectedPainPoints = normalizedCtx.pillar?.pain_points || [];

  // Build pillar context for score calculation
  const pillarContext: PillarContext | null = normalizedCtx.pillar
    ? { pain_points: normalizedCtx.pillar.pain_points }
    : null;

  // Calculate current scores
  const currentScore = run.maturity_v2?.execution_score ?? 0;
  const currentLevel = run.maturity_v2?.actual_level ?? 1;

  // Extract arrays with fallbacks
  const specQuestions = spec.questions || [];
  const specPractices = spec.practices || [];
  const specObjectives = spec.objectives || [];

  // Calculate objective scores
  const objectiveScores = calculateObjectiveScores(specObjectives, specQuestions, inputMap);

  // Calculate projections (current + planned actions)
  const { projectedScore, projectedLevel, objectiveProjections } = calculateProjections(
    specObjectives,
    specQuestions,
    inputMap,
    actionPlanSnapshot
  );

  // Derive pain points coverage
  const { addressed, remaining } = derivePainPointsCoverage(
    selectedPainPoints,
    actionPlanSnapshot,
    specQuestions
  );

  // Get top impactful actions
  const topActions = getTopImpactfulActions(
    actionPlanSnapshot,
    specQuestions,
    specPractices,
    specObjectives,
    calibration,
    pillarContext
  );

  // Count critical failures
  const criticalQuestions = specQuestions.filter(q => q.is_critical);
  const criticalFailuresTotal = criticalQuestions.filter(q => inputMap.get(q.id) !== true).length;
  const criticalActionsPlanned = actionPlanSnapshot.filter(a =>
    criticalQuestions.some(q => q.id === a.question_id)
  ).length;

  // Action counts by timeline
  const actionCounts = {
    total: actionPlanSnapshot.length,
    '6m': actionPlanSnapshot.filter(a => a.timeline === '6m').length,
    '12m': actionPlanSnapshot.filter(a => a.timeline === '12m').length,
    '24m': actionPlanSnapshot.filter(a => a.timeline === '24m').length,
  };

  // Build objectives array for prompt
  const objectivesForPrompt = specObjectives.map(obj => {
    const currentObjScore = objectiveScores.get(obj.id) || 0;
    const projectedObjScore = objectiveProjections.get(obj.id) || currentObjScore;
    const importance = calibration?.importance_map?.[obj.id] ?? 3;
    const hasCritical = criticalQuestions.some(
      q => q.objective_id === obj.id && inputMap.get(q.id) !== true
    );

    return {
      id: obj.id,
      name: obj.name,
      current_score: currentObjScore,
      projected_score: projectedObjScore,
      importance: importance as number,
      has_critical: hasCritical,
    };
  });

  return {
    company_name: companyName,
    industry: industry || undefined,
    current_score: Math.round(currentScore),
    current_level: currentLevel,
    current_level_name: LEVEL_NAMES[currentLevel] || 'Unknown',
    projected_score: Math.round(projectedScore),
    projected_level: projectedLevel,
    projected_level_name: LEVEL_NAMES[projectedLevel] || 'Unknown',
    objectives: objectivesForPrompt,
    action_plan: topActions,
    pain_points_addressed: addressed,
    pain_points_remaining: remaining,
    critical_failures_resolved: criticalActionsPlanned,
    critical_failures_remaining: criticalFailuresTotal - criticalActionsPlanned,
    action_counts: actionCounts,
  };
}

/**
 * Calculate current objective scores
 */
function calculateObjectiveScores(
  objectives: Array<{ id: string; name: string }>,
  questions: Array<{ id: string; objective_id?: string }>,
  inputMap: Map<string, unknown>
): Map<string, number> {
  const scores = new Map<string, number>();

  for (const obj of objectives) {
    const objQuestions = questions.filter(q => q.objective_id === obj.id);
    if (objQuestions.length === 0) {
      scores.set(obj.id, 0);
      continue;
    }

    const yesCount = objQuestions.filter(q => inputMap.get(q.id) === true).length;
    const score = Math.round((yesCount / objQuestions.length) * 100);
    scores.set(obj.id, score);
  }

  return scores;
}

/**
 * Calculate projected scores after action plan execution
 */
function calculateProjections(
  objectives: Array<{ id: string; name: string }>,
  questions: Array<{ id: string; objective_id?: string }>,
  inputMap: Map<string, unknown>,
  actionPlan: ActionPlanItem[]
): {
  projectedScore: number;
  projectedLevel: number;
  objectiveProjections: Map<string, number>;
} {
  const actionSet = new Set(actionPlan.map(a => a.question_id));
  const objectiveProjections = new Map<string, number>();

  // Total projection
  let totalYes = 0;
  let totalQuestions = questions.length;

  for (const obj of objectives) {
    const objQuestions = questions.filter(q => q.objective_id === obj.id);
    if (objQuestions.length === 0) {
      objectiveProjections.set(obj.id, 0);
      continue;
    }

    const projectedYes = objQuestions.filter(
      q => inputMap.get(q.id) === true || actionSet.has(q.id)
    ).length;

    const score = Math.round((projectedYes / objQuestions.length) * 100);
    objectiveProjections.set(obj.id, score);
    totalYes += projectedYes;
  }

  const projectedScore = totalQuestions > 0 ? Math.round((totalYes / totalQuestions) * 100) : 0;
  const projectedLevel = scoreToLevel(projectedScore);

  return { projectedScore, projectedLevel, objectiveProjections };
}

/**
 * Convert score to maturity level
 */
function scoreToLevel(score: number): number {
  if (score >= 95) return 4;
  if (score >= 80) return 3;
  if (score >= 50) return 2;
  return 1;
}

/**
 * Derive which pain points are addressed by the action plan
 */
function derivePainPointsCoverage(
  selectedPainPoints: string[],
  actionPlanSnapshot: ActionPlanItem[],
  questions: Array<{ id: string; practice_id?: string }>
): { addressed: string[]; remaining: string[] } {
  // Get all practices covered by action plan
  const practicesCovered = new Set<string>();

  for (const action of actionPlanSnapshot) {
    const question = questions.find(q => q.id === action.question_id);
    if (question?.practice_id) {
      practicesCovered.add(question.practice_id);
    }
  }

  const addressed: string[] = [];
  const remaining: string[] = [];

  // Check each user-selected pain point
  for (const painPoint of selectedPainPoints) {
    const relatedPractices = PAIN_POINT_PRACTICE_MAP[painPoint] || [];
    const isAddressed = relatedPractices.some(p => practicesCovered.has(p));
    const label = PAIN_POINTS_LABELS[painPoint as keyof typeof PAIN_POINTS_LABELS] || painPoint;

    if (isAddressed) {
      addressed.push(label);
    } else {
      remaining.push(label);
    }
  }

  return { addressed, remaining };
}

/**
 * Get top 3 most impactful actions from the action plan
 */
function getTopImpactfulActions(
  actionPlanSnapshot: ActionPlanItem[],
  questions: Array<{
    id: string;
    text?: string;
    practice_id?: string;
    objective_id?: string;
    impact?: number;
    complexity?: number;
    is_critical?: boolean;
  }>,
  practices: Array<{ id: string; title?: string }>,
  objectives: Array<{ id: string; name: string }>,
  calibration: CalibrationData | null,
  pillarContext: PillarContext | null
): ExecutiveCommentaryInput['action_plan'] {
  const actionsWithImpact = actionPlanSnapshot
    .map(action => {
      const question = questions.find(q => q.id === action.question_id);
      if (!question) return null;

      // Calculate impact score
      const impactScore = calculateScore(
        question as any, // Type coercion for SpecQuestion
        calibration,
        pillarContext
      );

      // Get practice and objective names
      const practice = practices.find(p => p.id === question.practice_id);
      const objective = objectives.find(o => o.id === question.objective_id);

      return {
        question_id: action.question_id,
        question_title: question.text || 'Action item',
        objective_name: objective?.name || 'General',
        practice_name: practice?.title || 'General',
        timeline: action.timeline || '12m',
        assigned_owner: action.assigned_owner || 'TBD',
        impact_score: impactScore,
        is_critical: question.is_critical || false,
      };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);

  // Sort by impact score and return top 3
  return actionsWithImpact
    .sort((a, b) => b.impact_score - a.impact_score)
    .slice(0, 3) as ExecutiveCommentaryInput['action_plan'];
}
