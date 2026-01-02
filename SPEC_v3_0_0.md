# 🚀 FINANCE DIAGNOSTIC PLATFORM — SYSTEM SPEC

**Version:** v3.0.0  
**Status:** FINAL / FROZEN  
**Supersedes:** v2.9.0  
**Audience:** Product, Engineering, Design, Content  
**Change Type:** Scoring Engine & AI Interpretation Release  
**Engineering Review:** Complete — reflects actual implementation through VS-40

---

## 1. CORE ARCHITECTURE

### 1.1 The "Strict Vertical" Rule

To support future scalability (e.g., adding Record-to-Report, Order-to-Cash), we enforce **Strict Vertical Isolation**.

- **Rule:** A `Practice` belongs to exactly **one** `Objective`.
- **Rule:** An `Objective` belongs to exactly **one** `Theme` (and one `Pillar`).
- **No Sharing:** Do not reuse a "Reconciliation" practice ID across FP&A and Accounting. Create unique instances (e.g., `prac_fpa_reconciliations` vs `prac_r2r_reconciliations`).

### 1.2 The "Horizontal" Tagging Layer

To enable cross-functional reporting (e.g., "Show me all Automation maturity"), we add a metadata layer to Practices.

- **Field:** `capability_tags` (Array of Strings)
- **Standard Values:** `['People', 'Process', 'Technology', 'Data', 'Governance', 'Culture', 'Risk', 'Communication']`

### 1.3 The 3×3×3 Content Hierarchy

```
Pillar (FP&A)
├── Theme 1: The Foundation (Control & Trust)
│   ├── Objective 1: Budget Discipline (3 Practices)
│   ├── Objective 2: Financial Controls (3 Practices)
│   └── Objective 3: Performance Monitoring (3 Practices)
├── Theme 2: The Future (Speed & Agility)
│   ├── Objective 4: Forecasting Agility (3 Practices)
│   ├── Objective 5: Driver-Based Planning (3 Practices)
│   └── Objective 6: Scenario Modeling (3 Practices)
└── Theme 3: The Intelligence (Value & Influence)
    ├── Objective 7: Strategic Influence (4 Practices)*
    ├── Objective 8: Decision Support (3 Practices)
    └── Objective 9: Operational Excellence (3 Practices)

* Strategic Influence includes 4th practice: Investment Rigor
```

---

## 2. DATA MODEL (Schema Definitions)

### 2.1 Themes (3 Total)

| ID | Name | Description |
|:---|:-----|:------------|
| `foundation` | The Foundation | Control & Trust (Budgeting, Controls, Variance) |
| `future` | The Future | Speed & Agility (Forecasting, Drivers, Scenarios) |
| `intelligence` | The Intelligence | Value & Influence (Partnership, Analytics, OpEx) |

### 2.2 Objectives (9 Total)

Aligned 3 per Theme:

| Theme | Objectives |
|:------|:-----------|
| The Foundation | Budget Discipline, Financial Controls, Performance Monitoring |
| The Future | Forecasting Agility, Driver-Based Planning, Scenario Modeling |
| The Intelligence | Strategic Influence, Decision Support, Operational Excellence |

### 2.3 Practices (28 Total)

- **Standard:** 3 Practices per Objective
- **Asymmetry:** "Strategic Influence" contains a 4th practice: **Investment Rigor**

### 2.4 Questions (60 Total)

- **ID Format:** `fpa_l{level}_q{num}` (e.g., `fpa_l1_q01`, `fpa_l3_q53`)
- **Fields:**
  - `help`: Contextual tooltip explaining "Why this matters"
  - `expert_action`: Structure containing `{title, recommendation, type}`
  - `impact`: Score 1–5 (used in priority scoring)
  - `complexity`: Score 1–5 (used in priority scoring)
  - `is_critical`: Boolean (triggers 2× multiplier)
  - `initiative_id`: Links question to an initiative

---

## 3. CONTENT FILES

### 3.1 File Inventory

| File | Count | Purpose |
|:-----|:------|:--------|
| `themes.json` | 3 | Theme definitions with metadata |
| `objectives.json` | 9 | Objective definitions linked to themes |
| `practices.json` | 28 | Practice definitions linked to objectives |
| `questions.json` | 60 | Assessment questions with scoring metadata |
| `initiatives.json` | 10 | Strategic initiative groupings |
| `gates.json` | 1 | Critical gates and score thresholds |

