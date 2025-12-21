# CFO Diagnostic Platform - V1.0 Release Notes

## V1.0 IS LIVE

**Release Date:** December 21, 2025

**Production URLs:**
- Frontend: https://cfodiagnosisv1.vercel.app
- Backend API: https://cfodiagnosisv1-production.up.railway.app

---

## What's in V1.0

### Core Features
| Feature | Status | Description |
|---------|--------|-------------|
| Scoring Engine | ✅ | Pure functions, 0-1 normalization |
| Maturity Gates | ✅ | Sequential gates (L1-L4), 80% threshold |
| Context Intake | ✅ | Company name, industry captured |
| Critical Risks | ✅ | "Silence is a Risk" - unanswered critical = risk |
| Action Engine | ✅ | Objective-based, derived priority (HIGH/MEDIUM) |
| PDF Export | ✅ | Browser print with preserved colors |
| AppShell Layout | ✅ | Responsive sidebar (desktop) + hamburger menu (mobile) |

### Content (v2.7.1)
| Metric | Value |
|--------|-------|
| Total Questions | 48 |
| Critical Questions | 8 (L1: 4, L2: 4) |
| Objectives | 8 (2 per level) |
| Actions | 8 (1 per objective) |
| Themes | 3 (Foundation, Future, Intelligence) |

### Question Distribution
| Level | Questions | Critical | Theme |
|-------|-----------|----------|-------|
| L1 (Emerging) | 9 | 4 | Foundation |
| L2 (Defined) | 14 | 4 | Foundation + Future |
| L3 (Managed) | 15 | 0 | Future + Intelligence |
| L4 (Optimized) | 10 | 0 | Intelligence |

### Critical Questions (8 Total)
**Level 1 (Foundation):**
- fpa_l1_q01: Annual budget exists
- fpa_l1_q03: Full P&L budget
- fpa_l1_q06: Consistent chart of accounts
- fpa_l1_q09: Monthly management reporting package

**Level 2 (Defined):**
- fpa_l2_q01: Monthly BvA report
- fpa_l2_q02: Variance investigation
- fpa_l2_q06: Quarterly forecast
- fpa_l2_q07: Cash flow forecast

---

## User Flow

```
Login → Create Run → Setup (company info) → Intro → Questionnaire → Submit → Report
```

### Pages with AppShell Layout
| Page | Sidebar Content |
|------|----------------|
| IntroPage | What You'll Get overview |
| SetupPage | Setup progress steps |
| DiagnosticInput | Progress bar, theme navigation, submit |
| Report | Company info, section nav, print/new buttons |

### Responsive Behavior
| Viewport | Sidebar | Header |
|----------|---------|--------|
| Desktop (≥1024px) | Fixed 280px left | Hidden |
| Mobile (<1024px) | Hidden (slide-in menu) | Hamburger menu |

---

## QA Results

### Test Suite
- **Total Tests:** 625 passing
- **Test Command:** `npm run test:all`

### Scenario Testing
| Scenario | Maturity | Risks | Actions | Status |
|----------|----------|-------|---------|--------|
| All NO | 0 | 8 | 8 | ✅ |
| All YES | 4 | 0 | 0 | ✅ |
| Partial (L1+L2 YES) | 2 | 0 | 4 | ✅ |

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                        │
│  React 19 + Vite + AppShell Layout                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │  Intro  │ │  Setup  │ │ Questio │ │ Report  │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Railway)                         │
│  Express.js + TypeScript                                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Scoring │ │Maturity │ │  Risks  │ │ Actions │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database (Supabase)                       │
│  PostgreSQL + RLS + Auth                                    │
│  diagnostic_runs | diagnostic_inputs | diagnostic_scores   │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Files Reference

### Backend
| File | Purpose |
|------|---------|
| `src/specs/v2.7.0.ts` | Questions, Objectives, Actions, Gates, Themes |
| `src/spec.ts` | Spec export for validation |
| `src/scoring/scoreRun.ts` | Question scoring logic |
| `src/maturity/engine.ts` | Gate evaluation |
| `src/risks/engine.ts` | Critical risk derivation |
| `src/actions/deriveFromObjectives.ts` | Action plan generation |

### Frontend
| File | Purpose |
|------|---------|
| `cfo-frontend/src/components/AppShell.jsx` | Main layout wrapper |
| `cfo-frontend/src/components/AppShell.css` | Responsive styles |
| `cfo-frontend/src/IntroPage.jsx` | Assessment intro |
| `cfo-frontend/src/SetupPage.jsx` | Context intake |
| `cfo-frontend/src/DiagnosticInput.jsx` | Questionnaire |
| `cfo-frontend/src/FinanceDiagnosticReport.jsx` | Results |

---

## Deployment

Both frontend and backend auto-deploy on push to `main`:
- **Frontend:** Vercel (auto-deploy)
- **Backend:** Railway (auto-deploy)

```bash
git push origin main  # Triggers both deployments
```

---

## Future Enhancements (Post-V1.0)

| Feature | Priority | Description |
|---------|----------|-------------|
| VS15: Admin Dashboard | Medium | View all runs, export analytics |
| Multi-Pillar | High | Add Liquidity, Treasury, Tax pillars |
| Benchmarking | Medium | Compare against industry peers |
| Trend Analysis | Low | Track maturity over time |
| Email Reports | Low | Send PDF via email |
| SSO Integration | Medium | Enterprise auth |

---

## Commands Reference

```bash
# Run all tests
npm run test:all

# Run specific test suite
npm run test:vs9   # Content validation
npm run test:vs20  # Action derivation

# Build backend
npm run build

# Start backend (dev)
npm run dev

# Start frontend (dev)
cd cfo-frontend && npm run dev

# Build frontend
cd cfo-frontend && npm run build
```

---

## Changelog

### v2.7.1 (December 21, 2025) - V1.0 Release
- Updated to 48 questions (was 44)
- Reduced critical questions to 8 (was 10)
- Added AppShell responsive layout
- Added IntroPage between Setup and Questionnaire
- Fixed validation to use v2.7.0 spec

### v2.7.0 (December 2025) - Behavioral Edition
- Rewrote 23 questions from process-checking to behavioral
- Added Theme layer (Foundation, Future, Intelligence)
- Grouped questions by theme in UI

### v2.6.4 (Legacy)
- 40 process-focused questions
- No theme grouping
