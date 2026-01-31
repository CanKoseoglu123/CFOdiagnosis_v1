// src/components/report/ReviewSummaryPanel.jsx
// Progressive Wizard Step 5 - Review summary and generate report
// Shows completeness check, summary cards, and action register preview

import React from 'react';
import { CheckCircle, AlertTriangle, Target, Clock, User, FileText, AlertCircle, Eye } from 'lucide-react';

const TIMELINE_LABELS = {
  '6m': '6 Months',
  '12m': '12 Months',
  '24m': '24 Months'
};

// Objective display names
const OBJECTIVE_NAMES = {
  'obj_budget_discipline': 'Budget Discipline',
  'obj_financial_controls': 'Financial Controls',
  'obj_performance_monitoring': 'Performance Monitoring',
  'obj_forecasting_agility': 'Forecasting Agility',
  'obj_driver_based_planning': 'Driver-Based Planning',
  'obj_scenario_modeling': 'Scenario Modeling',
  'obj_strategic_influence': 'Strategic Influence',
  'obj_decision_support': 'Decision Support',
  'obj_operational_excellence': 'Operational Excellence'
};

export default function ReviewSummaryPanel({
  gaps,
  objectives,
  selectedObjectives,
  selectedActions,
  timelines,
  owners,
  onComplete,
  onReviewImpact,
  completing = false
}) {
  // Filter to selected actions
  const selectedGaps = gaps.filter(g => selectedActions.has(g.id));

  // Calculate stats
  // gaps have objective_id from ProgressiveWizard
  const stats = {
    actionsSelected: selectedGaps.length,
    objectivesAddressed: new Set(selectedGaps.map(g => g.objective_id)).size,
    criticalGapsFixed: selectedGaps.filter(g => g.is_critical).length,
    totalCriticalGaps: gaps.filter(g => g.is_critical && selectedObjectives.has(g.objective_id)).length
  };

  // Timeline breakdown
  const timelineBreakdown = {
    '6m': selectedGaps.filter(g => timelines.get(g.id) === '6m').length,
    '12m': selectedGaps.filter(g => timelines.get(g.id) === '12m').length,
    '24m': selectedGaps.filter(g => timelines.get(g.id) === '24m').length,
    unassigned: selectedGaps.filter(g => !timelines.get(g.id)).length
  };

  // Completeness checks
  const checks = {
    hasActions: selectedGaps.length > 0,
    allTimelines: timelineBreakdown.unassigned === 0,
    allOwners: selectedGaps.every(g => owners.get(g.id)?.trim())
  };

  const isComplete = checks.hasActions && checks.allTimelines && checks.allOwners;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 sm:px-6 sm:py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="text-sm sm:text-base font-semibold text-slate-800">
          Review & Finalize
        </h3>
        <p className="text-sm text-slate-600 mt-1 hidden sm:block">
          Review your action plan before generating the Executive Report.
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard
            icon={<Target className="w-5 h-5 text-blue-600" />}
            label="Actions Selected"
            value={stats.actionsSelected}
            bgColor="bg-blue-50"
          />
          <SummaryCard
            icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
            label="Objectives Addressed"
            value={stats.objectivesAddressed}
            bgColor="bg-emerald-50"
          />
          <SummaryCard
            icon={<AlertCircle className="w-5 h-5 text-red-600" />}
            label="Critical Actions Addressed"
            value={`${stats.criticalGapsFixed}/${stats.totalCriticalGaps}`}
            bgColor="bg-red-50"
          />
        </div>

        {/* Timeline Breakdown Bar */}
        <div className="bg-white border border-slate-200 rounded-sm p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Timeline Distribution</h4>
          {selectedGaps.length > 0 ? (
            <>
              <div className="flex h-6 rounded-sm overflow-hidden bg-slate-100">
                {timelineBreakdown['6m'] > 0 && (
                  <div
                    className="bg-blue-500 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${(timelineBreakdown['6m'] / selectedGaps.length) * 100}%` }}
                  >
                    {timelineBreakdown['6m']}
                  </div>
                )}
                {timelineBreakdown['12m'] > 0 && (
                  <div
                    className="bg-blue-600 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${(timelineBreakdown['12m'] / selectedGaps.length) * 100}%` }}
                  >
                    {timelineBreakdown['12m']}
                  </div>
                )}
                {timelineBreakdown['24m'] > 0 && (
                  <div
                    className="bg-blue-700 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${(timelineBreakdown['24m'] / selectedGaps.length) * 100}%` }}
                  >
                    {timelineBreakdown['24m']}
                  </div>
                )}
                {timelineBreakdown.unassigned > 0 && (
                  <div
                    className="bg-slate-400 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${(timelineBreakdown.unassigned / selectedGaps.length) * 100}%` }}
                  >
                    {timelineBreakdown.unassigned}
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-2 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> 6m: {timelineBreakdown['6m']}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" /> 12m: {timelineBreakdown['12m']}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-700" /> 24m: {timelineBreakdown['24m']}
                </span>
                {timelineBreakdown.unassigned > 0 && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" /> Unassigned: {timelineBreakdown.unassigned}
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">No actions selected</p>
          )}
        </div>

        {/* Completeness Checklist */}
        <div className="bg-white border border-slate-200 rounded-sm p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Completeness Check</h4>
          <div className="space-y-2">
            <CheckItem
              passed={checks.hasActions}
              label="At least one action selected"
            />
            <CheckItem
              passed={checks.allTimelines}
              label="All actions have timeline assigned"
              warning={!checks.allTimelines && checks.hasActions}
            />
            <CheckItem
              passed={checks.allOwners}
              label="All actions have owner assigned"
              warning={!checks.allOwners && checks.hasActions}
            />
          </div>
        </div>

        {/* Action Register Preview */}
        {selectedGaps.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700">Action Register Preview</h4>
            </div>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-slate-600">Action</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-600 w-24">Timeline</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-600 w-32">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedGaps.map(gap => (
                    <tr key={gap.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          {gap.is_critical && (
                            <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          )}
                          <span className="text-slate-700 truncate">
                            {gap.expert_action?.title || gap.text}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {timelines.get(gap.id) ? (
                          <span className="text-slate-700">{TIMELINE_LABELS[timelines.get(gap.id)]}</span>
                        ) : (
                          <span className="text-amber-600">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {owners.get(gap.id)?.trim() ? (
                          <span className="text-slate-700">{owners.get(gap.id)}</span>
                        ) : (
                          <span className="text-amber-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Footer with action buttons */}
      <div className="px-3 py-2.5 sm:px-6 sm:py-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs sm:text-sm text-slate-600 hidden sm:block">
            {isComplete ? (
              <span className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="w-4 h-4" />
                Ready to finalize
              </span>
            ) : (
              <span className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                {!checks.hasActions
                  ? 'Select at least one action'
                  : !checks.allTimelines
                  ? 'Some timelines unassigned'
                  : 'Some owners unassigned'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {onReviewImpact && (
              <button
                onClick={onReviewImpact}
                disabled={!checks.hasActions || completing}
                className={`flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 text-sm font-medium rounded-sm transition-colors border flex-1 sm:flex-initial ${
                  checks.hasActions && !completing
                    ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Review Impact</span>
                <span className="sm:hidden">Review</span>
              </button>
            )}
            <button
              onClick={onComplete}
              disabled={!checks.hasActions || completing}
              className={`flex items-center justify-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 text-sm font-medium rounded-sm transition-colors flex-1 sm:flex-initial ${
                checks.hasActions && !completing
                  ? 'bg-slate-800 text-white hover:bg-slate-900'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <FileText className="w-4 h-4" />
              {completing ? 'Saving...' : 'Complete'}
            </button>
          </div>
        </div>
        {!isComplete && checks.hasActions && (
          <p className="text-xs text-slate-500 mt-2 hidden sm:block">
            You can proceed with incomplete assignments, but we recommend filling in all timelines and owners for a complete action plan.
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, bgColor }) {
  return (
    <div className={`${bgColor} border border-slate-200 rounded-sm p-4`}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <div className="text-xs text-slate-500">{label}</div>
          <div className="text-xl font-bold text-slate-800">{value}</div>
        </div>
      </div>
    </div>
  );
}

function CheckItem({ passed, label, warning = false }) {
  return (
    <div className="flex items-center gap-2">
      {passed ? (
        <CheckCircle className="w-4 h-4 text-emerald-500" />
      ) : warning ? (
        <AlertTriangle className="w-4 h-4 text-amber-500" />
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
      )}
      <span className={`text-sm ${passed ? 'text-slate-700' : warning ? 'text-amber-600' : 'text-slate-500'}`}>
        {label}
      </span>
    </div>
  );
}
