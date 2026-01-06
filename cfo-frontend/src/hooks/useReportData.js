// src/hooks/useReportData.js
// VS-45: Shared hook for report data computations
// Extracted from FinalReportTab.jsx for use in ExecutiveReportPage

import { useMemo } from 'react';

// Objective theme mapping
export const OBJECTIVE_THEME_MAP = {
  'obj_budget_discipline': 'Foundation',
  'obj_financial_controls': 'Foundation',
  'obj_performance_monitoring': 'Foundation',
  'obj_forecasting_agility': 'Future',
  'obj_driver_based_planning': 'Future',
  'obj_scenario_modeling': 'Future',
  'obj_strategic_influence': 'Intelligence',
  'obj_decision_support': 'Intelligence',
  'obj_operational_excellence': 'Intelligence',
  // Legacy IDs
  'obj_fpa_l1_budget': 'Foundation',
  'obj_fpa_l1_control': 'Foundation',
  'obj_fpa_l2_variance': 'Foundation',
  'obj_fpa_l2_forecast': 'Future',
  'obj_fpa_l3_driver': 'Future',
  'obj_fpa_l3_scenario': 'Intelligence',
  'obj_fpa_l4_integrate': 'Intelligence',
  'obj_fpa_l4_predict': 'Intelligence'
};

// Level names
export const LEVEL_NAMES = ['', 'Emerging', 'Defined', 'Managed', 'Optimized'];

// Score to maturity level conversion
export function scoreToLevel(score) {
  if (score >= 85) return 4;
  if (score >= 65) return 3;
  if (score >= 40) return 2;
  return 1;
}

/**
 * useReportData - Shared hook for report data computations
 *
 * @param {Object} params
 * @param {Object} params.report - Full report object from API
 * @param {Object} params.actionPlan - Action plan map (questionId -> plan)
 * @param {Array} params.objectives - Spec objectives
 * @param {Array} params.questions - Spec questions
 * @param {Array} params.practices - Spec practices
 */
