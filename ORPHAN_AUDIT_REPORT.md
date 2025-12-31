# CFOdiagnosis_v1 - Orphan Elements & Code Quality Audit

**Date:** December 31, 2025
**Auditor:** Claude Code
**Scope:** Complete codebase analysis for orphan elements, dead code, and spaghetti patterns

---

## Executive Summary

After a comprehensive audit of the CFOdiagnosis_v1 codebase, I found **significant technical debt** accumulated from version iterations (VS-18 through VS-39) and multiple reverts. The codebase has:

| Category | Issues Found | Severity |
|----------|--------------|----------|
| Orphan React Components | 20 components | 🟡 MEDIUM |
| Orphan Backend Functions | 12 exports | 🟡 MEDIUM |
| Unused API Endpoints | 10 endpoints | 🟡 MEDIUM |
| Database Schema Issues | 1 critical bug + orphans | 🔴 CRITICAL |
| Legacy Files/Directories | 18+ files | 🟡 MEDIUM |
| Route Inconsistencies | 3 patterns | 🟢 LOW |

**Estimated cleanup effort:** 2-4 hours for critical fixes, 1-2 days for full cleanup

---

## 🔴 CRITICAL ISSUES (Fix Immediately)

### 1. Database: Column Name Mismatch Bug

**Location:** `supabase/migrations/20251230_vs32d_action_planning.sql:82`

```sql
-- BUG: Function uses "target_timeline" but actual column is "timeline"
INSERT INTO action_plans (
  run_id,
  question_id,
  status,
  target_timeline,  -- ❌ WRONG: Column doesn't exist
  rationale,
  ...
)
```

**Impact:** The `save_action_proposal()` RPC function will fail on every call.

**Fix Required:**
```sql
-- Change line 82 from:
target_timeline,
-- To:
timeline,
```

---

## 🟡 ORPHAN REACT COMPONENTS (20 Total)

### Never Imported Components

These components exist but are **never imported or used anywhere**:

| Component | Location | Purpose | Action |
|-----------|----------|---------|--------|
| `PageContainer.jsx` | `/components/` | Centering utility | Review/Delete |
| `ContextWizard.jsx` | `/components/` | VS25 data wizard | Delete |
| `AuthPage.jsx` | `/pages/` | Authentication | Use or Delete |
| `AssessmentCard.jsx` | `/components/report/` | Exec summary stats | Delete |
| `CappedWarning.jsx` | `/components/report/` | Alert banner | Delete |
| `EmptyState.jsx` | `/components/report/` | Victory message | Delete |
| `ExecutiveSpine.jsx` | `/components/report/` | Layout anchor | Delete |
| `HeaderBar.jsx` | `/components/report/` | Sticky header | Delete |
| `InitiativeCard.jsx` | `/components/report/` | Initiative display | Delete |
| `InterpretationLoader.jsx` | `/components/report/` | Loading skeleton | Delete |
| `InterpretationQuestions.jsx` | `/components/report/` | Clarification UI | Delete |
| `InterpretationTabV32.jsx` | `/components/report/` | V32 interpretation | Delete |
| `InterpretedReport.jsx` | `/components/report/` | AI report display | Delete |
| `MaturityCard.jsx` | `/components/report/` | Maturity display | Delete |
| `MaturityFootprintGrid.jsx` | `/components/report/` | Capability grid | Delete |
| `MaturityLadder.jsx` | `/components/report/` | Maturity table | Delete |
| `ObjectiveCard.jsx` | `/components/report/` | Objective health | Delete |
| `PathToMaturity.jsx` | `/components/report/` | Maturity ladder | Delete |
| `PriorityTabs.jsx` | `/components/report/` | P1/P2/P3 tabs | Delete |
| `ScoreCard.jsx` | `/components/report/` | Score display | Delete |
| `StrategicRoadmap.jsx` | `/components/report/` | Roadmap viz | Delete |

### Legacy Index Exports

**File:** `cfo-frontend/src/components/report/index.js`

Contains 32 exports marked as "Legacy exports (if needed for backward compatibility)" - but none are actually used. Consider removing the entire barrel export file after cleanup.

---

## 🟡 ORPHAN BACKEND CODE

### Dead Exports in `src/maturity/footprint.ts`

These functions are exported but never imported elsewhere:

```typescript
// Should be made private (remove 'export')
export function computeEvidenceState(...) // lines 66-94
export function practiceHasCritical(...)  // lines 100-108
export function computeFocusNext(...)     // lines 149-189
```

### Dead Exports in `src/interpretation/tonality.ts`

```typescript
// Unused - can be deleted
export function getOverallTone(...) // lines 106-119
```

### Dead Exports in `src/specs/loader.ts`

```typescript
// Never called - can be deleted
export function getQuestionsByInitiative(...)  // line 182
export function getQuestionsByObjective(...)   // line 187
export function getObjectiveById(...)          // line 204
export function getInitiativeById(...)         // line 208
export function getThemeById(...)              // line 229
```

### Dead Export in `src/scoring/rules.ts`

```typescript
// Entire file may be legacy - scoringRules never used
export const scoringRules = [...]
```

