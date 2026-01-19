// src/hooks/useStepTransition.js
// Progress Tracking: Hook for updating workflow step on page navigation

import { useCallback } from 'react';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL;

// Valid workflow steps
export const WORKFLOW_STEPS = [
  'intro',
  'company_setup',
  'persona',
  'pillar_setup',
  'assessment',
  'calibration',
  'report',
  'finalized'
];

// Step display names for UI
export const STEP_NAMES = {
  intro: 'Introduction',
  company_setup: 'Company Setup',
  persona: 'Persona',
  pillar_setup: 'Pillar Setup',
  assessment: 'Assessment',
  calibration: 'Calibration',
  report: 'Report',
  finalized: 'Finalized'
};

/**
 * useStepTransition - Hook for updating workflow step
 *
 * Call this when navigating between workflow pages to update the current_step
 * in the database. This enables smart resume functionality.
 *
 * @returns {Object} { updateStep, updateProgress }
 */
export default function useStepTransition() {
  /**
   * Update the workflow step for a run
   *
   * @param {string} runId - The diagnostic run ID
   * @param {string} step - The new step (must be in WORKFLOW_STEPS)
   * @param {Object} options - Optional additional data
   * @param {string} options.last_visited_objective_id - Last objective visited (for assessment step)
   * @param {number} options.assessment_progress_pct - Assessment completion percentage (0-100)
   * @returns {Promise<boolean>} - Success status
   */
  const updateStep = useCallback(async (runId, step, options = {}) => {
    if (!runId || !step) {
      console.warn('[useStepTransition] Missing runId or step');
      return false;
    }

    if (!WORKFLOW_STEPS.includes(step)) {
      console.warn(`[useStepTransition] Invalid step: ${step}`);
      return false;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.warn('[useStepTransition] No auth session');
        return false;
      }

      const body = { step, ...options };

      const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/step`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.warn('[useStepTransition] Failed to update step:', errorData);
        return false;
      }

      return true;
    } catch (err) {
      // Fire-and-forget - don't block navigation on step update failures
      console.warn('[useStepTransition] Error updating step:', err);
      return false;
    }
  }, []);

  /**
   * Update assessment progress without changing step
   * Useful for tracking progress within the assessment phase
   *
   * @param {string} runId - The diagnostic run ID
   * @param {string} lastObjectiveId - Last visited objective ID
   * @param {number} progressPct - Assessment completion percentage (0-100)
   * @returns {Promise<boolean>} - Success status
   */
  const updateProgress = useCallback(async (runId, lastObjectiveId, progressPct) => {
    return updateStep(runId, 'assessment', {
      last_visited_objective_id: lastObjectiveId,
      assessment_progress_pct: Math.round(progressPct)
    });
  }, [updateStep]);

  return { updateStep, updateProgress };
}

/**
 * Get step index for comparing step positions
 * @param {string} step - Workflow step
 * @returns {number} - Index in workflow order
 */
export function getStepIndex(step) {
  return WORKFLOW_STEPS.indexOf(step);
}

/**
 * Check if step A is before step B in workflow
 * @param {string} stepA
 * @param {string} stepB
 * @returns {boolean}
 */
export function isStepBefore(stepA, stepB) {
  return getStepIndex(stepA) < getStepIndex(stepB);
}

/**
 * Get completed steps array based on current step
 * @param {string} currentStep - Current workflow step
 * @returns {string[]} - Array of completed step names
 */
export function getCompletedSteps(currentStep) {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex <= 0) return [];
  return WORKFLOW_STEPS.slice(0, currentIndex);
}
