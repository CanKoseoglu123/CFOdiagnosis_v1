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
│   ├── specs/                    # Specification layer (FROZEN v2.6.4)
│   │   ├── types.ts              # Spec interface definitions
│   │   ├── v2.6.4.ts             # Actual spec (questions, pillars, gates)
│   │   ├── registry.ts           # Spec version registry
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
│   └── tests/                    # QA test suites
│       ├── vs5-qa.test.ts        # Aggregation tests
│       ├── vs6-qa.test.ts        # Report generation tests
│       ├── vs7-qa.test.ts        # Maturity evaluation tests
│       ├── vs8-qa.test.ts        # Action derivation tests
│       ├── vs9-qa.test.ts        # Validation tests
│       └── vs11-qa.test.ts       # Integration tests
│
├── cfo-frontend/                 # Frontend application
│   ├── src/
│   │   ├── main.jsx              # App entry point
│   │   ├── App.jsx               # Routes, auth, navigation
│   │   ├── DiagnosticInput.jsx   # Assessment questionnaire UI
│   │   ├── FinanceDiagnosticReport.jsx  # Results display
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Supabase auth context
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx # Auth guard
│   │   └── lib/
│   │       └── supabase.js       # Supabase client
│   ├── package.json
│   └── vite.config.js
│
├── spec/
│   └── SPEC_v2.6.4.md            # Frozen specification document
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
| POST | `/diagnostic-runs` | Create new diagnostic run | Yes |
| POST | `/diagnostic-inputs` | Save question answer | Yes |
| POST | `/diagnostic-runs/:id/complete` | Mark run as complete | Yes |
| POST | `/diagnostic-runs/:id/score` | Calculate scores for run | Yes |
| GET | `/diagnostic-runs/:id/results` | Get aggregated results | Yes |
| GET | `/diagnostic-runs/:id/report` | Get full report with recommendations | Yes |

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
- `spec_version` (text): e.g., "2.6.4"
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
1. **Spec v2.6.4 is FROZEN** — No modifications without version bump
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
| `/assess` | DiagnosticInput | Yes |
| `/report/:runId` | FinanceDiagnosticReport | Yes |

### Assessment Flow
1. User clicks "Start Assessment"
2. POST `/diagnostic-runs` creates new run
3. User answers Yes/No to each question
4. Each answer → POST `/diagnostic-inputs`
5. User clicks "Submit"
6. POST `/diagnostic-runs/:id/complete`
7. POST `/diagnostic-runs/:id/score`
8. Redirect to `/report/:runId`
9. GET `/diagnostic-runs/:id/report` displays results

### Current Questions (8 FP&A questions)
- Level 1 (Emerging): Annual budget, Budget owner
- Level 2 (Defined): Variance analysis, Rolling forecast
- Level 3 (Managed): Driver-based forecasting, Scenario modeling
- Level 4 (Optimized): Integrated planning, Predictive analytics

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
npm run test:vs5     # Aggregation tests
npm run test:vs6     # Report tests
npm run test:vs7     # Maturity tests
npm run test:vs8     # Action tests
npm run test:vs9     # Validation tests
npm run test:all     # All tests
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

## MVP Status

| Feature | Status |
|---------|--------|
| VS1-VS12: Core diagnostic flow | ✅ Complete |
| VS16: Production deployment | ✅ Complete |
| VS13: PDF Export | ✅ Complete |
| VS15: Admin Dashboard | ❌ Post-MVP |

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

## Known Issues & Notes

1. **node_modules committed**: Some node_modules were accidentally committed. Consider cleaning with `git rm -r --cached node_modules` and updating `.gitignore`

2. **CFOdiagnosis_v2**: Separate repo exists but is just a placeholder. The real frontend is in `CFOdiagnosis_v1/cfo-frontend/`

3. **Questions are hardcoded**: Current questions are in `DiagnosticInput.jsx` (frontend) and should match spec

4. **TypeScript strict mode**: Backend uses strict TypeScript. Map callbacks need explicit type annotations.

5. **erasableSyntaxOnly**: Frontend tsconfig has this enabled - cannot use `enum`, use `const` objects instead

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

## Contact & Resources

- **GitHub**: https://github.com/CanKoseoglu123/CFOdiagnosis_v1
- **Spec Document**: `spec/SPEC_v2.6.4.md`
- **Railway Dashboard**: https://railway.app
- **Vercel Dashboard**: https://vercel.com