### Dead Export in `src/specs/v2.7.0.ts`

```typescript
// Last export never imported
export const specV270WithThemes = {...} // line 1300
```

---

## 🟡 UNUSED API ENDPOINTS (10 Total)

### Health Check Endpoints (Not Called from Frontend)
- `GET /health`
- `GET /supabase-health`

### Legacy Spec Endpoint
- `GET /spec/questions` (superseded by `/api/spec`)

### Debug/Internal Endpoints
- `GET /diagnostic-runs/:id/validate`
- `GET /diagnostic-runs/:id/results` (superseded by `/report`)

### V25 Interpretation Pipeline (Completely Orphaned)
The entire V25 interpretation system is still in the backend but unused:
- `POST /diagnostic-runs/:id/interpret/start`
- `GET /diagnostic-runs/:id/interpret/status`
- `POST /diagnostic-runs/:id/interpret/answer`
- `GET /diagnostic-runs/:id/interpret/report`
- `POST /diagnostic-runs/:id/interpret/feedback`

**Note:** Frontend migrated to V32 (`/interpret-v32` endpoints)

---

## 🟡 DATABASE ORPHANS

### Orphaned Table: `planning_context`

**Location:** `supabase/migrations/20251230_vs32d_action_planning.sql:5-15`

```sql
CREATE TABLE IF NOT EXISTS planning_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES diagnostic_runs(id),
  target_maturity_level INTEGER,
  bandwidth TEXT,
  priority_focus TEXT[],
  team_size_override INTEGER,
  ...
);
```

**Status:** Table created with 4 RLS policies but **zero references in code**

### Orphaned Columns in `action_plans`

Added but never read:
- `rationale JSONB`
- `evidence_ids TEXT[]`
- `ai_generated BOOLEAN`
- `priority_rank INTEGER`

### Orphaned Columns in `diagnostic_runs`

Added but never read:
- `action_proposal JSONB`
- `action_proposal_generated_at TIMESTAMPTZ`

### Orphaned Columns in `interpretation_reports`

Added but never queried:
- `clarifier_answers JSONB`
- `pending_questions JSONB`
- `loop_round INTEGER`
- `overview_sections JSONB`
- `current_stage TEXT`
- `heuristics_result JSONB`

### Duplicate Migration File

**Delete:** `supabase/migrations/20241226_prune_interpretation_logs.sql`
(Identical to `20241225_prune_interpretation_logs.sql`)

---

## 🟡 LEGACY FILES & DIRECTORIES

### 1. Legacy Frontend Directory (DELETE ENTIRELY)

**Path:** `/frontend/`

Contains only `FinanceDiagnosticReport.jsx` (1,185 lines) with hardcoded mock data. The production version is in `cfo-frontend/src/`.

### 2. Outdated Test Scripts

| File | Version | Action |
|------|---------|--------|
| `scripts/test-v21-production.js` | VS-21 | Delete |
| `scripts/test-vs21-flow.js` | VS-21 | Delete |
| `scripts/test-vs22-v3.js` | VS-22 | Delete |
| `scripts/test-vs25-complete.js` | VS-25 | Review/Delete |
| `scripts/test-vs25-fixed.js` | VS-25 | Review/Delete |
| `scripts/test-vs25-interpretation.js` | VS-25 | Review/Delete |

### 3. Outdated Unit Tests

| File | Version | Action |
|------|---------|--------|
| `src/tests/v2-qa.test.ts` | V2 | Archive/Delete |
| `src/tests/vs5-qa.test.ts` | VS-5 | Archive/Delete |
| `src/tests/vs6-qa.test.ts` | VS-6 | Archive/Delete |
| `src/tests/vs7-qa.test.ts` | VS-7 | Archive/Delete |
| `src/tests/vs8-qa.test.ts` | VS-8 | Archive/Delete |
| `src/tests/vs9-qa.test.ts` | VS-9 | Archive/Delete |
| `src/tests/vs11-qa.test.ts` | VS-11 | Archive/Delete |
| `src/tests/vs19-qa.test.ts` | VS-19 | Archive/Delete |
| `src/tests/vs20-qa.test.ts` | VS-20 | Archive/Delete |
| `src/tests/vs24-content.test.ts` | VS-24 | Archive/Delete |

### 4. OS Metadata File

