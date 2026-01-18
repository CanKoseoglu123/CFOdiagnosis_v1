// components/WorkflowSidebar.jsx
// Global sidebar for workflow navigation and page-specific progress
// VS-39: Updated workflow to include Executive Report step
// VS-41: New navigation buttons - Back to Assessment, Back to Calibration, Action Planning/Generate Executive Report
// Completed steps are clickable to allow users to navigate back and review/edit their context

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Lock, ChevronLeft, ChevronRight, FileText, Home } from 'lucide-react';

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
  // VS-41: Navigation props
  runId,
  activeTab = 'overview',
  onTabChange,
  showBenchmarkToggle = false,
  includeCommittedActions = false,
  onToggleIncludeCommittedActions,
  // VS-41: Finalization props (for Action Planning tab)
  onFinalizeRequest,
  canFinalize = false,
  incompleteCount = 0,
  selectedCount = 0
}) {
  const navigate = useNavigate();
  const [showTooltip, setShowTooltip] = useState(false);

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

  // Get navigation path for a step
  const getStepPath = (step) => {
    switch (step.id) {
      case 'setup':
        return `/run/${runId}/setup/company`;
      case 'assess':
        return `/assess/objective/obj_budget_discipline?runId=${runId}`;
      case 'calibrate':
        return `/run/${runId}/calibrate`;
      case 'report':
        return `/report/${runId}`;
      case 'executive':
        return `/report/${runId}/executive`;
      default:
        return null;
    }
  };

  // Navigation handlers
  function handleBackToAssessment() {
    navigate(`/assess/foundation?runId=${runId}`);
  }

  function handleBackToCalibration() {
    navigate(`/run/${runId}/calibrate`);
  }

  function handleGoToActionPlanning() {
    if (onTabChange) {
      onTabChange('actions');
    }
  }

  function handleGenerateExecutiveReport() {
    if (onFinalizeRequest) {
      onFinalizeRequest();
    }
  }

  function handleReturnToHome() {
    navigate('/');
  }

  function handleDownloadPDF() {
    navigate(`/report/${runId}/executive?print=true`);
  }

  // Build tooltip message for disabled Generate Executive Report button
  const getDisabledReason = () => {
    if (selectedCount === 0) {
      return 'Select at least one action to finalize';
    }
    if (incompleteCount > 0) {
      return `${incompleteCount} action${incompleteCount !== 1 ? 's' : ''} missing timeline or owner`;
    }
    return '';
  };

  const isActionPlanningTab = activeTab === 'actions';
  const showGenerateButton = isActionPlanningTab && !isFinalized;

  return (
    <div className="flex flex-col h-full">
      {/* Workflow Steps */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Workflow
        </div>
        <div className="space-y-1">
          {WORKFLOW_STEPS.map((step) => {
            const state = getStepState(step);
            const isClickable = state === 'completed';
            const path = isClickable ? getStepPath(step) : null;

            return (
              <div
                key={step.id}
                onClick={isClickable && path ? () => navigate(path) : undefined}
                className={`flex items-center gap-2.5 py-1.5 px-1 -mx-1 ${
                  state === 'active' ? 'text-blue-700 font-medium' :
                  state === 'completed' ? 'text-emerald-600 cursor-pointer hover:bg-slate-50 rounded-sm transition-colors' :
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

      {showBenchmarkToggle && (
        <div className="mt-4">
          <div className="flex items-center justify-between px-3 py-2 border border-slate-300 bg-white rounded-sm">
            <span className="text-sm text-slate-600">Include committed actions</span>
            <button
              type="button"
              onClick={onToggleIncludeCommittedActions}
              aria-pressed={includeCommittedActions}
              className={`relative w-10 h-5 border transition-colors ${
                includeCommittedActions ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-200 border-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white border border-slate-200 transition-transform ${
                  includeCommittedActions ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-slate-200 my-6" />

      {/* Page-specific content slot */}
      {children && (
        <>
          <div>{children}</div>
          <div className="border-t border-slate-200 my-6" />
        </>
      )}

      {/* Spacer to push navigation to bottom */}
      <div className="flex-1" />

      {/* VS-41: Navigation Buttons */}
      <div className="space-y-2 mt-6">
        {isFinalized ? (
          // Post-completion navigation
          <>
            {/* Completion message */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-4 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-emerald-800">Diagnostic Complete!</span>
              </div>
              <p className="text-sm text-emerald-700">
                Thank you for completing the CFO Diagnostic. Your Executive Report is ready.
              </p>
            </div>

            {/* Download PDF */}
            <button
              onClick={handleDownloadPDF}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-sm hover:bg-slate-900 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Download PDF
            </button>

            {/* Return to Home */}
            <button
              onClick={handleReturnToHome}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-600 text-sm font-medium rounded-sm border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <Home className="w-4 h-4" />
              Return to Home
            </button>
          </>
        ) : (
          // Pre-finalization navigation
          <>
            {/* Back to Assessment */}
            <button
              onClick={handleBackToAssessment}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-600 text-sm font-medium rounded-sm border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Assessment
            </button>

            {/* Back to Calibration */}
            <button
              onClick={handleBackToCalibration}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-600 text-sm font-medium rounded-sm border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Calibration
            </button>

            {/* Third button: Action Planning OR Generate Executive Report */}
            {showGenerateButton ? (
              // Generate Executive Report (Action Planning tab, not finalized)
              <div
                className="relative"
                onMouseEnter={() => !canFinalize && setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <button
                  onClick={handleGenerateExecutiveReport}
                  disabled={!canFinalize}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-sm hover:bg-slate-900 transition-colors disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  <FileText className="w-4 h-4" />
                  Generate Executive Report
                </button>
                {/* Tooltip for disabled state */}
                {showTooltip && !canFinalize && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
                    {getDisabledReason()}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                  </div>
                )}
              </div>
            ) : (
              // Go to Action Planning (Overview/Footprint tabs)
              <button
                onClick={handleGoToActionPlanning}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-sm hover:bg-blue-700 transition-colors"
              >
                Action Planning
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE-SPECIFIC SIDEBAR CONTENT COMPONENTS (kept for potential future use)
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
