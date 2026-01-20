# Navigation Principles - CFO Diagnostic Platform

**Version:** 1.1.0
**Created:** 2026-01-19
**Last Updated:** 2026-01-20
**Status:** Authoritative

This document establishes binding navigation principles for the CFO Diagnostic Platform. All new navigation code must adhere to these principles.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2026-01-20 | Added Principle 7 (Contextual UI Relevance), added Visual Cleanliness Rule to Principle 5 |
| 1.0.1 | 2026-01-19 | Added concurrent edit handling, clarified Locked state, fixed examples |
| 1.0.0 | 2026-01-19 | Initial version from navigation audit |

---

## Core Philosophy

Navigation in the CFO Diagnostic Platform follows a **guided journey** paradigm. Users progress through a structured diagnostic workflow, building toward a finalized executive report. The navigation system should feel like a well-organized consulting engagement: methodical, clear, and focused on outcomes.

---

## The Seven Navigation Principles

### Principle 1: Linear Progression with Free Review

**Rule:** Users cannot skip ahead, but can always go back to review.

**Implementation:**
- Forward navigation requires completion of the current step
- Backward navigation is always available to completed steps
- Review mode allows editing without resetting progress
- Sidebar shows completed steps as clickable (green checkmarks)
- Pending steps are grayed out and non-clickable

**Enforcement Points:**
| Location | File | Check |
|----------|------|-------|
| `AssessObjectivePage` | `src/components/assessment/AssessObjectivePage.jsx` | Guards `setup_completed_at` before assessment |
| `AssessObjectivePage` | `src/components/assessment/AssessObjectivePage.jsx` | Gates objective access to sequential order |
| `CalibrationPage` | `src/pages/CalibrationPage.jsx` | Requires assessment completion |
| `PillarReport` | `src/pages/PillarReport.jsx` | Requires calibration completion |
| `ExecutiveReportPage` | `src/pages/ExecutiveReportPage.jsx` | Requires `finalized_at` timestamp |

**Anti-patterns (DO NOT):**
- Allow URL manipulation to bypass guards
- Reset answers when navigating backward
- Block backward navigation for any reason
- Allow partial step completion to unlock next step

**Code Example - Correct Guard:**
```jsx
// In AssessObjectivePage - Guard setup completion
if (!run.setup_completed_at) {
  navigate(`/run/${runId}/setup/company`);
  return;
}
```

---

### Principle 2: Single Source of Truth

**Rule:** Navigation state derives from database, not local state.

**Implementation:**
- `current_step` field in `diagnostic_runs` drives sidebar highlighting
- `last_visited_objective_id` field drives resume navigation
- `finalized_at` timestamp drives executive report access
- `resume_path` is computed server-side for reliability

**Database Step Values (sequential):**
```
1. intro
2. company_setup
3. persona
4. pillar_setup
5. assessment
6. calibration
7. report
8. finalized
```

**Anti-patterns (DO NOT):**
- Use `localStorage` or `sessionStorage` for step state
- Maintain parallel step state in React context
- Compute "current step" from multiple sources
- Allow cached state to override fresh API data

**Code Example - Correct State Derivation:**
```jsx
// WorkflowSidebar derives state from runData
const { currentStep, completedSteps } = useMemo(() => {
  if (runData?.current_step) {
    return {
      currentStep: getSidebarStep(runData.current_step),
      completedSteps: getCompletedSidebarSteps(runData.current_step)
    };
  }
  return { currentStep: currentStepProp, completedSteps: completedStepsProp };
}, [runData, currentStepProp, completedStepsProp]);
```

**Concurrent Edit Handling (Multiple Tabs):**

When a user has multiple tabs open on the same run:

| Scenario | Behavior |
|----------|----------|
| Tab A saves answer, Tab B views | Tab B shows stale until refresh |
| Tab A advances step, Tab B on old step | Tab B can continue from old step (DB updates on save) |
| Tab A finalizes, Tab B on report | Tab B redirected to executive on next action |
| Both tabs edit same question | Last write wins (no conflict modal) |

**Rationale:** The platform is designed for single-user assessment sessions. Complex conflict resolution adds UX friction without meaningful benefit. Database timestamp ordering ensures data integrity.

**Future Consideration:** If collaborative assessment becomes a requirement, implement optimistic locking with version fields.

---

### Principle 3: URL = State (Deep Link Support)

**Rule:** Every meaningful state has a unique, bookmarkable URL.

