# CFO Diagnostic Platform - Project Reference

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
│   ├── specs/                    # Specification layer
│   │   ├── types.ts              # Spec interface definitions
│   │   ├── schemas.ts            # Zod validation schemas
│   │   ├── loader.ts             # JSON content loaders
│   │   └── registry.ts           # Spec version registry (default: v2.9.0)
│   ├── gates/                    # Critical gate definitions (SSOT)
│   │   └── index.ts              # Centralized gate loader from content/gates.json
│   ├── scoring/                  # Scoring engine (pure functions)
│   ├── results/                  # Score aggregation
│   ├── maturity/                 # Maturity evaluation + footprint
│   ├── reports/                  # Report generation
│   ├── actions/                  # Action derivation + calibration
│   ├── risks/                    # Critical risk engine
│   ├── interpretation/           # AI interpretation layer (VS-25)
│   └── tests/                    # QA test suites
│
├── content/                      # JSON content catalog (v2.9.0)
│   ├── questions.json            # 79 FP&A questions (practice_id linkage)
│   ├── practices.json            # 27 practices
│   ├── initiatives.json          # 9 initiatives
│   ├── objectives.json           # 9 objectives
│   └── gates.json                # Maturity gates
│
├── cfo-frontend/                 # Frontend application
│   ├── src/
│   │   ├── App.jsx               # Routes, auth, navigation
│   │   ├── pages/
│   │   │   ├── PillarReport.jsx  # Main report with 4 tabs (VS-39)
│   │   │   ├── ExecutiveReportPage.jsx # PDF-ready executive summary (VS-45)
│   │   │   ├── PersonaConfirmationPage.jsx # Persona classification display (VS-27c)
│   │   │   └── CalibrationPage.jsx # VS21 importance calibration
│   │   ├── components/
│   │   │   ├── AppShell.jsx      # Responsive layout wrapper
│   │   │   ├── WorkflowSidebar.jsx # Report sidebar (VS-29)
│   │   │   ├── assessment/
│   │   │   │   └── AssessmentSidebar.jsx # Assessment sidebar (VS-42)
│   │   │   ├── ChapterHeader.jsx # Unified dark header (VS-30)
│   │   │   ├── EnterpriseCanvas.jsx # Max-width content wrapper (VS-30)
│   │   │   ├── ExecutiveSpine.jsx # Report header component (VS-30)
│   │   │   ├── ExecutiveSummaryV2.jsx # Executive Report content (VS-45)
│   │   │   └── report/           # Report components
│   │   │       ├── ActionPlanTab.jsx   # Action Planning (VS-28)
│   │   │       ├── SimulatorHUD.jsx    # Score + maturity level projections (VS-38)
│   │   │       ├── CommandCenter.jsx   # Gap list with controls (VS-28)
│   │   │       ├── ActionSidebar.jsx   # Planning progress + AI placeholder (VS-38)
│   │   │       ├── PriorityMatrix.jsx  # BCG-style triage grid (VS-33)
│   │   │       └── ObjectivesPracticesOverview.jsx # Objectives grid
│   │   ├── utils/
│   │   │   └── matrixUtils.js    # Priority Matrix data derivation (VS-33)
│   │   └── data/
│   │       └── spec.js           # Question titles, lookups
│   └── tailwind.config.js        # Gartner enterprise colors
│
├── supabase/migrations/          # Database migrations
├── spec/                         # Specification documents
└── scripts/                      # Test utilities
```

---

## Key Principles (DO NOT VIOLATE)

1. **Current spec is v2.9.0** — Question → Practice → Objective schema
2. **Scoring is pure functions** — No side effects, deterministic
3. **Missing answers = 0 score** — Conservative scoring
4. **Gates are sequential** — Must pass all previous levels
5. **Critical failures surface in Priority Matrix** — Forced to Strategic Focus row
6. **Critical gates from SSOT** — All gate constants imported from `src/gates/index.ts`, never hardcoded

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Health check | No |
| GET | `/api/spec` | Get full spec | No |
| POST | `/diagnostic-runs` | Create new run | Yes |
| GET | `/diagnostic-runs/:id` | Get run details | Yes |
| POST | `/diagnostic-runs/:id/setup` | Save context | Yes |
| POST | `/diagnostic-inputs` | Save answer | Yes |
| POST | `/diagnostic-runs/:id/complete` | Mark complete | Yes |
| POST | `/diagnostic-runs/:id/score` | Calculate scores | Yes |
| GET/POST | `/diagnostic-runs/:id/calibration` | Importance calibration (VS21) | Yes |
| GET | `/diagnostic-runs/:id/report` | Get full report | Yes |
| POST | `/diagnostic-runs/:id/interpret/start` | Start AI interpretation (VS25) | Yes |
| GET | `/diagnostic-runs/:id/interpret/status` | Poll interpretation status | Yes |
| GET | `/diagnostic-runs/:id/interpret/report` | Get interpreted report | Yes |
| GET | `/diagnostic-runs/:id/action-plan` | Get saved action plan (VS28) | Yes |
| POST | `/diagnostic-runs/:id/action-plan` | Upsert action item (VS28) | Yes |
| DELETE | `/diagnostic-runs/:id/action-plan/:questionId` | Remove action item (VS28) | Yes |
| POST | `/diagnostic-runs/:id/finalize` | Lock action plan, enable Executive Report (VS39) | Yes |
| GET | `/diagnostic-runs/:id/company-profile` | Get linked company profile (VS-27c) | Yes |
| GET | `/diagnostic-runs/:id/targets` | Persona-specific maturity targets (VS-27e) | Yes |
| GET | `/diagnostic-runs/:id/benchmark` | Maturity benchmarks + commentary (VS-27d) | Yes |
| POST | `/api/company-profiles` | Create company profile with persona classification (VS-27c) | Yes |
| GET | `/api/company-profiles` | List company profiles (VS-27b) | Yes |
| GET | `/api/company-profiles/:id` | Get company profile (VS-27b) | Yes |
| PUT | `/api/company-profiles/:id` | Update company profile + reclassify (VS-27b) | Yes |
| POST | `/api/company-profiles/:id/reclassify` | Re-run classification (VS-27b) | Yes |
| PATCH | `/api/company-profiles/:id/persona` | Switch persona selection (VS-27c) | Yes |
| GET | `/api/company-profiles/meta/personas` | Get persona definitions (VS-27b) | Yes |
| GET | `/api/company-profiles/meta/matrix` | Get scoring matrix (VS-27b) | Yes |

### Authentication
- Bearer token in Authorization header
- Token from Supabase Auth
- RLS enforced at database level

---

## Database Schema

### Core Tables

**diagnostic_runs**
- `id`, `owner_id`, `status`, `spec_version`
- `context` (JSONB): `{company_name, industry, ...}`
- `calibration` (JSONB): `{importance_map, locked: []}` (locked always empty)
- `company_profile_id` (FK): Links to company_profiles table (VS-27c)
- `finalized_at` (TIMESTAMPTZ): When user locked their action plan (VS-39)
- `action_plan_snapshot` (JSONB): Frozen action plan at finalization (VS-39)
- `benchmark_commentary` (JSONB): Cached benchmark commentary (VS-27d)
- `created_at`, `updated_at`

**diagnostic_inputs** — Question answers per run

**company_profiles** (VS-27c)
- `id`, `user_id`, `context` (JSONB): 9 classification fields
- `classification` (JSONB): `{persona, scores, flags, modifiers, confidence, personaDetails, computedAt, override}`
- `diagnostic_run_id` (FK): Links profile to diagnostic run
- `created_at`, `updated_at`

**diagnostic_scores** — Calculated scores per run

### Interpretation Tables (VS-25)
- `interpretation_sessions` — Pipeline progress
- `interpretation_steps` — AI call logs
- `interpretation_reports` — Generated reports

---

## Frontend Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Home | Landing page |
| `/assess` | DiagnosticInput | Auto-creates run, redirects to setup |
| `/run/:runId/setup/company` | CompanySetupPage | Company context intake |
| `/run/:runId/setup/persona` | PersonaConfirmationPage | Persona classification display (VS-27c) |
| `/run/:runId/setup/pillar` | PillarSetupPage | FP&A context intake |
| `/run/:runId/intro` | IntroPage | Methodology explanation (VS-31) |
| `/assess/foundation` | AssessFoundation | Theme-based questions (VS-30) |
| `/assess/future` | AssessFuture | Theme-based questions (VS-30) |
| `/assess/intelligence` | AssessIntelligence | Theme-based questions (VS-30) |
| `/run/:runId/calibrate` | CalibrationPage | Objective importance (VS21) |
| `/report/:runId` | PillarReport | Main report (V2.8.0) |
| `/report/:runId/executive` | ExecutiveReportPage | PDF-ready executive summary (VS-45) |

---

## Assessment Flow

1. Click "Start Assessment" → `/assess` (auto-creates run)
2. Redirects to → `/run/:id/setup/company`
3. Enter company context → `/run/:id/setup/persona`
4. Review/confirm persona classification → `/run/:id/setup/pillar`
5. Enter FP&A context → `/run/:id/intro`
6. Read methodology → `/assess/foundation?runId=:id`
7. Answer questions (3 themes) → Complete + Score
8. Calibrate importance → `/run/:id/calibrate`
9. View report → `/report/:runId`

---

## Report Tabs (PillarReport)

| Order | Tab | Status | Description |
|-------|-----|--------|-------------|
| 1 | Executive Report | Locked until finalized | Final summary with action plan snapshot |
| 2 | Overview | Default active | Executive summary, AI insights, risks |
| 3 | Benchmark | | Maturity benchmark vs targets, persona context, practice detail table |
| 4 | Maturity Footprint | | Objectives grid, Priority Matrix |
| 5 | Action Planning | | War room for gap selection, timelines, owners |

**Finalization Requirements (VS-40):**
- All selected actions must have a timeline (6m/12m/24m)
- All selected actions must have an owner assigned
- Confirmation modal: "Are you sure you want to finalize?"

**Executive Report (VS-45):**
- Accessed via `/report/:runId/executive` after finalization
- Single-page PDF-optimized layout designed for browser print
- Content includes:
  - Company name, maturity level, overall score
  - AI-generated executive summary
  - Top 3 strengths and critical risks
  - Action plan snapshot (frozen at finalization)
  - Maturity Benchmark page (uses Benchmark tab view without practice detail tables)
- Print button triggers browser print dialog for PDF export

---

## Question Distribution (v2.9.0)

| Level | Questions | Critical | Objectives |
|-------|-----------|----------|------------|
| L1 Emerging | 12 | 5 | Budget Foundation, Financial Controls |
| L2 Defined | 25 | 4 | Variance Analysis, Forecasting |
| L3 Managed | 29 | 0 | Driver-Based Planning, Scenario Modeling |
| L4 Optimized | 13 | 0 | Integrated Planning, Predictive Analytics |
| **Total** | **79** | **10** | **9** |

---

## Scoring System

### Score Formula
```
Score = (Impact² / Complexity) × CriticalBoost × ImportanceFactor
```

### Importance Multipliers (VS21)
| Level | Multiplier |
|-------|------------|
| 5 Critical | 1.50x |
| 4 High | 1.25x |
| 3 Medium | 1.00x (default) |
| 2 Low | 0.75x |
| 1 Minimal | 0.50x |

### Maturity Levels
| Level | Name | Requirements |
|-------|------|--------------|
| 1 | Emerging | Pass L1 critical questions |
| 2 | Defined | L1 + L2 gates |
| 3 | Managed | L2 + L3 gates |
| 4 | Optimized | L3 + L4 gates |

---

## Development

### Run Locally
```bash
# Backend
cd CFOdiagnosis_v1
npm install
npm run dev          # localhost:3000

