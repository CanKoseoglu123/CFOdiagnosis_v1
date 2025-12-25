# Session Start Prompt — December 26, 2025

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

## Session Completed Yesterday (Dec 25)

1. ✅ VS-28 Action Planning & Simulator — Full war room with gap selection, timelines, projections
2. ✅ VS-29 Global Sidebar Layout — AppShell + WorkflowSidebar pattern
3. ✅ ActionSidebar inside Action Planning content (interactive, not global)
4. ✅ Fixed React hooks violation (useMemo before early returns)
5. ✅ Three-tab report structure: Overview | Maturity Footprint | Action Planning

---

## Today's Priority Tasks

### 1. MCQ Page Separation (HIGH PRIORITY) — VS-30

**Goal:** Separate the 48 questions into 3 theme-based pages with improved UI quality.

**Current State:**
- All questions on single `/assess` page
- Basic list format, not visually polished

**Target State:**
- **Page 1: Foundation** — L1/L2 questions (Budget, Controls, Variance, Forecasting)
- **Page 2: Future** — L3 questions (Driver-Based Planning, Scenario Modeling)
- **Page 3: Intelligence** — L4 questions (Strategic Influence, Predictive Analytics)

**UI Requirements:**
- Individual card per question (like Action Planning cards)
- Clear typography (question title prominent, help text secondary)
- Yes/No/Unsure toggle buttons (not basic checkboxes)
- Progress indicator showing theme completion
- Consistent with Action Planning design quality

**Files to Create/Modify:**
- `cfo-frontend/src/pages/AssessFoundation.jsx` — Theme 1 questions
- `cfo-frontend/src/pages/AssessFuture.jsx` — Theme 2 questions
- `cfo-frontend/src/pages/AssessIntelligence.jsx` — Theme 3 questions
- `cfo-frontend/src/components/QuestionCard.jsx` — Reusable question card
- `cfo-frontend/src/App.jsx` — Add routes

**Theme Mapping:**
```javascript
const THEME_OBJECTIVES = {
  foundation: ['obj_budget_discipline', 'obj_financial_controls', 'obj_performance_monitoring', 'obj_forecasting_agility'],
  future: ['obj_driver_based_planning', 'obj_scenario_modeling'],
  intelligence: ['obj_strategic_influence', 'obj_decision_support', 'obj_operational_excellence']
};
```

---

### 2. Maturity Ladder Completion (HIGH PRIORITY)

**Goal:** Finalize the maturity ladder visualization that shows progression L1 → L2 → L3 → L4.

**Current State:**
- MaturityFootprintGrid shows practices grid
- No clear "ladder" showing level progression with gates

**Target State:**
- Visual ladder/staircase showing 4 levels
- Each level shows: name, threshold, practices count, current status
- Gates between levels (locked/unlocked based on critical questions)
- Current position highlighted

**Possible Component:**
- `cfo-frontend/src/components/report/MaturityLadder.jsx`

---

### 3. AI Fine-Tuning (MEDIUM PRIORITY) — VS-31

**Goal:** Improve AI interpretation quality and follow-up question impact.

**Tasks:**
1. Review generated interpretations for quality
2. Tune prompts in `src/interpretation/prompts.ts` if needed
3. Ensure follow-up answers affect the final summary
4. Verify tonality matches score (celebrate/refine/remediate/urgent)

**Test Commands:**
```bash
TEST_PASSWORD=123456 node scripts/get-auth-token.js
AUTH_TOKEN="<token>" node scripts/test-interpretation.js
```

---

### 4. Printable Report Foundation (MEDIUM PRIORITY) — VS-32

**Goal:** Set up the foundation for final printable PDF report.

**Requirements:**
- Print-optimized CSS (hide nav, fix widths)
- Executive summary one-pager
- Full report with all sections
- Browser print or jsPDF integration

**Files to Consider:**
- `cfo-frontend/src/pages/PrintableReport.jsx`
- `cfo-frontend/src/styles/print.css`

---

## Design System Reference

**Colors (Gartner-inspired):**
```css
--slate-800: #1e293b;  /* Headers, primary text */
--slate-600: #475569;  /* Secondary text */
--slate-300: #cbd5e1;  /* Borders */
--slate-50:  #f8fafc;  /* Backgrounds */
--blue-600:  #2563eb;  /* Primary actions */
--emerald-500: #10b981; /* Success/evidenced */
--amber-400: #fbbf24;   /* Partial/warning */
--red-600:  #dc2626;    /* Critical/error */
```

**Card Pattern (from Action Planning):**
```jsx
<div className="bg-white border border-slate-300 rounded-sm overflow-hidden">
  <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
      Card Title
    </h3>
  </div>
  <div className="p-4">
    {/* Content */}
  </div>
</div>
```

**Button Styles:**
```jsx
// Primary
className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700"

// Secondary
className="px-4 py-2 bg-white text-slate-600 text-sm font-medium rounded border border-slate-300 hover:bg-slate-50"

// Toggle (selected)
className="px-4 py-2 bg-slate-800 text-white text-sm font-medium"

// Toggle (unselected)
className="px-4 py-2 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50"
```

---

## Key Files Reference

| Purpose | File |
|---------|------|
| Current Assessment Page | `cfo-frontend/src/pages/DiagnosticInput.jsx` |
| Report Page | `cfo-frontend/src/pages/PillarReport.jsx` |
| Action Planning Tab | `cfo-frontend/src/components/report/ActionPlanTab.jsx` |
| Question Card Reference | `cfo-frontend/src/components/report/CommandCenter.jsx` |
| Global Sidebar | `cfo-frontend/src/components/WorkflowSidebar.jsx` |
| App Routes | `cfo-frontend/src/App.jsx` |
| Design System | `DESIGN_SYSTEM.md` |

---

## Content Hierarchy

| Entity | Count | JSON File |
|--------|-------|-----------|
| Objectives | 8 | `content/objectives.json` |
| Practices | 21 | `content/practices.json` |
| Questions | 48 | `content/questions.json` |
| Initiatives | 9 | `content/initiatives.json` |

---

## Quick Commands

```bash
# Get fresh auth token
TEST_PASSWORD=123456 node scripts/get-auth-token.js

# Build frontend
cd cfo-frontend && npm run build

# Run backend
npm run dev

# Run all tests
npm run test:all
```

---

## End Goal for V1.0 Completion

After today's work:
1. ✅ 3-page MCQ flow with polished UI
2. ✅ Maturity ladder visualization complete
3. ✅ AI interpretations fine-tuned
4. ✅ Foundation for printable report

**Next Session (Dec 27):**
- Finalize printable report
- End-to-end QA testing
- Polish any remaining UI issues

---

## Start Working

1. Review the current `/assess` page to understand question structure
2. Create theme-based assessment pages with card-based UI
3. Add progress indicators and navigation between themes
4. Implement maturity ladder component for report
5. Test full flow: Setup → Assess (3 pages) → Calibrate → Report

GO!