**Delete:** `src/desktop.ini` (Windows metadata, shouldn't be in git)

---

## 🟢 ROUTE INCONSISTENCIES

### URL Pattern Mismatches

| Route Category | Pattern | Issue |
|----------------|---------|-------|
| Setup/Calibrate/Intro | `/run/:runId/...` | ✅ Consistent |
| Assessment | `/assess/...` | ❌ Missing runId in path |
| Report | `/report/:runId` | ❌ Missing `/run` prefix |

**Current Assessment Routes:**
```
/assess/foundation?runId=xxx
/assess/future?runId=xxx
/assess/intelligence?runId=xxx
```

**Should be:**
```
/run/:runId/assess/foundation
/run/:runId/assess/future
/run/:runId/assess/intelligence
```

---

## 📋 ACTION PLAN

### Phase 1: Critical Fixes (Do First) ⏱️ 30 minutes

1. **Fix database bug** in `20251230_vs32d_action_planning.sql`:
   - Change `target_timeline` to `timeline` on line 82
   - Create a new migration to fix if already applied to production

### Phase 2: High Priority Cleanup ⏱️ 2-3 hours

2. **Delete legacy frontend directory:**
   ```bash
   rm -rf frontend/
   ```

3. **Delete orphan React components** (20 files):
   ```bash
   # In cfo-frontend/src/components/
   rm PageContainer.jsx ContextWizard.jsx

   # In cfo-frontend/src/pages/
   rm AuthPage.jsx

   # In cfo-frontend/src/components/report/
   rm AssessmentCard.jsx CappedWarning.jsx EmptyState.jsx \
      ExecutiveSpine.jsx HeaderBar.jsx InitiativeCard.jsx \
      InterpretationLoader.jsx InterpretationQuestions.jsx \
      InterpretationTabV32.jsx InterpretedReport.jsx \
      MaturityCard.jsx MaturityFootprintGrid.jsx MaturityLadder.jsx \
      ObjectiveCard.jsx PathToMaturity.jsx PriorityTabs.jsx \
      ScoreCard.jsx StrategicRoadmap.jsx
   ```

4. **Clean up report index.js:**
   - Remove legacy exports that no longer exist

5. **Delete duplicate migration:**
   ```bash
   rm supabase/migrations/20241226_prune_interpretation_logs.sql
   ```

### Phase 3: Backend Cleanup ⏱️ 1-2 hours

6. **Remove dead exports** from:
   - `src/maturity/footprint.ts` - make functions private
   - `src/interpretation/tonality.ts` - delete `getOverallTone`
   - `src/specs/loader.ts` - delete 5 unused query functions
   - `src/scoring/rules.ts` - review if entire file can be deleted
   - `src/specs/v2.7.0.ts` - delete `specV270WithThemes`

7. **Archive V25 interpretation endpoints** in `src/index.ts`:
   - Either delete or move to a separate legacy file
   - Remove routes from lines 708-1173

### Phase 4: Test File Cleanup ⏱️ 30 minutes

8. **Delete outdated test scripts:**
   ```bash
   rm scripts/test-v21-production.js \
      scripts/test-vs21-flow.js \
      scripts/test-vs22-v3.js
   ```

9. **Archive old unit tests** (or delete if no longer needed):
   ```bash
   mkdir -p src/tests/archive
   mv src/tests/v2-qa.test.ts src/tests/vs{5,6,7,8,9,11,19,20}-qa.test.ts \
      src/tests/vs24-content.test.ts src/tests/archive/
   ```

10. **Delete OS metadata:**
    ```bash
    rm src/desktop.ini
    echo "desktop.ini" >> .gitignore
    ```

### Phase 5: Database Cleanup (Requires Careful Planning) ⏱️ 1 hour

11. **Create cleanup migration** to drop orphaned elements:
    ```sql
    -- Review carefully before applying!
    DROP TABLE IF EXISTS planning_context CASCADE;

    ALTER TABLE action_plans
      DROP COLUMN IF EXISTS rationale,
      DROP COLUMN IF EXISTS evidence_ids,
      DROP COLUMN IF EXISTS ai_generated,
      DROP COLUMN IF EXISTS priority_rank;

    ALTER TABLE diagnostic_runs
      DROP COLUMN IF EXISTS action_proposal,
      DROP COLUMN IF EXISTS action_proposal_generated_at;
    ```

### Phase 6: Route Standardization (Optional) ⏱️ 2-4 hours

12. **Standardize URL patterns** (breaking change):
    - Move assessment routes under `/run/:runId/assess/...`
    - Move report route to `/run/:runId/report`
    - Update all navigation logic

---

## 🎯 PREVENTION RECOMMENDATIONS

### 1. Add Unused Code Detection

Add to `package.json`:
```json
{
  "scripts": {
    "lint:unused": "npx knip"
  }
}
```

[Knip](https://github.com/webpro/knip) automatically detects unused files, dependencies, and exports.

### 2. Component Import Validation

Add ESLint rule:
```json
{
  "rules": {
    "no-unused-vars": ["error", { "varsIgnorePattern": "^_" }],
    "import/no-unused-modules": ["error", { "unusedExports": true }]
  }
}
```

### 3. Database Migration Discipline

- Always pair column additions with code that uses them
- Review migrations before merging
- Add column usage comments in migration files

### 4. Version Cleanup Protocol

After each major version release:
1. Delete components with old version suffixes
2. Remove old test files
3. Archive or delete legacy API endpoints

### 5. Git Hygiene

- Use feature branches for experimental code
- Squash commits before merging
- Tag releases to make reverts cleaner

---

## Summary

The codebase has accumulated ~20% dead code through rapid version iterations. The critical database bug should be fixed immediately. The remaining cleanup can be done incrementally but is recommended to prevent further technical debt accumulation.

**Estimated total cleanup time:** 4-8 hours
**Risk level:** Low (mostly deletions of unused code)
**Benefit:** Cleaner codebase, faster builds, reduced confusion for new developers
