# CFO Diagnostic Platform - Complete Project Reference

## Overview

A financial maturity assessment tool that helps organizations evaluate their finance function capabilities. Users answer diagnostic questions, the system scores their maturity level, identifies gaps, and provides actionable recommendations.

## Production URLs

| Component | URL |
|-----------|-----|
| **Frontend** | https://cfodiagnosisv1.vercel.app |
| **Backend API** | https://cfodiagnosisv1-production.up.railway.app |
| **GitHub Repo** | https://github.com/CanKoseoglu123/CFOdiagnosis_v1 |

---

## Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Express.js + TypeScript |
| Frontend | React 19 + Vite (JavaScript) |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Backend Hosting | Railway (auto-deploy on push) |
| Frontend Hosting | Vercel (auto-deploy on push) |

### Repository Structure

```
CFOdiagnosis_v1/
├── src/                          # Backend source code
│   ├── index.ts                  # Express server, API routes, middleware
│   ├── validateRun.ts            # Input validation logic
│   ├── spec.ts                   # Spec export
│   │
│   ├── specs/                    # Specification layer
│   │   ├── types.ts              # Spec interface definitions (with theme types)
│   │   ├── v2.6.4.ts             # Legacy spec (40 process questions)
│   │   ├── v2.7.0.ts             # Current spec (behavioral edition)
│   │   ├── registry.ts           # Spec version registry (default: v2.7.0)
│   │   └── toAggregateSpec.ts    # Spec transformation
│   │
│   ├── scoring/                  # Scoring engine
│   │   ├── scoreRun.ts           # Question scoring logic
│   │   ├── types.ts              # Scoring types
│   │   ├── guard.ts              # Score validation (0-1 range)
│   │   └── rules.ts              # Scoring rules
│   │
│   ├── results/                  # Aggregation
│   │   └── aggregate.ts          # Score aggregation (pure function)
│   │
│   ├── maturity/                 # Maturity evaluation
│   │   ├── engine.ts             # Gate evaluation (pure function)
│   │   ├── types.ts              # Maturity types
│   │   └── index.ts              # Exports
│   │
│   ├── reports/                  # Report generation
│   │   ├── builder.ts            # Report assembly
│   │   ├── types.ts              # Report DTOs
│   │   └── index.ts              # Exports
│   │
│   ├── actions/                  # Action derivation
│   │   ├── derive.ts             # Action plan generation
│   │   ├── types.ts              # Action types
│   │   └── index.ts              # Exports
│   │
│   ├── risks/                    # VS19: Critical Risk Engine
│   │   ├── types.ts              # CriticalRisk interface
│   │   ├── engine.ts             # deriveCriticalRisks (pure function)
│   │   └── index.ts              # Exports
│   │
│   └── tests/                    # QA test suites (569 tests total)
│       ├── vs5-qa.test.ts        # Aggregation tests
│       ├── vs6-qa.test.ts        # Report generation tests
│       ├── vs7-qa.test.ts        # Maturity evaluation tests
│       ├── vs8-qa.test.ts        # Action derivation tests
│       ├── vs9-qa.test.ts        # Content validation tests
│       ├── vs19-qa.test.ts       # Critical risk tests
│       └── vs20-qa.test.ts       # Dynamic action tests
│
├── cfo-frontend/                 # Frontend application
│   ├── src/
│   │   ├── main.jsx              # App entry point
│   │   ├── App.jsx               # Routes, auth, navigation
│   │   ├── IntroPage.jsx         # Assessment methodology intro
│   │   ├── SetupPage.jsx         # Context intake form (VS18)
│   │   ├── DiagnosticInput.jsx   # Assessment questionnaire UI
│   │   ├── FinanceDiagnosticReport.jsx  # Original report (V1)
│   │   ├── pages/
│   │   │   └── PillarReport.jsx  # V2.8.0 Enterprise report
│   │   ├── data/
│   │   │   └── spec.js           # Question titles, initiatives, lookups
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Supabase auth context
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx    # Auth guard
│   │   │   ├── AppShell.jsx          # Responsive layout wrapper
│   │   │   ├── AppShell.css          # Layout styles
│   │   │   ├── IntroSidebar.jsx      # Sidebar for intro page
│   │   │   ├── SetupSidebar.jsx      # Sidebar for setup page
│   │   │   ├── QuestionnaireSidebar.jsx  # Progress + themes
│   │   │   ├── ReportSidebar.jsx     # Navigation + actions
│   │   │   └── report/               # V2.8.0 Report components
│   │   │       ├── index.js          # Exports
│   │   │       ├── HeaderBar.jsx     # Sticky header
│   │   │       ├── ExecutiveSummary.jsx  # 3-column grid
│   │   │       ├── ScoreCard.jsx     # Execution score
│   │   │       ├── MaturityCard.jsx  # Maturity display
│   │   │       ├── AssessmentCard.jsx # Stats grid
│   │   │       ├── ObjectiveCard.jsx # Traffic light card
│   │   │       ├── InitiativeCard.jsx # Collapsible initiative
│   │   │       ├── ActionRow.jsx     # Dense action row
│   │   │       ├── PriorityTabs.jsx  # P1/P2/P3 tabs
│   │   │       ├── MaturityLadder.jsx # Levels 1-4
│   │   │       ├── CappedWarning.jsx # Alert banners
│   │   │       ├── EmptyState.jsx    # Victory message
│   │   │       ├── StatBox.jsx       # Quick stat
│   │   │       └── TabButton.jsx     # Tab navigation
│   │   └── lib/
│   │       └── supabase.js       # Supabase client
│   ├── tailwind.config.js        # Gartner enterprise colors
│   ├── postcss.config.js         # Tailwind v4 PostCSS
│   ├── vercel.json               # SPA routing config
│   ├── package.json
│   └── vite.config.js
│
├── supabase/
│   └── migrations/               # Database migrations
│       └── 20241220_vs18_context_intake.sql
│
├── spec/
│   ├── SPEC_v2.6.4.md            # Legacy specification document
│   └── SPEC_v2.7.0.md            # Current specification (behavioral edition)
│
├── dist/                         # Compiled TypeScript output
├── package.json
├── tsconfig.json
└── claude.md                     # This file
```

