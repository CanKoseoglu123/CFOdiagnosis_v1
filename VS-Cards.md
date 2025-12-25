# VS-Cards — Version Sprints Roadmap

**Last Updated:** December 25, 2025
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

## VS-30: UX Polish & MCQ Separation (NEXT)

**Status:** 📋 Planned
**Priority:** High
**Sprint:** December 26, 2025

### Problem Statement
The assessment questionnaire needs to be separated into 3 pages (one per theme) with improved look and feel matching the Action Planning quality. The maturity ladder visualization needs completion.

### Deliverables

| Component | Description |
|-----------|-------------|
| Theme-Based MCQ Pages | Separate assessment into 3 theme pages |
| Card-Based Question UI | Individual cards per question with clear fonts |
| Maturity Ladder Completion | Finalize the ladder visualization |
| Progress Indicators | Clear progress through themes |
| Consistent Design System | Match Action Planning quality |

### Themes for MCQ Pages

1. **Foundation** — L1/L2 questions (Budget, Controls, Variance, Forecasting)
2. **Future** — L3 questions (Driver-Based Planning, Scenario Modeling)
3. **Intelligence** — L4 questions (Strategic Influence, Predictive Analytics)

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

## VS Backlog

| VS | Name | Priority | Status |
|----|------|----------|--------|
| VS-15 | Admin Dashboard | Medium | 📋 Backlog |
| VS-33 | Multi-Pillar Architecture | High | 📋 Backlog |
| VS-34 | Benchmarking Engine | Medium | 📋 Backlog |
| VS-35 | Trend Analysis | Low | 📋 Backlog |
| VS-36 | Email Reports | Low | 📋 Backlog |
| VS-37 | SSO Integration | Medium | 📋 Backlog |

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
