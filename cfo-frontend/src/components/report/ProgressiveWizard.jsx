// src/components/report/ProgressiveWizard.jsx
// Progressive Wizard - 5-step guided action planning flow
// Orchestrates: Objectives -> Actions -> Timelines -> Owners -> Review

import React, { useState, useCallback, useMemo } from 'react';
import { X, ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import ProgressStepper from './ProgressStepper';
import ObjectiveCardGrid from './ObjectiveCardGrid';
import ActionSelectionPanel from './ActionSelectionPanel';
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
  onComplete
}) {
  // Note: The API already sets objective_id on questions (derived from practice_id in backend)
  // So we can use gaps directly with their objective_id property
  // Current wizard step (1-5)
  const [currentStep, setCurrentStep] = useState(1);

  // Wizard state - internal until completion
  const [selectedObjectives, setSelectedObjectives] = useState(() => new Set());
  const [selectedActions, setSelectedActions] = useState(() => new Set());
  const [timelines, setTimelines] = useState(() => new Map());
  const [owners, setOwners] = useState(() => new Map());

  // Completing state
  const [completing, setCompleting] = useState(false);

  // Exit confirmation
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Check if there are unsaved changes
  const hasChanges = selectedObjectives.size > 0 || selectedActions.size > 0;

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1: OBJECTIVE SELECTION HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  const handleToggleObjective = useCallback((objectiveId) => {
    setSelectedObjectives(prev => {
      const next = new Set(prev);
      if (next.has(objectiveId)) {
        next.delete(objectiveId);
        // Also remove actions from this objective
        setSelectedActions(prevActions => {
          const nextActions = new Set(prevActions);
          gaps.forEach(g => {
            if (g.objective_id === objectiveId) {
              nextActions.delete(g.id);
            }
          });
          return nextActions;
        });
      } else {
        next.add(objectiveId);
      }
      return next;
    });
  }, [gaps]);

  const handleSelectAllObjectives = useCallback(() => {
    const objectivesWithGaps = new Set(gaps.map(g => g.objective_id));
    setSelectedObjectives(objectivesWithGaps);
  }, [gaps]);

  const handleClearAllObjectives = useCallback(() => {
    setSelectedObjectives(new Set());
    setSelectedActions(new Set());
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: ACTION SELECTION HANDLERS
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
  // STEP 3: TIMELINE ASSIGNMENT HANDLERS
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
  // STEP 4: OWNER ASSIGNMENT HANDLERS
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
  // STEP 5: COMPLETION HANDLER
  // ─────────────────────────────────────────────────────────────────────────

  const handleComplete = useCallback(async () => {
    setCompleting(true);

    // Build the action plan data
    const actionPlanData = [];
    selectedActions.forEach(actionId => {
      actionPlanData.push({
        question_id: actionId,
        timeline: timelines.get(actionId) || null,
        assigned_owner: owners.get(actionId) || null,
        status: 'planned'
      });
    });

    try {
      await onComplete(actionPlanData);
      // Close wizard on success
      onClose();
    } catch (err) {
      console.error('Failed to complete wizard:', err);
      alert('Failed to save action plan. Please try again.');
    } finally {
      setCompleting(false);
    }
  }, [selectedActions, timelines, owners, onComplete, onClose]);

  // ─────────────────────────────────────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────────────────────────────────────

  const canProceedFromStep = useMemo(() => ({
    1: selectedObjectives.size > 0,
    2: selectedActions.size > 0,
    3: true, // Can skip timeline (soft requirement)
    4: true, // Can skip owner (soft requirement)
    5: selectedActions.size > 0
  }), [selectedObjectives.size, selectedActions.size]);

  const handleNext = () => {
    if (currentStep < 5 && canProceedFromStep[currentStep]) {
      setCurrentStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(s => s - 1);
    }
  };

  const handleStepClick = (step) => {
    // Only allow clicking on completed/previous steps
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  // Get relevant gaps count for step 2
  const relevantGapsCount = gaps.filter(g => selectedObjectives.has(g.objective_id)).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm w-full max-w-5xl h-[85vh] flex flex-col border border-slate-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Guided Action Planning
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
        <div className="flex-1 overflow-hidden">
          {currentStep === 1 && (
            <ObjectiveCardGrid
              objectives={objectives}
              gaps={gaps}
              questions={questions}
              practices={practices}
              report={report}
              selectedObjectives={selectedObjectives}
              onToggleObjective={handleToggleObjective}
              onSelectAll={handleSelectAllObjectives}
              onClearAll={handleClearAllObjectives}
            />
          )}

          {currentStep === 2 && (
            <ActionSelectionPanel
              gaps={gaps}
              objectives={objectives}
              selectedObjectives={selectedObjectives}
              selectedActions={selectedActions}
              onToggleAction={handleToggleAction}
              onSelectAllInObjective={handleSelectAllInObjective}
              onClearAllInObjective={handleClearAllInObjective}
            />
          )}

          {currentStep === 3 && (
            <TimelineAssignmentPanel
              gaps={gaps}
              selectedActions={selectedActions}
              timelines={timelines}
              onTimelineChange={handleTimelineChange}
              onBulkTimelineAssign={handleBulkTimelineAssign}
            />
          )}

          {currentStep === 4 && (
            <OwnerAssignmentPanel
              gaps={gaps}
              selectedActions={selectedActions}
              timelines={timelines}
              owners={owners}
              onOwnerChange={handleOwnerChange}
              onBulkOwnerAssign={handleBulkOwnerAssign}
            />
          )}

          {currentStep === 5 && (
            <ReviewSummaryPanel
              gaps={gaps}
              objectives={objectives}
              selectedObjectives={selectedObjectives}
              selectedActions={selectedActions}
              timelines={timelines}
              owners={owners}
              onComplete={handleComplete}
              completing={completing}
            />
          )}
        </div>

        {/* Footer Navigation (not shown on step 5 - it has its own) */}
        {currentStep < 5 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-sm transition-colors ${
                currentStep === 1
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="text-sm text-slate-500">
              {currentStep === 1 && selectedObjectives.size > 0 && (
                <span>{selectedObjectives.size} objective{selectedObjectives.size !== 1 ? 's' : ''} selected</span>
              )}
              {currentStep === 2 && selectedActions.size > 0 && (
                <span>{selectedActions.size} of {relevantGapsCount} action{relevantGapsCount !== 1 ? 's' : ''} selected</span>
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

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
          <div className="bg-white p-6 rounded-sm max-w-sm border border-slate-300">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Exit without saving?
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  You have unsaved changes. Your progress will be lost if you exit now.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-sm hover:bg-slate-50 transition-colors"
              >
                Continue Editing
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  onClose();
                }}
                className="flex-1 px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-sm hover:bg-slate-900 transition-colors"
              >
                Exit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