---

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check | No |
| GET | `/api/spec` | Get full spec (pillars, questions, gates) | No |
| POST | `/diagnostic-runs` | Create new diagnostic run | Yes |
| GET | `/diagnostic-runs/:id` | Get run details (status, context) | Yes |
| POST | `/diagnostic-runs/:id/setup` | Save context (company, industry) | Yes |
| POST | `/diagnostic-inputs` | Save question answer | Yes |
| POST | `/diagnostic-runs/:id/complete` | Mark run as complete | Yes |
| POST | `/diagnostic-runs/:id/score` | Calculate scores for run | Yes |
| GET | `/diagnostic-runs/:id/calibration` | Get calibration data (VS21) | Yes |
| POST | `/diagnostic-runs/:id/calibration` | Save importance map (VS21) | Yes |
| GET | `/diagnostic-runs/:id/results` | Get aggregated results | Yes |
| GET | `/diagnostic-runs/:id/report` | Get full report (with calibration) | Yes |

### Authentication
- Bearer token in Authorization header
- Token obtained from Supabase Auth
- Each request creates authenticated Supabase client for RLS

---

## Database Schema (Supabase)

### Tables

**diagnostic_runs**
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users)
- `status` (text): NOT_STARTED | IN_PROGRESS | COMPLETED | LOCKED
- `spec_version` (text): e.g., "2.7.0"
- `context` (jsonb): `{company_name, industry}` - VS18
- `setup_completed_at` (timestamptz): When context intake was completed - VS18
- `calibration` (jsonb): `{importance_map: {...}, locked: [...]}` - VS21
- `created_at`, `updated_at`

**diagnostic_inputs**
- `id` (uuid, PK)
- `run_id` (uuid, FK)
- `question_id` (text)
- `value` (boolean/jsonb)
- `created_at`

**diagnostic_scores**
- `id` (uuid, PK)
- `run_id` (uuid, FK)
- `question_id` (text)
- `score` (numeric, 0-1)
- `created_at`

### Row Level Security (RLS)
- Users can only access their own diagnostic runs
- Enforced at database level via Supabase RLS policies

---

## Core Business Logic

### Diagnostic Flow (State Machine)
```
NOT_STARTED → IN_PROGRESS → COMPLETED → LOCKED
     │              │             │
     └── create ────┘             │
                    └── complete ─┘
                                  └── score → report
```

### Scoring System
1. **Question Scores**: Each answer → normalized score (0-1)
2. **Pillar Scores**: Weighted average of question scores within pillar
3. **Overall Score**: Weighted average of pillar scores
4. **Maturity Level**: Determined by sequential gates (must pass all previous)

### Maturity Levels
| Level | Name | Requirements |
|-------|------|--------------|
| 1 | Emerging | Pass Level 1 critical questions |
| 2 | Defined | Level 1 + Level 2 gates |
| 3 | Managed | Level 2 + Level 3 gates |
| 4 | Optimized | Level 3 + Level 4 gates |

### Key Principles (DO NOT VIOLATE)
1. **Current spec is v2.7.0** — Behavioral edition with theme layer
2. **Scoring is pure functions** — No side effects, deterministic
3. **Missing answers = 0 score** — Conservative scoring
4. **Gates are sequential** — Must pass all previous levels
5. **Evidence-based** — No subjective scoring

