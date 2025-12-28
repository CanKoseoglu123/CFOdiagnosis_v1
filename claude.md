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
│   ├── questions.json            # 60 FP&A questions (practice_id linkage)
│   ├── practices.json            # 28 practices
│   ├── initiatives.json          # 9 initiatives
│   ├── objectives.json           # 9 objectives
│   └── gates.json                # Maturity gates
│
├── cfo-frontend/                 # Frontend application
│   ├── src/
│   │   ├── App.jsx               # Routes, auth, navigation
│   │   ├── pages/
│   │   │   ├── PillarReport.jsx  # Main report with 3 tabs (VS-28)
│   │   │   └── CalibrationPage.jsx # VS21 importance calibration
│   │   ├── components/
│   │   │   ├── AppShell.jsx      # Responsive layout wrapper
│   │   │   ├── WorkflowSidebar.jsx # Global sidebar (VS-29)
│   │   │   ├── ChapterHeader.jsx # Unified dark header (VS-30)
│   │   │   ├── EnterpriseCanvas.jsx # Max-width content wrapper (VS-30)
│   │   │   ├── ExecutiveSpine.jsx # Report header component (VS-30)
│   │   │   └── report/           # Report components
│   │   │       ├── ActionPlanTab.jsx   # Action Planning (VS-28)
│   │   │       ├── SimulatorHUD.jsx    # Score projections (VS-28)
│   │   │       ├── CommandCenter.jsx   # Gap list with controls (VS-28)
│   │   │       └── ActionSidebar.jsx   # Interactive sidebar (VS-28)
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
5. **Critical failures lock importance at 5** — Safety Valve

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

### Authentication
- Bearer token in Authorization header
- Token from Supabase Auth
- RLS enforced at database level

---

## Database Schema

### Core Tables

**diagnostic_runs**
- `id`, `user_id`, `status`, `spec_version`
- `context` (JSONB): `{company_name, industry}`
- `calibration` (JSONB): `{importance_map, locked}`
- `created_at`, `updated_at`

**diagnostic_inputs** — Question answers per run

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
| `/run/:runId/setup/pillar` | PillarSetupPage | FP&A context intake |
| `/run/:runId/intro` | IntroPage | Methodology explanation (VS-31) |
| `/assess/foundation` | AssessFoundation | Theme-based questions (VS-30) |
| `/assess/future` | AssessFuture | Theme-based questions (VS-30) |
| `/assess/intelligence` | AssessIntelligence | Theme-based questions (VS-30) |
| `/run/:runId/calibrate` | CalibrationPage | Objective importance (VS21) |
| `/report/:runId` | PillarReport | Main report (V2.8.0) |

---

## Assessment Flow

1. Click "Start Assessment" → `/assess` (auto-creates run)
2. Redirects to → `/run/:id/setup/company`
3. Enter company context → `/run/:id/setup/pillar`
4. Enter FP&A context → `/run/:id/intro`
5. Read methodology → `/assess/foundation?runId=:id`
6. Answer questions (3 themes) → Complete + Score
7. Calibrate importance → `/run/:id/calibrate`
8. View report → `/report/:runId`

---

## Question Distribution (v2.9.0)

| Level | Questions | Critical | Practices | Objectives |
|-------|-----------|----------|-----------|------------|
| L1 Emerging | 9 | 4 | 6 | Budget Foundation, Financial Controls |
| L2 Defined | 15 | 4 | 7 | Variance Analysis, Forecasting |
| L3 Managed | 21 | 0 | 9 | Driver-Based Planning, Scenario Modeling |
| L4 Optimized | 15 | 0 | 6 | Integrated Planning, Predictive Analytics |
| **Total** | **60** | **8** | **28** | **9** |

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
| VS21: Calibration Layer | User-declared importance (1-5) multiplies scores |
| VS-23: Maturity Footprint | 21 practices grid with evidence states |
| VS-24: JSON Content Catalog | Zod-validated content in `content/*.json` |
| VS-25: Interpretation Layer | AI-powered personalized insights (OpenAI) |
| VS-28: Action Planning | War room for gap selection, timelines, projections |
| VS-29: Global Sidebar | AppShell + WorkflowSidebar layout pattern |
| VS-30: Enterprise Layout | ChapterHeader, EnterpriseCanvas, ExecutiveSpine components |
| VS-31: Page Normalization | Consulting-document paradigm, no rounded buttons |
| VS-36: Interpretation Restart | User-friendly warnings + "Provide More Context" button |

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

---

## Roadmap

| Feature | Priority |
|---------|----------|
| VS15: Admin Dashboard | Medium |
| Multi-Pillar (Liquidity, Treasury, Tax) | High |
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
