// src/components/report/ProgressStepper.jsx
// Progressive Wizard step indicator - horizontal stepper with clickable back navigation
// Follows SetupProgress.jsx pattern with enterprise styling

import React from 'react';
import { Check } from 'lucide-react';

const STEPS = [
  { key: 1, label: 'Objectives' },
  { key: 2, label: 'Actions' },
  { key: 3, label: 'Timelines' },
  { key: 4, label: 'Owners' },
  { key: 5, label: 'Review' }
];

export default function ProgressStepper({ currentStep, onStepClick, completedSteps = new Set() }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4 px-6 bg-slate-50 border-b border-slate-200">
      {STEPS.map((step, index) => {
        const isCompleted = completedSteps.has(step.key) || step.key < currentStep;
        const isCurrent = step.key === currentStep;
        const isClickable = isCompleted && step.key !== currentStep;

        return (
          <div key={step.key} className="flex items-center">
            <button
              onClick={() => isClickable && onStepClick?.(step.key)}
              disabled={!isClickable}
              className={`flex flex-col items-center group ${
                isClickable ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-sm flex items-center justify-center text-sm font-semibold transition-colors
                  ${isCompleted && !isCurrent
                    ? 'bg-emerald-600 text-white group-hover:bg-emerald-700'
                    : isCurrent
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                  }`}
              >
                {isCompleted && !isCurrent ? <Check size={16} /> : step.key}
              </div>
              <span
                className={`text-xs mt-1.5 whitespace-nowrap transition-colors ${
                  isCurrent
                    ? 'text-blue-600 font-semibold'
                    : isCompleted
                    ? 'text-emerald-600 font-medium group-hover:text-emerald-700'
                    : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </button>
            {index < STEPS.length - 1 && (
              <div
                className={`w-10 h-0.5 mx-2 transition-colors ${
                  step.key < currentStep || completedSteps.has(step.key)
                    ? 'bg-emerald-500'
                    : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
