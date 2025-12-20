# 🚀 FINANCE DIAGNOSTIC PLATFORM — SYSTEM SPEC

**Version:** v2.7.0  
**Status:** FINAL / FROZEN  
**Supersedes:** v2.6.4  
**Audience:** Product, Engineering, Design, Content  
**Change Type:** Feature Addition (Theme Layer) + Content Calibration

---

## CHANGELOG from v2.6.4

| Change | Description |
|--------|-------------|
| **Theme Layer** | Added 3 themes for UX grouping: Foundation, Future, Intelligence |
| **Purpose Statements** | Added `purpose` field to objectives for clarity |
| **Theme Order** | Added `theme_order` field for deterministic UI rendering |
| **Budget Reclassification** | Moved Budget from "Planning" to "Foundation" theme |
| **Criticality Calibration** | Reduced critical questions from 16 to 10 |

---

## 0. PURPOSE OF THE SYSTEM

The Finance Diagnostic evaluates how reliably an organisation executes real finance workflows, based on observable, auditable evidence, and positions the organisation on explicit maturity levels using deterministic gates.

It produces:
- Execution completeness scores
- Gated maturity levels (non-linear)
- Capability, Pillar, and Finance roll-ups
- Explicit gaps and critical risks
- Deterministic, prioritised actions
- Executive-grade (Gartner-style) reports
- Full auditability (who changed what, when)

### Non-negotiable principles
- Reality before taxonomy
- Evidence before opinion
- Deterministic logic for scores & maturity
- AI is explanatory, never authoritative
- Multi-player safe by design

---

## 1. CANONICAL DIAGNOSTIC LAYER MODEL (L0–L5)

This model is normative. All system design, data structures, and UX must align to it.

| Layer | Name | Scope | What it is | Purpose |
|-------|------|-------|------------|---------|
| L0 | Workflow Reality Layer | All pillars | Process-based workflows | Capture how work actually happens |
| L1 | Domain | All pillars | The business function | Sets top-level boundary |
| L2 | Pillar | Per pillar | Navigational grouping | Orientation, reporting, UX |
| **L2.5** | **Theme** | **Per pillar** | **UX grouping of objectives** | **Visual flow, not scoring** |
| L3 | Objective | Per capability | Outcome the business expects | Defines what "good" looks like |
| L4 | Activity | Per objective | Recurring or trigger-based actions | Describe what actually happens |
| L5 | Evidence | Per activity | Binary, observable proof | Anchor diagnostic in reality |

**👉 Only L5 Evidence is directly assessed. All scores, maturity, narratives, and actions are derived.**

---

## 2. THEME LAYER (NEW in v2.7.0)

Themes group objectives for **presentation only**. They do not affect scoring or maturity logic.

### Theme Definitions

| Theme Code | Display Name | Purpose | Objectives |
|------------|--------------|---------|------------|
| `foundation` | The Foundation: Performance Management & Control | Establish baselines, ensure integrity, track against plan | Budget, Control, Variance |
| `future` | The Future: Planning & Forecasting | Build forward-looking capabilities | Forecast, Driver, Integrate |
| `intelligence` | The Intelligence: Strategic Analytics | Leverage advanced analytics | Scenario, Predict |

### Theme → Objective Mapping

| theme_order | Objective | Level | Theme |
|-------------|-----------|-------|-------|
| 1 | Budgeting | L1 | foundation |
| 2 | Financial Controls | L1 | foundation |
| 3 | Variance Management | L2 | foundation |
| 4 | Forecasting | L2 | future |
| 5 | Driver-Based Planning | L3 | future |
| 6 | Integrated Planning | L4 | future |
| 7 | Scenario Planning | L3 | intelligence |
| 8 | Predictive Analytics | L4 | intelligence |

### User Journey Narrative

```
THE FOUNDATION: "Do you have a plan? Do you control it? Do you track against it?"
├── Budgeting       → Establish the baseline
├── Controls        → Ensure data integrity
└── Variance        → Measure performance

THE FUTURE: "Where are you going? What drives it? Is it connected?"
├── Forecasting     → Project forward
├── Driver-Based    → Link to operations
└── Integrated      → Connect across functions

THE INTELLIGENCE: "What could happen? What will the machine tell us?"
├── Scenario        → Model uncertainty
└── Predictive      → Automate insights
```

---

## 3. OBJECTIVE DEFINITIONS (with Purpose Statements)

### Theme 1: The Foundation

| Objective | Purpose |
|-----------|---------|
| **Budgeting** | To establish a formal financial baseline against which performance can be measured |
| **Financial Controls** | To ensure data integrity, prevent fraud, and create a verifiable audit trail |
| **Variance Management** | To systematically identify, explain, and correct deviations from the plan |

### Theme 2: The Future

| Objective | Purpose |
|-----------|---------|
| **Forecasting** | To provide a realistic, rolling view of future performance as conditions change |
| **Driver-Based Planning** | To link financial outcomes directly to the operational levers that drive them |
| **Integrated Planning** | To unify data across functions into a single source of truth |

### Theme 3: The Intelligence

| Objective | Purpose |
|-----------|---------|
| **Scenario Planning** | To prepare the organization for volatility by modeling multiple "what-if" outcomes |
| **Predictive Analytics** | To use algorithms to automate baseline predictions and flag anomalies in real-time |

---

## 4. CRITICALITY MODEL (v2.7.0 Calibration)

