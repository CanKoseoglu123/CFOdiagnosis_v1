# CFO Diagnostic Platform

## What This Is
Financial maturity assessment tool. Users answer questions, system scores their finance workflow maturity, identifies gaps, recommends actions.

## Production URLs
- **Frontend:** https://cfodiagnosisv1.vercel.app
- **Backend API:** https://cfodiagnosisv1-production.up.railway.app

## Architecture

### Backend (`CFOdiagnosis_v1/`)
- **Framework:** Express.js + TypeScript
- **Database:** Supabase (PostgreSQL + Auth)
- **Hosting:** Railway (auto-deploys on push)

### Frontend (`cfo-frontend/`)
- **Framework:** React 19 + Vite
- **Hosting:** Vercel (auto-deploys on push)
- **Auth:** Supabase Auth

## Project Structure
```
CFOdiagnosis_v1/
├── src/
│   ├── index.ts              # Express server & API routes
│   ├── validateRun.ts        # Input validation
│   ├── specs/                # Spec definitions (v2.6.4 frozen)
│   ├── scoring/              # Scoring engine (pure functions)
│   ├── results/              # Score aggregation
│   ├── maturity/             # Maturity gate evaluation
│   ├── reports/              # Report generation
│   └── actions/              # Action plan derivation
├── cfo-frontend/
│   └── src/
│       ├── App.jsx           # Routes & auth
│       ├── DiagnosticInput.jsx   # Assessment flow
│       └── FinanceDiagnosticReport.jsx  # Results display
└── spec/
    └── SPEC_v2.6.4.md        # Canonical specification
```

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/diagnostic-runs` | Create new diagnostic run |
| POST | `/diagnostic-inputs` | Save question answers |
| POST | `/diagnostic-runs/:id/complete` | Mark run complete |
| POST | `/diagnostic-runs/:id/score` | Calculate scores |
| GET | `/diagnostic-runs/:id/results` | Get aggregated results |
| GET | `/diagnostic-runs/:id/report` | Get full report |
| GET | `/health` | Health check |

## Key Principles (DO NOT VIOLATE)
1. **Spec v2.6.4 is frozen** — don't modify specs/ without explicit approval
2. **Scoring logic must be pure functions** — no side effects
3. **Missing answers = 0 score** (conservative scoring)
4. **Maturity gates are deterministic** — evidence-based, not opinion-based

## State Machine
```
NOT_STARTED → IN_PROGRESS → COMPLETED → LOCKED
```

## Environment Variables

### Backend (Railway)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anon key
- `PORT` - Server port (auto-set by Railway)
- `CORS_ORIGIN` - Allowed frontend origin (optional)

### Frontend (Vercel)
- `VITE_API_URL` - Backend API URL
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key

## Development

### Run Backend Locally
```bash
cd CFOdiagnosis_v1
npm install
npm run dev
```

### Run Frontend Locally
```bash
cd CFOdiagnosis_v1/cfo-frontend
npm install
npm run dev
```

### Run Tests
```bash
npm run test:all
```

## MVP Status
- [x] VS1-VS12: Core diagnostic flow
- [x] VS16: Production deployment
- [ ] VS13: PDF Export
- [ ] VS15: Admin Dashboard (post-MVP)

## When Working on This Codebase
- Test scoring changes against existing test cases
- Don't break the API contract (check endpoints above)
- CORS is restricted to production frontend
- Auto-deploy is enabled — push to main deploys to production
