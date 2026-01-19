# Navigation Audit Findings Report

**Audit Date:** 2026-01-19
**Auditor:** Navigation Audit Process
**Codebase Version:** As of commit d325e88 (main branch)

---

## Executive Summary

This document records all navigation issues identified during the comprehensive audit of the CFO Diagnostic Platform. Issues are categorized by severity and include file locations with line numbers for easy reference.

**Total Issues Found:** 11
- Critical: 3
- High: 5
- Medium: 2
- Low: 1

---

## Issue Catalog

### CRITICAL Issues (Must Fix Before Launch)

#### NAV-001: No 404 Catch-All Route
**Severity:** Critical
**File:** `cfo-frontend/src/App.jsx`
**Lines:** 182-279 (Routes definition)

**Problem:** The route configuration has no catch-all route for invalid URLs. Users navigating to non-existent routes will see a blank page or React error rather than a helpful 404 page.

**Expected Behavior:** Invalid routes should show a branded 404 page with navigation options back to the home page or dashboard.

**Current Behavior:** Blank page or React error message.

**Fix Required:** Add a catch-all route at the end of the Routes configuration:
```jsx
<Route path="*" element={<NotFoundPage />} />
```

**Related Test:**
- [ ] `/invalid-route` → Should show 404 page
- [ ] `/report/invalid-uuid` → Should show "Run not found" error

---

#### NAV-002: ProtectedRoute Does Not Preserve Return URL
**Severity:** Critical
**File:** `cfo-frontend/src/components/ProtectedRoute.jsx`
**Line:** 24-26

**Problem:** When unauthenticated users access protected routes, they are redirected to `/login` without preserving the original destination. After login, they return to "/" instead of their intended page.

**Current Code:**
```jsx
if (!isAuthenticated) {
  return <Navigate to="/login" replace />
}
```

**Expected Behavior:** Preserve the intended URL and redirect back after successful login.

**Fix Required:** Store intended path and pass to login:
```jsx
if (!isAuthenticated) {
  return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
}
```

Then in LoginPage (App.jsx:107), read the state and navigate to the preserved path:
```jsx
const location = useLocation();
const from = location.state?.from || '/dashboard';
// After successful sign in:
navigate(from, { replace: true });
```

---

#### NAV-003: WorkflowSidebar Uses Legacy Assessment Route
**Severity:** Critical
**File:** `cfo-frontend/src/components/WorkflowSidebar.jsx`
**Line:** 129

**Problem:** The `handleBackToAssessment` function navigates to the legacy route `/assess/foundation?runId=` instead of the current objective-based route.

**Current Code:**
```jsx
function handleBackToAssessment() {
  navigate(`/assess/foundation?runId=${runId}`);
}
```

**Expected Behavior:** Should navigate to the objective-based assessment route.

**Fix Required:**
```jsx
function handleBackToAssessment() {
  const targetObjective = runData?.last_visited_objective_id || 'obj_budget_discipline';
  navigate(`/assess/objective/${targetObjective}?runId=${runId}`);
}
```

**Note:** The legacy route does have a redirect (App.jsx:237), so this will work but causes an unnecessary redirect hop.

---

### HIGH Issues (Should Fix Before Launch)

#### NAV-004: LoginPage Always Navigates to Home After Sign In
**Severity:** High
**File:** `cfo-frontend/src/App.jsx`
**Line:** 107

**Problem:** After successful login, users are always redirected to "/" (landing page) rather than a more useful destination like the dashboard or their previously intended page.

**Current Code:**
```jsx
await signIn(email, password)
navigate('/')
```

**Expected Behavior:** After login, users should be taken to:
1. Their intended destination (if coming from a protected route), OR
2. The dashboard (`/dashboard`) as a sensible default

**Fix Required:** Integrate with NAV-002 fix to read `location.state.from`:
```jsx
const location = useLocation();
await signIn(email, password);
const destination = location.state?.from || '/dashboard';
navigate(destination, { replace: true });
```

---

#### NAV-005: URL Structure Inconsistency
**Severity:** High
**File:** `cfo-frontend/src/App.jsx`
**Lines:** 231, 209-224, 251

**Problem:** The URL structure is inconsistent between assessment routes and other routes:

| Route Type | Pattern | Example |
|------------|---------|---------|
| Setup pages | Path param | `/run/:runId/setup/company` |
| Assessment | **Query param** | `/assess/objective/:objId?runId=:id` |
| Calibration | Path param | `/run/:runId/calibrate` |
| Report | Path param | `/report/:runId` |

