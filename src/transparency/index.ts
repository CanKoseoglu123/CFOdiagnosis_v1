// src/transparency/index.ts
// Admin Calculation Transparency - Hierarchical Score Breakdown
// Shows complete audit trail: Question → Practice → Objective → Overall

import { SupabaseClient } from "@supabase/supabase-js";
import { SpecRegistry } from "../specs/registry";
import { Spec, SpecQuestion, SpecObjective, SpecPractice } from "../specs/types";
import { L1_CRITICALS, L2_CRITICALS, SCORE_THRESHOLDS, LEVEL_NAMES } from "../gates";
import { CalibrationData, IMPORTANCE_MULTIPLIERS, ImportanceLevel } from "../actions/types";
import { calculateScore } from "../actions/prioritizeActions";

// =============================================================================
// TYPES
// =============================================================================

interface BlockingQuestion {
  question_id: string;
  question_text: string;
  gate_level: 'L1' | 'L2';
}

interface GateStatus {
  gate_level: 'L1' | 'L2';
  total_criticals: number;
  passed: number;
  failed: number;
  passed_questions: string[];
  failed_questions: string[];
}

interface QuestionBreakdown {
  question_id: string;
  question_text: string;
  maturity_level: number;
  practice_id: string;
  objective_id: string;
  answer: 'YES' | 'NO' | 'N/A' | 'Unanswered';
  possible_points: number;
  achieved_points: number;
  percent_of_total: number;
  is_critical: boolean;
  blocking_status: string | null;
  impact: number;
  complexity: number;
}

interface PracticeBreakdown {
  practice_id: string;
  practice_title: string;
  maturity_level: number;
  possible_points: number;
  achieved_points: number;
  score: number;
  evidence_state: 'proven' | 'partial' | 'not_proven';
  has_critical_failure: boolean;
  yes_count: number;
  no_count: number;
  na_count: number;
  contribution_to_objective: number;
  questions: QuestionBreakdown[];
}

interface ObjectiveBreakdown {
  objective_id: string;
  objective_name: string;
  possible_points: number;
  achieved_points: number;
  score: number;
  traffic_light: 'green' | 'yellow' | 'red';
  critical_override: boolean;
  importance_level: number;
  importance_multiplier: number;
  yes_count: number;
  no_count: number;
  na_count: number;
  contribution_to_overall: number;
  practices: PracticeBreakdown[];
}

interface ActionImpact {
  question_id: string;
  question_text: string;
  current_answer: string;
  priority: 'P1' | 'P2' | 'P3';
  score_impact: string;
  maturity_impact: string | null;
  projected_new_level: string | null;
  action_score: number;
  action_formula: string;
}

export interface DataAvailability {
  answered_count: number;
  total_questions: number;
  has_calibration: boolean;
  has_scores: boolean;
  is_complete: boolean;
}

export interface RunContext {
  company?: {
    name?: string;
    industry?: string;
    revenue_range?: string;
  };
  fpa?: Record<string, unknown>;
}

export interface PersonaInfo {
  type: string;
  confidence: number;
}

export interface TransparencyResult {
  run_id: string;
  company_name: string;
  spec_version: string;
  generated_at: string;

  // Run status fields
  status: 'draft' | 'in_progress' | 'completed' | 'locked';
  assessment_progress_pct: number;
  data_availability: DataAvailability;
  context: RunContext | null;
  persona: PersonaInfo | null;

  // Level 4: Overall
  overall: {
    total_possible_points: number;
    total_achieved_points: number;
    execution_score: number;
    total_questions: number;
    applicable_questions: number;
    yes_count: number;
    no_count: number;
    na_count: number;
    potential_maturity: { level: number; label: string };
    actual_maturity: { level: number; label: string };
    capped: boolean;
    cap_reason: string | null;
  };

