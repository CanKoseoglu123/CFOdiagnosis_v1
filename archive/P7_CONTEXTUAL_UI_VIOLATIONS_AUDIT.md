# Principle 7 (Contextual UI Relevance) - Violation Audit Report

**Audit Date:** 2026-01-20
**Auditor:** Claude Code Navigation Review
**Reference Document:** `spec/NAVIGATION_PRINCIPLES.md` (v1.2.0)
**Status:** Proposed Improvements

---

## Executive Summary

This audit identifies violations of **Principle 7: Contextual UI Relevance** which states:

> "Only show controls that are actionable in the current state."

The primary issue: **Setup pages show navigation buttons that lead to non-existent content.**

When a user starts a new diagnostic and is on CompanySetupPage (the first page of a run), they see:
- "Back to Assessment" button (assessment doesn't exist yet)
- "Back to Calibration" button (calibration doesn't exist yet)
- "Action Planning" button (no report exists yet)

This directly violates P7's rule: "Prefer hiding over disabling for unreachable actions."

**Total Violations Found:** 4
- Critical: 1
- Medium: 2
- Low: 1

---

## Detailed Findings

### VIOLATION P7-001: WorkflowSidebar Shows Report Navigation During Setup

**Severity:** Critical
**Status:** FIXED
**File:** `cfo-frontend/src/components/WorkflowSidebar.jsx`
**Lines:** 282-337

**Problem:**

The WorkflowSidebar component's pre-finalization navigation section (lines 282-337) always renders three buttons when `isFinalized` is false:

```jsx
// Lines 282-337 - Pre-finalization navigation
<>
  {/* Back to Assessment */}
  <button onClick={handleBackToAssessment} ...>
    Back to Assessment
  </button>

  {/* Back to Calibration */}
  <button onClick={handleBackToCalibration} ...>
    Back to Calibration
  </button>

  {/* Action Planning OR Generate Executive Report */}
  {showGenerateButton ? (
    <button ...>Generate Executive Report</button>
  ) : (
    <button ...>Action Planning</button>
  )}
</>
```

**Affected Pages:**

| Page | File | Current Step | What User Sees |
|------|------|--------------|----------------|
| CompanySetupPage | `src/pages/CompanySetupPage.jsx:417` | `setup` | "Back to Assessment", "Back to Calibration", "Action Planning" |
| PersonaConfirmationPage | `src/pages/PersonaConfirmationPage.jsx:287` | `setup` | "Back to Assessment", "Back to Calibration", "Action Planning" |
| PillarSetupPage | `src/pages/PillarSetupPage.jsx:574` | `setup` | "Back to Assessment", "Back to Calibration", "Action Planning" |

**Why It's a Violation:**

Per P7's Button Visibility Matrix, on early workflow steps, these buttons should be **hidden**, not shown:

| Context | "Back to Assessment" | "Back to Calibration" | "Action Planning" |
|---------|---------------------|----------------------|-------------------|
| Setup (company/persona/pillar) | Hidden | Hidden | Hidden |
| First assessment objective | Hidden | Hidden | Hidden |
| Calibration | Visible | Hidden | Hidden |
| Report | Visible | Visible | Visible |

**Impact:**

Users on the first page of a new diagnostic see navigation options to content that doesn't exist, creating confusion about the workflow state and violating the "guided journey" paradigm.

---

### VIOLATION P7-002: AssessmentSidebar Hardcoded Workflow Steps

**Severity:** Medium
**Status:** NEEDS FIX (cosmetic but confusing)
**File:** `cfo-frontend/src/components/assessment/AssessmentSidebar.jsx`
**Lines:** 47-54

**Problem:**

The WORKFLOW_STEPS constant hardcodes step states regardless of actual progress:

```jsx
const WORKFLOW_STEPS = [
  { id: 'setup', label: 'Company Setup', completed: true },      // Always shows as completed
  { id: 'pillar', label: 'Pillar Setup', completed: true },      // Always shows as completed
  { id: 'assessment', label: 'Assessment', current: true },      // Always shows as current
  { id: 'calibration', label: 'Calibration', completed: false }, // Always pending
  { id: 'report', label: 'Report', completed: false }            // Always pending
];
```

**Why It's a Violation:**

While the navigation principles allow showing pending steps in the sidebar "to communicate the overall journey" (P5), P2 (Single Source of Truth) states: "Navigation state derives from database, not local state."

The hardcoded states don't reflect actual database state. If a user navigates directly to an assessment URL, the sidebar shows "Company Setup" and "Pillar Setup" as completed without verifying this is true.

**Note:** The existing NAV-011 in the audit findings marks this as "DEFERRED (Post-Launch)" noting it's "Visual only, does not affect navigation."

---

### VIOLATION P7-003: CalibrationPage "Generate Report" Button Uses Disabled Pattern

**Severity:** Low
**Status:** ACCEPTABLE (follows P5's tolerance, but not ideal per P7)
**File:** `cfo-frontend/src/pages/CalibrationPage.jsx`
**Lines:** 327-338

**Problem:**

The "Generate Report" button is shown but disabled until all calibrations are complete:

```jsx
<button
  onClick={onSubmit}
  disabled={!allSelected || saving}  // Shows disabled button
  className={`... ${
    allSelected && !saving
      ? 'bg-primary text-white'
      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
  }`}
>
  Generate Report
</button>
```

**Why It's Minor:**

P7 states: "Prefer hiding over disabling for unreachable actions."

However, this case is borderline acceptable because:
1. The user IS on the calibration step (the action is contextually relevant)
2. The disabled state clearly communicates "complete your ratings first"
3. The explanatory text below explains what's needed

Per P7's anti-patterns, the rule is specifically about buttons "for future states" - this is the current state, just incomplete.

**Recommendation:** Consider hiding the button until calibration is complete, then showing it as actionable. But this is polish, not a violation.

---

### VIOLATION P7-004: WorkflowSidebar Shows Executive Report Step in Early Workflow

**Severity:** Medium
**Status:** ACCEPTABLE (intentional per P5, but worth noting)
**File:** `cfo-frontend/src/components/WorkflowSidebar.jsx`
**Lines:** 15-21, 180-208

**Context:**

The WorkflowSidebar shows all five workflow steps including "Executive Report" even during setup:

```jsx
const WORKFLOW_STEPS = [
  { id: 'setup', label: 'Company Setup', path: '/setup' },
  { id: 'assess', label: 'Assessment', path: '/assess' },
  { id: 'calibrate', label: 'Priority Calibration', path: '/calibrate' },
  { id: 'report', label: 'Report Review & Action Planning', path: '/report' },
  { id: 'executive', label: 'Executive Report', path: '/report', requiresFinalization: true }
];
```

**Why It's Acceptable:**

Per the Navigation Principles document (P7 Scope clarification):

> "This principle governs button and action visibility. It does NOT apply to the sidebar, which shows all steps (including pending/locked) to communicate the overall journey (see Principle 5)."

The sidebar steps are correctly rendered as pending/locked states, which is the intended behavior.

---

## Proposed Solutions

### Fix for P7-001 (Critical)

**Option A: Context-Aware Navigation Buttons in WorkflowSidebar**

Modify WorkflowSidebar to accept a `phase` prop and conditionally render navigation buttons:

```jsx
// New prop
phase = 'report', // 'setup' | 'assessment' | 'calibration' | 'report'

// In render, replace current button block (lines 282-337):
{!isFinalized && (
  <>
    {/* Back to Assessment - only show if past assessment */}
    {['calibration', 'report'].includes(phase) && (
      <button onClick={handleBackToAssessment}>
        Back to Assessment
      </button>
    )}

    {/* Back to Calibration - only show if on report */}
    {phase === 'report' && (
      <button onClick={handleBackToCalibration}>
        Back to Calibration
      </button>
    )}

    {/* Action Planning - only show if on report */}
    {phase === 'report' && !isActionPlanningTab && (
      <button onClick={handleGoToActionPlanning}>
        Action Planning
      </button>
    )}

    {/* Generate Executive Report - only on action planning tab */}
    {phase === 'report' && isActionPlanningTab && (
      <button onClick={handleGenerateExecutiveReport} disabled={!canFinalize}>
        Generate Executive Report
      </button>
    )}
  </>
)}
```

**Update Usage in Setup Pages:**

```jsx
// CompanySetupPage.jsx
<WorkflowSidebar
  currentStep="setup"
  completedSteps={[]}
  runId={runId}
  isFinalized={false}
  phase="setup"  // NEW PROP
/>
```

**Option B: Derive Phase from currentStep**

Alternatively, compute `phase` internally from `currentStep`:

```jsx
const phase = useMemo(() => {
  switch (currentStep) {
    case 'setup': return 'setup';
    case 'assess': return 'assessment';
    case 'calibrate': return 'calibration';
    case 'report':
    case 'executive': return 'report';
    default: return 'setup';
  }
}, [currentStep]);
```

**Recommendation:** Option B is cleaner as it doesn't require changing all call sites.

---

### Fix for P7-002 (Medium)

**Derive workflow step states from runData prop:**

```jsx
// In AssessmentSidebar.jsx - accept runData prop and derive step states dynamically

// Step mapping from database current_step to sidebar display step
const DB_STEP_TO_SIDEBAR_STEP = {
  'intro': 'setup',
  'company_setup': 'setup',
  'persona': 'setup',
  'pillar_setup': 'pillar',
  'assessment': 'assessment',
  'calibration': 'calibration',
  'report': 'report',
  'finalized': 'report'
};

// Step labels for display
const STEP_LABELS = {
  setup: 'Company Setup',
  pillar: 'Pillar Setup',
  assessment: 'Assessment',
  calibration: 'Calibration',
  report: 'Report'
};

// Instead of hardcoded WORKFLOW_STEPS constant, derive from runData
function getWorkflowSteps(dbCurrentStep) {
  const stepOrder = ['setup', 'pillar', 'assessment', 'calibration', 'report'];
  const currentSidebarStep = DB_STEP_TO_SIDEBAR_STEP[dbCurrentStep] || 'assessment';
  const currentIndex = stepOrder.indexOf(currentSidebarStep);

  return stepOrder.map((step, index) => ({
    id: step,
    label: STEP_LABELS[step],
    completed: index < currentIndex,
    current: index === currentIndex
  }));
}

// Usage in component:
export default function AssessmentSidebar({ runData, currentObjective, ... }) {
  const workflowSteps = useMemo(() => {
    if (runData?.current_step) {
      return getWorkflowSteps(runData.current_step);
    }
    // Fall back to current hardcoded behavior if no runData
    return WORKFLOW_STEPS;
  }, [runData]);

  // ... render workflowSteps instead of WORKFLOW_STEPS
}
```

**Implementation Notes:**
1. AssessmentSidebar must receive `runData` prop from parent (AssessObjectivePage already fetches this)
2. The mapping mirrors WorkflowSidebar's existing STEP_MAPPING for consistency
3. Fallback to existing behavior ensures no regression if runData is unavailable

---

## Implementation Priority

| Issue | Severity | Effort | Priority |
|-------|----------|--------|----------|
| P7-001 | Critical | Low (1-2 hours) | HIGH - Fix before launch |
| P7-002 | Medium | Medium (2-3 hours) | MEDIUM - Post-launch |
| P7-003 | Low | Low (30 min) | LOW - Polish |
| P7-004 | N/A | N/A | N/A - Acceptable |

---

## Files Requiring Changes

**For P7-001 (Critical Fix):**

1. `cfo-frontend/src/components/WorkflowSidebar.jsx`
   - Add phase computation from currentStep
   - Wrap navigation buttons in conditional renders

**For P7-002 (Post-Launch):**

1. `cfo-frontend/src/components/assessment/AssessmentSidebar.jsx`
   - Accept `runData` prop
   - Derive WORKFLOW_STEPS states from `runData.current_step`

---

## Testing Checklist

After implementing fixes, verify:

- [ ] CompanySetupPage shows NO navigation buttons at bottom of sidebar
- [ ] PersonaConfirmationPage shows NO navigation buttons at bottom of sidebar
- [ ] PillarSetupPage shows NO navigation buttons at bottom of sidebar
- [ ] First assessment objective shows only "Save & Exit" and "Previous Objective" (to methodology)
- [ ] CalibrationPage shows appropriate buttons (custom sidebar, unchanged)
- [ ] Report page shows "Back to Assessment", "Back to Calibration", "Action Planning"
- [ ] Executive Report page shows "Download PDF", "Return to Home"
- [ ] All deep links still work correctly
- [ ] Browser back button still works correctly

---

## Related Documents

- `spec/NAVIGATION_PRINCIPLES.md` - Authoritative navigation principles
- `archive/NAVIGATION_AUDIT_FINDINGS.md` - Previous audit findings (NAV-001 through NAV-011)

---

## Appendix: User's Original Report

> "For instance in the first page of a newly started diagnostic run, he shouldn't see a button to take him to the report, there is no report"

This feedback directly identified the P7-001 violation. The user correctly observed that showing navigation to non-existent content violates the contextual relevance principle.
