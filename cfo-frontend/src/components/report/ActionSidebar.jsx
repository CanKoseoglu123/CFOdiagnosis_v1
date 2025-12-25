// src/components/report/ActionSidebar.jsx
// VS-28: Universal sidebar for Action Planning - progress, context, navigation

import React from 'react';
import { ChevronLeft, ChevronRight, Save, CheckCircle2, Circle } from 'lucide-react';

export default function ActionSidebar({
  companyName,
  industry,
  pillarName = 'FP&A',
  // Progress
  totalGaps,
  selectedCount,
  assignedCount,
  // Timeline breakdown
  timelineCounts,
  // Navigation
  onBack,
  onProceed,
  onSave,
  saving = false,
  canProceed = true
}) {
  const progressPercent = totalGaps > 0 ? Math.round((selectedCount / totalGaps) * 100) : 0;
  const assignedPercent = selectedCount > 0 ? Math.round((assignedCount / selectedCount) * 100) : 0;

  // Workflow steps
  const steps = [
    { id: 'setup', label: 'Company Setup', completed: true },
    { id: 'assess', label: 'Assessment', completed: true },
    { id: 'calibrate', label: 'Calibration', completed: true },
    { id: 'review', label: 'Report Review', completed: true },
    { id: 'plan', label: 'Action Planning', completed: false, active: true },
  ];

  return (
    <div className="w-64 bg-white border border-slate-300 rounded-sm flex flex-col h-fit sticky top-4">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
          Diagnostic Progress
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

      {/* Workflow Steps */}
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Workflow
        </div>
        <div className="space-y-1.5">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-2">
              {step.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              ) : step.active ? (
                <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-blue-500 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
              )}
              <span className={`text-xs ${
                step.active ? 'font-semibold text-blue-700' :
                step.completed ? 'text-slate-600' : 'text-slate-400'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Plan Progress */}
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
        <div>
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span>Timeline Assigned</span>
            <span className="font-medium">{assignedCount}/{selectedCount || 0}</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${assignedPercent}%` }}
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

      {/* Navigation Buttons */}
      <div className="px-4 py-3 space-y-2 mt-auto">
        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded border border-slate-300 hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Progress'}
        </button>

        {/* Navigation Row */}
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white text-slate-600 text-sm font-medium rounded border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={onProceed}
            disabled={!canProceed}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Proceed
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
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