  // Level 5: Blocking Analysis
  blocking: {
    current_blockers: BlockingQuestion[];
    l1_gate_status: GateStatus;
    l2_gate_status: GateStatus;
    unlock_l2_requires: string[];
    unlock_l3_requires: { score_needed: number; criticals_needed: string[] };
  };

  // Level 3: Objectives (with nested practices and questions)
  objectives: ObjectiveBreakdown[];

  // Level 6: Action Impact (for selected actions)
  action_impact: ActionImpact[];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getAnswer(value: unknown): 'YES' | 'NO' | 'N/A' | 'Unanswered' {
  if (value === true) return 'YES';
  if (value === false) return 'NO';
  if (value === 'N/A') return 'N/A';
  return 'Unanswered';
}

function getEvidenceState(yesCount: number, noCount: number): 'proven' | 'partial' | 'not_proven' {
  const total = yesCount + noCount;
  if (total === 0) return 'not_proven';
  const coverage = yesCount / total;
  if (coverage >= 1.0) return 'proven';
  if (coverage >= 0.5) return 'partial';
  return 'not_proven';
}

function getTrafficLight(score: number, hasFailedCritical: boolean): { status: 'green' | 'yellow' | 'red'; overridden: boolean } {
  let baseStatus: 'green' | 'yellow' | 'red';
  if (score >= 80) baseStatus = 'green';
  else if (score >= 50) baseStatus = 'yellow';
  else baseStatus = 'red';

  if (hasFailedCritical && baseStatus === 'green') {
    return { status: 'yellow', overridden: true };
  }

  return { status: baseStatus, overridden: false };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// =============================================================================
// MAIN TRANSPARENCY GENERATOR
// =============================================================================

export async function generateTransparency(
  supabase: SupabaseClient,
  runId: string
): Promise<TransparencyResult> {
  // 1) Load run data with extended fields
  const { data: run, error: runError } = await supabase
    .from("diagnostic_runs")
    .select("id, spec_version, context, calibration, company_profile_id, status, assessment_progress_pct")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    throw new Error(`Run not found: ${runId}`);
  }

  // 2) Load inputs
  const { data: inputs, error: inputsError } = await supabase
    .from("diagnostic_inputs")
    .select("question_id, value")
    .eq("run_id", runId);

  if (inputsError) {
    throw new Error(`Failed to load inputs: ${inputsError.message}`);
  }

  const inputMap = new Map<string, unknown>(
    (inputs || []).map((i: { question_id: string; value: unknown }) => [i.question_id, i.value])
  );

  // 3) Load company profile for persona if available
  let personaInfo: PersonaInfo | null = null;
  if (run.company_profile_id) {
    const { data: profile } = await supabase
      .from("company_profiles")
      .select("classification")
      .eq("id", run.company_profile_id)
      .single();

    if (profile?.classification?.persona) {
      personaInfo = {
        type: profile.classification.persona,
        confidence: profile.classification.confidence || 0
      };
    }
  }

  // 4) Get spec for total question count
  const spec = SpecRegistry.get(run.spec_version);
  const totalQuestions = spec.questions.length;
  const answeredCount = inputs?.length || 0;

  // Extract context
  const runContext: RunContext | null = run.context ? {
    company: run.context.company || {
      name: run.context.company_name,
      industry: run.context.industry,
      revenue_range: run.context.revenue_range
    },
    fpa: run.context.fpa
  } : null;

  const companyName = runContext?.company?.name || run.context?.company_name || 'Unknown Company';

  // Calculate data availability
  const calibration: CalibrationData | null = run.calibration;
  const hasCalibration = !!(calibration?.importance_map && Object.keys(calibration.importance_map).length > 0);

  const dataAvailability: DataAvailability = {
    answered_count: answeredCount,
    total_questions: totalQuestions,
    has_calibration: hasCalibration,
    has_scores: answeredCount > 0,
    is_complete: run.status === 'completed' || run.status === 'locked'
  };

  // 5) Early return for runs with no answers - return minimal response
  if (answeredCount === 0) {
    return {
      run_id: runId,
      company_name: companyName,
      spec_version: run.spec_version,
      generated_at: new Date().toISOString(),
      status: run.status || 'draft',
      assessment_progress_pct: run.assessment_progress_pct || 0,
      data_availability: dataAvailability,
      context: runContext,
      persona: personaInfo,
      overall: {
        total_possible_points: 0,
        total_achieved_points: 0,
        execution_score: 0,
        total_questions: totalQuestions,
        applicable_questions: 0,
        yes_count: 0,
        no_count: 0,
        na_count: 0,
        potential_maturity: { level: 1, label: LEVEL_NAMES[1] || 'Level 1' },
        actual_maturity: { level: 1, label: LEVEL_NAMES[1] || 'Level 1' },
        capped: false,
        cap_reason: null
      },
      blocking: {
        current_blockers: [],
        l1_gate_status: {
          gate_level: 'L1',
          total_criticals: L1_CRITICALS.length,
          passed: 0,
          failed: 0,
          passed_questions: [],
          failed_questions: []
        },
        l2_gate_status: {
          gate_level: 'L2',
          total_criticals: L2_CRITICALS.length,
          passed: 0,
          failed: 0,
          passed_questions: [],
          failed_questions: []
        },
        unlock_l2_requires: [],
        unlock_l3_requires: { score_needed: SCORE_THRESHOLDS.LEVEL_3, criticals_needed: [] }
      },
      objectives: [],
      action_impact: []
    };
  }

  // 6) Load action plan (for action impact)
  const { data: actionPlan } = await supabase
    .from("action_plans")
    .select("question_id, timeline, owner")
    .eq("run_id", runId);

  const actionPlanMap = new Map<string, { timeline: string; owner: string }>(
    (actionPlan || []).map((a: { question_id: string; timeline: string; owner: string }) =>
      [a.question_id, { timeline: a.timeline, owner: a.owner }]
    )
  );

  // 7) Build lookup maps
  const objectiveMap = new Map<string, SpecObjective>(
    (spec.objectives || []).map((o: SpecObjective) => [o.id, o])
  );

  const practiceMap = new Map<string, SpecPractice>(
    (spec.practices || []).map((p: SpecPractice) => [p.id, p])
  );

  // Practice to objective mapping
  const practiceToObjective = new Map<string, string>();
  for (const p of spec.practices || []) {
    practiceToObjective.set(p.id, p.objective_id);
  }

  // Questions grouped by practice
  const questionsByPractice = new Map<string, SpecQuestion[]>();
  for (const q of spec.questions) {
    const practiceId = q.practice_id || '';
    const existing = questionsByPractice.get(practiceId) || [];
    existing.push(q);
    questionsByPractice.set(practiceId, existing);
  }

  // Practices grouped by objective
  const practicesByObjective = new Map<string, SpecPractice[]>();
  for (const p of spec.practices || []) {
    const existing = practicesByObjective.get(p.objective_id) || [];
    existing.push(p);
    practicesByObjective.set(p.objective_id, existing);
  }

  // 6) Calculate overall stats
  let totalPossible = 0;
  let totalAchieved = 0;
  let yesCount = 0;
  let noCount = 0;
  let naCount = 0;

  const allCriticals = new Set([...L1_CRITICALS, ...L2_CRITICALS]);

  for (const q of spec.questions) {
    const value = inputMap.get(q.id);
    const answer = getAnswer(value);

    if (answer === 'N/A') {
      naCount++;
      continue;
    }

    const points = 1; // Each question worth 1 point
    totalPossible += points;

    if (answer === 'YES') {
      totalAchieved += points;
      yesCount++;
    } else {
      noCount++;
    }
  }

  const executionScore = totalPossible > 0 ? round2((totalAchieved / totalPossible) * 100) : 0;

  // 7) Calculate potential and actual maturity
  let potentialLevel: 1 | 2 | 3 | 4;
  if (executionScore < SCORE_THRESHOLDS.LEVEL_2) potentialLevel = 1;
  else if (executionScore < SCORE_THRESHOLDS.LEVEL_3) potentialLevel = 2;
  else if (executionScore < SCORE_THRESHOLDS.LEVEL_4) potentialLevel = 3;
  else potentialLevel = 4;

  // Check critical failures
  const l1Failures: string[] = [];
  const l1Passed: string[] = [];
  for (const qId of L1_CRITICALS) {
    const value = inputMap.get(qId);
    if (value === true) {
      l1Passed.push(qId);
    } else if (value !== 'N/A') {
      l1Failures.push(qId);
    }
  }

  const l2Failures: string[] = [];
  const l2Passed: string[] = [];
  for (const qId of L2_CRITICALS) {
    const value = inputMap.get(qId);
    if (value === true) {
      l2Passed.push(qId);
    } else if (value !== 'N/A') {
      l2Failures.push(qId);
    }
  }

  // Apply caps
  let actualLevel: 1 | 2 | 3 | 4 = potentialLevel;
  let capped = false;
  let capReason: string | null = null;

  if (l1Failures.length > 0 && potentialLevel > 1) {
    actualLevel = 1;
    capped = true;
    capReason = `Capped at L1 due to ${l1Failures.length} failed L1 critical(s)`;
  } else if (l2Failures.length > 0 && potentialLevel > 2) {
    actualLevel = 2;
    capped = true;
    capReason = `Capped at L2 due to ${l2Failures.length} failed L2 critical(s)`;
  }

  // 8) Build blocking analysis
  const currentBlockers: BlockingQuestion[] = [];

  if (actualLevel === 1 && l1Failures.length > 0) {
    for (const qId of l1Failures) {
      const q = spec.questions.find(q => q.id === qId);
      currentBlockers.push({
        question_id: qId,
        question_text: q?.text || qId,
        gate_level: 'L1'
      });
    }
  } else if (actualLevel === 2 && l2Failures.length > 0) {
    for (const qId of l2Failures) {
      const q = spec.questions.find(q => q.id === qId);
      currentBlockers.push({
        question_id: qId,
        question_text: q?.text || qId,
        gate_level: 'L2'
      });
    }
  }

  const l1GateStatus: GateStatus = {
    gate_level: 'L1',
    total_criticals: L1_CRITICALS.length,
    passed: l1Passed.length,
    failed: l1Failures.length,
    passed_questions: l1Passed,
    failed_questions: l1Failures
  };

  const l2GateStatus: GateStatus = {
    gate_level: 'L2',
    total_criticals: L2_CRITICALS.length,
    passed: l2Passed.length,
    failed: l2Failures.length,
    passed_questions: l2Passed,
    failed_questions: l2Failures
  };

  // 9) Build objective breakdowns
  const objectiveBreakdowns: ObjectiveBreakdown[] = [];

  for (const objective of spec.objectives || []) {
    const practices = practicesByObjective.get(objective.id) || [];
    const practiceBreakdowns: PracticeBreakdown[] = [];

    let objYes = 0;
    let objNo = 0;
    let objNA = 0;
    let objPossible = 0;
    let objAchieved = 0;
    let objHasCriticalFailure = false;

    for (const practice of practices) {
      const questions = questionsByPractice.get(practice.id) || [];
      const questionBreakdowns: QuestionBreakdown[] = [];

      let pracYes = 0;
      let pracNo = 0;
      let pracNA = 0;
      let pracPossible = 0;
      let pracAchieved = 0;
      let pracHasCriticalFailure = false;

      // Determine practice maturity level (most common among its questions)
      const levelCounts: Record<number, number> = {};
      for (const q of questions) {
        const level = q.level || 1;
        levelCounts[level] = (levelCounts[level] || 0) + 1;
      }
      const pracLevel = Object.entries(levelCounts).reduce(
        (max, [lvl, cnt]) => cnt > max.count ? { level: Number(lvl), count: cnt } : max,
        { level: 1, count: 0 }
      ).level;

      for (const q of questions) {
        const value = inputMap.get(q.id);
        const answer = getAnswer(value);
        const points = 1;
        const isCritical = allCriticals.has(q.id);
        let blockingStatus: string | null = null;

        if (answer === 'N/A') {
          pracNA++;
          objNA++;
        } else {
          pracPossible += points;
          objPossible += points;

          if (answer === 'YES') {
            pracAchieved += points;
            objAchieved += points;
            pracYes++;
            objYes++;
          } else {
            pracNo++;
            objNo++;

            if (isCritical) {
              pracHasCriticalFailure = true;
              objHasCriticalFailure = true;

              if (L1_CRITICALS.includes(q.id)) {
                blockingStatus = 'Blocks L2';
              } else if (L2_CRITICALS.includes(q.id)) {
                blockingStatus = 'Blocks L3';
              }
            }
          }
        }

        const percentOfTotal = totalPossible > 0 ? round2((points / totalPossible) * 100) : 0;
        const objectiveId = practiceToObjective.get(q.practice_id || '') || '';

        questionBreakdowns.push({
          question_id: q.id,
          question_text: q.text,
          maturity_level: q.level || 1,
          practice_id: q.practice_id || '',
          objective_id: objectiveId,
          answer,
          possible_points: answer === 'N/A' ? 0 : points,
          achieved_points: answer === 'YES' ? points : 0,
          percent_of_total: answer === 'N/A' ? 0 : percentOfTotal,
          is_critical: isCritical,
          blocking_status: blockingStatus,
          impact: q.impact || 3,
          complexity: q.complexity || 3
        });
      }

      const pracScore = pracPossible > 0 ? round2((pracAchieved / pracPossible) * 100) : 0;
      const evidenceState = getEvidenceState(pracYes, pracNo);
      const contributionToObjective = objPossible > 0 ? round2((pracPossible / objPossible) * 100) : 0;

      practiceBreakdowns.push({
        practice_id: practice.id,
        practice_title: practice.title,
        maturity_level: pracLevel,
        possible_points: pracPossible,
        achieved_points: pracAchieved,
        score: pracScore,
        evidence_state: evidenceState,
        has_critical_failure: pracHasCriticalFailure,
        yes_count: pracYes,
        no_count: pracNo,
        na_count: pracNA,
        contribution_to_objective: contributionToObjective,
        questions: questionBreakdowns
      });
    }

    const objScore = objPossible > 0 ? round2((objAchieved / objPossible) * 100) : 0;
    const trafficLight = getTrafficLight(objScore, objHasCriticalFailure);
    const contributionToOverall = totalPossible > 0 ? round2((objPossible / totalPossible) * 100) : 0;

    // Get importance from calibration
    const importanceLevel = (calibration?.importance_map?.[objective.id] as number) || 3;
    const importanceMultiplier = IMPORTANCE_MULTIPLIERS[importanceLevel as ImportanceLevel] || 1.0;

    objectiveBreakdowns.push({
      objective_id: objective.id,
      objective_name: objective.name,
      possible_points: objPossible,
      achieved_points: objAchieved,
      score: objScore,
      traffic_light: trafficLight.status,
      critical_override: trafficLight.overridden,
      importance_level: importanceLevel,
      importance_multiplier: importanceMultiplier,
      yes_count: objYes,
      no_count: objNo,
      na_count: objNA,
      contribution_to_overall: contributionToOverall,
      practices: practiceBreakdowns
    });
  }

  // 10) Build action impact for selected actions
  const actionImpacts: ActionImpact[] = [];

  for (const [questionId, actionData] of actionPlanMap) {
    const q = spec.questions.find(q => q.id === questionId);
    if (!q) continue;

    const currentValue = inputMap.get(questionId);
    const currentAnswer = getAnswer(currentValue);

    // Calculate what score would be if this question was YES
    const isCurrentlyNo = currentAnswer === 'NO' || currentAnswer === 'Unanswered';

    let priority: 'P1' | 'P2' | 'P3' = 'P2';
    let maturityImpact: string | null = null;
    let projectedNewLevel: string | null = null;

    // Check if this is a P1 (blocker)
    if (L1_CRITICALS.includes(questionId) && isCurrentlyNo) {
      priority = 'P1';
      maturityImpact = `Clears 1 of ${l1Failures.length} L1 blockers`;

      // Check if this would unlock L2
      if (l1Failures.length === 1 && l1Failures[0] === questionId) {
        projectedNewLevel = `L1 → L2 (if this action is completed)`;
      }
    } else if (L2_CRITICALS.includes(questionId) && isCurrentlyNo) {
      priority = actualLevel >= 2 ? 'P1' : 'P2';
      maturityImpact = `Clears 1 of ${l2Failures.length} L2 blockers`;
    } else if ((q.level || 1) > potentialLevel) {
      priority = 'P3';
    }

    // Calculate score impact
    const pointsToGain = isCurrentlyNo ? 1 : 0;
    const newAchieved = totalAchieved + pointsToGain;
    const newScore = totalPossible > 0 ? round2((newAchieved / totalPossible) * 100) : 0;
    const scoreImpact = isCurrentlyNo
      ? `+1 pt → ${executionScore}% to ${newScore}%`
      : 'Already YES';

    // Calculate action score using the same formula
    const actionScore = calculateScore(q, calibration, null);
    const impact = q.impact || 3;
    const complexity = q.complexity || 3;
    const criticalBoost = q.is_critical ? 2 : 1;
    const impMultiplier = IMPORTANCE_MULTIPLIERS[(calibration?.importance_map?.[q.objective_id || ''] || 3) as ImportanceLevel] || 1.0;
    const actionFormula = `(${impact}²/${complexity}) × ${criticalBoost} × ${round2(impMultiplier)} = ${actionScore}`;

    actionImpacts.push({
      question_id: questionId,
      question_text: q.text,
      current_answer: currentAnswer,
      priority,
      score_impact: scoreImpact,
      maturity_impact: maturityImpact,
      projected_new_level: projectedNewLevel,
      action_score: actionScore,
      action_formula: actionFormula
    });
  }

  // Sort action impacts: P1 first, then by score
  actionImpacts.sort((a, b) => {
    const priorityOrder = { P1: 0, P2: 1, P3: 2 };
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.action_score - a.action_score;
  });

  // 11) Assemble result
  return {
    run_id: runId,
    company_name: companyName,
    spec_version: run.spec_version,
    generated_at: new Date().toISOString(),
    status: run.status || 'draft',
    assessment_progress_pct: run.assessment_progress_pct || 0,
    data_availability: dataAvailability,
    context: runContext,
    persona: personaInfo,

    overall: {
      total_possible_points: totalPossible,
      total_achieved_points: totalAchieved,
      execution_score: executionScore,
      total_questions: spec.questions.length,
      applicable_questions: totalPossible,
      yes_count: yesCount,
      no_count: noCount,
      na_count: naCount,
      potential_maturity: {
        level: potentialLevel,
        label: LEVEL_NAMES[potentialLevel] || `Level ${potentialLevel}`
      },
      actual_maturity: {
        level: actualLevel,
        label: LEVEL_NAMES[actualLevel] || `Level ${actualLevel}`
      },
      capped,
      cap_reason: capReason
    },

    blocking: {
      current_blockers: currentBlockers,
      l1_gate_status: l1GateStatus,
      l2_gate_status: l2GateStatus,
      unlock_l2_requires: l1Failures,
      unlock_l3_requires: {
        score_needed: SCORE_THRESHOLDS.LEVEL_3,
        criticals_needed: l2Failures
      }
    },

    objectives: objectiveBreakdowns,

    action_impact: actionImpacts
  };
}