**Impact:**
- Developer confusion when building navigation
- Inconsistent URL patterns make bookmarking harder to predict
- Query params are less RESTful and can be accidentally lost

**Expected Behavior:** All run-scoped routes should use consistent path params.

**Recommended Fix:** Migrate assessment routes to `/run/:runId/assess/:objectiveId`

**Note:** This is a larger refactor and may be deferred post-launch, but the inconsistency should be documented.

---

#### NAV-006: No Server-Side Validation for Finalization
**Severity:** High
**File:** Multiple (ActionPlanTab.jsx, backend API)

**Problem:** Per CLAUDE.md documentation, timeline/owner validation for finalization is currently client-side only:

> "Timeline/owner validation is currently client-side only. Server-side validation planned for future release."

**Impact:** A malicious or buggy client could bypass finalization requirements by directly calling the API.

**Expected Behavior:** The `/diagnostic-runs/:id/finalize` endpoint should validate:
1. At least one action is selected
2. All selected actions have a timeline
3. All selected actions have an owner

**Fix Required:** Add server-side validation in the finalize endpoint.

**Cross-Domain Note:** This issue spans navigation and API security.
The fix is backend code, not navigation components. Track in security
audit if one exists, but keep here for completeness.

---

#### NAV-009: PillarReport Error Handling Lacks Recovery Action
**Severity:** High
**File:** `cfo-frontend/src/pages/PillarReport.jsx`
**Lines:** 292-300
**Principle Violated:** P4 (Forgiving Navigation)

**Problem:** When report loading fails (network error, invalid run ID, etc.), the error state shows only red error text with no recovery action or navigation link.

**Current Code:**
```jsx
if (error || !report) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-red-600">
        {error || 'Failed to load report'}
      </div>
    </div>
  );
}
```

**Expected Behavior:** Error state should include actionable recovery options (link to dashboard, retry button).

**Fix Required:**
```jsx
if (error || !report) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-600 mb-4">{error || 'Failed to load report'}</div>
        <button onClick={() => navigate('/dashboard')} className="...">
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
```

---

#### NAV-010: CalibrationPage Missing Assessment Completion Gate
**Severity:** High
**File:** `cfo-frontend/src/pages/CalibrationPage.jsx`
**Lines:** 370-410 (fetchData function)
**Principle Violated:** P1 (Linear Progression)

**Problem:** CalibrationPage does not verify that the assessment phase is complete before rendering. A user could potentially access `/run/:id/calibrate` directly without completing all objectives.

**Current Behavior:** Page fetches calibration data from API and renders immediately. No client-side gate checking `assessment_completed_at` or similar.

**Expected Behavior:** Before rendering, verify assessment is complete. If not, redirect to the appropriate objective or show error.

**Fix Required:** Add gate check after fetching run data:
```jsx
// After fetching run data, check assessment completion
if (!run.assessment_completed_at) {
  // Redirect to assessment or show error
  navigate(`/assess/objective/obj_budget_discipline?runId=${runId}`);
  return;
}
```

**Note:** The API may already enforce this (returning error for incomplete assessment), but client-side gate provides better UX with immediate redirect.

---

### MEDIUM Issues

#### NAV-007: Inconsistent Back Navigation from First Objective
**Severity:** Medium
**Files:**
- `cfo-frontend/src/components/assessment/AssessObjectivePage.jsx` (line 421)
- `cfo-frontend/src/components/assessment/AssessmentSidebar.jsx` (line 93)
**Principle Violated:** P5 (Consistent Mental Model)

**Problem:** Two different `handleBack` functions exist with different navigation targets for the first objective:

| Component | Back Destination | Code |
|-----------|------------------|------|
| AssessObjectivePage | `/run/${runId}/setup/pillar?review=true` | Line 421 |
| AssessmentSidebar | `/run/${runId}/intro` | Line 93 |

The page uses `AssessObjectivePage.handleBack` for the navigation buttons, so users go to Pillar Setup. But if AssessmentSidebar's back handler were ever used, it would go to Intro instead.

**Expected Behavior:** All back navigation from first objective should go to the same destination consistently.

**Fix Required:** Align both handlers to the same destination. Recommendation: Go to Pillar Setup (the immediately preceding step) for consistency with the workflow.

---

#### NAV-011: AssessmentSidebar Hardcoded Workflow Steps
**Severity:** Medium
**File:** `cfo-frontend/src/components/assessment/AssessmentSidebar.jsx`
**Lines:** 48-54
**Principle Violated:** P5 (Consistent Mental Model)

