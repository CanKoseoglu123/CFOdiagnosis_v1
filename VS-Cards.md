# VS-Cards — Version Sprints Roadmap

**Last Updated:** December 24, 2025
**Status:** Active Development

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

### Technical Implementation

**Backend Files Created:**
- `src/interpretation/` — Full module with types, prompts, config
- `src/interpretation/agents/generator.ts` — GPT-4o for drafting
- `src/interpretation/agents/critic.ts` — GPT-4o-mini for assessment
- `src/interpretation/pipeline.ts` — Orchestrator with safety limits
- `supabase/migrations/20241224_vs25_interpretation_layer_fixed.sql`

**API Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/diagnostic-runs/:id/interpret/start` | POST | Start interpretation pipeline |
| `/diagnostic-runs/:id/interpret/status` | GET | Poll for progress/completion |
| `/diagnostic-runs/:id/interpret/answer` | POST | Submit clarifying answers |
| `/diagnostic-runs/:id/interpret/report` | GET | Get final interpreted report |
| `/diagnostic-runs/:id/interpret/feedback` | POST | Submit user rating |

### AI Model Configuration

```typescript
MODEL_CONFIG = {
  generator: {
    model: 'gpt-4o',        // Best quality for writing
    temperature: 0.7,
    maxTokens: 1000,
  },
  critic: {
    model: 'gpt-4o-mini',   // Fast & cheap for assessment
    temperature: 0.3,
    maxTokens: 800,
  },
}
```

### Safety Limits

```typescript
LOOP_CONFIG = {
  maxRounds: 2,              // Maximum refinement rounds
  maxQuestionsTotal: 5,      // Maximum clarifying questions
  maxTokensPerSession: 20000, // Token budget per session
  maxAICallsPerSession: 8,   // API call limit
}
```

### Remaining Work (Frontend)

1. **Interpretation UI Flow** — Pages for question answering
2. **Integration with Report** — Show interpreted synthesis
3. **Quality Testing** — Validate AI output quality

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

### Benefits Achieved

- Content editable without TypeScript knowledge
- Cleaner git diffs for content changes
- Runtime Zod validation catches errors early
- Foundation for future i18n/CMS integration

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

## VS-26: Interpretation UI & Flow (NEXT)

**Status:** 📋 Planned
**Priority:** High
**Sprint:** December 25, 2025

### Problem Statement
VS-25 backend is complete but needs frontend integration. Users need a seamless flow from assessment completion to interpreted report.

### Deliverables

| Component | Description |
|-----------|-------------|
| Interpretation Start Page | Trigger interpretation after calibration |
| Question Answering UI | Show clarifying questions, collect answers |
| Progress Indicator | Show pipeline status (generating, awaiting, finalizing) |
| Interpreted Report Section | Display synthesis in report page |
| Error Handling | Graceful fallback if AI fails |

### User Flow

```
Questionnaire → Complete → Score → Calibrate → Interpret → Report
                                        ↓
                              /interpret/start
                                        ↓
                              [AI generates draft]
                                        ↓
                              /interpret/status → awaiting_user
                                        ↓
                              [Show questions to user]
                                        ↓
                              /interpret/answer
                                        ↓
                              [AI refines with answers]
                                        ↓
                              /interpret/status → complete
                                        ↓
                              [Show interpreted report]
```

### Acceptance Criteria

- [ ] User can trigger interpretation from calibration page
- [ ] Questions render correctly with input fields
- [ ] Progress shown while AI processes
- [ ] Interpreted synthesis displays in report
- [ ] Graceful handling of AI errors

---

## VS-27: Hierarchy Clarification

**Status:** 📋 Planned
**Priority:** Medium

### Problem Statement
The relationship between Objectives, Practices, and Questions needs clearer documentation and potentially UI visualization.

### Current Hierarchy

```
Pillar (FP&A)
└── Objective (8 total) — "What we're trying to achieve"
    └── Practice (21 total) — "How we achieve it"
        └── Question (48 total) — "Evidence of practice"
```

### Relationships

| Entity | Parent | Children | Example |
|--------|--------|----------|---------|
| Objective | Pillar | Practices | "Budget Foundation" |
| Practice | Objective | Questions | "Annual Budget Process" |
| Question | Practice | — | "Does company produce annual budget?" |

### Deliverables

- [ ] Hierarchy diagram in documentation
- [ ] Visual explorer in UI (optional)
- [ ] Validation that all questions map to practices
- [ ] Validation that all practices map to objectives

---

## VS Backlog

| VS | Name | Priority | Status |
|----|------|----------|--------|
| VS-15 | Admin Dashboard | Medium | 📋 Backlog |
| VS-28 | Multi-Pillar Architecture | High | 📋 Backlog |
| VS-29 | Benchmarking Engine | Medium | 📋 Backlog |
| VS-30 | Trend Analysis | Low | 📋 Backlog |
| VS-31 | Email Reports | Low | 📋 Backlog |
| VS-32 | SSO Integration | Medium | 📋 Backlog |

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
