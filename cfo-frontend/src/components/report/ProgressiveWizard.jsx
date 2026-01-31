// src/components/report/ProgressiveWizard.jsx
// Progressive Wizard - 4-step guided action planning flow
// Orchestrates: Actions (sequential sub-steps) -> Timelines -> Owners -> Review

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 touch-none">
      <div className="bg-white rounded-sm w-full max-w-5xl h-[85vh] flex flex-col border border-slate-300 touch-auto overscroll-contain">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Action Planning Wizard
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Build your action plan step by step
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-sm transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Progress Stepper */}
        <ProgressStepper
          currentStep={currentStep}
          onStepClick={handleStepClick}
        />

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
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-sm transition-colors text-slate-600 hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="text-sm text-slate-500">
              {selectedActions.size > 0 && (
                <span>{selectedActions.size} action{selectedActions.size !== 1 ? 's' : ''} selected</span>
              )}
            </div>

            <button
              onClick={handleNext}
              disabled={!canProceedFromStep[currentStep]}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-sm transition-colors ${
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
