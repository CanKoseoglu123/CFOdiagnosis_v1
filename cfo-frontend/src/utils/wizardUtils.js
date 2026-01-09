// src/utils/wizardUtils.js
// VS-46: Action Planning Wizard filter utilities

import { PAIN_POINTS } from '../data/contextOptions';

// Build reverse lookup: practice_id → [pain_point_values]
const buildPainPointLookup = () => {
  const lookup = {};
  PAIN_POINTS.forEach(pp => {
    (pp.related_practices || []).forEach(practiceId => {
      if (!lookup[practiceId]) lookup[practiceId] = [];
      lookup[practiceId].push(pp.value);
    });
  });
  return lookup;
};

const PAIN_POINT_LOOKUP = buildPainPointLookup();

// Get pain point labels for display
export const getPainPointLabels = (painPointValues) => {
  if (!painPointValues?.length) return [];
  return painPointValues.map(val => {
    const pp = PAIN_POINTS.find(p => p.value === val);
    return pp?.label || val;
  });
};

// Get which pain points an action addresses
export const getAddressedPainPoints = (question, selectedPainPoints) => {
  if (!selectedPainPoints?.length || !question.practice_id) return [];
  const relatedPains = PAIN_POINT_LOOKUP[question.practice_id] || [];
  return relatedPains.filter(p => selectedPainPoints.includes(p));
};

/**
 * Tab 1: Pain Points - actions whose practice maps to selected pain points
 */
export const filterByPainPoints = (gaps, selectedPainPoints) => {
  if (!selectedPainPoints?.length) return [];
  const painSet = new Set(selectedPainPoints);
  return gaps.filter(q => {
    const relatedPains = PAIN_POINT_LOOKUP[q.practice_id] || [];
    return relatedPains.some(p => painSet.has(p));
  });
};

/**
 * Tab 2: Priorities - actions in objectives rated 4-5 (High/Critical)
 */
export const filterByPriorities = (gaps, importanceMap, practices) => {
  const highPriorityObjIds = new Set(
    Object.entries(importanceMap || {})
      .filter(([, importance]) => importance >= 4)
      .map(([objId]) => objId)
  );
  if (highPriorityObjIds.size === 0) return [];

  // Build practice → objective lookup
  const practiceToObj = {};
  practices.forEach(p => { practiceToObj[p.id] = p.objective_id; });

  return gaps.filter(q => {
    const objId = q.objective_id || practiceToObj[q.practice_id];
    return highPriorityObjIds.has(objId);
  });
};

/**
 * Tab 3: Quick Wins - explicit tag OR low complexity + high impact
 */
export const filterQuickWins = (gaps) => {
  return gaps.filter(q =>
    q.expert_action?.type === 'quick_win' ||
    (q.complexity <= 2 && q.impact >= 4)
  );
};

/**
 * Check if a question is a quick win
 */
export const isQuickWin = (question) => {
  return question.expert_action?.type === 'quick_win' ||
    (question.complexity <= 2 && question.impact >= 4);
};

/**
 * Tab 4: Critical Risks - critical questions that are gaps
 */
export const filterCriticalRisks = (gaps) => {
  return gaps.filter(q => q.is_critical);
};

/**
 * Tab 5: Unlock Level - questions in capped_by array
 */
export const filterUnlockLevel = (gaps, cappedBy) => {
  if (!cappedBy?.length) return [];
  const cappedSet = new Set(cappedBy);
  return gaps.filter(q => cappedSet.has(q.id));
};

/**
 * Get all tab counts for badge display
 */
export const getTabCounts = (gaps, context) => {
  const { painPoints, importanceMap, practices, cappedBy } = context;
  return {
    painPoints: filterByPainPoints(gaps, painPoints).length,
    priorities: filterByPriorities(gaps, importanceMap, practices).length,
    quickWins: filterQuickWins(gaps).length,
    criticalRisks: filterCriticalRisks(gaps).length,
    unlockLevel: filterUnlockLevel(gaps, cappedBy).length
  };
};

/**
 * Get which tabs an action appears in (for overlap indicator)
 */
export const getActionTabs = (question, context) => {
  const { painPoints, importanceMap, practices, cappedBy } = context;
  const tabs = [];

  if (filterByPainPoints([question], painPoints).length) tabs.push('Pain Points');
  if (filterByPriorities([question], importanceMap, practices).length) tabs.push('Priorities');
  if (filterQuickWins([question]).length) tabs.push('Quick Wins');
  if (filterCriticalRisks([question]).length) tabs.push('Critical Risks');
  if (filterUnlockLevel([question], cappedBy).length) tabs.push('Unlock Level');

  return tabs;
};

