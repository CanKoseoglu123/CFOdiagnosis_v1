// src/actions/prioritizeActions.ts
// V2.1: Prioritized Actions with P1/P2/P3 logic and Initiative grouping
// Fixes "High Performance Purgatory" - P2 uses potential_level, not actual_level
// Adds 2x critical multiplier and score calculation
// VS21: Adds ImportanceFactor multiplier from calibration data
// VS26: Adds pain point context boosting

import { PrioritizedAction, PrioritizedInitiative, CalibrationData, ImportanceLevel, IMPORTANCE_MULTIPLIERS, PillarContext } from "./types";
import { MaturityResultV2 } from "../maturity/types";
import { Spec, SpecQuestion, Initiative } from "../specs/types";

// =============================================================================
// TYPES
// =============================================================================

interface DiagnosticInput {
  question_id: string;
  value: unknown;
}

// =============================================================================
// PAIN POINT PRACTICE MAP (mirrors frontend contextOptions.js)
// =============================================================================

const PAIN_POINT_PRACTICE_MAP: Record<string, string[]> = {
  data_wrangling: [
    'prac_collaborative_systems',
    'prac_process_automation',
    'prac_self_service_analytics'  // Fixed: CoA is accounting policy, not data pipeline
  ],
  forecast_accuracy: [
    'prac_rolling_forecast_cadence',
    'prac_operational_drivers',
    'prac_dynamic_targets',
    'prac_predictive_analytics'
  ],
  partner_engagement: [
    'prac_commercial_partnership',
    'prac_strategic_alignment',
    'prac_variance_investigation',
    'prac_data_visualization'
  ],
  budget_cycle: [
    'prac_annual_budget_cycle',
    'prac_continuous_planning',
    'prac_rolling_forecast_cadence',
    'prac_process_automation'
  ],
  bandwidth: [
    'prac_process_automation',
    'prac_shared_services_model',
    'prac_service_level_agreements'
  ],
  tech_fragmentation: [
    'prac_collaborative_systems',
    'prac_chart_of_accounts',
    'prac_process_automation'
  ],
  scenario_planning: [
    'prac_rapid_what_if_capability',
    'prac_multi_scenario_management',
    'prac_stress_testing'
  ],
  communication: [
    'prac_data_visualization',
    'prac_board_level_impact',
    'prac_operational_drivers'
  ],
  realtime_visibility: [
    'prac_month_end_rigor',
    'prac_self_service_access',
    'prac_management_reporting'
  ]
};

// =============================================================================
// CONTEXT MODIFIER
// =============================================================================

/**
 * VS26: Calculates a context-based score modifier based on pain points.
 *
 * If the user selected a pain point that relates to this question's practice,
 * the action gets boosted because it directly addresses their stated pain.
 *
 * @param question - The question being scored
 * @param context - Pillar context with pain points and tools
 * @returns Multiplier (1.0 = no change, >1.0 = boosted)
 */
function calculateContextModifier(
  question: SpecQuestion,
  context?: PillarContext | null
): number {
  if (!context) return 1.0;

  let modifier = 1.0;
  const practiceId = question.practice_id;

  if (!practiceId) return modifier;

  // Pain point boosting
  if (context.pain_points && context.pain_points.length > 0) {
    for (const painPoint of context.pain_points) {
      const relatedPractices = PAIN_POINT_PRACTICE_MAP[painPoint];
      if (relatedPractices && relatedPractices.includes(practiceId)) {
        // Boost by 1.5x for each matching pain point
        // Cap at 2.0x to avoid runaway scores if multiple pain points match
        modifier = Math.min(modifier * 1.5, 2.0);
      }
    }
  }

  return modifier;
}

/**
 * VS26: Check if a question was boosted by pain points.
 */
