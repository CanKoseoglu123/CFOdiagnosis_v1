// src/components/report/ActionSidebar.jsx
// VS-28: Universal sidebar for Action Planning - context and controls
// VS-39: Added Finalize Pillar button with disabled safety valve
// VS-40: Added validation - require timeline + owner for all selected actions

import React from 'react';
import { ChevronLeft, ChevronRight, Save, Sparkles, Lock, CheckCircle, AlertCircle } from 'lucide-react';

export default function ActionSidebar({
  companyName,
  industry,
  pillarName = 'FP&A',
  // Progress (for validation only)
  selectedCount = 0,
  // Navigation
  onBack,
  onProceed,
  onSave,
  saving = false,
  canProceed = true,
  // VS-39: Finalization
  isFinalized = false,
  onRequestFinalize,
  disabled = false,  // Safety valve for loading states
  // VS-40: Validation for finalization
  canFinalize = false,
  incompleteCount = 0
}) {
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

      {/* Actions */}
      <div className="px-4 py-3 space-y-3 mt-auto">
        {/* VS-39/40: Finalize Pillar Button with validation */}
        {!isFinalized ? (
          <div className="pb-3 border-b border-slate-200">
            <button
              onClick={onRequestFinalize}
              disabled={disabled || !canFinalize}
              className="w-full px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-sm flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              <span>Finalize Pillar</span>
            </button>
            {/* VS-40: Show validation status */}
            {selectedCount === 0 ? (
              <p className="text-xs text-slate-500 text-center mt-2">
                Select at least one action to finalize
              </p>
            ) : incompleteCount > 0 ? (
              <div className="flex items-start gap-1.5 mt-2 p-2 bg-amber-50 border border-amber-200 rounded-sm">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  {incompleteCount} action{incompleteCount !== 1 ? 's' : ''} missing timeline or owner
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center mt-2">
                Lock your action plan to view Executive Report
              </p>
            )}
          </div>
        ) : (
          <div className="pb-3 border-b border-slate-200">
            <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-sm">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Pillar Finalized</span>
            </div>
            <p className="text-xs text-slate-500 text-center mt-2">
              Executive Report is now available
            </p>
          </div>
        )}

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