**Problem:** The WORKFLOW_STEPS constant has hardcoded `completed: true/false` and `current: true` values that never change based on actual progress:

```jsx
const WORKFLOW_STEPS = [
  { id: 'setup', label: 'Company Setup', completed: true },
  { id: 'pillar', label: 'Pillar Setup', completed: true },
  { id: 'assessment', label: 'Assessment', current: true },
  { id: 'calibration', label: 'Calibration', completed: false },
  { id: 'report', label: 'Report', completed: false }
];
```

**Impact:** Sidebar always shows Setup and Pillar Setup as completed, Assessment as current, regardless of actual state. This could mislead users about their actual progress.

**Expected Behavior:** Workflow steps should derive state from the run's `current_step` field, similar to how WorkflowSidebar does it.

**Fix Required:** Accept `runData` prop and derive step states dynamically, or remove the workflow steps section from AssessmentSidebar if objectives progress is sufficient.

---

### LOW Issues

#### NAV-008: Workflow Steps Don't Include Intro
**Severity:** Low
**File:** `cfo-frontend/src/components/WorkflowSidebar.jsx`
**Lines:** 15-21

**Problem:** The WORKFLOW_STEPS constant shows "Company Setup" as the first step, but the actual flow starts with IntroPage (`/run/:id/intro`).

**Current Steps:**
```jsx
const WORKFLOW_STEPS = [
  { id: 'setup', label: 'Company Setup', path: '/setup' },
  { id: 'assess', label: 'Assessment', path: '/assess' },
  // ...
];
```

**Impact:** Low - The intro page is a brief methodology overview and doesn't have significant user state. The STEP_MAPPING (line 24-33) correctly maps 'intro' to 'setup', so the sidebar state is accurate.

**Recommendation:** Consider whether Intro should be shown as a separate step or if "Setup" should encompass all setup phases (intro → company → persona → pillar).

---

## Verification Checklist

**Legend:**
- [x] Verified working during audit
- [ ] Needs fix (see issue reference)
- [ ] Needs verification (not yet tested)

### Route Integrity (P3, P4)
- [ ] `/invalid-route` → Shows 404 page (NAV-001: needs NotFoundPage)
- [ ] `/run/invalid-uuid/setup/company` → Shows "Run not found" error with recovery link (needs verification)
- [x] `/assess/foundation?runId=xxx` → Redirects to objective route
- [ ] `/report/xxx` (unauthenticated) → Redirects to login with return URL preserved (NAV-002: needs fix)

### Linear Flow Enforcement (P1)
- [ ] Direct `/run/:id/calibrate` without assessment → Redirects to assessment (NAV-010: needs fix)
- [ ] Direct `/report/:id` without calibration → Should redirect (needs verification)
- [x] Click locked objective in AssessmentSidebar → No navigation
- [x] Access `/report/:id/executive` before finalization → Redirects to report

### Backward Navigation (P5)
- [ ] Back from Company Setup → Intro (needs verification)
- [x] Back from first Objective → Pillar Setup (NAV-007: inconsistent with sidebar, but working)
- [ ] Back from Report → Assessment via sidebar button (NAV-003: needs fix)
- [ ] Browser back button preserves form data (needs verification)

### Error Handling (P4)
- [ ] PillarReport error state → Shows dashboard link (NAV-009: needs fix)
- [x] CalibrationPage error state → Shows home link
- [x] ExecutiveReportPage error state → Shows error message

### Smart Resume (P2)
- [x] Dashboard "Resume" button uses `resume_path`
- [x] Landing page smart resume banner appears for in-progress runs
- [x] Resume path targets correct objective/step

### Sidebar Accuracy (P5)
- [x] WorkflowSidebar derives state from runData.current_step
- [ ] AssessmentSidebar workflow steps reflect actual progress (NAV-011: hardcoded, needs fix)
- [x] Completed steps are clickable and navigate correctly

---

## Fix Priority Matrix

| Issue | Severity | Effort | Priority | Sprint | Principle |
|-------|----------|--------|----------|--------|-----------|
| NAV-001 | Critical | Low | P0 | Current | P4 |
| NAV-002 | Critical | Medium | P0 | Current | P4 |
| NAV-003 | Critical | Low | P0 | Current | P3 |
| NAV-004 | High | Low | P1 | Current | P4 |
| NAV-005 | High | High | P2 | Post-Launch | P3 |
| NAV-006 | High | Medium | P1 | Current | P1 |
| NAV-009 | High | Low | P1 | Current | P4 |
| NAV-010 | High | Medium | P1 | Current | P1 |
| NAV-007 | Medium | Low | P2 | Post-Launch | P5 |
| NAV-011 | Medium | Medium | P2 | Post-Launch | P5 |
| NAV-008 | Low | Low | P3 | Backlog | P5 |