function wasBoostedByContext(
  question: SpecQuestion,
  context?: PillarContext | null
): boolean {
  if (!context?.pain_points || !question.practice_id) return false;

  for (const painPoint of context.pain_points) {
    const relatedPractices = PAIN_POINT_PRACTICE_MAP[painPoint];
    if (relatedPractices && relatedPractices.includes(question.practice_id)) {
      return true;
    }
  }
  return false;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculates the action score using the V2.2 formula with VS21 calibration and VS26 context.
 * Score = (Impact² / Complexity) × CriticalBoost × CombinedMultiplier
 *
 * where: CombinedMultiplier = min(2.0, ImportanceFactor × ContextModifier)
 *
 * The 2x critical multiplier ensures criticals rank above high-ROI governance tasks.
 * The ImportanceFactor (0.5x to 1.5x) allows users to adjust priority based on organizational needs.
 * The ContextModifier (1.0x to 2.0x) boosts actions that address stated pain points.
 * The CombinedMultiplier is capped at 2.0x to prevent "Double Jeopardy" score inflation.
 *
 * @param question - The question/action being scored
 * @param calibration - Optional calibration data with importance_map
 * @param context - Optional VS26 pillar context for pain point boosting
 * @returns Calculated score (rounded to 1 decimal)
 */
function calculateScore(
  question: SpecQuestion,
  calibration?: CalibrationData | null,
  context?: PillarContext | null
): number {
  const impact = question.impact ?? 3;
  const complexity = question.complexity ?? 3;

  let score = Math.pow(impact, 2) / complexity;

  // CriticalBoost: 2x if critical
  if (question.is_critical) {
    score = score * 2;
  }

  // VS21: ImportanceFactor from calibration (default 1.0)
  let importanceFactor = 1.0;
  if (calibration?.importance_map && question.objective_id) {
    const importance = calibration.importance_map[question.objective_id] as ImportanceLevel | undefined;
    if (importance && IMPORTANCE_MULTIPLIERS[importance]) {
      importanceFactor = IMPORTANCE_MULTIPLIERS[importance];
    }
  }

  // VS26: ContextModifier from pain points
  const contextModifier = calculateContextModifier(question, context);

  // Combined Multiplier Cap: Prevent "Double Jeopardy" score inflation
  // Cap at 2.0x to ensure trivial L1 gaps don't outrank strategic L3 gaps
  const combinedMultiplier = Math.min(2.0, importanceFactor * contextModifier);
  score = score * combinedMultiplier;

  return Math.round(score * 10) / 10; // Round to 1 decimal
}

/**
 * Generates action text from a question.
 * Uses expert_action.title if available, otherwise generates from question text.
 */
function generateActionText(question: SpecQuestion): string {
  // Use expert action title if available
  if (question.expert_action?.title) {
    return question.expert_action.title;
  }

  const text = question.text;

  // Simple transformations
  if (text.startsWith('Does ') || text.startsWith('Do ')) {
    return text
      .replace(/^Does the company /, 'Implement: ')
      .replace(/^Does the /, 'Implement: ')
      .replace(/^Does /, 'Implement: ')
      .replace(/^Do /, 'Implement: ')
      .replace(/\?$/, '');
  }

  if (text.startsWith('Is there ') || text.startsWith('Is the ')) {
    return text
      .replace(/^Is there /, 'Establish: ')
      .replace(/^Is the /, 'Ensure: ')
      .replace(/^Is /, 'Implement: ')
      .replace(/\?$/, '');
  }

  if (text.startsWith('Are ') || text.startsWith('Can ')) {
    return text
      .replace(/^Are /, 'Ensure: ')
      .replace(/^Can /, 'Enable: ')
      .replace(/\?$/, '');
  }

  if (text.startsWith('Has ')) {
    return text
      .replace(/^Has /, 'Complete: ')
      .replace(/\?$/, '');
  }

  if (text.startsWith('When ') || text.startsWith('In ')) {
    return `Address: ${text.replace(/\?$/, '')}`;
  }

  // Default: prefix with "Address:"
  return `Address: ${text.replace(/\?$/, '')}`;
}

/**
 * Estimates effort based on complexity.
 */
function estimateEffort(question: SpecQuestion): 'low' | 'medium' | 'high' {
  const complexity = question.complexity ?? 3;

  if (complexity >= 4) return 'high';
  if (complexity >= 2) return 'medium';
  return 'low';
}

/**
 * Gets failed questions at a specific level.
 */
function getFailedQuestionsAtLevel(
  inputs: DiagnosticInput[],
  questions: SpecQuestion[],
  level: number
): SpecQuestion[] {
  const inputMap = new Map<string, unknown>(
    inputs.map((i) => [i.question_id, i.value])
  );

  return questions.filter((q) => {
    const qLevel = q.level ?? 1;
    if (qLevel !== level) return false;
    const answer = inputMap.get(q.id);
    // Failed = not YES and not N/A
    return answer !== true && answer !== 'N/A';
  });
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Prioritizes actions using P1/P2/P3 logic with context modifiers.
 *
 * P1 (Unlock): Failed criticals causing the cap
 * P2 (Optimize): Failed questions up to POTENTIAL level (not actual)
 * P3 (Future): Failed questions at POTENTIAL + 1
 *
 * Key Insight: Use potential_level for P2 to avoid "High Performance Purgatory"
 * A 90% scorer capped at L1 should see L1, L2, AND L3 gaps in P2.
 *
 * VS26: Pain points boost actions in related practices by 1.5x (capped at 2.0x)
 *
 * Score Formula: (Impact² / Complexity) × CriticalBoost × ImportanceFactor × ContextModifier
 *
 * @param maturity - V2 maturity result with potential_level
 * @param inputs - User answers
 * @param questions - All questions from spec
 * @param calibration - Optional VS21 calibration data for importance multipliers
 * @param context - Optional VS26 pillar context for pain point boosting
 * @returns Sorted array of PrioritizedAction
 */
export function prioritizeActions(
  maturity: MaturityResultV2,
  inputs: DiagnosticInput[],
  questions: SpecQuestion[],
  calibration?: CalibrationData | null,
  context?: PillarContext | null
): PrioritizedAction[] {
  const actions: PrioritizedAction[] = [];
  const { actual_level, potential_level, capped_by } = maturity;
  const seenQuestionIds = new Set<string>();

  // Helper to get importance for a question's objective
  const getImportance = (q: SpecQuestion): ImportanceLevel | undefined => {
    if (calibration?.importance_map && q.objective_id) {
      return calibration.importance_map[q.objective_id] as ImportanceLevel | undefined;
    }
    return undefined;
  };

  // P1: Critical questions causing the cap (UNLOCK)
  for (const qId of capped_by) {
    const q = questions.find((q) => q.id === qId);
    if (q && !seenQuestionIds.has(qId)) {
      seenQuestionIds.add(qId);
      actions.push({
        priority: 'P1',
        question_id: qId,
        question_text: q.text,
        action_text: generateActionText(q),
        action_title: q.expert_action?.title,
        action_type: q.expert_action?.type,
        recommendation: q.expert_action?.recommendation,
        impact: 'Unlocks next maturity level',
        effort: estimateEffort(q),
        level: q.level ?? 1,
        score: calculateScore(q, calibration, context),
        is_critical: q.is_critical ?? false,
        initiative_id: q.initiative_id,
        importance: getImportance(q),
        boosted_by_context: wasBoostedByContext(q, context),
      });
    }
  }

  // P2: Failed questions from L1 up to POTENTIAL level (OPTIMIZE)
  // This ensures high performers see their full roadmap
  for (let level = 1; level <= potential_level; level++) {
    const levelFailures = getFailedQuestionsAtLevel(inputs, questions, level);
    for (const q of levelFailures) {
      // Skip if already in P1
      if (seenQuestionIds.has(q.id)) continue;
      seenQuestionIds.add(q.id);

      const qLevel = q.level ?? 1;
      actions.push({
        priority: 'P2',
        question_id: q.id,
        question_text: q.text,
        action_text: generateActionText(q),
        action_title: q.expert_action?.title,
        action_type: q.expert_action?.type,
        recommendation: q.expert_action?.recommendation,
        impact:
          qLevel <= actual_level
            ? 'Strengthens current level'
            : 'Advances toward potential',
        effort: estimateEffort(q),
        level: qLevel,
        score: calculateScore(q, calibration, context),
        is_critical: q.is_critical ?? false,
        initiative_id: q.initiative_id,
        importance: getImportance(q),
        boosted_by_context: wasBoostedByContext(q, context),
      });
    }
  }

  // P3: Failed questions at POTENTIAL + 1 (NEXT STEPS)
  const nextLevel = Math.min(potential_level + 1, 4);
  if (nextLevel > potential_level) {
    const nextLevelFailures = getFailedQuestionsAtLevel(inputs, questions, nextLevel);
    for (const q of nextLevelFailures) {
      if (seenQuestionIds.has(q.id)) continue;
      seenQuestionIds.add(q.id);

      actions.push({
        priority: 'P3',
        question_id: q.id,
        question_text: q.text,
        action_text: generateActionText(q),
        action_title: q.expert_action?.title,
        action_type: q.expert_action?.type,
        recommendation: q.expert_action?.recommendation,
        impact: 'Prepares for next level',
        effort: estimateEffort(q),
        level: q.level ?? 1,
        score: calculateScore(q, calibration, context),
        is_critical: q.is_critical ?? false,
        initiative_id: q.initiative_id,
        importance: getImportance(q),
        boosted_by_context: wasBoostedByContext(q, context),
      });
    }
  }

  // Sort by priority (P1 first), then by score (descending)
  return actions.sort((a, b) => {
    const priorityOrder = { P1: 0, P2: 1, P3: 2 };
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    // Within same priority, sort by score (higher first)
    return b.score - a.score;
  });
}

/**
 * Groups prioritized actions by initiative.
 *
 * @param actions - Flat list of prioritized actions
 * @param initiatives - Initiative definitions from spec
 * @returns Array of PrioritizedInitiative with grouped actions
 */
export function groupActionsByInitiative(
  actions: PrioritizedAction[],
  initiatives: Initiative[]
): PrioritizedInitiative[] {
  const initiativeMap = new Map<string, Initiative>(
    initiatives.map(i => [i.id, i])
  );

  const groupedMap = new Map<string, PrioritizedAction[]>();

  // Group actions by initiative_id
  for (const action of actions) {
    const initId = action.initiative_id ?? 'ungrouped';
    if (!groupedMap.has(initId)) {
      groupedMap.set(initId, []);
    }
    groupedMap.get(initId)!.push(action);
  }

  const result: PrioritizedInitiative[] = [];

  for (const [initId, groupedActions] of groupedMap) {
    const initiative = initiativeMap.get(initId);

    // Sort actions within initiative by score
    groupedActions.sort((a, b) => b.score - a.score);

    // Determine highest priority (P1 > P2 > P3)
    const priorityOrder = { P1: 0, P2: 1, P3: 2 };
    const highestPriority = groupedActions.reduce((highest, action) => {
      return priorityOrder[action.priority] < priorityOrder[highest]
        ? action.priority
        : highest;
    }, 'P3' as 'P1' | 'P2' | 'P3');

    // Calculate total score
    const totalScore = groupedActions.reduce((sum, a) => sum + a.score, 0);

    // VS26: Check if any action in initiative was boosted
    const hasBoostedActions = groupedActions.some(a => a.boosted_by_context);

    result.push({
      initiative_id: initId,
      initiative_title: initiative?.title ?? 'Other Actions',
      initiative_description: initiative?.description ?? '',
      theme_id: initiative?.theme_id ?? 'unknown',
      priority: highestPriority,
      total_score: Math.round(totalScore * 10) / 10,
      actions: groupedActions,
      boosted_by_context: hasBoostedActions,
    });
  }

  // Sort initiatives by priority, then by total score
  result.sort((a, b) => {
    const priorityOrder = { P1: 0, P2: 1, P3: 2 };
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.total_score - a.total_score;
  });

  return result;
}
