// src/components/report/TimelineAssignmentPanel.jsx
// Progressive Wizard Step 3 - Assign timelines to selected actions
// Includes bulk assignment and grouped view by timeline bucket

import React from 'react';
import { AlertCircle, Clock, Zap } from 'lucide-react';
import { isQuickWin } from '../../utils/wizardUtils';

const TIMELINE_OPTIONS = [
  { value: '6m', label: '6 months', shortLabel: '6m' },
  { value: '12m', label: '12 months', shortLabel: '12m' },
  { value: '24m', label: '24 months', shortLabel: '24m' }
];

export default function TimelineAssignmentPanel({
  gaps,
  selectedActions,
  timelines,
  onTimelineChange,
  onBulkTimelineAssign
}) {
  // Filter to selected actions only
  const selectedGaps = gaps.filter(g => selectedActions.has(g.id));

  // Group by timeline
  const grouped = {
    unassigned: selectedGaps.filter(g => !timelines.get(g.id)),
    '6m': selectedGaps.filter(g => timelines.get(g.id) === '6m'),
    '12m': selectedGaps.filter(g => timelines.get(g.id) === '12m'),
    '24m': selectedGaps.filter(g => timelines.get(g.id) === '24m')
  };

  const assignedCount = selectedGaps.length - grouped.unassigned.length;
  const totalCount = selectedGaps.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header with bulk assign */}
      <div className="px-3 py-2 lg:px-6 lg:py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between mb-2 lg:mb-3">
          <div>
            <h3 className="text-sm lg:text-base font-semibold text-slate-800">
              Assign Timelines
            </h3>
            <p className="text-sm text-slate-600 mt-1 hidden lg:block">
              Set when you plan to complete each action. Use bulk assign for quick setup.
            </p>
          </div>
        </div>

        {/* Bulk assign controls */}
        {grouped.unassigned.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-sm">
            <span className="text-sm text-slate-600">
              Apply to {grouped.unassigned.length} unassigned:
            </span>
            <div className="flex gap-2">
              {TIMELINE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onBulkTimelineAssign(opt.value)}
                  className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-sm transition-colors"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-2 lg:p-4">
        {totalCount === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-sm">No actions selected</p>
            <p className="text-xs text-slate-400 mt-1">
              Go back to select actions first.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Unassigned section */}
            {grouped.unassigned.length > 0 && (
              <TimelineGroup
                label="Unassigned"
                icon={<Clock className="w-4 h-4 text-amber-500" />}
                actions={grouped.unassigned}
                timelines={timelines}
                onTimelineChange={onTimelineChange}
                headerColor="bg-amber-50 border-amber-200"
              />
            )}

            {/* 6 months */}
            {grouped['6m'].length > 0 && (
              <TimelineGroup
                label="6 Months"
                icon={<span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />}
                actions={grouped['6m']}
                timelines={timelines}
                onTimelineChange={onTimelineChange}
                headerColor="bg-blue-50 border-blue-200"
              />
            )}

            {/* 12 months */}
            {grouped['12m'].length > 0 && (
              <TimelineGroup
                label="12 Months"
                icon={<span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />}
                actions={grouped['12m']}
                timelines={timelines}
                onTimelineChange={onTimelineChange}
                headerColor="bg-blue-50 border-blue-200"
              />
            )}

            {/* 24 months */}
            {grouped['24m'].length > 0 && (
              <TimelineGroup
                label="24 Months"
                icon={<span className="w-2.5 h-2.5 rounded-sm bg-blue-700" />}
                actions={grouped['24m']}
                timelines={timelines}
                onTimelineChange={onTimelineChange}
                headerColor="bg-blue-50 border-blue-200"
              />
            )}
          </div>
        )}
      </div>

      {/* Footer with progress - hidden on mobile */}
      <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 hidden lg:block">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">
            Assigned: <strong className={assignedCount === totalCount ? 'text-emerald-600' : ''}>{assignedCount}</strong>/{totalCount} action{totalCount !== 1 ? 's' : ''}
          </span>
          {grouped.unassigned.length > 0 && (
            <span className="text-xs text-amber-600">
              {grouped.unassigned.length} need timeline
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineGroup({ label, icon, actions, timelines, onTimelineChange, headerColor }) {
  return (
    <div className="border border-slate-200 rounded-sm overflow-hidden">
      {/* Group header */}
      <div className={`px-4 py-2 flex items-center gap-2 border-b ${headerColor}`}>
        {icon}
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className="text-xs text-slate-500 ml-auto">{actions.length} action{actions.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Actions */}
      <div className="bg-white divide-y divide-slate-100">
        {actions.map(action => (
          <TimelineActionRow
            key={action.id}
            action={action}
            currentTimeline={timelines.get(action.id)}
            onTimelineChange={(value) => onTimelineChange(action.id, value)}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineActionRow({ action, currentTimeline, onTimelineChange }) {
  const quickWin = isQuickWin(action);
  const isCritical = action.is_critical;

  return (
    <div className="px-4 py-3 flex items-center gap-4">
      {/* Action info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isCritical && (
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          )}
          {quickWin && (
            <Zap className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
          )}
          <span className="text-sm font-medium text-slate-700 truncate">
            {action.expert_action?.title || action.text}
          </span>
        </div>
      </div>

      {/* Timeline selector */}
      <select
        value={currentTimeline || ''}
        onChange={(e) => onTimelineChange(e.target.value || null)}
        className="text-sm border border-slate-300 rounded-sm px-3 py-1.5 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Select...</option>
        {TIMELINE_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
