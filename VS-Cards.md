# VS-Cards — Version Sprints Roadmap

**Last Updated:** December 23, 2025
**Status:** Active Development

---

## VS-23: Maturity Footprint Grid

**Status:** 🟡 In Progress (Visual refinement pending)
**Priority:** High
**Sprint:** December 23, 2025

### Problem Statement
The report needs a visual "capability map" showing which practices are proven, partial, or gaps — organized by maturity level. This helps executives see their capability footprint at a glance.

### Deliverables

| Component | Status | Description |
|-----------|--------|-------------|
| Practice Catalog | ✅ Done | 21 FP&A practices across L1-L4 (`src/specs/practices.ts`) |
| Footprint Engine | ✅ Done | Evidence state computation (`src/maturity/footprint.ts`) |
| API Integration | ✅ Done | `maturity_footprint` in report response |
| Frontend Grid | 🟡 WIP | `MaturityFootprintGrid.jsx` - visual refinement pending |
| Focus Next | ✅ Done | Priority gap ranking algorithm |

### Technical Implementation

**Backend Files Created:**
- `src/specs/practices.ts` — 21 practice definitions with question mappings
- `src/maturity/footprint.ts` — `buildMaturityFootprint()` pure function
- Updated `src/reports/builder.ts` — includes `maturity_footprint` in response
- Updated `src/reports/types.ts` — `MaturityFootprint` interface

**Frontend Files:**
- `cfo-frontend/src/components/report/MaturityFootprintGrid.jsx`
- Updated `cfo-frontend/src/pages/PillarReport.jsx` — consumes API data

### Practice Distribution

| Level | Count | Practices |
|-------|-------|-----------|
| L1 Foundation | 5 | Annual Budget, Budget Owner, Chart of Accounts, Approval Controls, Mgmt Reporting |
| L2 Defined | 6 | BvA Generation, Variance Discipline, Forecast System, Cash Flow, Refresh Cycle, Documentation |
| L3 Managed | 6 | Driver Models, Integrated Planning, Business Partnership, Strategic Integration, Rolling Forecast, Scenario Planning |
| L4 Optimized | 4 | Forward KPIs, Automated Insights, Continuous Planning, Self-Service Analytics |
| **Total** | **21** | |

### Evidence State Logic

```typescript
function computeEvidenceState(practice, answers): 'proven' | 'partial' | 'not_proven' {
  const yesCount = answers.filter(a => a.value === true).length;
  const coverage = yesCount / answers.length;

  if (coverage >= 1.0) return 'proven';    // 100% YES
  if (coverage >= 0.5) return 'partial';   // 50-99% YES
  return 'not_proven';                      // <50% YES
}
```

### Focus Next Priority Formula

```
Priority = (5 - level) × gapScore × (isCritical ? 2 : 1)
```

- **Level weight:** Lower levels get higher priority (foundation first)
- **Gap score:** `1 - coverage` (bigger gaps rank higher)
- **Critical boost:** 2× multiplier for practices containing critical questions

### Remaining Work

1. **Visual Refinement** — Finalize grid design (tiles fit in one row, design system colors)
2. **User Acceptance** — Review with stakeholder
3. **Documentation** — Update CLAUDE.md with session notes

### Acceptance Criteria

- [ ] All 21 practices render correctly in grid
- [ ] Evidence states show via left-border color (green/yellow/gray)
- [ ] Critical practices marked with AlertCircle icon
- [ ] L4 at top, L1 at bottom (strategic leverage perspective)
- [ ] Focus Next shows top 3 priority gaps
- [ ] Tiles fit in single horizontal row per level

---

## VS-24: JSON Catalog Refactor

**Status:** 📋 Planned
**Priority:** High
**Depends On:** VS-23 completion
**Sprint:** December 24, 2025

### Problem Statement
The spec file (`src/specs/v2.7.0.ts`) has grown large and complex with 48 questions, 21 practices, 9 initiatives, and various mappings. This creates:
- Difficult content updates (requires TypeScript knowledge)
- Risk of breaking type contracts
- No separation between content and code
- Complex git diffs for content changes

