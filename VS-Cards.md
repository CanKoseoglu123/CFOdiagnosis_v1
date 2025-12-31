# VS-Cards — Version Sprints Roadmap

**Last Updated:** December 31, 2025
**Status:** Active Development

---

## VS-29: Global Sidebar Layout

**Status:** ✅ Complete
**Priority:** High
**Completed:** December 25, 2025

### Problem Statement
The application needed a consistent sidebar navigation pattern across all pages (except landing). The Action Planning tab has interactive controls that need to stay within the content area, while Overview/Footprint tabs should use the standard global sidebar.

### Deliverables

| Component | Status | Description |
|-----------|--------|-------------|
| AppShell Component | ✅ Done | Responsive layout with 280px fixed sidebar |
| WorkflowSidebar | ✅ Done | Global workflow steps + page-specific slots |
| ActionSidebar | ✅ Done | Interactive sidebar inside Action Planning content |
| Tab-Specific Content | ✅ Done | ReportOverviewContent, FootprintContent helpers |

### Technical Implementation

**Files Created/Modified:**
- `cfo-frontend/src/components/WorkflowSidebar.jsx` — Global sidebar with workflow steps
- `cfo-frontend/src/components/report/ActionSidebar.jsx` — Action Planning interactive sidebar
- `cfo-frontend/src/pages/PillarReport.jsx` — Integrated AppShell + WorkflowSidebar

### Layout Pattern

