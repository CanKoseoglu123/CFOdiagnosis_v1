# CFO Lens AI — System Specification

**Version:** 4.0  
**Status:** Canonical  
**Purpose:** Design philosophy, architecture principles, system invariants.

---

## 1. Architecture Principles

### 1.1 Strict Vertical Isolation

The platform is architected for 9-pillar scalability.

**Rules:**
- A Practice belongs to exactly **one** Objective
- An Objective belongs to exactly **one** Theme and Pillar
- No sharing of IDs across pillars

**Example:** `prac_fpa_reconciliations` vs `prac_r2r_reconciliations` — never share.

### 1.2 Horizontal Tagging

Practices can be tagged for cross-functional reporting without breaking isolation.

**Field:** `capability_tags`  
**Values:** `['People', 'Process', 'Technology', 'Data', 'Governance', 'Culture', 'Risk', 'Communication']`

### 1.3 Content Hierarchy (3×3×3)

```
Pillar (e.g., FP&A)
└── 3 Themes
    └── 3 Objectives per Theme (9 total)
        └── 2-4 Practices per Objective
            └── Questions at L1-L4 maturity levels
```

**FP&A totals:** 3 themes, 9 objectives, 26 practices, 97 questions.

---

## 2. Scoring System

### 2.1 The Formula

```
Priority Score = (Impact² / Complexity) × CriticalBoost × CombinedMultiplier

where:
  CombinedMultiplier = min(2.0, ImportanceFactor × ContextModifier)
```

**Why Impact²:** High-impact items are disproportionately valuable.

**Why 2.0× cap:** Prevents runaway inflation from stacking multipliers.

### 2.2 Components

| Component | Source | Values |
|-----------|--------|--------|
| Impact | Question JSON | 1-5 |
| Complexity | Question JSON | 1-5 |
| CriticalBoost | `is_critical` flag | 1× or 2× |
| ImportanceFactor | User calibration | 0.50×, 0.75×, 1.00×, 1.25×, 1.50× |
| ContextModifier | Pain point matches | 1.0× base, ×1.5 per match, max 2.0× |

### 2.3 Calibration Multipliers

| Level | Label | Multiplier |
|-------|-------|------------|
| 5 | Critical Priority | 1.50× |
| 4 | High | 1.25× |
| 3 | Medium | 1.00× (default) |
| 2 | Low | 0.75× |
| 1 | Minimal | 0.50× |

### 2.4 Priority Lanes

| Lane | Name | Criteria |
|------|------|----------|
| **P1** | Unlock | Critical blockers preventing level advancement |
| **P2** | Optimize | Gaps between current and potential level |
| **P3** | Future | Next-level preparation items |

### 2.5 Fair but Firm

- If any P1 exists → overall status ≠ Green
- Critical gate failures cap level regardless of score
- Maximum 2 levels above lowest practice score

---

## 3. Maturity Model

### 3.1 Levels and Thresholds

| Level | Name | Score Threshold | Gate Requirement |
|-------|------|-----------------|------------------|
| 1 | Emerging | < 40% | — |
| 2 | Defined | ≥ 40% | Pass L1 critical gates |
| 3 | Managed | ≥ 65% | Pass L1 + L2 critical gates |
| 4 | Optimized | ≥ 85% | Pass all critical gates |

### 3.2 The Three-Stage Journey

| Stage | Theme | Core Question |
|-------|-------|---------------|
| **Foundation** | Control & Trust | Can leadership trust your numbers? |
| **Future** | Speed & Agility | Can you adapt when plans change? |
| **Intelligence** | Value & Influence | Are you a strategic partner? |

### 3.3 Critical Gates

Gates enforce prerequisites. Failing a gate caps your level.

**Source of truth:** `content/gates.json` → imported via `src/gates/index.ts`

**FP&A L1→L2 gates:**
- `fpa_q001` — Annual budget before fiscal year
- `fpa_q002` — Full P&L in budget
- `fpa_q016` — Unified chart of accounts
- `fpa_q026` — Monthly management reporting