### Proposed Solution
Extract all content into JSON files with TypeScript loaders that validate at build time.

### Deliverables

| Component | Description |
|-----------|-------------|
| `content/questions.json` | All 48 questions with metadata |
| `content/practices.json` | 21 practices with question mappings |
| `content/initiatives.json` | 9 initiatives with action mappings |
| `content/objectives.json` | 8 objectives with thresholds |
| `content/gates.json` | Maturity gates configuration |
| `src/specs/loader.ts` | TypeScript loader with Zod validation |
| Migration script | Convert existing TS to JSON |

### Benefits

1. **Content team autonomy** — Edit JSON without touching code
2. **Cleaner diffs** — Content changes isolated from logic
3. **Runtime validation** — Zod schemas catch errors early
4. **Easier i18n** — JSON structure supports translations
5. **API-ready** — Could serve from CMS/database later

### JSON Schema Example

```json
// content/questions.json
{
  "version": "2.8.1",
  "questions": [
    {
      "id": "fpa_l1_q01",
      "text": "Does the company produce an approved annual budget...",
      "help": "This tests whether formal budgeting exists",
      "maturity_level": 1,
      "is_critical": true,
      "objective_id": "obj_fpa_l1_budget",
      "practice_id": "prac_annual_budget",
      "initiative_id": "init_budget_foundation",
      "impact": 5,
      "complexity": 2,
      "expert_action": {
        "title": "Establish Annual Budget Process",
        "recommendation": "Create a formal annual budget cycle...",
        "type": "structural"
      }
    }
  ]
}
```

### Loader Pattern

```typescript
// src/specs/loader.ts
import questionsJson from '../../content/questions.json';
import { QuestionSchema } from './schemas';
import { z } from 'zod';

export function loadQuestions(): Question[] {
  const result = z.array(QuestionSchema).safeParse(questionsJson.questions);
  if (!result.success) {
    throw new Error(`Invalid questions.json: ${result.error.message}`);
  }
  return result.data;
}
```

### Migration Steps

1. Create `content/` directory structure
2. Write JSON schemas with Zod
3. Extract content from v2.7.0.ts to JSON files
4. Create loader functions with validation
5. Update spec exports to use loaders
6. Run all tests to verify
7. Remove hardcoded content from TS files

### Acceptance Criteria

- [ ] All content in JSON files
- [ ] TypeScript loaders with Zod validation
- [ ] All 625 tests pass after migration
- [ ] Content editable without TypeScript knowledge
- [ ] Build fails on invalid JSON (schema enforcement)

---

## VS Backlog

| VS | Name | Priority | Status |
|----|------|----------|--------|
| VS-15 | Admin Dashboard | Medium | 📋 Backlog |
| VS-25 | Multi-Pillar Architecture | High | 📋 Backlog |
| VS-26 | Benchmarking Engine | Medium | 📋 Backlog |
| VS-27 | Trend Analysis | Low | 📋 Backlog |
| VS-28 | Email Reports | Low | 📋 Backlog |
| VS-29 | SSO Integration | Medium | 📋 Backlog |

---

## Completed VS History

| VS | Name | Completed | Key Deliverable |
|----|------|-----------|-----------------|
| VS-1 to VS-12 | Core Platform | Dec 2025 | Scoring, maturity, reports |
| VS-13 | PDF Export | Dec 2025 | Browser print with colors |
| VS-14 | Content Hydration | Dec 2025 | Spec API endpoint |
| VS-16 | Production Deploy | Dec 2025 | Railway + Vercel |
| VS-18 | Context Intake | Dec 2025 | Company/industry capture |
| VS-19 | Critical Risk Engine | Dec 2025 | "Silence is Risk" logic |
| VS-20 | Dynamic Action Engine | Dec 2025 | Objective-based actions |
| VS-21 | Objective Importance | Dec 2025 | Calibration layer |
| VS-22 | Enterprise Report UI | Dec 2025 | Gartner-style report v2.8.0 |
