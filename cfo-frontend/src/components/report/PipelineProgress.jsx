// src/components/report/PipelineProgress.jsx
// VS-32c: Pipeline progress indicator for AI interpretation stages
// Shows current stage in the generate → assess → clarify → rewrite loop

import React from 'react';
import {
  Sparkles,
  CheckCircle,
  ShieldCheck,
  MessageCircleQuestion,
  RefreshCw,
  AlertTriangle,
  Loader2
} from 'lucide-react';

/**
 * VS-32c PipelineProgress Component
 *
 * Displays the AI interpretation pipeline stages:
 * 1. Generating - Initial AI draft creation
 * 2. Quality Check - Heuristics validation
 * 3. Assessment - Critic evaluates gaps
 * 4. Clarifying - Waiting for user answers (optional)
 * 5. Refining - Rewriting with new context
 * 6. Complete - Final report ready
 *
 * Props:
 * - currentStage: VS32cPipelineStage from backend
 * - loopRound: Current loop iteration (1 or 2)
 * - errorMessage: Optional error to display
 * - onRetry: Optional retry callback for failed state
 */

// Map backend stages to display steps
const STAGE_CONFIG = {
  pending: { step: 0, label: 'Starting...' },
  generating: { step: 1, label: 'Generating Insights' },
  heuristics: { step: 2, label: 'Quality Check' },
  critic: { step: 3, label: 'Assessing Quality' },
  awaiting_answers: { step: 4, label: 'Your Input Needed' },
  rewriting: { step: 5, label: 'Refining Insights' },
  completed: { step: 6, label: 'Complete' },
  failed: { step: -1, label: 'Error' },
};

// Display steps in order
const STEPS = [
  { id: 'generating', label: 'Generate', icon: Sparkles },
  { id: 'heuristics', label: 'Validate', icon: ShieldCheck },
  { id: 'critic', label: 'Assess', icon: CheckCircle },
  { id: 'awaiting_answers', label: 'Clarify', icon: MessageCircleQuestion },
  { id: 'rewriting', label: 'Refine', icon: RefreshCw },
];

export default function PipelineProgress({
  currentStage = 'pending',
  loopRound = 1,
  errorMessage,
  onRetry
}) {
  const stageConfig = STAGE_CONFIG[currentStage] || STAGE_CONFIG.pending;
  const currentStepIndex = stageConfig.step;
  const isFailed = currentStage === 'failed';
  const isComplete = currentStage === 'completed';

  // Determine step status
  const getStepStatus = (stepIndex) => {
    if (isFailed) return 'error';
    if (isComplete) return 'completed';
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${
              isFailed
                ? 'bg-red-100'
                : isComplete
                  ? 'bg-green-100'
                  : 'bg-primary-100'
            }`}>
              {isFailed ? (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              ) : isComplete ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-navy-900">
                AI Interpretation
                {loopRound > 1 && !isComplete && !isFailed && (
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    (Refinement Round {loopRound})
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {stageConfig.label}
              </p>
            </div>
          </div>

          {/* Estimated time for active states */}
          {!isComplete && !isFailed && currentStage !== 'awaiting_answers' && (
            <span className="text-xs text-slate-400">
              ~15-30 seconds
            </span>
          )}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-6 py-5">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const status = getStepStatus(index + 1);
            const Icon = step.icon;
            const isLast = index === STEPS.length - 1;

            return (
              <React.Fragment key={step.id}>
                {/* Step indicator */}
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-sm flex items-center justify-center transition-colors ${
                    status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : status === 'active'
                        ? 'bg-primary-100 text-primary-700'
                        : status === 'error'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-slate-100 text-slate-400'
                  }`}>
                    {status === 'active' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : status === 'completed' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className={`mt-2 text-[10px] font-medium uppercase tracking-wide ${
                    status === 'completed'
                      ? 'text-green-700'
                      : status === 'active'
                        ? 'text-primary-700'
                        : 'text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    status === 'completed'
                      ? 'bg-green-300'
                      : 'bg-slate-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Error state */}
      {isFailed && (
        <div className="px-6 py-4 bg-red-50 border-t border-red-100">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                Interpretation Failed
              </p>
              <p className="text-xs text-red-600 mt-1">
                {errorMessage || 'An error occurred during AI interpretation. Please try again.'}
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-3 px-4 py-2 text-xs font-semibold text-red-700 bg-white border border-red-200 rounded-sm hover:bg-red-50 transition-colors"
                >
                  Retry Interpretation
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Awaiting answers message */}
      {currentStage === 'awaiting_answers' && (
        <div className="px-6 py-3 bg-amber-50 border-t border-amber-100">
          <p className="text-xs text-amber-700 flex items-center gap-2">
            <MessageCircleQuestion className="w-3 h-3" />
            Please answer the questions above to improve your personalized insights
          </p>
        </div>
      )}

      {/* Complete state */}
      {isComplete && (
        <div className="px-6 py-3 bg-green-50 border-t border-green-100">
          <p className="text-xs text-green-700 flex items-center gap-2">
            <CheckCircle className="w-3 h-3" />
            Your personalized insights are ready
          </p>
        </div>
      )}
    </div>
  );
}