**Implementation:**
- Run ID in path param: `/run/:runId/setup/company`
- Objective ID in path param: `/assess/objective/:objectiveId`
- Run ID passed as query param to assessment (legacy, documented)
- Review mode as query param: `?review=true`
- No hidden state required to render a page

**URL Patterns:**
| Route Type | Pattern |
|------------|---------|
| Setup | `/run/:runId/setup/{company\|persona\|pillar}` |
| Assessment | `/assess/objective/:objectiveId?runId=:runId` |
| Calibration | `/run/:runId/calibrate` |
| Report | `/report/:runId` |
| Executive | `/report/:runId/executive` |

**Technical Debt: Assessment URL Pattern**

The assessment route uses a query parameter (`?runId=`) while all other run-scoped routes use path parameters. This inconsistency exists because assessment pages were built before the `/run/:runId/...` convention was established.

| Current (Technical Debt) | Target Pattern |
|--------------------------|----------------|
| `/assess/objective/:objId?runId=:id` | `/run/:runId/assess/:objectiveId` |

**Migration Plan:**
1. Add new route pattern as primary
2. Keep legacy route with redirect for bookmarked URLs
3. Update all internal navigation to use new pattern
4. Monitor analytics for legacy route usage
5. Deprecate legacy route after 6 months

**Priority:** Medium (post-launch refactor, see NAV-005 in audit findings)

**Anti-patterns (DO NOT):**
- Require prior navigation to render a page
- Store critical state only in React state/context
- Use URLs that break on page refresh
- Omit run ID from any run-scoped route

**Code Example - Correct Deep Link:**
```jsx
// Assessment URL includes all required context
navigate(`/assess/objective/${nextObjective.id}?runId=${runId}`);
```

---

### Principle 4: Forgiving Navigation (Graceful Error Handling)

**Rule:** Errors guide users, never block them.