# Frontend
cd cfo-frontend
npm install
npm run dev          # Vite dev server
```

### Run Tests
```bash
npm run test:all     # All tests
npm run test:vs24    # Content validation
```

### Build
```bash
npm run build        # Backend → dist/
cd cfo-frontend && npm run build  # Frontend → dist/
```

---

## Deployment

- **Backend**: Push to `main` → Railway auto-deploys
- **Frontend**: Push to `main` → Vercel auto-deploys
- **CORS**: Restricted to production frontend
- **Health Check**: `/health` endpoint

---

## Environment Variables

### Backend (Railway)
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
OPENAI_API_KEY=sk-...  # For VS-25 interpretation
PORT=8080
```

### Frontend (Vercel)
```
VITE_API_URL=https://cfodiagnosisv1-production.up.railway.app
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## Feature Summary

| Feature | Description |
|---------|-------------|
| VS18: Context Intake | Company name + industry before assessment |
| VS19: Critical Risk Engine | "Silence is Risk" — missing criticals = risk |
| VS20: Dynamic Action Engine | Objective-based actions with runtime priority |
| VS21: Calibration Layer | User-declared importance (1-5) multiplies scores, full user control |
| VS-23: Maturity Footprint | 27 practices grid with evidence states |
| VS-24: JSON Content Catalog | Zod-validated content in `content/*.json` |
| VS-25: Interpretation Layer | AI-powered personalized insights (OpenAI) |
| VS-28: Action Planning | War room for gap selection, timelines, projections |
| VS-29: Global Sidebar | AppShell + WorkflowSidebar layout pattern |
| VS-30: Enterprise Layout | ChapterHeader, EnterpriseCanvas, ExecutiveSpine components |
| VS-31: Page Normalization | Consulting-document paradigm, no rounded buttons |
| VS-33: Priority Matrix | BCG-style triage grid, critical failures forced to Strategic row |
| VS-36: Interpretation Restart | User-friendly warnings + "Provide More Context" button |
| VS-38: Simulator Enhancements | Maturity level progression (L2→L3) in Execution Score card |
| VS-38: Action Sidebar | Removed workflow steps, added AI "Generate Action Plan" placeholder |
| VS-39: Finalization Workflow | Lock action plan → unlock Executive Report (irreversible) |
| VS-40: Finalization Validation | Require timeline + owner for all actions before finalizing |
| VS-42: Assessment Sidebar Polish | Matches Report sidebar styling, back button navigation |
| VS-43: IntroPage Redesign | Marketing-focused, horizontal layout, journey + value props |
| VS-44: Objective-Based Assessment | 9 objective pages replace 3 theme pages |
| VS-45: Executive Report | PDF-ready single-page summary with action plan snapshot |
| VS-27b: Classification Engine | 9-input persona classification → 6 finance archetypes |
| VS-27c: Persona Confirmation | Frontend persona display with one-click switching |
| VS-27e: Target Calculation | Persona-specific maturity targets per objective |
| VS-27d: Benchmark Tab | Targets vs actuals comparison with persona context, practice detail table, and "Include committed actions" toggle in the report sidebar |
| VS-27f: Target Lines | Target lines in Objectives grid (Post-MVP, #75) |


---

## UI Design Principles (VS-30/31)

### Consulting-Document Paradigm
Pages read like chapters in a consulting report. No playful UI elements.

### Key Components
| Component | Purpose |
|-----------|---------|
| `ChapterHeader` | Dark slate header with label, title, description |
| `EnterpriseCanvas` | Max-width (1100px) centered content wrapper |
| `ExecutiveSpine` | Report header with company name, score, maturity level |

### Styling Conventions
- **No rounded buttons** — Enterprise style, sharp corners
- **Neutral colors** — Slate palette, no theme color pills
- **No sidebar on intro pages** — Distraction-free single column
- **Auto-redirect** — `/assess` creates run and redirects immediately

### Tailwind Colors (tailwind.config.js)
```js
primary: '#1e3a5f'      // Dark blue
primary-hover: '#2d4a6f'
accent: '#f59e0b'       // Amber highlights
```

---

## Content Architecture (v2.9.0)

```
content/*.json (Source of Truth)
       ↓
src/specs/schemas.ts (Zod Validation)
       ↓
src/specs/loader.ts (Load + Transform)
       ↓
src/specs/registry.ts (Version Registry)
       ↓
API / Reports / Tests

Schema Relationships (v2.9.0):
  question.practice_id → practice.objective_id → objective.theme_id
  (3-level hierarchy: Question → Practice → Objective)
```

---

## Gates Architecture (SSOT)

Critical gates control maturity level progression. All gate constants **MUST** be imported from `src/gates/index.ts`:

```
content/gates.json (Source of Truth)
       ↓
src/specs/loader.ts (loadGates function)
       ↓
src/gates/index.ts (Exports readonly arrays)
       ↓
All consumers (maturity, scoring, tests)
```

### Exported Constants

| Export | Type | Source |
|--------|------|--------|
| `L1_CRITICALS` | `readonly string[]` | `critical_gates.l1_to_l2` |
| `L2_CRITICALS` | `readonly string[]` | `critical_gates.l2_to_l3` |
| `ALL_CRITICALS` | `readonly string[]` | Combined L1 + L2 |
| `SCORE_THRESHOLDS` | `object` | `score_thresholds` |
| `LEVEL_NAMES` | `object` | `level_names` |

### Usage

```typescript
// ✅ CORRECT: Import from centralized module
import { L1_CRITICALS, L2_CRITICALS } from '../gates';

// ❌ WRONG: Never hardcode gate arrays
const L1_CRITICALS = ['fpa_l1_q01', ...]; // DO NOT DO THIS
```

---

## AI Interpretation (VS-25)

### Pipeline
1. **Tonality Injector** — Code-based tone (celebrate/refine/remediate/urgent)
2. **Generator (AI1)** — Creates draft report
3. **Quality Heuristics** — Traffic light validation
4. **Critic (AI2)** — Assesses gaps, generates clarifying questions
5. **Gap Prioritizer** — Ranks gaps by criticality

### Tonality Rules
| Score | Has Critical | Tone |
|-------|--------------|------|
| 80-100 | No | Celebrate |
| 40-79 | No | Refine |
| 0-39 | No | Remediate |
| Any | Yes | Urgent |

---

## Known Issues

1. **TypeScript strict mode** — Map callbacks need explicit type annotations
2. **erasableSyntaxOnly** — Frontend cannot use `enum`, use `const` objects
3. **Review mode field population** — Some optional fields (ownership_structure, finance_ftes) may not repopulate when navigating back to setup pages (#60)

---

## MVP Polish (Pre-Launch)

| Task | Priority | Status |
|------|----------|--------|
| Domain QA (cfo-lens.com) | High | Pending |
| Move Intro page before Company Setup | High | Pending |
| Post-completion flow (return to landing) | High | Pending |
| PDF export for reports | High | **Done** (VS-45 Executive Report) |
| Executive Report comprehensive export (PPTX-like) | Medium | Pending |
| Review diagnostic questions | Medium | Pending |
| Review AI report generation | Medium | Pending |
| Logo on all pages | High | Pending |
| Implement code/Supabase audit findings | High | Pending |

---

## Roadmap (Post-MVP)

| Feature | Priority |
|---------|----------|
| VS-27d: Benchmark Tab (#74) | High |
| VS-27f: Target Lines (#75) | High |
| VS15: Admin Dashboard | Medium |
| Multi-Pillar (Liquidity, Treasury, Tax) | High |
| 9-Pillar Scalability (#73) | High |
| Benchmarking | Medium |
| Trend Analysis | Low |
| SSO Integration | Medium |

---

## Quick Reference

```bash
# Health check
curl https://cfodiagnosisv1-production.up.railway.app/health

# Create diagnostic run
curl -X POST https://cfodiagnosisv1-production.up.railway.app/diagnostic-runs \
  -H "Authorization: Bearer <token>"
```

---

## Resources

- **GitHub**: https://github.com/CanKoseoglu123/CFOdiagnosis_v1
- **Frontend**: https://cfodiagnosisv1.vercel.app
- **API**: https://cfodiagnosisv1-production.up.railway.app
- **Supabase**: https://app.supabase.com