---

## Recommended Implementation Order

**Phase 1 - Critical (P0):**
1. **NAV-001** - Add 404 page (30 min)
2. **NAV-003** - Fix legacy route in sidebar (5 min)
3. **NAV-002 + NAV-004** - Implement return URL preservation (2 hr)
   *Note: Allow buffer for edge cases (OAuth callbacks, query param encoding)*

**Phase 2 - High Priority (P1):**
4. **NAV-009** - Add recovery action to PillarReport error state (15 min)
5. **NAV-010** - Add assessment completion gate to CalibrationPage (30 min)
6. **NAV-006** - Add server-side finalization validation (2 hr)

**Phase 3 - Medium Priority (P2, Post-Launch):**
7. **NAV-007** - Align back navigation handlers (15 min)
8. **NAV-011** - Make AssessmentSidebar workflow steps dynamic (1 hr)
9. **NAV-005** - URL structure refactor (4+ hr)

**Phase 4 - Low Priority (P3, Backlog):**
10. **NAV-008** - Workflow steps cleanup (15 min, optional)

---

## Files Modified in This Audit

Files read and analyzed:
- `cfo-frontend/src/App.jsx`
- `cfo-frontend/src/components/ProtectedRoute.jsx`
- `cfo-frontend/src/context/AuthContext.jsx`
- `cfo-frontend/src/components/AppShell.jsx`
- `cfo-frontend/src/components/WorkflowSidebar.jsx`
- `cfo-frontend/src/components/assessment/AssessmentSidebar.jsx`
- `cfo-frontend/src/hooks/useStepTransition.js`
- `cfo-frontend/src/hooks/useReportData.js`
- `cfo-frontend/src/IntroPage.jsx`
- `cfo-frontend/src/pages/CompanySetupPage.jsx`
- `cfo-frontend/src/pages/PersonaConfirmationPage.jsx`
- `cfo-frontend/src/pages/CalibrationPage.jsx`
- `cfo-frontend/src/pages/DashboardPage.jsx`
- `cfo-frontend/src/pages/LandingPage.jsx`
- `cfo-frontend/src/pages/PillarReport.jsx`
- `cfo-frontend/src/DiagnosticInput.jsx`
- `cfo-frontend/src/components/assessment/AssessObjectivePage.jsx`

---

## Related Documents

- `spec/NAVIGATION_PRINCIPLES.md` - Navigation principles (authoritative)
- `spec/SPEC_v3.1.0.md` - Master system specification
- `spec/DESIGN_SYSTEM.md` - Visual design patterns
- `CLAUDE.md` - Project reference (source of known issues)

---

## Audit Methodology

This audit was conducted using the Navigation Principles document as a lens:

| Principle | Issues Found |
|-----------|--------------|
| P1: Linear Progression | NAV-006, NAV-010 |
| P2: Single Source of Truth | (none) |
| P3: URL = State | NAV-003, NAV-005 |
| P4: Forgiving Navigation | NAV-001, NAV-002, NAV-004, NAV-009 |
| P5: Consistent Mental Model | NAV-007, NAV-008, NAV-011 |
| P6: No Surprises | (none - finalization uses branded modal) |

**Positive Findings:**
- ExecutiveReportPage correctly gates access via `finalized_at` check
- WorkflowSidebar derives state from database `current_step`
- ActionPlanTab uses branded confirmation modal (not `window.confirm`)
- Smart resume functionality works correctly via `resume_path`

---

## Out of Scope

### Mobile/Responsive Navigation
Not fully audited. Original audit plan marked this LOW priority (Category 9),
but CFO tablet usage during meetings may warrant investigation.

**Recommendation:** Post-launch, analyze usage analytics to determine if
dedicated mobile UX audit is needed. Key areas:
- Hamburger menu behavior
- Sidebar overlay interactions
- Touch target sizing (44px minimum)

---

## Won't Fix / Deferred

### NAV-008: Workflow Steps Don't Include Intro
**Status:** Deferred indefinitely
**Rationale:** The Intro page is a brief methodology overview without
significant user state. STEP_MAPPING correctly maps 'intro' to 'setup',
so sidebar state is technically accurate. Adding a separate "Intro" step
would add visual complexity without clear user benefit.

**Revisit If:** User research indicates confusion about workflow position.