### "Silence is a Risk" Rule
Any critical evidence = FALSE or UNANSWERED → CRITICAL_RISK generated.

### Critical Question Distribution

| Level | Theme | Objective | Critical | Non-Critical | Total |
|-------|-------|-----------|----------|--------------|-------|
| L1 | Foundation | Budgeting | 3 | 2 | 5 |
| L1 | Foundation | Financial Controls | 3 | 2 | 5 |
| L2 | Foundation | Variance Management | 2 | 3 | 5 |
| L2 | Future | Forecasting | 2 | 3 | 5 |
| L3 | Future | Driver-Based Planning | 0 | 5 | 5 |
| L4 | Future | Integrated Planning | 0 | 5 | 5 |
| L3 | Intelligence | Scenario Planning | 0 | 5 | 5 |
| L4 | Intelligence | Predictive Analytics | 0 | 5 | 5 |
| **Total** | | | **10** | **30** | **40** |

### Critical Questions (Exhaustive List)

| ID | Question | Rationale |
|----|----------|-----------|
| fpa_l1_q01 | Annual budget exists | No budget = no baseline |
| fpa_l1_q02 | Budget owner assigned | No owner = no accountability |
| fpa_l1_q03 | Full P&L budget | Partial budget ≠ budget |
| fpa_l1_q06 | Consistent chart of accounts | Inconsistent = unreliable |
| fpa_l1_q07 | JE review process | No review = fraud risk |
| fpa_l1_q10 | Segregation of duties | No SoD = audit failure |
| fpa_l2_q01 | Monthly BvA report | Core variance capability |
| fpa_l2_q02 | Variance investigation | Core variance capability |
| fpa_l2_q06 | Quarterly forecast | Core forecasting capability |
| fpa_l2_q07 | Cash flow forecast | Liquidity is always critical |

---

## 5. SCORING MODEL (UNCHANGED)

Execution score:
```
sum(earned_points) / sum(possible_points)
```

| Answer | Earned | Possible |
|--------|--------|----------|
| TRUE | 1 | 1 |
| FALSE | 0 | 1 |
| N/A | 0 | 0 |

If denominator = 0 → NOT_IN_SCOPE.

---

## 6. MATURITY MODEL (GATED, UNCHANGED)

### Core Rule
Maturity = highest level whose prerequisites are fully satisfied.

- Defined at Workflow level
- Rolled up via weakest-link logic
- NOT_APPLICABLE excluded

### Gates

| Level | Label | Threshold | Questions |
|-------|-------|-----------|-----------|
| 1 | Emerging | 80% | L1 (Budget + Control) |
| 2 | Defined | 80% | L2 (Variance + Forecast) |
| 3 | Managed | 80% | L3 (Driver + Scenario) |
| 4 | Optimized | 80% | L4 (Integrate + Predict) |

### Roll-ups
```
capability_maturity = min(applicable workflow maturity)
pillar_maturity     = min(applicable capability maturity)
finance_maturity    = min(applicable pillar maturity)
```

---

## 7. UI RENDERING RULES (NEW in v2.7.0)

### Question Presentation Order

The UI MUST render questions in `theme_order`, NOT in array index order.

```
Correct:  Theme 1 → Theme 2 → Theme 3
          (Budget → Control → Variance → Forecast → Driver → ...)

Incorrect: Level 1 → Level 2 → Level 3 → Level 4
           (Budget → Control → Variance → Forecast → ...)
```

### "Next" Button Logic

The "Next" button MUST follow visual order (theme_order), not backend array order.

```javascript
// CORRECT: Sort by theme_order before navigation
const sortedObjectives = objectives.sort((a, b) => a.theme_order - b.theme_order);

// INCORRECT: Rely on array index
const nextQuestion = questions[currentIndex + 1];
```

---

## 8. SCHEMA CHANGES (v2.7.0)

### SpecObjective (Updated)

```typescript
interface SpecObjective {
  id: string;
  pillar_id: string;
  level: number;
  name: string;
  purpose: string;       // NEW: Purpose statement
  description: string;
  action_id: string;
  theme: ThemeCode;      // NEW: 'foundation' | 'future' | 'intelligence'
  theme_order: number;   // NEW: Global sort order (1-8)
}
```

### AggregateSpec (Updated)

```typescript
interface AggregateSpec {
  version: string;
  pillars: SpecPillar[];
  questions: SpecQuestion[];
  maturityGates: SpecMaturityGate[];
  objectives: SpecObjective[];
  actions: SpecAction[];
  themes?: ThemeMetadata[];  // NEW: Theme metadata for UI
}
```

---

## 9. CONTENT INVENTORY

| Item | Count |
|------|-------|
| Pillars | 1 |
| Themes | 3 |
| Objectives | 8 |
| Questions | 40 |
| Critical Questions | 10 |
| Actions | 8 |
| Maturity Levels | 5 (0-4) |

---

## 10. CANONICAL SYSTEM RULE

> If a score, maturity level, or insight cannot be explained by pointing to specific evidence and the user who provided it, the system is wrong.

---

## APPENDIX: File Reference

| File | Purpose |
|------|---------|
| `src/specs/v2.7.0.ts` | Spec implementation |
| `src/specs/types.ts` | Type definitions |
| `src/specs/registry.ts` | Default version pointer |
| `spec/SPEC_v2.7.0.md` | This document |