```
┌─────────────────────────────────────────────────────────────┐
│ Header (CFO Diagnostic, user email, sign out)               │
├──────────────┬──────────────────────────────────────────────┤
│  SIDEBAR     │  MAIN CONTENT                                │
│  (280px)     │                                              │
│              │  ┌──────────────────────────────────────┐   │
│  Workflow    │  │  Overview Tab                        │   │
│  Steps       │  │  Footprint Tab                       │   │
│              │  │  Action Planning Tab (flex layout)    │   │
│  Page-       │  │  ┌─────────────────┬────────────┐   │   │
│  Specific    │  │  │ Actions List    │ ActionBar  │   │   │
│  Content     │  │  │ (scrollable)    │ (sticky)   │   │   │
│              │  │  └─────────────────┴────────────┘   │   │
│  Navigation  │  └──────────────────────────────────────┘   │
│  Buttons     │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

---

## VS-28: Action Planning & Simulator

**Status:** ✅ Complete
**Priority:** High
**Completed:** December 25, 2025

### Problem Statement
Users needed a "war room" for planning their maturity improvement journey. They should be able to select gaps to address, assign timelines, and see projected score improvements.

### Deliverables

| Component | Status | Description |
|-----------|--------|-------------|
| ActionPlanTab | ✅ Done | Container for action planning functionality |
| SimulatorHUD | ✅ Done | Real-time score projection display |
| CommandCenter | ✅ Done | Actions list with grouping (by Objective/Initiative) |
| ActionSidebar | ✅ Done | Progress tracking and timeline breakdown |
| Backend API | ✅ Done | `/diagnostic-runs/:id/action-plan` CRUD endpoints |

### Technical Implementation

**Files Created:**
- `cfo-frontend/src/components/report/ActionPlanTab.jsx`
- `cfo-frontend/src/components/report/SimulatorHUD.jsx`
- `cfo-frontend/src/components/report/CommandCenter.jsx`
- `cfo-frontend/src/components/report/ActionSidebar.jsx`

### Features

1. **Gap Selection** — Toggle checkboxes to add/remove gaps from plan
2. **Timeline Assignment** — 6m / 12m / 24m dropdown per action
3. **Owner Assignment** — Free-text owner field per action
4. **Score Projection** — Real-time calculation of projected scores by timeline
5. **View Modes** — Group by Objective or by Initiative
6. **Auto-Save** — Debounced saves to backend

---

## VS-25: AI Interpretation Layer

**Status:** ✅ Complete (Backend)
**Priority:** High
**Completed:** December 24, 2025

### Problem Statement
The diagnostic report provides raw scores and actions but lacks personalized, narrative interpretation. Users need context-aware synthesis that explains what the scores mean for their specific situation.

### Deliverables

| Component | Status | Description |
|-----------|--------|-------------|
| Pipeline Architecture | ✅ Done | Generator-Critic loop with 2 rounds max |
| Generator Agent | ✅ Done | GPT-4o for high-quality report writing |
| Critic Agent | ✅ Done | GPT-4o-mini for fast assessment |
| Database Schema | ✅ Done | Sessions, steps, questions, reports tables |
| Safety Limits | ✅ Done | 20K tokens, 8 AI calls, 5 questions max |
| API Endpoints | ✅ Done | /interpret/start, /status, /answer, /report |
| Frontend Integration | ✅ Done | InterpretationSection in report page |

### Technical Implementation

**Backend Files Created:**
- `src/interpretation/` — Full module with types, prompts, config
- `src/interpretation/agents/generator.ts` — GPT-4o for drafting
- `src/interpretation/agents/critic.ts` — GPT-4o-mini for assessment
- `src/interpretation/pipeline.ts` — Orchestrator with safety limits
- `supabase/migrations/20241224_vs25_interpretation_layer_fixed.sql`

**Frontend Files:**
- `cfo-frontend/src/components/report/InterpretationSection.jsx`

---

## VS-24: JSON Catalog Refactor

**Status:** ✅ Complete
**Priority:** High
**Completed:** December 24, 2025

### Deliverables

| Component | Status | Description |
|-----------|--------|-------------|
| `content/questions.json` | ✅ Done | 48 questions with metadata |
| `content/practices.json` | ✅ Done | 21 practices with question mappings |
| `content/initiatives.json` | ✅ Done | 9 initiatives with action mappings |
| `content/objectives.json` | ✅ Done | 8 objectives with thresholds |
| `src/content/loader.ts` | ✅ Done | Zod validation loader |
| Registry Update | ✅ Done | `registry.ts` uses JSON loaders |

---

## VS-23: Maturity Footprint Grid

**Status:** ✅ Complete
**Priority:** High
**Completed:** December 23, 2025

### Deliverables

| Component | Status | Description |
|-----------|--------|-------------|
| Practice Catalog | ✅ Done | 21 FP&A practices across L1-L4 |
| Footprint Engine | ✅ Done | Evidence state computation |
| API Integration | ✅ Done | `maturity_footprint` in report response |
| Frontend Grid | ✅ Done | Design system compliant visualization |
| Focus Next | ✅ Done | Priority gap ranking algorithm |

### Practice Distribution

| Level | Count | Practices |
|-------|-------|-----------|
| L1 Foundation | 5 | Annual Budget, Budget Owner, Chart of Accounts, Approval Controls, Mgmt Reporting |
| L2 Defined | 6 | BvA Generation, Variance Discipline, Forecast System, Cash Flow, Refresh Cycle, Documentation |
| L3 Managed | 6 | Driver Models, Integrated Planning, Business Partnership, Strategic Integration, Rolling Forecast, Scenario Planning |
| L4 Optimized | 4 | Forward KPIs, Automated Insights, Continuous Planning, Self-Service Analytics |
| **Total** | **21** | |

---

## VS-30: Theme-Based Assessment Pages

**Status:** ✅ Complete
**Priority:** High
**Completed:** December 26, 2025

### Problem Statement
The assessment questionnaire needed to be separated into 3 pages (one per theme) with improved look and feel matching the Action Planning quality.

### Deliverables

| Component | Status | Description |
|-----------|--------|-------------|
| QuestionCard.jsx | ✅ Done | Polished card with level badges, help toggle, Yes/No buttons |
| AssessmentSidebar.jsx | ✅ Done | Progress HUD with theme/objective breakdown |
| AssessThemePage.jsx | ✅ Done | Reusable base component for all themes |
| AssessFoundation.jsx | ✅ Done | Foundation theme page (Budget, Controls, Monitoring) |
| AssessFuture.jsx | ✅ Done | Future theme page (Forecasting, Driver-Based, Scenarios) |
| AssessIntelligence.jsx | ✅ Done | Intelligence theme page (Strategic, Decision, Excellence) |
| Routes | ✅ Done | /assess/foundation, /assess/future, /assess/intelligence |

### Technical Implementation

**Files Created:**
- `cfo-frontend/src/components/assessment/QuestionCard.jsx`
- `cfo-frontend/src/components/assessment/AssessmentSidebar.jsx`
- `cfo-frontend/src/components/assessment/AssessThemePage.jsx`
- `cfo-frontend/src/pages/AssessFoundation.jsx`
- `cfo-frontend/src/pages/AssessFuture.jsx`
- `cfo-frontend/src/pages/AssessIntelligence.jsx`

### Features

1. **Theme-Based Navigation** — 3 separate pages with prev/next navigation
2. **Objective Grouping** — Collapsible cards grouping questions by objective
3. **Real-Time Saving** — Debounced auto-save with visual feedback
4. **Progress Tracking** — Theme-level and overall progress in sidebar
5. **Action Planning Design** — Matches enterprise UI patterns
6. **Mobile Responsive** — AppShell layout with mobile bottom nav

### Theme Mapping

| Theme | Objectives |
|-------|------------|
| Foundation | Budget Discipline, Financial Controls, Performance Monitoring |
| Future | Forecasting Agility, Driver-Based Planning, Scenario Modeling |
| Intelligence | Strategic Influence, Decision Support, Operational Excellence |

---

## VS-31: AI Fine-Tuning & Follow-up Questions

**Status:** 📋 Planned
**Priority:** High
**Sprint:** December 26-27, 2025

### Problem Statement
The AI interpretation needs fine-tuning for quality and the follow-up question mechanism needs refinement. Questions should meaningfully impact the final summary.

### Deliverables

| Component | Description |
|-----------|-------------|
| Prompt Refinement | Tune prompts for better output quality |
| Question Impact | Follow-up answers should visibly affect summary |
| Tonality Calibration | Ensure tone matches score appropriately |
| Error Handling | Graceful fallbacks for AI failures |

---

## VS-32: Printable Report

**Status:** 📋 Planned
**Priority:** High
**Sprint:** December 27, 2025

### Problem Statement
Users need a final, printable PDF report at the end of the pillar assessment that captures all insights, scores, and recommendations.

### Deliverables

| Component | Description |
|-----------|-------------|
| Print-Optimized Layout | CSS print styles for clean export |
| Executive Summary | One-page overview for executives |
| Full Report | Complete diagnostic with all sections |
| PDF Generation | Browser print or server-side PDF |

---

## VS-38: How to Create New Pillars — Developer Guide

**Status:** 📚 Reference Documentation
**Type:** Developer Guide
**Last Updated:** December 31, 2025

### Overview

This guide documents the complete process for adding a new diagnostic pillar to the CFO Diagnosis platform. The system currently supports FPA (Financial Planning & Analysis) and is architected to support multiple pillars. Follow these steps in order to add a new pillar (e.g., R2R - Record to Report, Tax, Treasury, etc.).

---

### Architecture Summary

A pillar consists of:
- **Questions** (48 per pillar, across 4 maturity levels)
- **Practices** (21 capabilities mapped to questions)
- **Objectives** (8 strategic objectives grouped into 3 themes)
- **Initiatives** (9 improvement initiatives)
- **Interpretation Pack** (AI prompt templates and section configs)

---

### Phase 1: Core Pillar Definition

#### Step 1.1: Add Pillar to Registry

**File:** `src/specs/loader.ts` (Lines 304-311)

```typescript
const PILLARS: SpecPillar[] = [
  {
    id: "fpa",
    name: "Financial Planning & Analysis",
    description: "Budget, forecast, variance analysis, and strategic planning capabilities",
    weight: 1
  },
  // ADD NEW PILLAR HERE:
  {
    id: "r2r",  // Use lowercase 3-4 char identifier
    name: "Record to Report",
    description: "Close process, consolidation, reporting, and compliance capabilities",
    weight: 1
  }
];
```

#### Step 1.2: Update Schema Validation

**File:** `src/specs/schemas.ts`

Update the pillar literal to accept multiple values:

```typescript
// Line ~55-65: Change from literal to enum
export const QuestionsFileSchema = z.object({
  version: z.string(),
  pillar: z.enum(['fpa', 'r2r']),  // WAS: z.literal('fpa')
  questions: z.array(QuestionSchema)
});
```

Update question ID regex to accept new prefix:

```typescript
// Line ~42-53: Update regex pattern
id: z.string().regex(/^(fpa|r2r)_l[1-4]_q\d{2}$/, 'Invalid question ID format')
```

#### Step 1.3: Add to Backward-Compatible Specs (Optional)

**File:** `src/specs/v2.6.4.ts` (Lines 24-31)

If supporting older spec versions, add pillar here too:

```typescript
pillars: [
  { id: "fpa", name: "Financial Planning & Analysis", ... },
  { id: "r2r", name: "Record to Report", ... }
]
```

---

### Phase 2: Content JSON Files

#### Step 2.1: Create Questions JSON

**Option A (Recommended):** Create separate file per pillar

**File:** `content/questions-r2r.json`

```json
{
  "version": "2.9.0",
  "pillar": "r2r",
  "questions": [
    {
      "id": "r2r_l1_q01",
      "level": 1,
      "practice_id": "prac_r2r_close_calendar",
      "text": "Does your organization have a documented month-end close calendar?",
      "help_text": "A formal calendar includes deadlines for each close activity...",
      "critical_risk": {
        "risk_statement": "Missing close calendar leads to inconsistent reporting...",
        "business_impact": "financial_reporting",
        "severity": "high"
      }
    }
    // ... 47 more questions following same pattern
  ]
}
```

**Question ID Pattern:** `{pillar}_l{level}_q{number}`
- `r2r_l1_q01` through `r2r_l1_q12` (Level 1: 12 questions)
- `r2r_l2_q01` through `r2r_l2_q12` (Level 2: 12 questions)
- `r2r_l3_q01` through `r2r_l3_q12` (Level 3: 12 questions)
- `r2r_l4_q01` through `r2r_l4_q12` (Level 4: 12 questions)

**Option B:** Add to existing `content/questions.json` with pillar field per question

#### Step 2.2: Create Practices JSON

**File:** `content/practices-r2r.json` or add to existing

```json
{
  "practices": [
    {
      "id": "prac_r2r_close_calendar",
      "objective_id": "obj_close_efficiency",
      "title": "Close Calendar Management",
      "capability_tags": ["close", "planning", "timeline"]
    }
    // ... 20 more practices (21 total per pillar)
  ]
}
```

**Practice Distribution by Level:**
| Level | Count | Example Practices |
|-------|-------|-------------------|
| L1 Foundation | 5 | Close Calendar, Trial Balance, Reconciliations |
| L2 Defined | 6 | Consolidation Process, Intercompany, Adjustments |
| L3 Managed | 6 | Fast Close, Continuous Accounting, Automation |
| L4 Optimized | 4 | Predictive Close, AI Reconciliation, Real-time Reporting |

#### Step 2.3: Create Objectives JSON

**File:** `content/objectives-r2r.json` or add to existing

```json
{
  "objectives": [
    {
      "id": "obj_close_efficiency",
      "name": "Close Efficiency",
      "description": "Speed and accuracy of period-end close process",
      "theme_id": "theme_foundation",
      "level": 1,
      "thresholds": { "emerging": 25, "established": 50, "advanced": 75, "leading": 90 }
    }
    // ... 7 more objectives (8 total per pillar)
  ]
}
```

**Objective Distribution by Theme:**
| Theme | Objectives (Example for R2R) |
|-------|------------------------------|
| Foundation | Close Efficiency, Data Integrity, Compliance Controls |
| Future | Automation Maturity, Continuous Close, Predictive Analytics |
| Intelligence | Reporting Insights, Stakeholder Value, Process Excellence |

#### Step 2.4: Create Initiatives JSON

**File:** `content/initiatives-r2r.json` or add to existing

```json
{
  "initiatives": [
    {
      "id": "init_r2r_close_automation",
      "name": "Close Process Automation",
      "description": "Automate repetitive close tasks and reconciliations",
      "pillar_id": "r2r"
    }
    // ... 8 more initiatives (9 total per pillar)
  ]
}
```

---

### Phase 3: Update Content Loader

**File:** `src/specs/loader.ts`

Modify `buildSpecFromContent()` to load pillar-specific content:

```typescript
export function buildSpecFromContent(pillarId: string = 'fpa'): Spec {
  // Load pillar-specific files
  const questionsFile = pillarId === 'fpa'
    ? 'questions.json'
    : `questions-${pillarId}.json`;

  const questions = loadQuestions(questionsFile);
  const practices = loadPractices(pillarId);
  const objectives = loadObjectives(pillarId);

  // Map objectives to pillar
  const specObjectives: SpecObjective[] = objectives.map(o => ({
    ...o,
    pillar_id: pillarId,  // Dynamic pillar assignment
  }));

  // ... rest of spec building
}
```

---

### Phase 4: Interpretation Engine Pack

#### Step 4.1: Create Pillar Pack Configuration

**File:** `src/interpretation/pillars/r2r/config.ts` (NEW FILE)

```typescript
import { PillarPack } from '../types';

