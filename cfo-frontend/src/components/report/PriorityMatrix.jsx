// src/components/report/PriorityMatrix.jsx
// VS-33: Priority Matrix - BCG-style triage matrix
// Replaces Capability Footprint section in Overview tab

import React, { useMemo } from 'react';
import MatrixGrid from './MatrixGrid';
import MatrixLegend from './MatrixLegend';
import {
  derivePracticeData,
  getColumnConfig,
  groupPracticesIntoGrid,
  getMatrixStats
} from '../../utils/matrixUtils';

/**
 * Priority Matrix Component
 *
 * @param {Object} props
 * @param {Array} props.footprintLevels - report.maturity_footprint.levels
 * @param {Array} props.specPractices - spec.practices (has objective_id)
 * @param {Array} props.specObjectives - spec.objectives
 * @param {Object} props.calibration - report.calibration (has importance_map)
 * @param {number} props.userLevel - User's achieved maturity level (1-4)
 */
export default function PriorityMatrix({
  footprintLevels,
  specPractices,
  specObjectives,
  calibration,
  userLevel
}) {
  // Derive practice data with priority, level, and status
  const practiceData = useMemo(() => {
    return derivePracticeData(
      footprintLevels,
      specPractices,
      specObjectives,
      calibration
    );
  }, [footprintLevels, specPractices, specObjectives, calibration]);

  // Get column config based on user level
  const columns = useMemo(() => {
    return getColumnConfig(userLevel || 1);
  }, [userLevel]);

  // Group practices into grid cells
  const gridData = useMemo(() => {
    return groupPracticesIntoGrid(practiceData, columns);
  }, [practiceData, columns]);

  // Get stats for header
  const stats = useMemo(() => {
    return getMatrixStats(practiceData);
  }, [practiceData]);

  return (
    <div className="bg-white border border-slate-300 rounded-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">
          Priority Matrix
        </h2>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>
            <span className="font-semibold text-[#6699CC]">{stats.gaps}</span> gaps
          </span>
          <span>
            <span className="font-semibold text-[#336699]">{stats.partial}</span> partial
          </span>
          <span>
            <span className="font-semibold text-[#003366]">{stats.complete}</span> proven
          </span>
          {stats.strategicGaps > 0 && (
            <span className="text-red-600 font-medium">
              {stats.strategicGaps} urgent gaps
            </span>
          )}
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="p-3">
        <MatrixGrid columns={columns} gridData={gridData} />
      </div>

      {/* Legend */}
      <div className="px-4 pb-3 pt-1 border-t border-slate-100">
        <MatrixLegend />
      </div>
    </div>
  );
}