export default function useReportData({
  report,
  actionPlan = {},
  objectives = [],
  questions = [],
  practices = []
}) {
  // ─────────────────────────────────────────────────────────────────────────────
  // CURRENT STATE METRICS
  // ─────────────────────────────────────────────────────────────────────────────

  const maturityV2 = report?.maturity_v2 || {};
  const currentScore = maturityV2.execution_score ?? Math.round((report?.overall_score || 0) * 100);
  const currentLevel = maturityV2.actual_level ?? report?.maturity?.achieved_level ?? 1;
  const levelName = LEVEL_NAMES[currentLevel] || 'Emerging';

  // Critical failures
  const criticalRisks = report?.critical_risks || [];
  const failedCriticalCount = criticalRisks.length;

  // ─────────────────────────────────────────────────────────────────────────────
  // PRACTICE TO OBJECTIVE MAP
  // ─────────────────────────────────────────────────────────────────────────────

  const practiceToObjective = useMemo(() => {
    const map = {};
    practices.forEach(p => {
      if (p.id && p.objective_id) {
        map[p.id] = p.objective_id;
      }
    });
    return map;
  }, [practices]);

  // ─────────────────────────────────────────────────────────────────────────────
  // OBJECTIVE DATA WITH MILESTONE SCORES
  // ─────────────────────────────────────────────────────────────────────────────

  const objectiveData = useMemo(() => {
    const calibration = report?.calibration?.importance_map || {};
    const inputMap = new Map((report?.inputs || []).map(i => [i.question_id, i.value]));

    return (report?.objectives || []).map(obj => {
      const objId = obj.id || obj.objective_id;
      const score = Math.round(obj.score || 0);
      const importance = calibration[objId] || 3;
      const theme = OBJECTIVE_THEME_MAP[objId] || 'Intelligence';

      // Determine status
      let status = 'opportunity';
      if (score >= 80) status = 'strength';
      else if (score < 40 || criticalRisks.some(r => r.objective_id === objId)) status = 'critical';

      // Find questions for this objective via practice_id → objective_id mapping
      const objQuestions = questions.filter(q => {
        if (q.objective_id === objId) return true;
        if (q.practice_id && practiceToObjective[q.practice_id] === objId) return true;
        return false;
      });

      const totalQuestions = obj.questions_total || objQuestions.length || 6;

      // Count actions by timeline for this objective
      const actions6m = objQuestions.filter(q => actionPlan[q.id]?.timeline === '6m').length;
      const actions12m = objQuestions.filter(q => actionPlan[q.id]?.timeline === '12m').length;
      const actions24m = objQuestions.filter(q => actionPlan[q.id]?.timeline === '24m').length;
      const totalActions = actions6m + actions12m + actions24m;

      // Calculate milestone scores based on committed actions
      const todayScore = score;
      const score6m = Math.min(100, todayScore + Math.round((actions6m / totalQuestions) * 100));
      const score12m = Math.min(100, score6m + Math.round((actions12m / totalQuestions) * 100));
      const score24m = Math.min(100, score12m + Math.round((actions24m / totalQuestions) * 100));

      // Calculate current and target maturity levels
      const currentObjLevel = scoreToLevel(todayScore);
      const targetObjLevel = scoreToLevel(score24m);

      return {
        id: objId,
        name: obj.objective_name || obj.title || obj.name || objId,
        theme,
        importance,
        today: todayScore,
        at6m: score6m,
        at12m: score12m,
        at24m: score24m,
        status,
        currentLevel: currentObjLevel,
        targetLevel: targetObjLevel,
        actionCount: totalActions
      };
    });
  }, [report, actionPlan, questions, criticalRisks, practiceToObjective]);

  // ─────────────────────────────────────────────────────────────────────────────
  // GROUP OBJECTIVES BY THEME
  // ─────────────────────────────────────────────────────────────────────────────

  const objectivesByTheme = useMemo(() => {
    const groups = { Foundation: [], Future: [], Intelligence: [] };
    objectiveData.forEach(obj => {
      if (groups[obj.theme]) {
        groups[obj.theme].push(obj);
      }
    });
    return groups;
  }, [objectiveData]);

  // ─────────────────────────────────────────────────────────────────────────────
  // ACTION COUNTS BY TIMELINE
  // ─────────────────────────────────────────────────────────────────────────────

  const actionCounts = useMemo(() => {
    const counts = { total: 0, '6m': 0, '12m': 0, '24m': 0, withOwner: 0, withTimeline: 0 };
    Object.entries(actionPlan).forEach(([, a]) => {
      counts.total++;
      if (a.timeline === '6m') counts['6m']++;
      else if (a.timeline === '12m') counts['12m']++;
      else if (a.timeline === '24m') counts['24m']++;
      if (a.assigned_owner) counts.withOwner++;
      if (a.timeline) counts.withTimeline++;
    });
    return counts;
  }, [actionPlan]);

  // ─────────────────────────────────────────────────────────────────────────────
  // PROJECTED SCORES (24 MONTHS)
  // ─────────────────────────────────────────────────────────────────────────────

  const projectedScore = useMemo(() => {
    const totalQuestions = questions.length || 48;
    const inputMap = new Map((report?.inputs || []).map(i => [i.question_id, i.value]));
    const projectedYes = questions.filter(q => inputMap.get(q.id) === true || actionPlan[q.id]).length;
    return Math.round((projectedYes / totalQuestions) * 100);
  }, [questions, report, actionPlan]);

  const projectedLevel = useMemo(() => {
    if (projectedScore >= 85) return 4;
    if (projectedScore >= 65) return 3;
    if (projectedScore >= 45) return 2;
    return 1;
  }, [projectedScore]);

  // ─────────────────────────────────────────────────────────────────────────────
  // CONFIDENCE BASED ON COVERAGE
  // ─────────────────────────────────────────────────────────────────────────────

  const confidence = useMemo(() => {
    const objectivesWithActions = new Set();
    Object.keys(actionPlan).forEach(qId => {
      const q = questions.find(q => q.id === qId);
      const objId = q?.objective_id || (q?.practice_id && practiceToObjective[q.practice_id]);
      if (objId) objectivesWithActions.add(objId);
    });
    const coverage = objectivesWithActions.size / (objectives.length || 1);
    if (coverage >= 0.7) return 'High';
    if (coverage >= 0.4) return 'Medium';
    return 'Low';
  }, [actionPlan, questions, objectives, practiceToObjective]);

  // ─────────────────────────────────────────────────────────────────────────────
  // DIAGNOSIS TEXT
  // ─────────────────────────────────────────────────────────────────────────────

  const diagnosis = useMemo(() => {
    if (currentLevel >= 3 && failedCriticalCount === 0) {
      return 'Strong foundation with mature practices. Focus on optimization and predictive capabilities.';
    }
    if (currentLevel >= 2 && failedCriticalCount <= 2) {
      return 'Foundation established, execution uneven beyond budgeting. Address critical gaps to unlock Level 3.';
    }
    if (failedCriticalCount > 2) {
      return 'Multiple critical gaps blocking maturity progression. Immediate remediation required.';
    }
    return 'Early-stage finance function. Prioritize foundational controls before advancing.';
  }, [currentLevel, failedCriticalCount]);

  // ─────────────────────────────────────────────────────────────────────────────
  // STRENGTHS, CRITICALS, OPPORTUNITIES
  // ─────────────────────────────────────────────────────────────────────────────

  const strengths = objectiveData.filter(o => o.today >= 80).slice(0, 3);

  const criticalFixes = criticalRisks.slice(0, 5).map(r => ({
    id: r.evidence_id || r.question_id,
    title: r.expert_action?.title || r.title || 'Address critical gap'
  }));

  const topOpportunities = useMemo(() => {
    return objectiveData
      .filter(o => o.status !== 'strength')
      .map(o => ({
        ...o,
        uplift: o.at24m - o.today,
        upliftScore: o.importance * (o.at24m - o.today)
      }))
      .sort((a, b) => b.upliftScore - a.upliftScore)
      .slice(0, 3);
  }, [objectiveData]);

  // ─────────────────────────────────────────────────────────────────────────────
  // COMMITMENT REGISTER (ACTION PLAN GROUPED BY OBJECTIVE)
  // ─────────────────────────────────────────────────────────────────────────────

  const commitmentRegister = useMemo(() => {
    const byObjective = {};
    Object.entries(actionPlan).forEach(([questionId, plan]) => {
      const question = questions.find(q => q.id === questionId);
      if (!question) return;

      const objId = question.objective_id || practiceToObjective[question.practice_id];
      if (!objId) return;

      const objective = objectives.find(o => o.id === objId);
      const objName = objective?.title || objective?.name || objId;

      if (!byObjective[objId]) {
        byObjective[objId] = {
          objectiveId: objId,
          objectiveName: objName,
          actions: []
        };
      }

      byObjective[objId].actions.push({
        id: questionId,
        title: question.text || question.title || 'Action item',
        timeline: plan.timeline,
        owner: plan.assigned_owner,
        isCritical: question.is_critical || false
      });
    });

    return Object.values(byObjective);
  }, [actionPlan, questions, objectives, practiceToObjective]);

  // ─────────────────────────────────────────────────────────────────────────────
  // PROJECTED SCORES BY TIMELINE (for radar chart)
  // ─────────────────────────────────────────────────────────────────────────────

  const projectedByTimeline = useMemo(() => {
    const result = {
      current: {},
      '6m': {},
      '12m': {},
      '24m': {}
    };

    objectiveData.forEach(obj => {
      result.current[obj.id] = obj.today;
      result['6m'][obj.id] = obj.at6m;
      result['12m'][obj.id] = obj.at12m;
      result['24m'][obj.id] = obj.at24m;
    });

    return result;
  }, [objectiveData]);

  // ─────────────────────────────────────────────────────────────────────────────
  // RETURN ALL COMPUTED DATA
  // ─────────────────────────────────────────────────────────────────────────────

  return {
    // Current state
    currentScore,
    currentLevel,
    levelName,
    criticalRisks,
    failedCriticalCount,

    // Projections
    projectedScore,
    projectedLevel,
    projectedByTimeline,
    confidence,
    diagnosis,

    // Objective data
    objectiveData,
    objectivesByTheme,
    practiceToObjective,

    // Action data
    actionCounts,
    commitmentRegister,

    // Highlights
    strengths,
    criticalFixes,
    topOpportunities
  };
}