### 3.2 initiatives.json Schema

Initiatives group questions by strategic theme for the Action Planning War Room. Questions link to initiatives via `question.initiative_id`.

```typescript
interface Initiative {
  id: string;                    // e.g., "init_forecast_accuracy"
  theme_id: string;              // Parent theme
  objective_id: string;          // Parent objective
  title: string;                 // Display name
  description: string;           // What this initiative achieves
}
```

### 3.3 gates.json Schema

Critical gates define blocking conditions and score thresholds. Uses a flat object structure:

```typescript
interface GatesConfig {
  version: string;               // e.g., "2.9.0"
  score_thresholds: {
    level_2: number;             // e.g., 50
    level_3: number;             // e.g., 80
    level_4: number;             // e.g., 95
  };
  critical_gates: {
    l1_to_l2: string[];          // Question IDs that must pass
    l2_to_l3: string[];          // Question IDs that must pass
  };
  level_names: {
    [level: string]: string;     // e.g., "1": "Foundational"
  };
}
```

**Example:**

```json
{
  "version": "2.9.0",
  "score_thresholds": {
    "level_2": 50,
    "level_3": 80,
    "level_4": 95
  },
  "critical_gates": {
    "l1_to_l2": ["fpa_l1_q01", "fpa_l1_q02", "fpa_l1_q05", "fpa_l1_q09"],
    "l2_to_l3": ["fpa_l2_q01", "fpa_l2_q02", "fpa_l2_q06", "fpa_l2_q07"]
  },
  "level_names": {
    "1": "Foundational",
    "2": "Developing",
    "3": "Advanced",
    "4": "Leading"
  }
}
```

---

## 4. DATABASE SCHEMA

### 4.1 Core Tables

#### diagnostic_runs

Primary table for assessment sessions.

```sql
CREATE TABLE diagnostic_runs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  pillar TEXT NOT NULL DEFAULT 'fpa',
  
  -- VS-18: Context Intake
  context JSONB,                           -- Company/industry information
  setup_completed_at TIMESTAMPTZ,          -- When intake was completed
  
  -- VS-21: Calibration
  calibration JSONB,                       -- Objective importance weights
  
  -- Assessment State
  status TEXT CHECK (status IN ('draft', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  
  -- VS-39: Finalization
  finalized_at TIMESTAMPTZ,                -- When action plan was locked
  action_plan_snapshot JSONB,              -- Frozen plan at finalization
  
  -- VS-32d: AI Action Proposal
  action_proposal JSONB,                   -- AI-generated proposal
  action_proposal_generated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### diagnostic_inputs

Stores user responses to assessment questions.

```sql
CREATE TABLE diagnostic_inputs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  run_id UUID REFERENCES diagnostic_runs(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,               -- e.g., 'fpa_l1_q01'
  value TEXT CHECK (value IS NULL OR value IN ('true', 'false', 'N/A')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(run_id, question_id)
);
```

**Note:** The `value` field accepts:
- `'true'` — Yes/Implemented
- `'false'` — No/Not implemented
- `'N/A'` — Not applicable

#### action_plans

User commitments from the War Room.

```sql
CREATE TABLE action_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  run_id UUID REFERENCES diagnostic_runs(id) ON DELETE CASCADE,
  
  -- Maps to the JSON Question ID (e.g., 'fpa_l1_q01')
  question_id TEXT NOT NULL, 
  
  -- Plan details
  status TEXT CHECK (status IN ('planned', 'completed')) DEFAULT 'planned',
  timeline TEXT CHECK (timeline IN ('6m', '12m', '24m')),
  assigned_owner TEXT,
  
  -- VS-32d: AI-generated fields
  rationale JSONB,                         -- AI explanation for recommendation
  evidence_ids TEXT[],                     -- Supporting evidence references
  ai_generated BOOLEAN DEFAULT FALSE,      -- Flag for AI-created plans
  priority_rank INTEGER,                   -- Sort order within priority lane
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(run_id, question_id)
);
```

### 4.2 VS-25: AI Interpretation Tables

Five-table pipeline for AI-powered analysis.

#### interpretation_sessions

Tracks AI pipeline execution.

```sql
CREATE TABLE interpretation_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  run_id UUID REFERENCES diagnostic_runs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  -- Status values: pending | generating | awaiting_user | finalizing | complete | failed
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);
```

#### interpretation_steps

Logs individual AI calls within a session.

```sql
CREATE TABLE interpretation_steps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES interpretation_sessions(id) ON DELETE CASCADE,
  step_type TEXT NOT NULL,                 -- e.g., 'analysis', 'critique', 'synthesis'
  step_order INTEGER NOT NULL,
  input_data JSONB,
  output_data JSONB,
  model_used TEXT,                         -- e.g., 'gpt-4-turbo'
  tokens_used INTEGER,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### interpretation_ai_conversations

