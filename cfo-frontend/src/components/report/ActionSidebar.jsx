// src/components/report/ActionSidebar.jsx
// VS-28: Universal sidebar for Action Planning - context, progress, and controls
// VS-41: Removed Finalize button (moved to left sidebar), removed Back/Proceed, restored progress tracker

import React from 'react';
import { Save, Sparkles } from 'lucide-react';

export default function ActionSidebar({
  companyName,
  industry,
  pillarName = 'FP&A',
  // Progress tracking
  totalGaps = 0,
  selectedCount = 0,
  assignedCount = 0,
  ownerCount = 0,
  // Timeline breakdown
  timelineCounts = {},
  // Actions
  onSave,
  saving = false,
  isFinalized = false
}) {
  const progressPercent = totalGaps > 0 ? Math.round((selectedCount / totalGaps) * 100) : 0;
  const timelinePercent = selectedCount > 0 ? Math.round((assignedCount / selectedCount) * 100) : 0;
  const ownerPercent = selectedCount > 0 ? Math.round((ownerCount / selectedCount) * 100) : 0;

  return (
    <div className="w-64 bg-white border border-slate-300 rounded-sm flex flex-col h-fit sticky top-4">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
          Action Planning
        </h3>
      </div>

      {/* Company Context */}
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="text-sm font-semibold text-slate-700 truncate">
          {companyName || 'Your Company'}
        </div>
        {industry && (
          <div className="text-xs text-slate-500 mt-0.5 capitalize">
            {industry.replace(/_/g, ' ')}
          </div>
        )}
        <div className="mt-2 inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">
          {pillarName} Pillar
        </div>
      </div>

      {/* Planning Progress */}
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Planning Progress
        </div>

        {/* Selection Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span>Actions Selected</span>
            <span className="font-medium">{selectedCount}/{totalGaps}</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Timeline Assignment */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span>Timeline Assigned</span>
            <span className={`font-medium ${assignedCount === selectedCount && selectedCount > 0 ? 'text-emerald-600' : ''}`}>
              {assignedCount}/{selectedCount || 0}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${assignedCount === selectedCount && selectedCount > 0 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${timelinePercent}%` }}
            />
          </div>
        </div>

        {/* Owner Assignment */}
        <div>
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span>Owner Assigned</span>
            <span className={`font-medium ${ownerCount === selectedCount && selectedCount > 0 ? 'text-emerald-600' : ''}`}>
              {ownerCount}/{selectedCount || 0}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${ownerCount === selectedCount && selectedCount > 0 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${ownerPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Timeline Breakdown */}
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          By Timeline
        </div>
        <div className="space-y-1.5">
          <TimelineRow label="6 Months" count={timelineCounts?.['6m'] || 0} color="bg-blue-500" />
          <TimelineRow label="12 Months" count={timelineCounts?.['12m'] || 0} color="bg-blue-600" />
          <TimelineRow label="24 Months" count={timelineCounts?.['24m'] || 0} color="bg-blue-700" />
          <TimelineRow label="Unassigned" count={timelineCounts?.unassigned || 0} color="bg-slate-400" />
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 space-y-3">
        {/* Generate Action Plan - Coming Soon */}
        <div className="pb-3 border-b border-slate-200">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-900">AI-Powered Analysis</h4>
              <p className="text-xs text-slate-500 mt-0.5">Generate a prioritized action plan</p>
            </div>
          </div>
          <button
            disabled
            className="w-full px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Action Plan</span>
          </button>
          <div className="text-center mt-1.5">
            <span className="text-xs text-slate-400">Coming Soon</span>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={saving || isFinalized}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded border border-slate-300 hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : isFinalized ? 'Locked' : 'Save Progress'}
        </button>
      </div>
    </div>
  );
}

function TimelineRow({ label, count, color }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
        <span className="text-xs text-slate-600">{label}</span>
      </div>
      <span className="text-xs font-medium text-slate-700">{count}</span>
    </div>
  );
}