/**
 * Sort actions by relevance score (impact^2 / complexity, with critical boost)
 */
export const sortByRelevance = (actions) => {
  return [...actions].sort((a, b) => {
    const scoreA = calculateRelevanceScore(a);
    const scoreB = calculateRelevanceScore(b);
    return scoreB - scoreA; // Descending
  });
};

const calculateRelevanceScore = (question) => {
  const impact = question.impact || 3;
  const complexity = question.complexity || 3;
  let score = (impact * impact) / complexity;
  if (question.is_critical) score *= 2;
  return score;
};

/**
 * Format impact level for display
 */
export const formatImpact = (impact) => {
  if (impact >= 5) return 'Very High';
  if (impact >= 4) return 'High';
  if (impact >= 3) return 'Medium';
  if (impact >= 2) return 'Low';
  return 'Minimal';
};

/**
 * Format complexity level for display
 */
export const formatComplexity = (complexity) => {
  if (complexity >= 5) return 'Very High';
  if (complexity >= 4) return 'High';
  if (complexity >= 3) return 'Medium';
  if (complexity >= 2) return 'Low';
  return 'Minimal';
};

/**
 * Get color class for impact badge (navy enterprise style)
 */
export const getImpactColor = (impact) => {
  if (impact >= 4) return 'bg-emerald-100 text-emerald-700';
  if (impact >= 3) return 'bg-slate-100 text-slate-600';
  return 'bg-slate-50 text-slate-500';
};

/**
 * Get color class for complexity badge (navy enterprise style)
 * Lower complexity = better (green), higher = harder (amber)
 */
export const getComplexityColor = (complexity) => {
  if (complexity <= 2) return 'bg-emerald-100 text-emerald-700';
  if (complexity <= 3) return 'bg-slate-100 text-slate-600';
  return 'bg-amber-100 text-amber-700';
};

/**
 * Group actions by pain point for the Pain Points tab
 * Returns array of { painPoint: { value, label }, actions: Question[] }
 */
export const groupByPainPoint = (gaps, selectedPainPoints) => {
  if (!selectedPainPoints?.length) return [];

  const groups = [];

  selectedPainPoints.forEach(painPointValue => {
    const painPointConfig = PAIN_POINTS.find(p => p.value === painPointValue);
    if (!painPointConfig) return;

    const relatedPractices = new Set(painPointConfig.related_practices || []);
    const matchingActions = gaps.filter(q =>
      q.practice_id && relatedPractices.has(q.practice_id)
    );

    if (matchingActions.length > 0) {
      groups.push({
        painPoint: {
          value: painPointValue,
          label: painPointConfig.label
        },
        actions: sortByRelevance(matchingActions)
      });
    }
  });

  return groups;
};

/**
 * Group actions by priority objective for the Priorities tab
 * Returns array of { objective: { id, name, importance, importanceLabel }, actions: Question[] }
 */
export const groupByPriorityObjective = (gaps, importanceMap, practices, objectives) => {
  if (!importanceMap || Object.keys(importanceMap).length === 0) return [];

  // Build practice → objective lookup
  const practiceToObj = {};
  practices.forEach(p => { practiceToObj[p.id] = p.objective_id; });

  // Get high priority objectives (4-5) sorted by importance desc
  const highPriorityObjs = Object.entries(importanceMap)
    .filter(([, importance]) => importance >= 4)
    .sort((a, b) => b[1] - a[1]) // Sort by importance descending
    .map(([objId, importance]) => ({
      id: objId,
      importance,
      importanceLabel: importance === 5 ? 'Critical' : 'High'
    }));

  if (highPriorityObjs.length === 0) return [];

  const groups = [];

  highPriorityObjs.forEach(objInfo => {
    const objectiveConfig = objectives.find(o => o.id === objInfo.id);
    const objName = objectiveConfig?.title || objectiveConfig?.name || objInfo.id;

    const matchingActions = gaps.filter(q => {
      const qObjId = q.objective_id || practiceToObj[q.practice_id];
      return qObjId === objInfo.id;
    });

    if (matchingActions.length > 0) {
      groups.push({
        objective: {
          id: objInfo.id,
          name: objName,
          importance: objInfo.importance,
          importanceLabel: objInfo.importanceLabel
        },
        actions: sortByRelevance(matchingActions)
      });
    }
  });

  return groups;
};