Full conversation history for debugging and audit.

```sql
CREATE TABLE interpretation_ai_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES interpretation_sessions(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('system', 'user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### interpretation_questions

Critic-generated clarifying questions.

```sql
CREATE TABLE interpretation_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES interpretation_sessions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT,                      -- e.g., 'clarification', 'depth', 'context'
  user_answer TEXT,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### interpretation_reports

Generated analysis reports.

```sql
CREATE TABLE interpretation_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES interpretation_sessions(id) ON DELETE CASCADE,
  report_type TEXT CHECK (report_type IN ('executive', 'detailed', 'action')),
  content JSONB NOT NULL,                  -- Structured report content
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 VS-32d: Planning Context

Wizard state for action planning flow.

```sql
CREATE TABLE planning_context (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  run_id UUID REFERENCES diagnostic_runs(id) ON DELETE CASCADE,
  
  -- Planning parameters
  target_maturity_level INTEGER CHECK (target_maturity_level BETWEEN 1 AND 4),
  bandwidth TEXT CHECK (bandwidth IN ('limited', 'moderate', 'available')),
  priority_focus TEXT[] DEFAULT '{}',      -- Array of focus area IDs
  team_size_override INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(run_id)
);
```

### 4.4 Feedback Table

Beta feedback collection.

```sql
CREATE TABLE feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  run_id UUID REFERENCES diagnostic_runs(id),
  type TEXT CHECK (type IN ('bug', 'confusion', 'suggestion', 'general')),
  content TEXT NOT NULL,
  metadata JSONB,                          -- Browser info, page context, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. SCORING ENGINE

### 5.1 Core Algorithm

The scoring engine calculates action priority using the **Impact²/Complexity** formula with multipliers.

```
Priority Score = (Impact² / Complexity) × CriticalBoost × ImportanceFactor
```

### 5.2 Components

| Component | Source | Values | Description |
|:----------|:-------|:-------|:------------|
| **Impact** | `questions.json` | 1–5 | Business impact if addressed |
| **Complexity** | `questions.json` | 1–5 | Implementation difficulty |
| **CriticalBoost** | `is_critical` flag | 1× or 2× | Doubles score for critical blockers |
| **ImportanceFactor** | VS-21 Calibration | 0.50×–1.50× | User-declared objective importance |

### 5.3 Priority Lanes

Actions are sorted into three priority lanes based on gap analysis:

| Lane | Name | Criteria | Purpose |
|:-----|:-----|:---------|:--------|
| **P1** | Unlock | Critical blockers preventing level advancement | Must-fix items blocking maturity progression |
| **P2** | Optimize | Gaps between current and potential level | High-impact improvements within reach |
| **P3** | Future | Next-level preparation items | Strategic investments for future maturity |

### 5.4 Score Calculation Flow

```
1. Load user responses from diagnostic_inputs
2. Calculate raw scores per practice/objective/theme
3. Apply calibration multipliers (ImportanceFactor)
4. Identify gaps (answered 'false' or partial)
5. For each gap:
   a. Calculate: (Impact² / Complexity)
   b. Apply CriticalBoost if is_critical = true
   c. Apply ImportanceFactor from calibration
6. Assign to P1/P2/P3 lane based on gap type
7. Sort within lane by Priority Score (descending)
```

### 5.5 Traffic Light Override ("Fair but Firm")

To prevent the "Green Light of Death" (high aggregate scores masking critical failures):

- **Rule:** If any P1 (critical blocker) exists, overall status cannot be "Green"
- **Rule:** Maximum 2 levels above lowest practice score
- **Rule:** Critical gate failures override percentage-based scoring