---

## Frontend Flow

### Routes
| Path | Component | Auth |
|------|-----------|------|
| `/` | Home | No |
| `/login` | LoginPage | No |
| `/run/:runId/setup` | SetupPage | Yes |
| `/run/:runId/intro` | IntroPage | Yes |
| `/assess` | DiagnosticInput | Yes |
| `/run/:runId/calibrate` | CalibrationPage (VS21) | Yes |
| `/report/:runId` | PillarReport (V2.8.0 - Main) | Yes |
| `/report-legacy/:runId` | FinanceDiagnosticReport (V1) | Yes |

### Assessment Flow
1. User clicks "Start Assessment"
2. POST `/diagnostic-runs` creates new run
3. Redirect to `/run/:id/setup` (context intake)
4. User enters company name and industry
5. POST `/diagnostic-runs/:id/setup` saves context
6. Redirect to `/run/:id/intro` (methodology explanation)
7. User clicks "Begin Assessment"
8. Redirect to `/assess?runId=:id`
9. User answers Yes/No to each question
10. Each answer → POST `/diagnostic-inputs`
11. User clicks "Submit"
12. POST `/diagnostic-runs/:id/complete`
13. POST `/diagnostic-runs/:id/score`
14. **Redirect to `/run/:id/calibrate` (VS21 - priority calibration)**
15. **User sets objective importance levels (optional)**
16. **POST `/diagnostic-runs/:id/calibration` saves calibration**
17. Redirect to `/report/:runId`
18. GET `/diagnostic-runs/:id/report` displays results (with calibrated scores)

### Current Questions (48 FP&A questions) - v2.7.1

| Level | Questions | Critical | Objectives |
|-------|-----------|----------|------------|
| Level 1 (Emerging) | 9 | 4 | Budget Foundation, Financial Controls |
| Level 2 (Defined) | 14 | 4 | Variance Analysis, Forecasting |
| Level 3 (Managed) | 15 | 0 | Driver-Based Planning, Scenario Modeling |
| Level 4 (Optimized) | 10 | 0 | Integrated Planning, Predictive Analytics |
| **Total** | **48** | **8** | **8** |

---

## Environment Variables

### Backend (Railway)
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
PORT=8080  # Auto-set by Railway
CORS_ORIGIN=https://cfodiagnosisv1.vercel.app  # Optional override
```

### Frontend (Vercel)
```
VITE_API_URL=https://cfodiagnosisv1-production.up.railway.app
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## Development

### Run Backend Locally
```bash
cd CFOdiagnosis_v1
npm install
npm run dev          # Uses ts-node, runs on localhost:3000
```

### Run Frontend Locally
```bash
cd CFOdiagnosis_v1/cfo-frontend
npm install
npm run dev          # Vite dev server with HMR
```

### Run Tests
```bash
npm run test:vs5     # Aggregation tests (22 tests)
npm run test:vs6     # Report tests (35 tests)
npm run test:vs7     # Maturity tests (34 tests)
npm run test:vs8     # Action tests (23 tests)
npm run test:vs9     # Content validation tests (411 tests)
npm run test:vs19    # Critical risk tests (15 tests)
npm run test:vs20    # Dynamic action tests (29 tests)
npm run test:all     # All tests (569 total)
```

### Build for Production
```bash
# Backend
npm run build        # Compiles TypeScript to dist/

# Frontend
cd cfo-frontend
npm run build        # Vite build to dist/
```

---

## Deployment

### CI/CD
- **Backend**: Push to `main` → Railway auto-deploys
- **Frontend**: Push to `main` → Vercel auto-deploys

### CORS Configuration
- Backend restricts CORS to `https://cfodiagnosisv1.vercel.app`
- Override with `CORS_ORIGIN` env var if needed

### Health Check
- Railway uses `/health` endpoint
- Returns 200 OK when server is ready

---

## V1.0 Status - LIVE

**Release Date:** December 21, 2025

| Feature | Status |
|---------|--------|
| VS1-VS12: Core diagnostic flow | ✅ Complete |
| VS13: PDF Export | ✅ Complete |
| VS14: Content Hydration | ✅ Complete |
| VS16: Production deployment | ✅ Complete |
| VS18: Context Intake | ✅ Complete |
| VS19: Critical Risk Engine | ✅ Complete |
| VS20: Dynamic Action Engine | ✅ Complete |
| VS21: Objective Importance Matrix | ✅ Complete |
| v2.7.0 Behavioral Edition | ✅ Complete |
| v2.7.1 Content Update (48 questions) | ✅ Complete |
| AppShell Responsive Layout | ✅ Complete |
| IntroPage (methodology) | ✅ Complete |
| V2.8.0 Enterprise Report UI | ✅ Complete |
| VS15: Admin Dashboard | ❌ Post-V1 |

