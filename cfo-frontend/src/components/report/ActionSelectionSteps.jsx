// src/components/report/ActionSelectionSteps.jsx
// Sequential Action Selection - Step 1 of Progressive Wizard
// 4 sub-steps: Pain Points -> Quick Wins -> Fix Basics -> Objective Matrix

import React, { useMemo } from 'react';
import { Target, Zap, AlertTriangle, Layers, ArrowLeft, ArrowRight } from 'lucide-react';
import PainPointsPanel from './PainPointsPanel';
import QuickWinsPanel from './QuickWinsPanel';
import FixBasicsPanel from './FixBasicsPanel';
import ObjectiveBasedPanel from './ObjectiveBasedPanel';
import {
  filterByPainPoints,
  filterQuickWins,
  filterCriticalRisks
} from '../../utils/wizardUtils';

// Sub-step configuration (sequential order)
const SUB_STEPS = [
  { id: 'painPoints', label: 'Address Pain Points', icon: Target, step: 1 },
  { id: 'quickWins', label: 'Monetize Quick Wins', icon: Zap, step: 2 },
  { id: 'fixBasics', label: 'Fix the Basics', icon: AlertTriangle, step: 3 },
  { id: 'objective', label: 'Objective-Based Actions', icon: Layers, step: 4 }
];

export default function ActionSelectionSteps({
  gaps,
  practices,
  objectives,
  report,
  selectedActions,
  onToggleAction,
  onSelectAllInObjective,
  onClearAllInObjective,
  benchmarkData,
  importanceMap,
  questions,
  currentSubStep,
  onSubStepChange,
  onContinueToTimelines
}) {
  // Default to step 1 if not provided
  const subStep = currentSubStep || 1;

  // Extract context from report
  const painPoints = report?.context?.pillar?.pain_points || [];

  // Calculate counts for each sub-step
  const stepCounts = useMemo(() => ({
    painPoints: filterByPainPoints(gaps, painPoints).length,
    quickWins: filterQuickWins(gaps).length,
    fixBasics: filterCriticalRisks(gaps).length,
    objective: gaps.length
  }), [gaps, painPoints]);

  // Get current sub-step config
  const currentConfig = SUB_STEPS[subStep - 1];
  const isLastSubStep = subStep === 4;
  const isFirstSubStep = subStep === 1;

  // Common props for all panels
  const panelProps = {
    gaps,
    practices,
    objectives,
    report,
    selectedActions,
    onToggleAction,
    onSelectAllInObjective,
    onClearAllInObjective,
    benchmarkData,
    importanceMap,
    questions
  };

  const handleBack = () => {
    if (!isFirstSubStep) {
      onSubStepChange(subStep - 1);
    }
  };

  const handleContinue = () => {
    if (isLastSubStep) {
      // Continue to Timeline Assignment (wizard step 2)
      onContinueToTimelines?.();
    } else {
      onSubStepChange(subStep + 1);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sub-step Header - Compact numbered cards */}
      <div className="px-3 py-2 lg:px-6 lg:py-3 border-b border-slate-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Numbered step cards */}
          <div className="flex items-center gap-1.5 lg:gap-2">
            {SUB_STEPS.map((step) => {
              const isActive = step.step === subStep;
              const isCompleted = step.step < subStep;
              return (
                <button
                  key={step.id}
                  onClick={() => onSubStepChange(step.step)}
                  title={step.label}
                  className={`w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center text-xs lg:text-sm font-semibold rounded-sm border transition-colors ${
                    isActive
                      ? 'bg-slate-700 border-slate-700 text-white'
                      : isCompleted
                      ? 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500'
                  }`}
                >
                  {step.step}
                </button>
              );
            })}
          </div>

          {/* Current step label */}
          <span className="text-xs lg:text-sm font-medium text-slate-600">
            {currentConfig.label}
          </span>

          {/* Count badge */}
          <div className="text-xs text-slate-500 hidden lg:block">
            <span className="font-semibold text-slate-700">{stepCounts[currentConfig.id]}</span> action{stepCounts[currentConfig.id] !== 1 ? 's' : ''} in this view
          </div>
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">
        {subStep === 1 && (
          <PainPointsPanel {...panelProps} painPoints={painPoints} subStep={subStep} />
        )}
        {subStep === 2 && (
          <QuickWinsPanel {...panelProps} subStep={subStep} />
        )}
        {subStep === 3 && (
          <FixBasicsPanel {...panelProps} subStep={subStep} />
        )}
        {subStep === 4 && (
          <ObjectiveBasedPanel {...panelProps} subStep={subStep} />
        )}
      </div>

      {/* Sub-step Navigation Footer */}
      <div className="px-3 py-2 lg:px-6 lg:py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
        <button
          onClick={handleBack}
          disabled={isFirstSubStep}
          className={`flex items-center gap-2 px-2 py-1.5 lg:px-3 text-sm font-medium rounded-sm transition-colors ${
            isFirstSubStep
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden lg:inline">Back</span>
        </button>

        <div className="text-xs lg:text-sm text-slate-600">
          <span className="font-semibold">{selectedActions.size}</span> selected
        </div>

        <button
          onClick={handleContinue}
          className="flex items-center gap-2 px-2 py-1.5 lg:px-3 text-sm font-medium rounded-sm transition-colors bg-slate-700 text-white hover:bg-slate-800"
        >
          {isLastSubStep ? 'Timelines' : 'Next'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