**FP&A L2→L3 gates:**
- `fpa_q031` — Monthly Budget vs. Actuals
- `fpa_q033` — Variance threshold investigation
- `fpa_q041` — Working capital modeled
- `fpa_q046` — Multi-user forecasting

---

## 4. User Journey

### 4.1 Assessment Flow

```
Start → Company Setup → Persona Classification → Pillar Context
      → Assessment (by objective) → Calibration → Report
      → War Room → Finalization → Executive Report
```

**Subscription Gating:** When subscription enforcement is enabled, paid objectives display an upgrade modal instead of assessment questions for users on the free tier. Free-tier users can complete a subset of objectives; upgrading unlocks the full assessment. Bypass emails (configured via env) skip gating for testing and admin use.

### 4.2 Run States

| State | Meaning | Editable |
|-------|---------|----------|
| `created` | Just created | Setup only |
| `draft` | Setup in progress | Setup only |
| `in_progress` | Assessment underway | Questions, calibration |
| `completed` | Assessment done | Action plan only |

### 4.3 Finalization

Finalization is **irreversible**:
1. Creates frozen `action_plan_snapshot`
2. Sets `finalized_at` timestamp
3. Unlocks Executive Report
4. Prevents further edits

**Why irreversible:** Executive Report is a board-level commitment. Must be stable.

---

## 5. Persona Classification

### 5.1 The Six Archetypes

| Persona | Focus |
|---------|-------|
| Growth Challenger | Cash, speed |
| Margin Optimizer | Cost control, profitability |
| Stability Seeker | Controls, governance |
| Transformation Driver | Scenarios, agility |
| Scale Navigator | Process, automation |
| Value Creator | ROI, investor reporting |

### 5.2 Classification Inputs

Nine fields drive classification:
1. Ownership structure
2. Revenue size
3. Growth rate
4. Margin profile
5. Leverage situation
6. Industry
7. FP&A team size
8. Current tools
9. Pain points

### 5.3 Target Calibration

Each persona has different maturity targets per objective.

**Source:** `content/targetMatrix.json`

---

## 6. AI Interpretation

### 6.1 Core Principle

**AI cannot grade.** AI explains scores but never changes them. Scoring is deterministic; AI adds narrative.

### 6.2 Tonality Rules

| Score | Has Critical | Tone |
|-------|--------------|------|
| 80-100 | No | Celebrate |
| 40-79 | No | Refine |
| 0-39 | No | Remediate |
| Any | Yes | Urgent |

### 6.3 Pipeline

```
Results → Tonality Injector → Generator (AI) → Quality Heuristics
        → Critic (AI) → [Questions] → Synthesizer → Report
```

---

## 7. Data Model

### 7.1 Content Files

| File | Purpose |
|------|---------|
| `content/themes.json` | 3 theme definitions |
| `content/objectives.json` | 9 objective definitions |
| `content/practices.json` | 26 practice definitions |
| `content/questions-foundation.json` | 37 Foundation questions |
| `content/questions-future.json` | 27 Future questions |
| `content/questions-intelligence.json` | 33 Intelligence questions |
| `content/initiatives.json` | 9 initiative groupings |
| `content/gates.json` | Thresholds and critical gates |
| `content/targetMatrix.json` | Persona-specific targets |

### 7.2 Question Schema

```typescript
interface Question {
  id: string;                    // e.g., "fpa_q001"
  practice_id: string;
  maturity_level: 1 | 2 | 3 | 4;
  text: string;
  help: string;                  // "Why this matters"
  impact: 1 | 2 | 3 | 4 | 5;
  complexity: 1 | 2 | 3 | 4 | 5;
  is_critical: boolean;
  initiative_id: string;
  expert_action: {
    title: string;
    recommendation: string;
    type: 'quick_win' | 'structural' | 'behavioral' | 'governance';
  };
}
```

### 7.3 Gates Schema

```typescript
interface GatesConfig {
  version: string;
  score_thresholds: {
    level_2: 40;
    level_3: 65;
    level_4: 85;
  };
  critical_gates: {
    l1_to_l2: string[];  // Question IDs
    l2_to_l3: string[];
  };
  level_names: {
    "1": "Emerging";
    "2": "Defined";
    "3": "Managed";
    "4": "Optimized";
  };
}
```