---

## PDF Export (VS13)

**Implementation:** Browser-native print using `react-to-print`

**How it works:**
1. User clicks "Download PDF" button on report page
2. Browser print dialog opens
3. User selects "Save as PDF" destination
4. PDF preserves colors, hides interactive elements

**Key files:**
- `cfo-frontend/src/FinanceDiagnosticReport.jsx` - Print button + ref
- `cfo-frontend/src/index.css` - `@media print` styles

**CSS utilities:**
- `.no-print` - Hides elements in print (buttons, tabs)
- `[data-print-card]` - Prevents page breaks inside cards
- `-webkit-print-color-adjust: exact` - Preserves background colors

---

## Content Hydration (VS14)

**Problem solved:** Questions were hardcoded in frontend (DRY violation)

**Solution:** Single Source of Truth - frontend fetches spec from backend

**New endpoint:** `GET /api/spec`
```json
{
  "version": "v2.6.4",
  "pillars": [...],
  "questions": [...],
  "maturityGates": [...]
}
```

**Frontend hierarchy:**
- Pillar (dark header with name + progress)
  - Level 1: Emerging (collapsible, color-coded)
    - Question cards
  - Level 2: Defined
    - Question cards
  - ...

**Key files:**
- `src/index.ts` - `/api/spec` endpoint
- `cfo-frontend/src/DiagnosticInput.jsx` - Fetches and renders hierarchy

---

## Context Intake (VS18)

**Problem solved:** No company context captured before assessment

**Solution:** Minimal setup page collects company_name and industry before questions

**New database columns:**
- `context` (JSONB): Stores `{company_name, industry}`
- `setup_completed_at` (TIMESTAMPTZ): Gating timestamp

**New endpoints:**
- `GET /diagnostic-runs/:id` - Returns run details including context
- `POST /diagnostic-runs/:id/setup` - Saves context, sets setup_completed_at

**Flow:**
1. User clicks "Start Assessment"
2. Run created, redirected to `/run/:id/setup`
3. User enters company name and industry
4. Context saved, redirected to `/assess?runId=:id`
5. Report header displays context (graceful fallback for legacy runs)

**Key files:**
- `src/index.ts` - Setup endpoints
- `cfo-frontend/src/SetupPage.jsx` - Setup form UI
- `cfo-frontend/src/DiagnosticInput.jsx` - Routing guard
- `cfo-frontend/src/FinanceDiagnosticReport.jsx` - Context in header
- `supabase/migrations/20241220_vs18_context_intake.sql` - Schema migration

---

## Critical Risk Engine (VS19)

**Problem solved:** Missing or unanswered critical questions were not flagged as risks

**Solution:** "Silence is a Risk" philosophy - any critical question without `true` answer generates a risk

**Key Logic:**
- Risk generated if: `is_critical === true` AND `answer !== true`
- Only safe if: answer is strictly boolean `true`
- False, null, undefined, strings, numbers → all generate risks

**New module:** `src/risks/`
- `types.ts` - CriticalRisk interface with severity and pillar_name
- `engine.ts` - deriveCriticalRisks pure function
- `index.ts` - exports

**Report changes:**
- CriticalRisk now includes `pillar_name` and `severity: "CRITICAL"`
- Report shows risks even for unanswered critical questions