**Implementation:**
- Invalid URLs show branded 404 page with home link
- Invalid run IDs show "Assessment not found" message
- Network failures show retry button
- Session expiry preserves return path after re-login
- Auto-save failures are silent (logged, don't block)

**Error Recovery Matrix:**
| Error Type | User Action | System Response |
|------------|-------------|-----------------|
| Invalid route | Show 404 | Link to home |
| Invalid run ID | Show error | Link to dashboard |
| Network failure (page load) | Show banner | Retry button |
| Network failure (save) | Toast notification | Retry with exponential backoff |
| Auth expired | Redirect | Preserve return URL |
| Degraded connection | Continue | Queue saves, sync when stable |

**Auto-Save Failure Handling:**

Auto-save for question answers uses the following strategy:

1. **Optimistic UI** - Selection updates immediately in UI
2. **Background save** - API call fires asynchronously
3. **On failure** - Revert UI state, show toast "Answer not saved, please try again"
4. **Retry logic** - 3 attempts with exponential backoff (1s, 2s, 4s)
5. **Offline queue** - If navigator.onLine is false, queue saves for when connection returns

**Current vs Target State:**

| Behavior | Current State | Target State |
|----------|---------------|--------------|
| Optimistic UI | Implemented | Implemented |
| Background save | Implemented | Implemented |
| On failure | Silent revert + console.log | Toast notification + revert |
| Retry logic | None | 3 attempts with exponential backoff |
| Offline queue | None | Queue saves when navigator.onLine is false |

**Target Implementation (not yet implemented):**
```jsx
// TARGET STATE: Auto-save with retry and user feedback
const saveAnswer = async (questionId, value, attempt = 1) => {
  setAnswers(prev => ({ ...prev, [questionId]: value })); // Optimistic
  try {
    await api.saveAnswer(runId, questionId, value);
  } catch (err) {
    if (attempt < 3) {
      setTimeout(() => saveAnswer(questionId, value, attempt + 1), 1000 * attempt);
    } else {
      setAnswers(prev => { const u = {...prev}; delete u[questionId]; return u; }); // Revert
      toast.error('Answer not saved. Please try again.');
    }
  }
};
```

**Anti-patterns (DO NOT):**
- Show blank pages on error
- Display cryptic error codes
- Block the entire UI on recoverable errors
- Lose user's intended destination on auth redirect

**Code Example - Correct Error Handling:**
```jsx
// Error state with recovery action
if (error) {
  return (
    <div className="error-container">
      <p>{error.message}</p>
      <button onClick={() => navigate('/dashboard')}>
        Return to Dashboard
      </button>
    </div>
  );
}
```

---

### Principle 5: Consistent Mental Model

**Rule:** Navigation works the same everywhere.

**Implementation:**
- Back buttons always go "up" the workflow hierarchy
- Sidebar always shows accurate progress
- Step indicators use consistent terminology
- All completed steps are clickable
- All pending steps are grayed out

**Sidebar Step States:**
| State | Icon | Color | Clickable | When |
|-------|------|-------|-----------|------|
| Completed | Checkmark | Emerald | Yes | Step fully finished |
| Active | Filled circle | Blue | No | Currently on this step |
| Pending | Empty circle | Gray | No | Step not yet reached |
| Locked | Lock icon | Gray | No | Requires action to unlock |

**Locked State Explained:**

The "Locked" state applies specifically to the **Executive Report** step. It differs from "Pending" because:

- **Pending** = Sequential progression not yet reached (will unlock automatically when prior steps complete)
- **Locked** = Requires explicit user action to unlock (finalization of action plan)

```
Workflow: Setup > Assessment > Calibration > Report > [LOCKED] Executive Report

To unlock Executive Report:
1. User must be on Report step
2. User must select at least one action in Action Planning tab
3. User must assign timeline + owner to all selected actions
4. User must click "Generate Executive Report" and confirm
5. finalized_at timestamp is set in database
6. Executive Report step becomes "Completed" and accessible
```

The lock icon visually communicates that this step requires intentional action, not just progression through the workflow.

**Terminology Consistency:**
| Step | Sidebar Label | Button Labels |
|------|---------------|---------------|
| Setup | "Company Setup" | "Continue to Assessment" |
| Assessment | "Assessment" | "Previous Objective" / "Next Objective" |
| Calibration | "Priority Calibration" | "Back to Assessment" / "View Report" |
| Report | "Report Review & Action Planning" | "Back to Calibration" / "Generate Executive Report" |
| Executive | "Executive Report" | "Download PDF" / "Return to Home" |

**Anti-patterns (DO NOT):**
- Use different labels for the same step
- Show stale progress in sidebar
- Make only some completed steps clickable
- Use inconsistent icons or colors

**Visual Cleanliness Rule:**
- Prefer hiding over disabling for unreachable actions
- Keep button groups minimal (max 2-3 primary actions)
- Remove visual clutter - if something isn't actionable, it shouldn't be visible
- Exception: Sidebar steps can show pending state to communicate overall journey

---

### Principle 6: No Surprises

**Rule:** Navigation never triggers unexpected actions.

**Implementation:**
- Confirmation modal before finalization (irreversible)
- Auto-save is transparent (no data loss on navigate)
- No auto-redirect without user action
- Form data preserved on back navigation
- Clear indication when leaving will lose work

**Confirmation Required For:**
| Action | Consequence | Modal |
|--------|-------------|-------|
| Finalize | Locks action plan permanently | Required |
| Delete run | Removes all data | Required |
| Sign out | Ends session | Not required (can resume) |

**Auto-save Behavior:**
- Question answers save immediately on selection
- Setup form data saves on "Continue" button
- Calibration saves on slider release
- No "unsaved changes" warning needed (always saved)

**Anti-patterns (DO NOT):**
- Auto-navigate without user action
- Lose form data on navigation
- Perform destructive actions without confirmation
- Show confirmation for non-destructive actions

**Code Example - Correct Confirmation (using branded modal):**
```jsx
// Finalization requires explicit confirmation via branded modal
const [showFinalizeModal, setShowFinalizeModal] = useState(false);

const handleFinalizeClick = () => {
  setShowFinalizeModal(true);
};

const handleFinalizeConfirm = async () => {
  setShowFinalizeModal(false);
  await api.finalize(runId);
  navigate(`/report/${runId}/executive`);
};

// In render:
{showFinalizeModal && (
  <ConfirmationModal
    title="Generate Executive Report?"
    message="This will lock your action plan. You won't be able to make changes after this."
    confirmLabel="Generate Report"
    cancelLabel="Cancel"
    onConfirm={handleFinalizeConfirm}
    onCancel={() => setShowFinalizeModal(false)}
    variant="warning"
  />
)}
```

**Note:** Always use the platform's branded modal component (`ConfirmationModal`) rather than `window.confirm()` to maintain visual consistency per the Design System.

---

### Principle 7: Contextual UI Relevance

**Rule:** Only show controls that are actionable in the current state.

**Implementation:**
- Hide navigation buttons that lead to non-existent or inaccessible content
- On first page of a new diagnostic: no "View Report" button (report doesn't exist yet)
- On assessment page before completion: no "Calibrate" button
- Report buttons only appear after finalization
- Action buttons reflect actual available actions, not potential future actions

**Button Visibility Matrix:**
| Context | "Back" | "Next" | "View Report" | "Generate Executive" |
|---------|--------|--------|---------------|---------------------|
| First assessment question | Hidden | Visible | Hidden | Hidden |
| Mid-assessment | Visible | Visible | Hidden | Hidden |
| Calibration | Visible | Visible | Hidden | Hidden |
| Action Planning (incomplete) | Visible | N/A | Visible | Hidden |
| Action Planning (complete) | Visible | N/A | Visible | Visible |
| Executive Report | Hidden | N/A | N/A | N/A |

**Anti-patterns (DO NOT):**
- Show disabled buttons for future states (use hidden instead)
- Display "Coming Soon" placeholders
- Show buttons that lead to error pages
- Clutter the UI with conditional explanatory text about why buttons are hidden

**Code Example - Correct Contextual Visibility:**
```jsx
// Only show "Generate Executive Report" when action plan is complete
{isActionPlanComplete && (
  <Button onClick={handleGenerateExecutive}>
    Generate Executive Report
  </Button>
)}

// DO NOT do this (disabled button for future state):
// <Button disabled={!isActionPlanComplete}>Generate Executive Report</Button>
```

---

## Implementation Checklist

When implementing new navigation:

- [ ] **P1: Linear Progression** - Can user skip ahead? Can they go back?
- [ ] **P2: Single Source** - Where does state come from? Is it DB-backed?
- [ ] **P3: URL = State** - Does the URL work in a new tab?
- [ ] **P4: Forgiving** - What happens on error? Is there recovery?
- [ ] **P5: Consistent** - Does it match existing patterns? Is the UI clean?
- [ ] **P6: No Surprises** - Any destructive actions? Confirmation needed?
- [ ] **P7: Contextual UI** - Are all visible buttons actionable? Any buttons shown for future states?

---

## Testing Requirements

Every navigation path must be tested for:

1. **Happy Path** - Normal flow works
2. **Direct URL** - Bookmarked/shared URL loads correctly
3. **Browser Back** - Back button behaves correctly
4. **Refresh** - Page reload preserves state
5. **Auth Expired** - Re-login returns to correct page
6. **Invalid Input** - Bad URLs/IDs show helpful error

**Principle-to-Test Matrix:**

| Principle | Happy Path | Direct URL | Browser Back | Refresh | Auth Expired | Invalid Input |
|-----------|:----------:|:----------:|:------------:|:-------:|:------------:|:-------------:|
| P1: Linear Progression | X | X | X | | | X |
| P2: Single Source | X | | | X | | |
| P3: URL = State | X | X | | X | | X |
| P4: Forgiving | | | | | X | X |
| P5: Consistent | X | | X | | | |
| P6: No Surprises | X | | X | | | |
| P7: Contextual UI | X | X | | X | | |

**Key Test Scenarios by Principle:**

| Principle | Must-Test Scenario |
|-----------|-------------------|
| P1 | Direct URL to `/run/:id/calibrate` without setup → redirects to company setup |
| P2 | Complete step in Tab A, refresh Tab B → Tab B shows updated state |
| P3 | Bookmark assessment URL, close browser, reopen → lands on correct objective |
| P4 | Navigate to `/report/invalid-uuid` → shows "Run not found" with dashboard link |
| P5 | Click completed "Setup" step in sidebar from Report → navigates to company setup |
| P6 | Click "Generate Executive Report" → confirmation modal appears (not browser dialog) |
| P7 | First assessment question → no "Back" or "View Report" buttons visible |

---

## Governance

- **Owner:** Frontend Team
- **Review Required:** Any PR touching these files:
  - `src/App.jsx` - Route definitions
  - `src/components/ProtectedRoute.jsx` - Auth guard
  - `src/hooks/useStepTransition.js` - Step progression logic
  - `src/components/WorkflowSidebar.jsx` - Sidebar navigation
  - `src/components/assessment/AssessmentSidebar.jsx` - Assessment navigation
- **Exceptions:** Must be documented in PR description with rationale
- **Updates:** Changes to this document require team review

---

## Related Documents

- `spec/NAVIGATION_AUDIT_FINDINGS.md` - Current issues and fixes
- `spec/SPEC_v3.1.0.md` - Master system specification
- `spec/DESIGN_SYSTEM.md` - Visual design patterns
