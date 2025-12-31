// components/WorkflowSidebar.jsx
// Global sidebar for workflow navigation and page-specific progress
// VS-39: Updated workflow to include Executive Report step

import React from 'react';
import { CheckCircle2, Circle, ChevronLeft, ChevronRight, Lock } from 'lucide-react';

// Workflow steps for the diagnostic journey
// VS-39: Merged Report Review & Action Planning, added Executive Report
const WORKFLOW_STEPS = [
  { id: 'setup', label: 'Company Setup', path: '/setup' },
  { id: 'assess', label: 'Assessment', path: '/assess' },
  { id: 'calibrate', label: 'Priority Calibration', path: '/calibrate' },
  { id: 'report', label: 'Report Review & Action Planning', path: '/report' },
  { id: 'executive', label: 'Executive Report', path: '/report', requiresFinalization: true }
];

export default function WorkflowSidebar({
  // Current step identifier
  currentStep = 'report',
  // All steps before currentStep are considered completed
  completedSteps = ['setup', 'assess', 'calibrate'],
  // VS-39: Whether pillar is finalized (unlocks Executive Report)
  isFinalized = false,
  // Page-specific content slot
  children,
  // Navigation
  onBack,
  onProceed,
  backLabel = 'Back',
  proceedLabel = 'Continue',
  canProceed = true,
  showNavigation = true
}) {
  // Determine step states
  const getStepState = (step) => {
    // VS-39: Executive step requires finalization to be active/completed
    if (step.requiresFinalization && !isFinalized) {
      return 'locked';
    }
    if (step.id === currentStep) return 'active';
    if (completedSteps.includes(step.id)) return 'completed';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      {/* Workflow Steps */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Workflow
        </div>
        <div className="space-y-1">
          {WORKFLOW_STEPS.map((step) => {
            const state = getStepState(step);
            return (
              <div
                key={step.id}
                className={`flex items-center gap-2.5 py-1.5 ${
                  state === 'active' ? 'text-blue-700 font-medium' :
                  state === 'completed' ? 'text-emerald-600' :
                  state === 'locked' ? 'text-slate-300' :
                  'text-slate-400'
                }`}
              >
                {state === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : state === 'active' ? (
                  <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-blue-500 flex-shrink-0" />
                ) : state === 'locked' ? (
                  <Lock className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="text-sm">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200" />

      {/* Page-specific content slot */}
      {children && (
        <>
          <div>{children}</div>
          <div className="border-t border-slate-200" />
        </>
      )}

      {/* Navigation Buttons */}
      {showNavigation && (
        <div className="space-y-2">
          {onProceed && (
            <button
              onClick={onProceed}
              disabled={!canProceed}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {proceedLabel}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {onBack && (
            <button
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-600 text-sm font-medium rounded-md border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {backLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE-SPECIFIC SIDEBAR CONTENT COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// Report Overview sidebar content
export function ReportOverviewContent({
  executionScore = 0,
  maturityLevel = 1,
  criticalCount = 0,
  actionCount = 0
}) {
  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        Report Summary
      </div>

      {/* Score Card */}
      <div className="bg-slate-50 rounded-md p-3 border border-slate-200">
        <div className="text-2xl font-bold text-slate-800">{executionScore}%</div>
        <div className="text-xs text-slate-500">Execution Score</div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-blue-50 rounded p-2 text-center border border-blue-100">
          <div className="text-lg font-bold text-blue-700">L{maturityLevel}</div>
          <div className="text-[10px] text-slate-500 uppercase">Level</div>
        </div>
        <div className={`rounded p-2 text-center border ${
          criticalCount > 0
            ? 'bg-red-50 border-red-100'
            : 'bg-emerald-50 border-emerald-100'
        }`}>
          <div className={`text-lg font-bold ${
            criticalCount > 0 ? 'text-red-600' : 'text-emerald-600'
          }`}>{criticalCount}</div>
          <div className="text-[10px] text-slate-500 uppercase">Critical</div>
        </div>
      </div>

      {/* Action Count */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">Available Actions</span>
        <span className="font-semibold text-slate-800">{actionCount}</span>
      </div>
    </div>
  );
}

// Maturity Footprint sidebar content
export function FootprintContent({
  totalPractices = 21,
  evidencedPractices = 0,
  partialPractices = 0,
  gapPractices = 0
}) {
  const evidencePercent = Math.round((evidencedPractices / totalPractices) * 100);

  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        Maturity Footprint
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-600">Practices Evidenced</span>
          <span className="font-medium text-slate-700">{evidencedPractices}/{totalPractices}</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${evidencePercent}%` }}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-1.5">
        <LegendItem color="bg-emerald-500" label="Evidenced" count={evidencedPractices} />
        <LegendItem color="bg-amber-400" label="Partial" count={partialPractices} />
        <LegendItem color="bg-slate-200" label="Gap" count={gapPractices} />
      </div>
    </div>
  );
}

function LegendItem({ color, label, count }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-sm ${color}`} />
        <span className="text-slate-600">{label}</span>
      </div>
      <span className="font-medium text-slate-700">{count}</span>
    </div>
  );
}