**Frontend changes:**
- RiskCard updated with white background for print legibility
- High-contrast dark red border (#DC2626)
- Displays severity and pillar name

**Tests:** `npm run test:vs19` (15 test cases)

---

## Dynamic Action Engine (VS20)

**Problem solved:** Actions were hardcoded per question, priority was static

**Solution:** Actions attach to Objectives (L3) with priority derived dynamically

**Key concepts:**
- Objective layer groups related questions (e.g., "Budget Foundation" = annual budget + budget owner)
- Priority is computed at runtime:
  - HIGH: Objective has critical risk OR blocks maturity advancement
  - MEDIUM: Objective incomplete but not critical/blocking
- Satisfied objectives do not generate actions

**New types:**
- `SpecObjective`: Groups questions, links to action
- `DerivedAction`: Runtime-computed action with derived_priority

**New module:** `src/actions/deriveFromObjectives.ts`
- `deriveActionsFromObjectives(spec, inputs, criticalRisks, maturity)` - pure function
- Returns sorted, deduplicated actions

**Report changes:**
- `derived_actions?: DerivedAction[]` added to FinanceReportDTO
- Both legacy `actions` and new `derived_actions` returned for backward compat

**Frontend changes:**
- `DerivedActionCard` component displays objective-based actions
- Shows objective name, maturity level, trigger reason
- Falls back to legacy actions if derived_actions empty

**Tests:** `npm run test:vs20` (29 test cases)

---

## Criticality Configuration ("Fair but Firm")

**Philosophy:** Not every unanswered question is fatal. Only foundational controls trigger critical risks.

**Distribution (v2.7.1):**

| Level | Questions | Critical | Non-Critical | Rationale |
|-------|-----------|----------|--------------|-----------|
| L1 (Emerging) | 9 | 4 | 5 | Core budget/control fundamentals |
| L2 (Defined) | 14 | 4 | 10 | Key variance/forecast processes |
| L3 (Managed) | 15 | 0 | 15 | Advanced practices, not fatal |
| L4 (Optimized) | 10 | 0 | 10 | Excellence indicators, not fatal |
| **Total** | **48** | **8** | **40** | |

**Critical Questions (L1) - 4 total:**
- fpa_l1_q01: Annual budget exists
- fpa_l1_q02: Full P&L budget
- fpa_l1_q05: Chart of accounts
- fpa_l1_q06: Approval controls

**Critical Questions (L2) - 4 total:**
- fpa_l2_q01: Monthly BvA report
- fpa_l2_q02: Variance investigation
- fpa_l2_q06: Collaborative planning system
- fpa_l2_q07: Cash flow forecast

**Tests:** `npm run test:vs9` validates critical question counts

---

## Known Issues & Notes

1. **node_modules committed**: Some node_modules were accidentally committed. Consider cleaning with `git rm -r --cached node_modules` and updating `.gitignore`

2. **CFOdiagnosis_v2**: Separate repo exists but is just a placeholder. The real frontend is in `CFOdiagnosis_v1/cfo-frontend/`

3. **TypeScript strict mode**: Backend uses strict TypeScript. Map callbacks need explicit type annotations.

4. **erasableSyntaxOnly**: Frontend tsconfig has this enabled - cannot use `enum`, use `const` objects instead

---

## Quick Reference

### Create a new diagnostic run
```bash
curl -X POST https://cfodiagnosisv1-production.up.railway.app/diagnostic-runs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### Check API health
```bash
curl https://cfodiagnosisv1-production.up.railway.app/health
```

### Supabase Dashboard
Access via: https://app.supabase.com (login required)

---

## v2.7.0 Behavioral Edition

**Problem solved:** The diagnostic was assessing "process existence" (Junior Auditor) instead of "organizational health" (Senior Partner)

**Solution:** Rewrote 23 questions from process-checking to behavioral assessment

**Question Distribution:**

| Type | Count | Location |
|------|-------|----------|
| Process Questions | 17 | Foundation (15) + Forecasting critical (2) |
| Behavioral Questions | 23 | Future (13) + Intelligence (10) |
| **Total** | **40** | |

**Theme Layer:**

| Theme | Icon | Objectives | Questions |
|-------|------|------------|-----------|
| The Foundation 🏛️ | Process | Budget, Control, Variance | 15 (8 critical) |
| The Future 🔮 | Behavioral | Forecast, Driver, Integrate | 15 (2 critical) |
| The Intelligence 🧠 | Behavioral | Scenario, Predict | 10 (0 critical) |

**Example Transformation:**

| Before (Process) | After (Behavioral) |
|-----------------|-------------------|
| "Are assumptions documented?" | "When the forecast is wrong, does Finance lead a blameless post-mortem?" |
| "Is model linked to drivers?" | "When Finance says 'we can't afford this hire,' does leadership accept it or demand the model be 'fixed'?" |

**Key files:**
- `src/specs/v2.7.0.ts` - Behavioral questions and theme assignments
- `src/specs/types.ts` - ThemeCode, ThemeMetadata types
- `spec/SPEC_v2.7.0.md` - Full specification document
- `cfo-frontend/src/DiagnosticInput.jsx` - Theme-based UI grouping

---

## AppShell Layout (V1.0)

**Problem solved:** Inconsistent layout across pages, no sidebar navigation

**Solution:** Unified AppShell wrapper with responsive sidebar

### Components Created
```
cfo-frontend/src/components/
├── AppShell.jsx          # Main layout wrapper
├── AppShell.css          # Responsive styles
├── IntroSidebar.jsx      # What You'll Get preview
├── SetupSidebar.jsx      # Setup progress steps
├── QuestionnaireSidebar.jsx  # Progress + themes + submit
└── ReportSidebar.jsx     # Company info + navigation + actions
```

### Layout Behavior
| Viewport | Sidebar | Header |
|----------|---------|--------|
| Desktop (≥1024px) | Fixed 280px left, white bg | Hidden |
| Mobile (<1024px) | Hidden (slide-in on hamburger) | Dark header with hamburger |

### Usage Pattern
```jsx
<AppShell sidebarContent={<QuestionnaireSidebar ... />}>
  {/* Page content */}
</AppShell>
```

### Key Styles
- Sidebar: `#FFFFFF` background, `#E5E7EB` border
- Logo section: `#1F2937` text
- Progress bar: `#4F46E5` fill
- Print: Sidebar hidden via `@media print`

---

## V2.8.0 Enterprise Report UI

**Problem solved:** Original report needed a more enterprise-friendly design with better component organization.

**Solution:** New report page at `/report-v2/:runId` with Gartner-inspired styling and modular components.

### Tech Stack
- **Tailwind CSS v4** with `@tailwindcss/postcss` plugin
- **Gartner Enterprise Colors**: Navy (#172B4D), Slate (#42526E), Primary (#0052CC)
- **Sharp corners**: `rounded-sm` (2px) instead of rounded corners
- **No shadows**: Clean flat design

### Component Architecture
```
src/components/report/
├── HeaderBar.jsx         # Sticky header with stats + tabs
├── ExecutiveSummary.jsx  # 3-column grid container
│   ├── ScoreCard.jsx     # Execution score with progress bar
│   ├── MaturityCard.jsx  # Level display with bar indicators
│   └── AssessmentCard.jsx # Questions/critical stats
├── ObjectiveCard.jsx     # Traffic light with left border
├── InitiativeCard.jsx    # Collapsible with nested actions
│   └── ActionRow.jsx     # Dense tabular row
├── PriorityTabs.jsx      # P1/P2/P3 (never disabled)
├── MaturityLadder.jsx    # Levels 1-4 table
├── CappedWarning.jsx     # Yellow alert + OnTrackBanner
└── EmptyState.jsx        # Victory message when count=0
```

### Data Layer
```javascript
// src/data/spec.js
LEVEL_NAMES = {1: 'Emerging', 2: 'Defined', 3: 'Managed', 4: 'Optimized'}
LEVEL_THRESHOLDS = {1: 0, 2: 50, 3: 80, 4: 95}
INITIATIVES = [...] // 9 initiatives with metadata
QUESTION_TITLES = {...} // Human-readable titles for all 48 questions

// Lookup functions
getQuestionTitle(id) → string
getLevelName(level) → string
getInitiative(id) → Initiative
```

### Key UX Decisions
1. **No Level 0** - Maturity ladder shows only Levels 1-4
2. **P1/P2/P3 tabs never disabled** - Show ✓ when count=0
3. **Mobile-safe** - Score/Effort columns hidden on small screens
4. **Human-readable titles** - No question IDs shown to users

### URLs
- **Main Report**: `https://cfodiagnosisv1.vercel.app/report/:runId` (V2.8.0 PillarReport)
- **Legacy Report**: `https://cfodiagnosisv1.vercel.app/report-legacy/:runId` (V1)

### Features
- **Recommendations** display in ActionRow when expanded (blue left border, prominent styling)
- **Initiative grouping** - Actions grouped under parent initiatives with P1/P2/P3 priority
- **Priority tabs** - P1 (Unlock), P2 (Optimize), P3 (Future)

### Pending Design Decision
Alternative visualization approaches for P1/P2/P3 to show recommendations without hiding them:
- **Option A**: Priority Lanes - Vertical zones with decreasing visual weight
- **Option B**: Recommendation-First Cards - Flip structure, recommendation is hero, details collapse
- **Option C**: Executive Summary + Deep Dive - Top summary cards + detailed sections below
- **Option D**: Single Stream - Visual hierarchy through typography/spacing

---

## VS21: Objective Importance Matrix (Calibration Layer)

**Problem solved:** All objectives treated equally regardless of organizational priorities.

**Solution:** User-declared importance (1-5 scale) that multiplies action scores.

### Database Schema
```sql
ALTER TABLE diagnostic_runs
ADD COLUMN calibration JSONB DEFAULT '{}'::jsonb;

-- JSONB Shape:
-- {
--   "importance_map": { "obj_fpa_l1_budget": 5, "obj_fpa_l2_variance": 3, ... },
--   "locked": ["obj_fpa_l1_budget"]  -- Safety Valve applied
-- }
```

### Importance Levels & Multipliers

| Level | Label | Multiplier | Use Case |
|-------|-------|------------|----------|
| 5 | Critical | 1.50x | Top organizational priority |
| 4 | High | 1.25x | Important focus area |
| 3 | Medium | 1.00x | Default (no adjustment) |
| 2 | Low | 0.75x | Lower priority this cycle |
| 1 | Minimal | 0.50x | Deprioritized |

### Score Formula
```
Score = (Impact² / Complexity) × CriticalBoost × ImportanceFactor
```

Where:
- `Impact` = Question impact (1-5)
- `Complexity` = Implementation complexity (1-5)
- `CriticalBoost` = 2x if `is_critical`
- `ImportanceFactor` = IMPORTANCE_MULTIPLIERS[importance] (0.5x to 1.5x)

### Safety Valve
**Critical failures cannot be deprioritized.** If an objective contains a failed critical question, its importance is locked at 5 (Critical Priority) and cannot be changed.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/diagnostic-runs/:id/calibration` | Get calibration data (with defaults + locked objectives) |
| POST | `/diagnostic-runs/:id/calibration` | Save importance_map (Safety Valve auto-applied) |

### Frontend Components

**CalibrationPage** (`/run/:runId/calibrate`)
- Shows all 8 objectives grouped by theme
- 5-button importance selector (Min/Low/Med/High/Crit)
- Locked objectives shown with red styling + lock icon
- Submit saves to API → redirects to report

**ActionRow** (importance badge)
- Shows importance badge when non-default (not 3)
- Color-coded: red (5), orange (4), slate (2), light slate (1)

### User Flow
```
Questionnaire → Complete → Calibration → Report
                    ↓
              /run/:runId/calibrate
                    ↓
              Set importance levels
                    ↓
              /report/:runId (with weighted scores)
```

### Key Files
- `src/actions/types.ts` - CalibrationData, ImportanceLevel, IMPORTANCE_MULTIPLIERS
- `src/actions/prioritizeActions.ts` - Score calculation with ImportanceFactor
- `src/index.ts` - GET/POST calibration endpoints
- `cfo-frontend/src/pages/CalibrationPage.jsx` - Calibration UI
- `cfo-frontend/src/components/report/ActionRow.jsx` - Importance badges
- `supabase/migrations/20241223_vs21_calibration_column.sql` - Migration

---

## Session Log

### December 23, 2025 - VS21 Objective Importance Matrix

**Completed:**

1. **VS21 Backend Implementation**
   - Added `calibration` JSONB column to `diagnostic_runs` table
   - Added CalibrationData, ImportanceLevel types with 0.5x-1.5x multipliers
   - Added GET/POST `/diagnostic-runs/:id/calibration` endpoints
   - Implemented Safety Valve: lock objectives with failed criticals at importance=5
   - Updated action scoring: Score = (Impact² / Complexity) × CriticalBoost × ImportanceFactor

2. **VS21 Frontend Implementation**
   - Created CalibrationPage with ObjectiveImportanceCard UI
   - Updated navigation: Questionnaire → Calibration → Report
   - Added importance badges to ActionRow (shown when non-default)
   - Added IMPORTANCE_CONFIG to spec.js data layer

3. **End-to-End Testing**
   - Created `test-vs21-flow.js` comprehensive test script
   - Verified all 8 steps pass: create → setup → answer → complete → score → calibrate → report
   - Confirmed importance-weighted scores appear in report

**Key Commits:**
- `c73324d` - VS21: Objective Importance Matrix - Calibration Layer
- `bac9d9e` - Fix calibration endpoint to handle missing column gracefully
- `3241868` - VS21: Complete implementation and testing

**Test Results:**
```
Run ID: 3eed1bae-fc5d-41c8-8d78-daf0746315a1
Execution Score: 67%
Actions with Importance: 10
- "Assign Budget Ownership" (importance=5) → Score 24
- "Build Driver Literacy" (importance=4) → Score 6.7
- "Create Challenge Culture" (importance=1) → Score 3.1
```

---

### December 22, 2025 (Evening) - Report Production Launch

**Completed:**

1. **PillarReport Now Main Report**
   - `/report/:runId` → PillarReport (V2.8.0)
   - `/report-legacy/:runId` → FinanceDiagnosticReport (V1 backup)

2. **Recommendations Display**
   - Added recommendation field to ActionRow component
   - Blue left border, prominent styling when expanded
   - Tested with new assessment - all 48 questions have recommendations

3. **Production Verification**
   - Created test run: `3a18ce26-9ddc-4e2b-92d3-925dea18acef`
   - Verified 4 initiative groups with P1/P2 actions
   - Recommendations confirmed in API response

4. **Design Discussion**
   - User feedback: "pretty good" but wants recommendations visible without hiding
   - Proposed 4 alternative visualizations (A-D)
   - Decision deferred to next session

**Key Commits:**
- `0a6e697` - Make PillarReport the main report at /report/:runId
- `f2d737a` - Add recommendation display to ActionRow component

---

### December 22, 2025 (Morning) - V2.8.0 Enterprise Report UI

**Completed Today:**

1. **V2.8.0 Frontend Implementation**
   - Installed Tailwind CSS v4 with `@tailwindcss/postcss` plugin
   - Created Gartner enterprise color theme (navy, slate, primary, status colors)
   - Added data layer (`src/data/spec.js`) with question titles and lookup helpers
   - Created 15 report components in `src/components/report/`
   - Added new PillarReport page at `/report-v2/:runId`

2. **Component Library Created:**
   - `HeaderBar` - Sticky header with quick stats and tab navigation
   - `ExecutiveSummary` - 3-column grid (Score, Maturity, Assessment)
   - `ScoreCard`, `MaturityCard`, `AssessmentCard` - Summary cards
   - `ObjectiveCard` - Traffic light health indicator
   - `InitiativeCard` - Collapsible card with nested actions
   - `ActionRow` - Dense tabular action with mobile-safe columns
   - `PriorityTabs` - P1/P2/P3 tabs (never disabled, ✓ when count=0)
   - `MaturityLadder` - Levels 1-4 only (no Level 0)
   - `CappedWarning`, `OnTrackBanner` - Alert banners
   - `EmptyState`, `StatBox`, `TabButton` - Utilities

3. **Vercel SPA Routing Fix**
   - Added `vercel.json` with rewrites for client-side routing

**Key Commits:**
- `8b8eac2` - V2.8.0 Frontend: Enterprise report UI with Gartner styling
- `359711e` - Add Vercel SPA routing config for client-side routes

**Files Created:**
- `cfo-frontend/src/pages/PillarReport.jsx` - Main report page
- `cfo-frontend/src/data/spec.js` - Question titles, initiatives, lookups
- `cfo-frontend/src/components/report/*.jsx` - 15 components
- `cfo-frontend/tailwind.config.js` - Gartner colors
- `cfo-frontend/postcss.config.js` - Tailwind v4 config
- `cfo-frontend/vercel.json` - SPA routing

---

### December 21, 2025 - V2.1 Initiative Engine + Bug Fixes

**Completed:**

1. **V2.1 Initiative Engine** (Backend + Frontend)
   - Backend: `src/reports/builder.ts` now returns `grouped_initiatives` in report
   - 9 initiatives across 3 themes (Foundation: 4, Future: 3, Intelligence: 2)
   - Actions grouped under parent Initiative with P1/P2/P3 priority
   - Frontend: `PrioritizedActionsV2.jsx` renders Initiative cards with nested actions

2. **Human-Readable Question Text**
   - Fixed ObjectiveTrafficLights showing raw question IDs
   - Fetches spec data and builds questions lookup with `expert_action.title`
   - Passes `questions` prop to V2 components

3. **Maturity Level Display Bug Fix** (commit `b869858`)
   - Added `LEVEL_NAMES` constant: `{1: "Emerging", 2: "Defined", 3: "Managed", 4: "Optimized"}`
   - Filtered out Level 0 "Ad-hoc" from MaturityLadder (model is 1-4 only)
   - Fixed header to use `getLevelName()` instead of API's `achieved_label`

**Key Commits:**
- `ec5d81a` - Fix question IDs to show human-readable text
- `8054a70` - Group actions by Initiative (P1/P2/P3 tabs)
- `b869858` - Fix maturity level display

---

### Known Issues

1. **V2.8.0 Report Design** - Functional but needs visual polish (Tailwind v4 colors not fully applying)
2. **API Level 0** - Backend still returns Level 0 "Ad-hoc" in `maturityGates` (frontend filters it out)
3. **Test utilities** - Test files in repo root should be moved to `scripts/`

### Next Steps

**Immediate (Next Session):**
- Decide on priority visualization approach (Options A-D)
- Implement chosen design to show recommendations without hiding

**Design Polish (V2.8.0 Report):**
- Fix Tailwind v4 color theming
- Refine spacing and layout
- Consider switching to inline styles for reliability

**Post-V1 Feature Backlog:**
- VS15: Admin Dashboard
- Multi-Pillar expansion (Liquidity, Treasury, Tax)
- Benchmarking against industry peers

---

## Post-V1.0 Roadmap

| Feature | Priority | Description |
|---------|----------|-------------|
| VS15: Admin Dashboard | Medium | View all runs, export analytics |
| Multi-Pillar | High | Add Liquidity, Treasury, Tax |
| Benchmarking | Medium | Compare against industry peers |
| Trend Analysis | Low | Track maturity over time |
| Email Reports | Low | Send PDF via email |
| SSO Integration | Medium | Enterprise auth |

---

## Contact & Resources

- **GitHub**: https://github.com/CanKoseoglu123/CFOdiagnosis_v1
- **Production Frontend**: https://cfodiagnosisv1.vercel.app
- **Production API**: https://cfodiagnosisv1-production.up.railway.app
- **Spec Document**: `spec/SPEC_v2.7.0.md`
- **Railway Dashboard**: https://railway.app
- **Vercel Dashboard**: https://vercel.com