---

## 8. Database Tables

### 8.1 Core Tables

| Table | Purpose |
|-------|---------|
| `diagnostic_runs` | Assessment sessions |
| `diagnostic_inputs` | Question responses |
| `company_profiles` | Company context + persona |
| `action_plans` | War Room commitments |
| `stripe_subscriptions` | Subscription status and tier (Stripe-synced) |

### 8.2 Key Fields

**diagnostic_runs:**
- `context` (JSONB) — Pillar-specific context
- `calibration` (JSONB) — `{importance_map, locked}`
- `company_profile_id` — Links to persona
- `finalized_at` — When locked
- `action_plan_snapshot` — Frozen plan

**diagnostic_inputs:**
- `question_id` — e.g., "fpa_q001"
- `value` — `true`, `false`, `'N/A'`

**action_plans:**
- `question_id` — Links to question
- `status` — `'planned'` or `'completed'`
- `timeline` — `'6m'`, `'12m'`, `'24m'`
- `assigned_owner` — Text

---

## 9. Extension Points

### 9.1 Adding a New Pillar

1. Create `content/pillars/{pillar_id}/` with config
2. Create `spec/pillars/{pillar_id}/CONTENT_GUIDE.md`
3. Create `spec/pillars/{pillar_id}/IMPACT_ANCHORS.md`
4. Create pillar pack in `src/interpretation/pillars/{pillar_id}/`
5. Register in `src/interpretation/pillars/registry.ts`
6. Follow Strict Vertical Rule (unique IDs)

### 9.2 Adding Questions

1. Add to `content/questions-{theme}.json`
2. Follow `QUESTION_REVIEW_CRITERIA.md`
3. Calibrate with pillar `IMPACT_ANCHORS.md`
4. Run `npm run test:vs24`

### 9.3 Adding Pain Points

1. Add to context schema
2. Add mapping to pillar `CONTENT_GUIDE.md`
3. Update scoring engine

---

## 10. System Invariants

These must **always** be true:

| Invariant | Enforcement |
|-----------|-------------|
| Question → one Practice | Content validation |
| Practice → one Objective | Content validation |
| Scoring is deterministic | Pure functions |
| Missing answers = 0 | Conservative scoring |
| Gate failure caps level | Maturity calculation |
| AI never changes scores | Layer separation |
| Finalization irreversible | No reversal endpoint |
| Gates from SSOT | `src/gates/index.ts` |
| Content in JSON | `content/*.json` |

---

## 11. API Endpoints (Summary)

| Category | Key Endpoints |
|----------|---------------|
| Runs | `POST /diagnostic-runs`, `GET /:id`, `POST /:id/complete` |
| Inputs | `POST /diagnostic-inputs` |
| Calibration | `GET/POST /diagnostic-runs/:id/calibration` |
| Scoring | `POST /:id/score`, `GET /:id/report` |
| Action Plans | `GET/POST/DELETE /diagnostic-runs/:id/action-plan` |
| Finalization | `POST /:id/finalize` |
| AI | `POST /:id/interpret/start`, `GET /:id/interpret/status` |
| Profiles | `POST/GET/PUT /api/company-profiles` |
| Stripe | `POST /api/stripe/checkout`, `POST /api/stripe/webhooks`, `POST /api/stripe/portal` |
| Subscriptions | `GET /api/stripe/subscription/status` |

**Auth:** Bearer token (Supabase) on all except `/health`, `/api/spec`.

---

## Related Documents

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | Entry point, decision framework |
| `DESIGN_SYSTEM.md` | Visual design |
| `NAVIGATION_PRINCIPLES.md` | Navigation rules |
| `QUESTION_REVIEW_CRITERIA.md` | Universal question checklist |
| `ACTION_REVIEW_CRITERIA.md` | Universal action checklist |
| `IMPACT_COMPLEXITY.md` | Cross-pillar methodology |
| `pillars/fpa/CONTENT_GUIDE.md` | FP&A specifics |
| `pillars/fpa/IMPACT_ANCHORS.md` | FP&A calibration examples |

---

*This spec defines what the system is and what must always be true.*