export const R2R_PACK: PillarPack = {
  pillar_id: 'r2r',
  pillar_name: 'Record to Report',

  // Define 5 interpretation sections
  sections: [
    {
      id: 'summary',
      title: 'R2R Maturity Overview',
      guidance: 'Summarize the overall close-to-report maturity...',
      max_words: 80
    },
    {
      id: 'strengths',
      title: 'Close Process Strengths',
      guidance: 'Highlight areas where close process excels...',
      max_words: 100
    },
    {
      id: 'gaps',
      title: 'Critical Gaps',
      guidance: 'Identify urgent close process weaknesses...',
      max_words: 100
    },
    {
      id: 'recommendations',
      title: 'Priority Actions',
      guidance: 'Recommend specific close improvements...',
      max_words: 120
    },
    {
      id: 'outlook',
      title: 'Future State Vision',
      guidance: 'Describe target state for close process...',
      max_words: 80
    }
  ],

  // Phrases to avoid in AI output
  forbidden_phrases: [
    'I think',
    'I believe',
    'seems like',
    'might be',
    'probably',
    'based on what I see'
  ],

  // Fallback templates when AI fails
  fallback_templates: {
    summary: (input) => ({
      content: `${input.company_name}'s Record to Report maturity assessment reveals a ${input.overall_score > 60 ? 'solid' : 'developing'} foundation...`,
      evidence_ids: input.objectives.slice(0, 3).map(o => o.id)
    }),
    strengths: (input) => ({
      content: `Key strengths include ${input.objectives.filter(o => o.score >= 70).map(o => o.name).join(', ') || 'foundational processes'}...`,
      evidence_ids: []
    }),
    // ... templates for each section
  }
};
```

#### Step 4.2: Register Pillar Pack

**File:** `src/interpretation/pillars/registry.ts`

```typescript
import { FPA_PACK } from './fpa/config';
import { R2R_PACK } from './r2r/config';  // ADD IMPORT