---

## 6. VS-21: CALIBRATION LAYER

### 6.1 Purpose

Allows users to declare relative importance of objectives before scoring, ensuring the Priority Matrix reflects their strategic priorities.

### 6.2 Schema (diagnostic_runs.calibration)

```typescript
interface CalibrationData {
  importance_map: Record<string, 1 | 2 | 3 | 4 | 5>;  // objective_id → level
  locked: string[];                                    // Safety Valve objectives (cannot be deprioritized)
}
```

**Example:**

```json
{
  "importance_map": {
    "obj_budget_discipline": 3,
    "obj_forecasting_agility": 5,
    "obj_strategic_influence": 4
  },
  "locked": ["obj_financial_controls"]
}
```

### 6.3 Importance Multipliers (5-Tier System)

| Level | Label | Multiplier | Effect |
|:------|:------|:-----------|:-------|
| 1 | Minimal | 0.50× | Strongly de-prioritizes gaps |
| 2 | Low | 0.75× | De-prioritizes gaps |
| 3 | Medium | 1.00× | Default weighting |
| 4 | High | 1.25× | Elevates gaps |
| 5 | Critical Priority | 1.50× | Maximum priority boost |

---

## 7. VS-18: CONTEXT INTAKE

### 7.1 Purpose

Captures company and pillar context before assessment begins, enabling personalized AI interpretation and relevant benchmarking.

### 7.2 Schema (diagnostic_runs.context)

```typescript
interface Context {
  company: {
    name: string;
    industry: string;
    size: 'startup' | 'smb' | 'mid_market' | 'enterprise';
    revenue_range?: string;
    employee_count?: string;
  };
  pillar: {
    team_size: number;
    reporting_to: string;           // e.g., "CFO", "VP Finance"
    current_tools: string[];        // e.g., ["Excel", "Anaplan"]
    pain_points: string[];
    strategic_priorities: string[];
  };
  completed_at: string;             // ISO timestamp
}
```

### 7.3 Workflow

1. User starts new diagnostic run
2. Redirect to Context Intake wizard
3. Collect company information (Step 1)
4. Collect pillar-specific context (Step 2)
5. Set `setup_completed_at` timestamp
6. Proceed to assessment

---

## 8. VS-25: AI INTERPRETATION LAYER

### 8.1 Architecture

The AI Interpretation Layer follows the **Critic-Advocate** pattern:

```
User Results → Analyzer → Critic → [Questions] → Synthesizer → Report
```

### 8.2 Pipeline Steps

| Step | Agent | Input | Output |
|:-----|:------|:------|:-------|
| 1 | **Analyzer** | Scores + Context | Initial insights |
| 2 | **Critic** | Initial insights | Clarifying questions |
| 3 | **User** | Questions | Answers |
| 4 | **Synthesizer** | All above | Final report |

### 8.3 Session Status Flow

```
pending → generating → awaiting_user → finalizing → complete
                ↓              ↓              ↓
              failed        failed        failed
```

### 8.4 Core Principle: "AI Cannot Grade"

- AI **explains** scores but never **changes** underlying deterministic scoring
- AI provides interpretation and recommendations, not assessment
- All scores come from the Scoring Engine (Section 5)

### 8.5 Report Types

| Type | Audience | Content |
|:-----|:---------|:--------|
| `executive` | C-suite | 1-page summary with key findings |
| `detailed` | FP&A team | Full analysis with practice-level insights |
| `action` | Project leads | Prioritized action recommendations |

---

## 9. VS-28: ACTION PLANNING (WAR ROOM)

### 9.1 Concept

A "War Room" where users select initiatives to build their action plan. The UI dynamically updates projected scores as actions are toggled.

### 9.2 Workflow

1. View Priority Matrix with P1/P2/P3 lanes
2. Select actions to commit to
3. Assign timeline (6m / 12m / 24m)
4. Assign owner (optional)
5. View projected score impact
6. Save action plan

### 9.3 Simulator

When an action is toggled:

1. Recalculate scores assuming that gap is closed
2. Update projected maturity level
3. Show delta vs. current state
4. Highlight newly unlocked capabilities

---

## 10. VS-39/VS-40: FINALIZATION

### 10.1 Purpose

