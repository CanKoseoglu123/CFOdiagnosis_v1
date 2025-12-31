// src/utils/matrixUtils.js
// VS-33: Priority Matrix - Data derivation utilities

/**
 * Map evidence_state from backend to display status
 */
function mapEvidenceToStatus(evidenceState) {
  switch (evidenceState) {
    case 'proven':
    case 'full':
      return 'complete';
    case 'partial':
      return 'partial';
    case 'not_proven':
    case 'none':
    default:
      return 'gap';
  }
}

/**
 * Derive practice data with priority, level, and status
 * Uses maturity_footprint data which already has evidence_state computed
 *
 * @param {Array} footprintLevels - report.maturity_footprint.levels
 * @param {Array} specPractices - spec.practices (has objective_id)
 * @param {Array} specObjectives - spec.objectives
 * @param {Object} calibration - report.calibration (has importance_map)
 */
export function derivePracticeData(footprintLevels, specPractices, specObjectives, calibration) {
  const practices = [];

  // Flatten practices from footprint levels
  (footprintLevels || []).forEach(level => {
    (level.practices || []).forEach(fp => {
      // Find matching spec practice to get objective_id
      const specPractice = specPractices?.find(sp => sp.id === fp.id);
      const objectiveId = specPractice?.objective_id;

      // Find objective to get name and default importance
      const objective = specObjectives?.find(o => o.id === objectiveId);

      // Get importance from calibration or default
      const importance = calibration?.importance_map?.[objectiveId]
        ?? objective?.default_importance
        ?? 3;

      // Check if practice has critical question(s) that failed (not proven = critical failure)
      const hasCritical = fp.has_critical || fp.is_critical || false;
      const isGap = fp.evidence_state === 'not_proven' || fp.evidence_state === 'none';
      const hasCriticalFailure = hasCritical && isGap;

      // Critical failures force Strategic Focus regardless of importance
      const priorityRow = (hasCriticalFailure || importance >= 4) ? 'strategic' : 'operational';

      // Map evidence state to status
      const status = mapEvidenceToStatus(fp.evidence_state);

      practices.push({
        id: fp.id,
        name: fp.title || specPractice?.name || specPractice?.title || fp.id,
        objective_id: objectiveId,
        objective_name: objective?.name || objective?.title || 'Unknown',
        importance,
        priorityRow,
        level: fp.maturity_level || level.level,
        status,
        evidence_state: fp.evidence_state,
        has_critical: hasCritical,
        has_critical_failure: hasCriticalFailure
      });
    });
  });

  return practices;
}

/**
 * Get column configuration based on user maturity level
 * Dynamic columns show relevant level groupings
 *
 * @param {number} userLevel - Current maturity level (1-4)
 */
export function getColumnConfig(userLevel) {
  if (userLevel === 1) {
    return [
      { id: 'col1', label: 'Level 1', sublabel: 'Current Focus', levels: [1] },
      { id: 'col2', label: 'Level 2', sublabel: 'Next Step', levels: [2] },
      { id: 'col3', label: 'Levels 3-4', sublabel: 'Future', levels: [3, 4] },
    ];
  }

  if (userLevel === 2) {
    return [
      { id: 'col1', label: 'Levels 1-2', sublabel: 'Foundation', levels: [1, 2] },
      { id: 'col2', label: 'Level 3', sublabel: 'Next Step', levels: [3] },
      { id: 'col3', label: 'Level 4', sublabel: 'Future', levels: [4] },
    ];
  }

  // Level 3 or 4
  return [
    { id: 'col1', label: 'Levels 1-2', sublabel: 'Foundation', levels: [1, 2] },
    { id: 'col2', label: 'Level 3', sublabel: 'Current', levels: [3] },
    { id: 'col3', label: 'Level 4', sublabel: 'Next Step', levels: [4] },
  ];
}

/**
 * Group practices into grid cells (2 rows × 3 columns)
 * Sorts gaps to top within each cell
 *
 * @param {Array} practiceData - Output from derivePracticeData
 * @param {Array} columns - Output from getColumnConfig
 */
export function groupPracticesIntoGrid(practiceData, columns) {
  const grid = {
    strategic: {},   // Top row (importance 4-5 OR critical failures)
    operational: {}, // Bottom row (importance 1-3, no critical failures)
  };

  // Initialize cells
  columns.forEach(col => {
    grid.strategic[col.id] = [];
    grid.operational[col.id] = [];
  });

  // Place practices into cells
  practiceData.forEach(practice => {
    // Find which column this practice belongs to
    const column = columns.find(col => col.levels.includes(practice.level));
    if (!column) return;

    grid[practice.priorityRow][column.id].push(practice);
  });

  // Sort each cell: gaps first, then partial, then complete
  const statusOrder = { gap: 0, partial: 1, complete: 2 };

  Object.keys(grid).forEach(row => {
    Object.keys(grid[row]).forEach(col => {
      grid[row][col].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    });
  });

  return grid;
}

/**
 * Get zone background class for styling
 * Zone A (Urgent): Top row, columns 0-1 → red tint
 * Zone B (Vision): Top row, column 2 → blue tint
 * Zone C (Operational): Bottom row → slate tint
 *
 * @param {string} row - 'strategic' or 'operational'
 * @param {number} colIndex - 0, 1, or 2
 */
export function getZoneBackground(row, colIndex) {
  if (row === 'strategic') {
    // Top row: Zone A (cols 0-1) or Zone B (col 2)
    return colIndex < 2 ? 'bg-red-50' : 'bg-blue-50';
  }
  // Bottom row: Zone C
  return 'bg-slate-50';
}

/**
 * Get summary stats for the matrix
 */
export function getMatrixStats(practiceData) {
  const total = practiceData.length;
  const gaps = practiceData.filter(p => p.status === 'gap').length;
  const partial = practiceData.filter(p => p.status === 'partial').length;
  const complete = practiceData.filter(p => p.status === 'complete').length;
  const strategicGaps = practiceData.filter(p => p.priorityRow === 'strategic' && p.status === 'gap').length;

  return { total, gaps, partial, complete, strategicGaps };
}
