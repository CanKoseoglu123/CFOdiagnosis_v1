// src/components/report/ProgressiveWizard.jsx
// Progressive Wizard - 4-step guided action planning flow
// Orchestrates: Actions (sequential sub-steps) -> Timelines -> Owners -> Review

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { X, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import ProgressStepper from './ProgressStepper';
import ActionSelectionSteps from './ActionSelectionSteps';
import TimelineAssignmentPanel from './TimelineAssignmentPanel';
import OwnerAssignmentPanel from './OwnerAssignmentPanel';
import ReviewSummaryPanel from './ReviewSummaryPanel';

export default function ProgressiveWizard({
  isOpen,
  onClose,
  gaps,
  questions,
  objectives,
  practices,
  report,
  onComplete,
  onSaveDraft,
  onReviewImpact,
  benchmarkData,
  importanceMap
}) {
  // Current wizard step (1-4)
  const [currentStep, setCurrentStep] = useState(1);

  // Current sub-step within Actions step (1-4: Pain Points, Quick Wins, Fix Basics, Objectives)
  const [currentSubStep, setCurrentSubStep] = useState(1);

  // Wizard state - single selection state for all steps
  const [selectedActions, setSelectedActions] = useState(() => new Set());
  const [timelines, setTimelines] = useState(() => new Map());
  const [owners, setOwners] = useState(() => new Map());

  // Completing state
  const [completing, setCompleting] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Lock to portrait on mobile/tablet; fallback overlay if lock unsupported (iOS)
  const [isLandscape, setIsLandscape] = useState(false);
  const [orientationLocked, setOrientationLocked] = useState(false);
  useEffect(() => {
    if (!isOpen) return;
    const isMobile = window.innerWidth < 1024 || window.innerHeight < 1024;
    if (!isMobile) return;

    // Try automatic orientation lock (works on Android Chrome)
    let locked = false;
    const tryLock = async () => {
      try {
        await screen.orientation.lock('portrait');
        locked = true;
        setOrientationLocked(true);
      } catch {
        // Lock not supported (iOS Safari) — use fallback overlay
        setOrientationLocked(false);
      }
    };
    tryLock();

    // Fallback: detect landscape for overlay prompt
    const check = () => {
      if (locked) return;
      const landscape = window.innerWidth > window.innerHeight;
      setIsLandscape(landscape);
    };
    check();
    window.addEventListener('resize', check);

    return () => {
      window.removeEventListener('resize', check);
      setIsLandscape(false);
      if (locked) {
        try { screen.orientation.unlock(); } catch {}
        setOrientationLocked(false);
      }
    };
  }, [isOpen]);

  // Check if there are unsaved changes
  const hasChanges = selectedActions.size > 0;

  // Derive selected objectives from selected actions
  const selectedObjectives = useMemo(() => {
    const objIds = new Set();
    selectedActions.forEach(actionId => {
      const action = gaps.find(g => g.id === actionId);
      if (action?.objective_id) {
        objIds.add(action.objective_id);
      }
    });
    return objIds;
  }, [selectedActions, gaps]);

  // Build gaps lookup map
  const gapsById = useMemo(() => {
    const map = new Map();
    gaps.forEach(g => map.set(g.id, g));
    return map;
  }, [gaps]);

  // ─────────────────────────────────────────────────────────────────────────
  // ACTION SELECTION HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  const handleToggleAction = useCallback((actionId) => {
    setSelectedActions(prev => {
      const next = new Set(prev);
      if (next.has(actionId)) {
        next.delete(actionId);
        // Clear timeline and owner when deselecting
        setTimelines(prevT => {
          const nextT = new Map(prevT);
          nextT.delete(actionId);
          return nextT;
        });
        setOwners(prevO => {
          const nextO = new Map(prevO);
          nextO.delete(actionId);
          return nextO;
        });
      } else {
        next.add(actionId);
      }
      return next;
    });
  }, []);

  const handleSelectAllInObjective = useCallback((objectiveId) => {
    setSelectedActions(prev => {
      const next = new Set(prev);
      gaps.filter(g => g.objective_id === objectiveId).forEach(g => next.add(g.id));
      return next;
    });
  }, [gaps]);

  const handleClearAllInObjective = useCallback((objectiveId) => {
    setSelectedActions(prev => {
      const next = new Set(prev);
      gaps.filter(g => g.objective_id === objectiveId).forEach(g => {
        next.delete(g.id);
        setTimelines(prevT => {
          const nextT = new Map(prevT);
          nextT.delete(g.id);
          return nextT;
        });
        setOwners(prevO => {
          const nextO = new Map(prevO);
          nextO.delete(g.id);
          return nextO;
        });
      });
      return next;
    });
  }, [gaps]);

  // ─────────────────────────────────────────────────────────────────────────
  // TIMELINE ASSIGNMENT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  const handleTimelineChange = useCallback((actionId, value) => {
    setTimelines(prev => {
      const next = new Map(prev);
      if (value) {
        next.set(actionId, value);
      } else {
        next.delete(actionId);
      }
      return next;
    });
  }, []);

  const handleBulkTimelineAssign = useCallback((timeline) => {
    setTimelines(prev => {
      const next = new Map(prev);
      selectedActions.forEach(actionId => {
        if (!next.has(actionId)) {
          next.set(actionId, timeline);
        }
      });
      return next;
    });
  }, [selectedActions]);

  // ─────────────────────────────────────────────────────────────────────────
  // OWNER ASSIGNMENT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  const handleOwnerChange = useCallback((actionId, value) => {
    setOwners(prev => {
      const next = new Map(prev);
      if (value && value.trim()) {
        next.set(actionId, value.trim());
      } else {
        next.delete(actionId);
      }
      return next;
    });
  }, []);

  const handleBulkOwnerAssign = useCallback((owner) => {
    setOwners(prev => {
      const next = new Map(prev);
      selectedActions.forEach(actionId => {
        if (!next.get(actionId)?.trim()) {
          next.set(actionId, owner);
        }
      });
      return next;
    });
  }, [selectedActions]);

  // ─────────────────────────────────────────────────────────────────────────
  // HELPER: Build action plan data from current selections
  // ─────────────────────────────────────────────────────────────────────────

  const buildActionPlanData = useCallback(() => {
    const actionPlanData = [];
    selectedActions.forEach(actionId => {
      actionPlanData.push({
        question_id: actionId,
        timeline: timelines.get(actionId) || null,
        assigned_owner: owners.get(actionId) || null,
        status: 'planned'
      });
    });
    return actionPlanData;
  }, [selectedActions, timelines, owners]);

  // ─────────────────────────────────────────────────────────────────────────
  // COMPLETION HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  const handleComplete = useCallback(async () => {
    setCompleting(true);
    const actionPlanData = buildActionPlanData();

    try {
      await onComplete(actionPlanData);
      onClose();
    } catch (err) {
      console.error('Failed to complete wizard:', err);
      alert('Failed to save action plan. Please try again.');
    } finally {
      setCompleting(false);
    }
  }, [buildActionPlanData, onComplete, onClose]);

  // "Review Impact" - saves draft and scrolls to simulator
  const handleReviewImpact = useCallback(async () => {
    setCompleting(true);
    const actionPlanData = buildActionPlanData();

    try {
      if (onSaveDraft) {
        await onSaveDraft(actionPlanData);
      }
      if (onReviewImpact) {
        onReviewImpact();
      }
      onClose();
    } catch (err) {
      console.error('Failed to save draft:', err);
      alert('Failed to save draft. Please try again.');
    } finally {
      setCompleting(false);
    }
  }, [buildActionPlanData, onSaveDraft, onReviewImpact, onClose]);

  // ─────────────────────────────────────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────────────────────────────────────

  const canProceedFromStep = useMemo(() => ({
    1: selectedActions.size > 0,  // Must select at least 1 action
    2: true,                       // Timelines optional
    3: true,                       // Owners optional
    4: selectedActions.size > 0   // Review requires actions
  }), [selectedActions.size]);

  const handleNext = () => {
    if (currentStep < 4 && canProceedFromStep[currentStep]) {
      setCurrentStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      // If going back to Actions step, start at sub-step 4 (Objectives)
      if (newStep === 1) {
        setCurrentSubStep(4);
      }
    }
  };

  const handleStepClick = (step) => {
    // Only allow clicking on completed/previous steps
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  const handleClose = async () => {
    // Auto-save draft if there are changes
    if (hasChanges && onSaveDraft) {
      const actionPlanData = buildActionPlanData();
      try {
        await onSaveDraft(actionPlanData);
      } catch (err) {
        console.error('Failed to auto-save draft:', err);
      }
    }
    onClose();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 lg:p-4 touch-none">
      {/* Landscape rotation prompt — fallback when orientation lock not supported (iOS) */}
      {isLandscape && !orientationLocked && (
        <div className="absolute inset-0 z-10 bg-slate-900 flex flex-col items-center justify-center text-center px-8">
          <RotateCcw className="w-12 h-12 text-slate-400 mb-4 animate-pulse" />
          <h3 className="text-lg font-semibold text-white mb-2">Rotate to Portrait</h3>
          <p className="text-sm text-slate-400 mb-6">
            The Action Wizard works best in portrait mode. Please rotate your device.
          </p>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 border border-slate-600 rounded-sm hover:bg-slate-800 transition-colors"
          >
            Close Wizard
          </button>
        </div>
      )}
      <div className="bg-white rounded-none lg:rounded-sm w-full max-w-5xl h-full lg:h-[85vh] flex flex-col border-0 lg:border border-slate-300 touch-auto overscroll-contain">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 lg:px-6 lg:py-4 border-b border-slate-200">
          <div className="min-w-0">
            <h2 className="text-sm lg:text-lg font-semibold text-slate-800">
              <span className="lg:hidden">Step {currentStep}/4 · {['Actions', 'Timelines', 'Owners', 'Review'][currentStep - 1]}</span>
              <span className="hidden lg:inline">Action Planning Wizard</span>
            </h2>
            <p className="text-sm text-slate-500 mt-0.5 hidden lg:block">
              Build your action plan step by step
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-sm transition-colors flex-shrink-0 hidden lg:block"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
          <button
            onClick={handleClose}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-sm transition-colors flex-shrink-0 lg:hidden"
          >
            <X className="w-4 h-4" />
            Exit
          </button>
        </div>

        {/* Progress Stepper - hidden on mobile, step shown in header instead */}
        <div className="hidden lg:block">
          <ProgressStepper
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Step Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {currentStep === 1 && (
            <ActionSelectionSteps
              gaps={gaps}
              practices={practices}
              objectives={objectives}
              report={report}
              selectedActions={selectedActions}
              onToggleAction={handleToggleAction}
              onSelectAllInObjective={handleSelectAllInObjective}
              onClearAllInObjective={handleClearAllInObjective}
              benchmarkData={benchmarkData}
              importanceMap={importanceMap}
              questions={questions}
              currentSubStep={currentSubStep}
              onSubStepChange={setCurrentSubStep}
              onContinueToTimelines={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <TimelineAssignmentPanel
              gaps={gaps}
              selectedActions={selectedActions}
              timelines={timelines}
              onTimelineChange={handleTimelineChange}
              onBulkTimelineAssign={handleBulkTimelineAssign}
            />
          )}

          {currentStep === 3 && (
            <OwnerAssignmentPanel
              gaps={gaps}
              selectedActions={selectedActions}
              timelines={timelines}
              owners={owners}
              onOwnerChange={handleOwnerChange}
              onBulkOwnerAssign={handleBulkOwnerAssign}
            />
          )}

          {currentStep === 4 && (
            <ReviewSummaryPanel
              gaps={gaps}
              objectives={objectives}
              selectedObjectives={selectedObjectives}
              selectedActions={selectedActions}
              timelines={timelines}
              owners={owners}
              onComplete={handleComplete}
              onReviewImpact={handleReviewImpact}
              completing={completing}
            />
          )}
        </div>

        {/* Footer Navigation (not shown on step 1 - it has its own, or step 4 - it has its own) */}
        {currentStep > 1 && currentStep < 4 && (
          <div className="px-4 py-3 lg:px-6 lg:py-4 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-2 lg:px-4 text-sm font-medium rounded-sm transition-colors text-slate-600 hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="text-sm text-slate-500 hidden lg:block">
              {selectedActions.size > 0 && (
                <span>{selectedActions.size} action{selectedActions.size !== 1 ? 's' : ''} selected</span>
              )}
            </div>

            <button
              onClick={handleNext}
              disabled={!canProceedFromStep[currentStep]}
              className={`flex items-center gap-2 px-3 py-2 lg:px-4 text-sm font-medium rounded-sm transition-colors ${
                canProceedFromStep[currentStep]
                  ? 'bg-slate-800 text-white hover:bg-slate-900'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