Locks the action plan to create an immutable snapshot, enabling progress tracking and unlocking the Executive Report.

### 10.2 Validation Rules (VS-40)

Before finalization is allowed:

- [ ] At least 1 action selected
- [ ] All selected actions have timeline assigned
- [ ] All selected actions have owner assigned (configurable)

### 10.3 Finalization Flow

```
1. Validate all rules pass
2. Create action_plan_snapshot (JSONB copy of current plans)
3. Set finalized_at timestamp
4. Lock action_plans for this run (no edits)
5. Unlock Executive Report tab
```

### 10.4 Post-Finalization State

| Field | Value |
|:------|:------|
| `finalized_at` | Timestamp of lock |
| `action_plan_snapshot` | Frozen copy of action_plans |
| Action Plans | Read-only (status can still change to 'completed') |
| Executive Report | Unlocked and accessible |

---

## 11. API ENDPOINTS

### 11.1 Core CRUD

| Method | Endpoint | Purpose |
|:-------|:---------|:--------|
| GET | `/diagnostic-runs` | List user's diagnostic runs |
| POST | `/diagnostic-runs` | Create new diagnostic run |
| GET | `/diagnostic-runs/:id` | Get single run with inputs |
| DELETE | `/diagnostic-runs/:id` | Delete run and related data |
| GET | `/diagnostic-inputs/:runId` | Get all inputs for a run |
| POST | `/diagnostic-inputs` | Save/update input response |

### 11.2 Setup & Calibration

| Method | Endpoint | Purpose |
|:-------|:---------|:--------|
| GET | `/diagnostic-runs/:id/setup` | Get context intake state |
| POST | `/diagnostic-runs/:id/setup` | Save context intake |
| GET | `/diagnostic-runs/:id/calibration` | Get calibration state |
| POST | `/diagnostic-runs/:id/calibration` | Save objective importance |

### 11.3 Scoring & Results

| Method | Endpoint | Purpose |
|:-------|:---------|:--------|
| POST | `/diagnostic-runs/:id/complete` | Mark assessment complete |
| POST | `/diagnostic-runs/:id/score` | Calculate scores |
| GET | `/diagnostic-runs/:id/results` | Get full results with analysis |
| GET | `/diagnostic-runs/:id/report` | Get formatted report data |

### 11.4 AI Interpretation (VS-25)

All interpretation endpoints are nested under `/diagnostic-runs/:id/`:

| Method | Endpoint | Purpose |
|:-------|:---------|:--------|
| POST | `/diagnostic-runs/:id/interpret/start` | Begin interpretation session |
| GET | `/diagnostic-runs/:id/interpret/status` | Get session status |
| POST | `/diagnostic-runs/:id/interpret/answer` | Submit answer to critic question |
| GET | `/diagnostic-runs/:id/interpret/report` | Get generated report |
| POST | `/diagnostic-runs/:id/interpret/feedback` | Submit feedback on AI quality |

### 11.5 Action Planning (VS-28)

| Method | Endpoint | Purpose |
|:-------|:---------|:--------|
| GET | `/diagnostic-runs/:id/action-plan` | Get current action plans |
| POST | `/diagnostic-runs/:id/action-plan` | Create/update action plan |
| DELETE | `/diagnostic-runs/:id/action-plan/:questionId` | Remove action plan by question ID |
| GET | `/diagnostic-runs/:id/action-plan/simulate` | Get projected scores |

### 11.6 Finalization (VS-39)

| Method | Endpoint | Purpose |
|:-------|:---------|:--------|
| POST | `/diagnostic-runs/:id/finalize` | Lock action plan |
| GET | `/diagnostic-runs/:id/finalize/validate` | Check if ready to finalize |

### 11.7 Feedback

| Method | Endpoint | Purpose |
|:-------|:---------|:--------|
| POST | `/feedback` | Submit user feedback |
| GET | `/feedback` | Get user's feedback history |

### 11.8 Spec & System

| Method | Endpoint | Purpose |
|:-------|:---------|:--------|
| GET | `/api/spec` | Get full content spec |
| GET | `/spec/questions` | Get questions only |
| GET | `/supabase-health` | Health check |

---

## 12. UI COMPONENTS

### 12.1 Assessment Flow

```
Context Intake → Calibration → Questions → Results → War Room → Executive Report
     (VS-18)       (VS-21)       (Core)    (Core)    (VS-28)      (VS-39)
```

