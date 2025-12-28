// src/components/report/InterpretationLoader.jsx
// VS-25: Loading skeleton for interpretation generation
// VS-32: Updated pipeline stages with critic/question phases
// PATCH V2: Square indicators per design system (no circles)

import React from 'react';
import { Brain, Sparkles, CheckCircle2, FileCheck, MessageCircleQuestion, RefreshCw } from 'lucide-react';

const STEPS = [
  { id: 'analyzing', label: 'Analyzing your assessment data...', icon: Brain },
  { id: 'generating', label: 'Drafting personalized insights...', icon: Sparkles },
  { id: 'critiquing', label: 'Quality review and gap identification...', icon: CheckCircle2 },
  { id: 'awaiting_user', label: 'Gathering additional context...', icon: MessageCircleQuestion },
  { id: 'refining', label: 'Refining based on your input...', icon: RefreshCw },
  { id: 'finalizing', label: 'Finalizing your report...', icon: FileCheck }
];

export default function InterpretationLoader({ currentStep = 'analyzing', progress = 25 }) {
  const stepIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="bg-white border border-slate-200 rounded-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        {/* PATCH V2: Square indicator */}
        <div className="w-8 h-8 rounded-sm bg-primary-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-semibold text-navy-900">Generating AI Insights</h3>
          <p className="text-sm text-slate-500">This may take a moment</p>
        </div>
      </div>

      {/* Progress bar - PATCH V2: Square corners */}
      <div className="mb-6">
        <div className="h-2 bg-slate-100 rounded-sm overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps - PATCH V2: Square indicators with icons */}
      <div className="space-y-3">
        {STEPS.map((step, index) => {
          const isComplete = index < stepIndex;
          const isCurrent = index === stepIndex;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-sm ${
                isCurrent ? 'bg-primary-50 border border-primary-200' : 'bg-slate-50'
              }`}
            >
              {/* PATCH V2: Square step indicator */}
              <div className={`w-6 h-6 rounded-sm flex items-center justify-center ${
                isComplete ? 'bg-green-600' :
                isCurrent ? 'bg-primary-500' : 'bg-slate-300'
              }`}>
                {isComplete ? (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <Icon className="w-3.5 h-3.5 text-white" />
                )}
              </div>
              <span className={`text-sm flex-1 ${
                isComplete ? 'text-green-700' :
                isCurrent ? 'text-primary-700 font-medium' : 'text-slate-400'
              }`}>
                {step.label}
              </span>
              {/* Active spinner */}
              {isCurrent && (
                <svg className="w-3.5 h-3.5 text-primary-500 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
