# Session Start Prompt — December 25, 2025

Copy and paste this entire prompt to start your session:

---

## Project Context

You are continuing work on CFO Diagnostic Platform. This is a financial maturity assessment tool where users answer questions and receive a report with maturity scores, capability gaps, and recommended actions.

**Production URLs:**
- Frontend: https://cfodiagnosisv1.vercel.app
- Backend API: https://cfodiagnosisv1-production.up.railway.app
- GitHub: https://github.com/CanKoseoglu123/CFOdiagnosis_v1

**Tech Stack:**
- Backend: Express.js + TypeScript (Railway)
- Frontend: React 19 + Vite + Tailwind CSS v4 (Vercel)
- Database: Supabase (PostgreSQL)
- AI: OpenAI GPT-4o (generator) + GPT-4o-mini (critic)

---

## Permissions

You have FULL AUTONOMY to:
- Create files
- Edit files
- Run builds and tests
- Commit and push to main (auto-deploys)
- Make design decisions within the design system

**ONLY ASK FOR APPROVAL when:**
- Deleting files or significant code blocks
- Changing database schema
- Modifying API contracts

---

## Today's Priority Tasks

### 1. Interpretation Flow & Pages (HIGH PRIORITY)

**Goal:** Ensure the user can complete the full interpretation flow from start to finish.

**Current State:**
- Backend API endpoints working: `/interpret/start`, `/status`, `/answer`, `/report`
- No frontend UI for the interpretation flow yet

**Needed Pages/Components:**
1. **InterpretationPage** (`/run/:runId/interpret`)
   - Triggers interpretation after calibration
   - Shows progress while AI generates
   - Displays clarifying questions when `awaiting_user`
   - Submits answers and polls for completion

2. **Update PillarReport**
   - Fetch and display interpreted synthesis if available
   - Show "Executive Interpretation" section with AI-generated content

**API Flow to Wire Up:**
```
POST /diagnostic-runs/:id/interpret/start → 202 + poll_url
GET  /diagnostic-runs/:id/interpret/status → {status, questions?}
POST /diagnostic-runs/:id/interpret/answer → {answers: {...}}
GET  /diagnostic-runs/:id/interpret/report → {synthesis, priority_rationale, key_insight}
```

**Test Run ID:** `9751a455-8855-4e54-aa84-cda70a49ea16` (has interpretation session in `awaiting_user` state)

---

### 2. AI Output Quality (MEDIUM PRIORITY)

**Goal:** Verify the AI-generated content is valuable and well-formatted.

**Check Points:**
- [ ] Synthesis is concise (200-300 words target)
- [ ] Priority rationale explains why actions are ordered
- [ ] Key insight provides actionable value
- [ ] Questions are relevant to gaps identified
- [ ] No hallucinations or generic responses

**Test Script:**
```bash
TEST_PASSWORD=123456 node scripts/get-auth-token.js
AUTH_TOKEN="<token>" node scripts/test-interpretation.js
```

**If Quality Issues Found:**
- Adjust prompts in `src/interpretation/prompts.ts`
- Tune temperatures in `src/interpretation/config.ts`

---

### 3. Hierarchy Clarity (MEDIUM PRIORITY)

**Goal:** Ensure the Objective → Practice → Question hierarchy is clear and correctly wired.

**Current Hierarchy:**
```
Pillar (FP&A)
└── Objective (8 total) — "What we're trying to achieve"
    ├── obj_fpa_l1_budget: "Budget Foundation"
    ├── obj_fpa_l1_control: "Financial Controls"
    ├── obj_fpa_l2_variance: "Variance Analysis"
    ├── obj_fpa_l2_forecast: "Forecasting"
    ├── obj_fpa_l3_driver: "Driver-Based Planning"
    ├── obj_fpa_l3_integrate: "Integrated Planning"
    ├── obj_fpa_l4_scenario: "Scenario Modeling"
    └── obj_fpa_l4_predict: "Predictive Analytics"

    └── Practice (21 total) — "How we achieve it"
        └── Question (48 total) — "Evidence of practice"
```

**JSON Files (Source of Truth):**
- `content/questions.json` — 48 questions with `objective_id`, `practice_id`
- `content/practices.json` — 21 practices with `objective_id`
- `content/objectives.json` — 8 objectives

**Validation Task:**
1. Verify all 48 questions have valid `practice_id`
2. Verify all 21 practices have valid `objective_id`
3. Ensure no orphaned entities

---

## Technical Debt / Nice-to-Have

### 4. Error Handling for Interpretation

- What happens if OpenAI API fails mid-pipeline?
- Need graceful fallback with user-friendly message
- Consider retry logic for transient failures

### 5. Test Coverage

- Add tests for interpretation pipeline (`src/interpretation/__tests__/`)
- Validate prompt outputs with mock responses

### 6. Documentation Update

- Update CLAUDE.md with VS-25 interpretation layer details
- Add interpretation flow to user documentation

---

## Quick Reference

### Content Hierarchy

| Entity | Count | JSON File |
|--------|-------|-----------|
| Objectives | 8 | `content/objectives.json` |
| Practices | 21 | `content/practices.json` |
| Questions | 48 | `content/questions.json` |
| Initiatives | 9 | `content/initiatives.json` |

### AI Model Config

| Agent | Model | Temperature | Purpose |
|-------|-------|-------------|---------|
| Generator | gpt-4o | 0.7 | Report writing |
| Critic | gpt-4o-mini | 0.3 | Quality assessment |

### Safety Limits

| Limit | Value | Purpose |
|-------|-------|---------|
| maxRounds | 2 | Prevent infinite loops |
| maxQuestionsTotal | 5 | Limit user burden |
| maxTokensPerSession | 20000 | Cost control |
| maxAICallsPerSession | 8 | API rate control |

---

## Commands Reference

```bash
# Get fresh auth token
TEST_PASSWORD=123456 node scripts/get-auth-token.js

# Test interpretation endpoint
AUTH_TOKEN="<token>" node scripts/test-interpretation.js [runId]

# Build backend
npm run build

# Run all tests
npm run test:all

# Build frontend
cd cfo-frontend && npm run build
```

---

## Key Files for Today

| Purpose | File |
|---------|------|
| Interpretation Pipeline | `src/interpretation/pipeline.ts` |
| AI Prompts | `src/interpretation/prompts.ts` |
| API Endpoints | `src/index.ts` (lines 683-1120) |
| Config/Limits | `src/interpretation/config.ts` |
| Report Page | `cfo-frontend/src/pages/PillarReport.jsx` |
| Calibration Page | `cfo-frontend/src/pages/CalibrationPage.jsx` |

---

## Session Completed Yesterday (Dec 24)

1. ✅ VS-25 AI Interpretation Layer — Backend complete with OpenAI
2. ✅ Supabase migration for interpretation tables
3. ✅ Safety limits (tokens, calls, rounds)
4. ✅ Lazy OpenAI client initialization (prevents crash if no key)
5. ✅ End-to-end test showing questions generated

**Test Result:**
```
Response received in 20.9s
Status: 202
Questions: 5 clarifying questions generated
Status: awaiting_user
```

---

## Start Working

1. First, get a fresh auth token for API testing
2. Review the interpretation test result from yesterday
3. Create InterpretationPage component for the flow
4. Wire up the pages in App.jsx routing
5. Test the full flow: Calibrate → Interpret → Report

GO!