### 12.2 Results Dashboard

| Component | Purpose |
|:----------|:--------|
| **Maturity Summary** | Overall score with theme breakdown |
| **Priority Matrix** | BCG-style grid: Priority × Maturity Stage (VS-33) |
| **Maturity Footprint** | Practice-level evidence grid (VS-23) |
| **AI Insights** | Interpretation summary (VS-25) |

### 12.3 Priority Matrix (VS-33)

BCG-style 2×2 matrix grouping practices:

```
                    │ High Priority │ Low Priority │
────────────────────┼───────────────┼──────────────┤
 Early Maturity     │   FOCUS NOW   │   CONSIDER   │
────────────────────┼───────────────┼──────────────┤
 Advanced Maturity  │   OPTIMIZE    │   MAINTAIN   │
```

---

## 13. FUTURE CONSIDERATIONS

### 13.1 Planned Features

| VS | Feature | Status |
|:---|:--------|:-------|
| VS-43 | Multi-pillar support | Planned |
| VS-50 | Team collaboration | Backlog |

### 13.2 Extensibility Points

- **New Pillars:** Follow Strict Vertical Isolation for new content
- **New AI Models:** Swap models in interpretation pipeline via config
- **Custom Gates:** Define pillar-specific critical gates in `gates.json`
- **Benchmarking:** Context data enables industry comparisons (future)

---

## APPENDIX A: Changelog (v2.9.0 → v3.0.0)

| Area | v2.9.0 | v3.0.0 |
|:-----|:-------|:-------|
| **Database Tables** | 1 table (action_plans) | 8 tables fully documented |
| **Scoring Engine** | "Simulator" (undocumented) | Full algorithm specification |
| **Priority System** | Not specified | P1/P2/P3 Priority Lanes |
| **Content Files** | 4 mentioned | 6 files with schemas |
| **API Endpoints** | 0 documented | 25+ endpoints specified |
| **AI Interpretation** | Not mentioned | VS-25 pipeline (5 tables) |
| **Finalization** | Not mentioned | VS-39/VS-40 workflow |
| **Calibration** | Not mentioned | VS-21 importance multipliers (5-tier) |
| **Context Intake** | Not mentioned | VS-18 company/pillar fields |
| **action_plans.status** | 4 values | 2 values ('planned', 'completed') |
| **Visualization** | "Dynamic Radar + Metro Line" | Priority Matrix (BCG-style) |

---

## APPENDIX B: Migration History

| Migration | VS | Tables/Columns Added |
|:----------|:---|:---------------------|
| 001 | Core | diagnostic_runs, diagnostic_inputs |
| 002 | VS-18 | + context, setup_completed_at |
| 003 | VS-21 | + calibration |
| 004 | VS-25 | interpretation_* (5 tables) |
| 005 | VS-28 | action_plans |
| 006 | VS-32d | + rationale, evidence_ids, ai_generated, priority_rank, action_proposal |
| 007 | VS-39 | + finalized_at, action_plan_snapshot |
| 008 | VS-101 | feedback |

---

## APPENDIX C: Spec vs Implementation Reconciliation

Items from v2.9.0 explicitly updated in v3.0.0:

| v2.9.0 Claim | v3.0.0 Status |
|:-------------|:--------------|
| `action_plans.status` has 4 values | Updated to 2: ('planned', 'completed') |
| `target_timeline` field | Renamed to `timeline` |
| "Dynamic Radar + Metro Line" | Replaced with Priority Matrix (VS-33) |
| "Simulator" undocumented | Fully documented in Section 5 |
| 0 API endpoints | 25+ documented in Section 11 |
| Calibration 4-tier system | Corrected to 5-tier (Minimal through Critical Priority) |
| Theme IDs with `theme_` prefix | Corrected to match code (`foundation`, `future`, `intelligence`) |
| `diagnostic_inputs.response` field | Corrected to `value` with 'true'/'false'/'N/A' |
| Interpretation endpoints standalone | Corrected to nested under `/diagnostic-runs/:id/` |
| VS-33 marked as Planned | Removed — VS-33 is implemented |

---

**END OF SPECIFICATION**

*Document version: v3.0.0*  
*Reflects implementation through VS-40*