const PACKS: Record<string, PillarPack> = {
  fpa: FPA_PACK,
  r2r: R2R_PACK,  // ADD TO REGISTRY
};

export function getPillarPack(pillarId: string): PillarPack {
  const pack = PACKS[pillarId];
  if (!pack) {
    throw new Error(`Unknown pillar: ${pillarId}. Available: ${Object.keys(PACKS).join(', ')}`);
  }
  return pack;
}
```

---

### Phase 5: Database Migration

**File:** `supabase/migrations/20251231_vs38_add_pillar_id.sql` (NEW FILE)

```sql
-- Add pillar_id column to diagnostic_runs if not present
ALTER TABLE diagnostic_runs
ADD COLUMN IF NOT EXISTS pillar_id TEXT DEFAULT 'fpa';

COMMENT ON COLUMN diagnostic_runs.pillar_id IS
  'Identifies the diagnostic pillar: fpa, r2r, tax, treasury, etc.';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_diagnostic_runs_pillar_id
ON diagnostic_runs(pillar_id);

-- Optional: Create pillars reference table
CREATE TABLE IF NOT EXISTS pillars (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  weight NUMERIC DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed pillar data
INSERT INTO pillars (id, name, description) VALUES
  ('fpa', 'Financial Planning & Analysis', 'Budget, forecast, variance analysis, and strategic planning'),
  ('r2r', 'Record to Report', 'Close process, consolidation, reporting, and compliance')
ON CONFLICT (id) DO NOTHING;
```

---

### Phase 6: Frontend Components

#### Step 6.1: Create Pillar Setup Page (Optional)

If the new pillar needs custom context fields:

**File:** `cfo-frontend/src/pages/R2RSetupPage.jsx` (NEW FILE)

```jsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function R2RSetupPage() {
  const { runId } = useParams();

  // Custom fields for R2R pillar
  const [closeFrequency, setCloseFrequency] = useState('monthly');
  const [consolidationEntities, setConsolidationEntities] = useState('');

  return (
    <div className="setup-page">
      <h1>R2R Context Setup</h1>
      {/* Pillar-specific context fields */}
      <select value={closeFrequency} onChange={e => setCloseFrequency(e.target.value)}>
        <option value="monthly">Monthly Close</option>
        <option value="quarterly">Quarterly Close</option>
      </select>
      {/* ... more fields */}
    </div>
  );
}
```

#### Step 6.2: Update Router

**File:** `cfo-frontend/src/App.jsx`

```jsx
import R2RSetupPage from './pages/R2RSetupPage';

// Add route
<Route path="/setup/:runId/r2r" element={<R2RSetupPage />} />
```

#### Step 6.3: Update Objective-Theme Mapping

**File:** `cfo-frontend/src/pages/PillarReport.jsx`

```javascript
const OBJECTIVE_THEME_MAP = {
  // FPA objectives
  'obj_budget_discipline': 'Foundation',
  'obj_financial_controls': 'Foundation',
  // ... existing FPA mappings

  // R2R objectives (ADD THESE)
  'obj_close_efficiency': 'Foundation',
  'obj_data_integrity': 'Foundation',
  'obj_compliance_controls': 'Foundation',
  'obj_automation_maturity': 'Future',
  'obj_continuous_close': 'Future',
  'obj_predictive_analytics': 'Future',
  'obj_reporting_insights': 'Intelligence',
  'obj_process_excellence': 'Intelligence',
};
```

---

### Phase 7: API Endpoint Updates

#### Step 7.1: Run Creation Endpoint

**File:** `src/index.ts`

Ensure pillar_id is captured when creating a run:

```typescript
app.post('/diagnostic-runs', async (req, res) => {
  const { pillar_id = 'fpa', ...otherFields } = req.body;

  const { data, error } = await supabase
    .from('diagnostic_runs')
    .insert({
      pillar_id,  // Store pillar selection
      ...otherFields
    })
    .select()
    .single();

  // ...
});
```

#### Step 7.2: Report Generation

**File:** `src/reports/builder.ts`

No changes needed — already iterates over `spec.pillars`:

```typescript
const pillarReports = spec.pillars.map((pillar) =>
  buildPillarReport(pillar, spec, aggregateResult, inputMap, gates, calibration, engineRisks)
);
```

---

### Phase 8: Calibration Configuration

**File:** `content/calibration.json`

Add pillar-specific calibration settings if needed:

```json
{
  "pillars": {
    "fpa": {
      "objective_weights": { ... }
    },
    "r2r": {
      "objective_weights": {
        "obj_close_efficiency": 1.2,
        "obj_data_integrity": 1.0,
        "obj_compliance_controls": 1.1
      }
    }
  }
}
```

---

### Complete Checklist

#### Phase 1: Core Definition
- [ ] Add pillar to `PILLARS` array in `src/specs/loader.ts`
- [ ] Update `z.literal('fpa')` to `z.enum([...])` in `src/specs/schemas.ts`
- [ ] Update question ID regex pattern
- [ ] Add pillar to `src/specs/v2.6.4.ts` (if supporting older versions)

#### Phase 2: Content Files
- [ ] Create `content/questions-{pillar}.json` (48 questions)
- [ ] Create `content/practices-{pillar}.json` (21 practices)
- [ ] Create `content/objectives-{pillar}.json` (8 objectives)
- [ ] Create `content/initiatives-{pillar}.json` (9 initiatives)
- [ ] Validate all cross-references between files

#### Phase 3: Content Loader
- [ ] Update `buildSpecFromContent()` to accept pillar parameter
- [ ] Add pillar-specific file loading logic

#### Phase 4: Interpretation Pack
- [ ] Create `src/interpretation/pillars/{pillar}/config.ts`
- [ ] Define 5 sections with titles and guidance
- [ ] Define forbidden_phrases list
- [ ] Implement fallback_templates for each section
- [ ] Register pack in `src/interpretation/pillars/registry.ts`

#### Phase 5: Database
- [ ] Create migration adding `pillar_id` column
- [ ] Add index on `pillar_id`
- [ ] Seed pillars reference table (optional)

#### Phase 6: Frontend
- [ ] Create pillar-specific setup page (if needed)
- [ ] Update router with new routes
- [ ] Add objective-theme mappings to `OBJECTIVE_THEME_MAP`
- [ ] Test report display with new pillar data

#### Phase 7: API
- [ ] Ensure run creation captures `pillar_id`
- [ ] Verify report generation handles multiple pillars

#### Phase 8: Calibration
- [ ] Add pillar-specific weights (if different from defaults)

---

### Files Summary by Impact Level

| File | Impact | Action |
|------|--------|--------|
| `src/specs/loader.ts` | CRITICAL | Add to PILLARS array |
| `src/specs/schemas.ts` | CRITICAL | Update enum and regex |
| `src/interpretation/pillars/registry.ts` | CRITICAL | Register new pack |
| `src/interpretation/pillars/{id}/config.ts` | CRITICAL | NEW FILE — pack config |
| `content/questions-{pillar}.json` | CRITICAL | NEW FILE — 48 questions |
| `content/objectives-{pillar}.json` | CRITICAL | NEW FILE — 8 objectives |
| `content/practices-{pillar}.json` | CRITICAL | NEW FILE — 21 practices |
| `content/initiatives-{pillar}.json` | HIGH | NEW FILE — 9 initiatives |
| `supabase/migrations/` | HIGH | Add pillar_id column |
| `cfo-frontend/src/pages/PillarReport.jsx` | MEDIUM | Update theme map |
| `src/specs/v2.6.4.ts` | LOW | Backward compat (optional) |
| `src/reports/builder.ts` | NONE | Already pillar-agnostic |
| `src/risks/engine.ts` | NONE | Already pillar-agnostic |

---

### Testing Checklist

1. **Spec Loading** — Verify `getSpec()` returns all pillars in `spec.pillars`
2. **Question Loading** — Verify all 48 questions load with correct IDs
3. **Scoring** — Run full assessment and verify scores calculate correctly
4. **Report Generation** — Verify pillar report builds without errors
5. **Interpretation** — Test AI interpretation generates for new pillar
6. **Frontend** — Navigate through assessment and report for new pillar
7. **Database** — Verify `pillar_id` persists and queries work

---

## VS Backlog

| VS | Name | Priority | Status |
|----|------|----------|--------|
| VS-15 | Admin Dashboard | Medium | 📋 Backlog |
| VS-33 | Multi-Pillar Architecture | High | 📋 Backlog |
| VS-34 | Benchmarking Engine | Medium | 📋 Backlog |
| VS-35 | Trend Analysis | Low | 📋 Backlog |
| VS-36 | Email Reports | Low | 📋 Backlog |
| VS-37 | SSO Integration | Medium | 📋 Backlog |
| VS-38 | Pillar Creation Guide | 📚 Reference | ✅ Complete |

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
| VS-23 | Maturity Footprint | Dec 2025 | 21-practice capability grid |
| VS-24 | JSON Catalog | Dec 2025 | Content extraction to JSON |
| VS-25 | AI Interpretation | Dec 2025 | GPT-4o/mini pipeline |
| VS-28 | Action Planning | Dec 25, 2025 | War room simulator |
| VS-29 | Global Sidebar | Dec 25, 2025 | AppShell layout pattern |
| VS-30 | Theme Assessment | Dec 26, 2025 | 3-page MCQ with enterprise UI |
