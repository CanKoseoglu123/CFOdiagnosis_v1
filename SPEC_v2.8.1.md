# 🚀 FINANCE DIAGNOSTIC PLATFORM — SYSTEM SPEC

**Version:** v2.8.1
**Status:** FINAL / FROZEN
**Supersedes:** v2.8.0
**Audience:** Product, Engineering, Design, Content
**Change Type:** VS21 Objective Importance Matrix (Calibration Layer)

---

## CHANGELOG (v2.8.0 → v2.8.1)

| Change | Before | After |
|--------|--------|-------|
| Calibration Layer | None | **VS21 Objective Importance Matrix** |
| Importance Levels | N/A | **1-5 scale** (Minimal to Critical) |
| Score Formula | `Impact²/Complexity × CriticalBoost` | `Impact²/Complexity × CriticalBoost × ImportanceFactor` |
| Calibration Page | N/A | `/run/:runId/calibrate` |
| Calibration API | N/A | `GET/POST /diagnostic-runs/:id/calibration` |
| Database Schema | No calibration | `calibration JSONB` column |

---

## CHANGELOG (v2.7.0 → v2.8.0)

| Change | Before | After |
|--------|--------|-------|
| Questions | 40 | **48** |
| Criticals | Undefined | **8** (4 L1 + 4 L2) |
| Initiatives | None | **9 Strategic Initiatives** |
| Maturity Engine | Score-only | **Fair-but-Firm** (score + critical gates) |
| Action Scoring | None | **Impact²/Complexity × Critical Boost** |
| Priority Labels | P0/P1/P2 | **P1/P2/P3** |
| Maturity Levels | L0-L4 | **L1-L4 only** (no Level 0) |
| Traffic Lights | Score-only | **Critical Override** |

---

## 0. PURPOSE OF THE SYSTEM

The Finance Diagnostic evaluates how reliably an organisation executes real finance workflows, based on observable, auditable evidence, and positions the organisation on explicit maturity levels using deterministic gates.

### It produces:

- Execution completeness scores
- Gated maturity levels (non-linear)
- Objective traffic lights with critical override
- Strategic initiatives with prioritized actions
- Critical risks that block advancement
- Executive-grade (Gartner-style) reports
- Full auditability (who changed what, when)

### Non-negotiable principles:

- Reality before taxonomy
- Evidence before opinion
- Deterministic logic for scores & maturity
- AI is explanatory, never authoritative
- Multi-player safe by design

---

## 1. QUESTION MODEL

### 1.1 Question Counts

| Level | Name | Questions | Criticals |
|-------|------|-----------|-----------|
| L1 | Emerging | 9 | 4 |
| L2 | Defined | 14 | 4 |
| L3 | Managed | 15 | 0 |
| L4 | Optimized | 10 | 0 |
| **Total** | | **48** | **8** |

### 1.2 Critical Questions

Critical questions are **gates** that block maturity advancement regardless of score.

#### L1 Criticals (Gate to Level 2)

| ID | Question | Why Critical |
|----|----------|--------------|
| `fpa_l1_q01` | Does the company produce an approved annual budget before the fiscal year begins? | No budget = no baseline |
| `fpa_l1_q02` | Does the budget include a full P&L down to Net Income? | Partial budget hides reality |
| `fpa_l1_q05` | Is there a single, documented chart of accounts used by all business units? | No CoA = no consolidation |
| `fpa_l1_q09` | Is there a standard monthly management reporting package distributed to leadership? | No reporting = flying blind |

#### L2 Criticals (Gate to Level 3)

| ID | Question | Why Critical |
|----|----------|--------------|
| `fpa_l2_q01` | Is a Budget vs. Actuals (BvA) report generated every month? | No feedback loop |
| `fpa_l2_q02` | Are variances exceeding a defined threshold formally investigated? | Reports without action |
| `fpa_l2_q06` | Is the live forecast stored in a multi-user system? | Single-user = fragile |
| `fpa_l2_q07` | Does the forecast project cash flow and liquidity, not just P&L? | Profit ≠ Cash |

### 1.3 Question Schema

```typescript
interface Question {
  id: string;                    // e.g., "fpa_l1_q01"
  text: string;                  // The question shown to user
  help: string;                  // Diagnostic intent
  maturity_level: 1 | 2 | 3 | 4;
  is_critical: boolean;
  objective_id: string;
  
  // Initiative Engine fields
  initiative_id: string;
  impact: 1 | 2 | 3 | 4 | 5;
  complexity: 1 | 2 | 3 | 4 | 5;
  expert_action: {
    title: string;
    recommendation: string;
    type: 'quick_win' | 'structural' | 'behavioral' | 'governance';
  };
}
```

---

## 2. MATURITY MODEL: FAIR-BUT-FIRM

The maturity model decouples **Execution Score** (effort recognition) from **Maturity Level** (gate-based caps).

### 2.1 The Two Dimensions

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   EXECUTION SCORE (0-100%)        MATURITY LEVEL (1-4)         │
│   ─────────────────────────       ──────────────────────       │
│   "How much have you done?"       "How far can you advance?"   │
│                                                                 │
│   Based on: YES answers           Based on: Score + Critical   │
│   Recognizes: Effort              Gates: L1 & L2 criticals     │
│                                                                 │
│   Example: 85%                    Example: Level 2 (Defined)   │
│                                   Reason: "Capped by L2-Q07"   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Maturity Levels (L1-L4 ONLY)

| Level | Name | Score Range | Critical Requirement |
|-------|------|-------------|----------------------|
| **1** | Emerging | 0–49% | None |
| **2** | Defined | 50–79% | Must pass ALL L1 criticals |
| **3** | Managed | 80–94% | Must pass ALL L2 criticals |
| **4** | Optimized | 95–100% | No critical failures |

**⚠️ IMPORTANT: There is NO Level 0. There is NO "Ad-hoc". Levels are 1-4 only.**

### 2.3 Execution Score Formula

```typescript
function calculateExecutionScore(answers: Answer[]): number {
  let earned = 0;
  let possible = 0;
  
  for (const answer of answers) {
    if (answer.value === 'YES') {
      earned += 1;
      possible += 1;
    } else if (answer.value === 'NO') {
      earned += 0;
      possible += 1;
    } else if (answer.value === 'N/A') {
      // N/A removes question from denominator
      earned += 0;
      possible += 0;
    }
  }
  
  if (possible === 0) return 0;
  return Math.round((earned / possible) * 100);
}
```

### 2.4 Maturity Calculation with Gates

```typescript
interface MaturityResult {
  execution_score: number;        // 0-100
  potential_level: 1 | 2 | 3 | 4; // Based on score alone
  actual_level: 1 | 2 | 3 | 4;    // After critical caps applied
  capped: boolean;
  capped_by: string[];            // Question IDs that caused cap
  capped_reason: string | null;   // Human-readable explanation
}

const L1_CRITICALS = ['fpa_l1_q01', 'fpa_l1_q02', 'fpa_l1_q05', 'fpa_l1_q09'];
const L2_CRITICALS = ['fpa_l2_q01', 'fpa_l2_q02', 'fpa_l2_q06', 'fpa_l2_q07'];

function calculateMaturity(answers: Answer[], questions: Question[]): MaturityResult {
  const score = calculateExecutionScore(answers);
  
  // Step 1: Determine potential level from score
  let potential: 1 | 2 | 3 | 4;
  if (score < 50) potential = 1;
  else if (score < 80) potential = 2;
  else if (score < 95) potential = 3;
  else potential = 4;
  
  // Step 2: Check critical failures
  const l1Failures = getFailedCriticals(answers, L1_CRITICALS);
  const l2Failures = getFailedCriticals(answers, L2_CRITICALS);
  
  // Step 3: Apply caps
  let actual = potential;
  let capped = false;
  let cappedBy: string[] = [];
  
  // L1 criticals failed → cap at Level 1
  if (l1Failures.length > 0 && potential > 1) {
    actual = 1;
    capped = true;
    cappedBy = l1Failures;
  }
  // L2 criticals failed → cap at Level 2 (only if not already capped lower)
  else if (l2Failures.length > 0 && potential > 2) {
    actual = 2;
    capped = true;
    cappedBy = l2Failures;
  }
  
  return {
    execution_score: score,
    potential_level: potential,
    actual_level: actual,
    capped,
    capped_by: cappedBy,
    capped_reason: capped ? buildCapReason(cappedBy, questions) : null
  };
}
```

---

## 3. OBJECTIVE TRAFFIC LIGHTS

### 3.1 Base Thresholds

| Score | Status | Color | Meaning |
|-------|--------|-------|---------|
| 80-100% | Green | 🟢 | Strong performance |
| 50-79% | Yellow | 🟡 | Needs attention |
| 0-49% | Red | 🔴 | Critical gap |

### 3.2 Critical Override Rule

**Rule:** If an Objective contains a **failed Critical Question**, its status **cannot be Green**, regardless of score.

| Condition | Max Status | Reasoning |
|-----------|------------|-----------|
| Contains failed critical | 🟡 Yellow (max) | Critical failure overrides score |
| No failed criticals | Normal logic | Score determines status |

```typescript
function getObjectiveStatus(
  score: number, 
  objectiveQuestionIds: string[],
  failedCriticals: string[]
): ObjectiveStatus {
  const criticalFailureInObjective = objectiveQuestionIds.some(
    qId => failedCriticals.includes(qId)
  );
  
  let baseStatus: 'green' | 'yellow' | 'red';
  if (score >= 80) baseStatus = 'green';
  else if (score >= 50) baseStatus = 'yellow';
  else baseStatus = 'red';
  
  // Critical Override: Green → Yellow
  if (criticalFailureInObjective && baseStatus === 'green') {
    return {
      status: 'yellow',
      score,
      overridden: true,
      override_reason: `Score (${score}%) indicates strong execution, but status downgraded due to critical failure`
    };
  }
  
  return { status: baseStatus, score, overridden: false, override_reason: null };
}
```

---

## 4. INITIATIVE ENGINE

### 4.1 The 9 Strategic Initiatives

| # | ID | Initiative | Theme | Questions |
|---|----|-----------| ------|-----------|
| 1 | `init_budget_discipline` | Establish Budget Discipline | Foundation | 5 |
| 2 | `init_financial_controls` | Strengthen Financial Controls | Foundation | 5 |
| 3 | `init_feedback_loops` | Implement Performance Feedback Loops | Foundation | 7 |
| 4 | `init_forecast_infrastructure` | Modernize Forecasting Infrastructure | Future | 5 |
| 5 | `init_forward_visibility` | Build Forward Visibility | Future | 6 |
| 6 | `init_seat_at_table` | Earn a Seat at the Table | Intelligence | 4 |
| 7 | `init_strategic_influence` | Exercise Strategic Influence | Intelligence | 5 |
| 8 | `init_decision_support` | Enable Decision Support | Intelligence | 5 |
| 9 | `init_operational_excellence` | Achieve Operational Excellence | Intelligence | 6 |

**Total: 48 questions across 9 initiatives**

### 4.2 Initiative Schema

```typescript
interface Initiative {
  id: string;
  title: string;
  description: string;
  theme_id: 'foundation' | 'future' | 'intelligence';
  objective_id: string;
}
```

### 4.3 Themes

| Theme | Purpose | Initiatives |
|-------|---------|-------------|
| **Foundation** | Build the Basics | 1, 2, 3 |
| **Future** | See What's Coming | 4, 5 |
| **Intelligence** | Drive Decisions | 6, 7, 8, 9 |

### 4.4 Question-to-Initiative Mapping

| Initiative | Questions |
|------------|-----------|
| init_budget_discipline | L1-Q01⭐, L1-Q02⭐, L1-Q03, L1-Q04, L2-Q12 |
| init_financial_controls | L1-Q05⭐, L1-Q06, L1-Q07, L1-Q08, L2-Q13 |
| init_feedback_loops | L1-Q09⭐, L2-Q01⭐, L2-Q02⭐, L2-Q03, L2-Q04, L2-Q05, L2-Q14 |
| init_forecast_infrastructure | L2-Q06⭐, L2-Q07⭐, L2-Q08, L2-Q09, L2-Q10 |
| init_forward_visibility | L3-Q09, L3-Q10, L3-Q11, L3-Q14, L3-Q15, L4-Q09 |
| init_seat_at_table | L3-Q01, L3-Q02, L3-Q03, L3-Q05 |
| init_strategic_influence | L3-Q04, L3-Q06, L3-Q07, L3-Q08, L3-Q12 |
| init_decision_support | L3-Q13, L4-Q01, L4-Q04, L4-Q05, L4-Q10 |
| init_operational_excellence | L2-Q11, L4-Q02, L4-Q03, L4-Q06, L4-Q07, L4-Q08 |

---

## 5. ACTION PRIORITIZATION

### 5.1 Scoring Formula (With Critical Boost)

```typescript
function calculateActionScore(question: Question): number {
  let score = Math.pow(question.impact, 2) / question.complexity;
  
  if (question.is_critical) {
    score = score * 2;  // Critical boost: 2x multiplier
  }
  
  return score;
}
```

### 5.2 Why 2x Critical Multiplier?

Without it, non-critical governance tasks outrank critical structural tasks:

| Action | Critical? | Base Score | With 2x |
|--------|-----------|------------|---------|
| Assign Budget Ownership (L1-Q03) | No | 16.0 | 16.0 |
| Implement Monthly BvA (L2-Q01) | ⭐ Yes | 12.5 | **25.0** |

**Result:** Criticals now correctly dominate the top of the list.

### 5.3 Priority Labels (P1/P2/P3)

| Priority | Label | Definition | Color |
|----------|-------|------------|-------|
| **P1** | 🔓 Unlock | Critical questions causing the maturity cap | Red |
| **P2** | ⚡ Optimize | Failed questions up to potential_level | Yellow |
| **P3** | 🚀 Future | Failed questions at potential_level + 1 | Blue/Gray |

**Note:** We use P1/P2/P3, not P0/P1/P2.

### 5.4 Action Types

| Backend Type | Icon | Display Label | Color |
|--------------|------|---------------|-------|
| `quick_win` | ⚡ | Quick Win | `bg-green-100 text-green-800` |
| `structural` | 🏗️ | Structural | `bg-blue-100 text-blue-800` |
| `behavioral` | 🧠 | Behavioral | `bg-purple-100 text-purple-800` |
| `governance` | 📋 | Governance | `bg-orange-100 text-orange-800` |

### 5.5 Effort Labels (From Complexity)

| Complexity | Effort Label |
|------------|--------------|
| 1-2 | Low Effort |
| 3 | Moderate |
| 4-5 | Significant |

### 5.6 Initiative Sorting Logic

Initiatives are sorted using a **three-tier tie-breaker** system:

```
┌─────────────────────────────────────────────────────────────┐
│ INITIATIVE SORTING (Top to Bottom)                          │
├─────────────────────────────────────────────────────────────┤
│ TIER 1: Priority                                            │
│         P1 (Unlock) > P2 (Optimize) > P3 (Future)          │
├─────────────────────────────────────────────────────────────┤
│ TIER 2: Critical Count (The "Fire" Rule)                    │
│         More criticals = higher urgency                     │
│         Initiative with 2 criticals > Initiative with 1     │
├─────────────────────────────────────────────────────────────┤
│ TIER 3: Total Score                                         │
│         Sum of all action scores within initiative          │
│         Higher total value = do first                       │
└─────────────────────────────────────────────────────────────┘
```

**Implementation:**

```typescript
function sortInitiatives(initiatives: PrioritizedInitiative[]): PrioritizedInitiative[] {
  return initiatives.sort((a, b) => {
    // Tier 1: Priority (P1 > P2 > P3)
    const priorityScore = { P1: 3, P2: 2, P3: 1 };
    if (priorityScore[a.priority] !== priorityScore[b.priority]) {
      return priorityScore[b.priority] - priorityScore[a.priority];
    }
    
    // Tier 2: Critical Count (more criticals = higher urgency)
    const aCriticals = a.actions.filter(x => x.is_critical).length;
    const bCriticals = b.actions.filter(x => x.is_critical).length;
    if (aCriticals !== bCriticals) {
      return bCriticals - aCriticals;
    }
    
    // Tier 3: Total Score (higher value = do first)
    const aTotal = a.actions.reduce((sum, x) => sum + x.score, 0);
    const bTotal = b.actions.reduce((sum, x) => sum + x.score, 0);
    return bTotal - aTotal;
  });
}
```

**Within each Initiative**, actions are also sorted:

1. **Criticals first** (regardless of score)
2. **Then by score** (highest first)

```typescript
function sortActionsWithinInitiative(actions: GroupedAction[]): GroupedAction[] {
  return actions.sort((a, b) => {
    // Criticals always first
    if (a.is_critical && !b.is_critical) return -1;
    if (!a.is_critical && b.is_critical) return 1;
    // Then by score
    return b.score - a.score;
  });
}
```

---

## 5B. VS21 CALIBRATION LAYER (Objective Importance Matrix)

### 5B.1 Purpose

The Calibration Layer allows users to customize the relative importance of each Objective based on their organizational context. This creates **personalized action priorities** without changing the underlying diagnostic logic.

### 5B.2 Importance Levels

| Level | Label | Multiplier | Use Case |
|-------|-------|------------|----------|
| **5** | Critical | 1.5x | "This is a board-level priority" |
| **4** | High | 1.25x | "Executive focus area" |
| **3** | Medium | 1.0x | "Standard priority" (default) |
| **2** | Low | 0.75x | "Lower priority for now" |
| **1** | Minimal | 0.5x | "Not relevant to our context" |

### 5B.3 Updated Score Formula

```typescript
function calculateActionScore(question: Question, importanceMap?: Record<string, number>): number {
  // Base score (unchanged)
  let score = Math.pow(question.impact, 2) / question.complexity;

  // Critical boost (unchanged)
  if (question.is_critical) {
    score = score * 2;
  }

  // VS21: Importance multiplier
  const importance = importanceMap?.[question.objective_id] ?? 3; // Default: Medium
  const multiplier = getImportanceMultiplier(importance);
  score = score * multiplier;

  return score;
}

function getImportanceMultiplier(importance: number): number {
  const multipliers: Record<number, number> = {
    5: 1.5,   // Critical
    4: 1.25,  // High
    3: 1.0,   // Medium (default)
    2: 0.75,  // Low
    1: 0.5    // Minimal
  };
  return multipliers[importance] ?? 1.0;
}
```

### 5B.4 Safety Valve

**Rule:** Critical failures **lock** importance at Level 5 (Critical).

If a user marks an objective as "Minimal" (1) but has a failed critical question in that objective, the system automatically overrides to "Critical" (5).

```typescript
function applyCalibration(
  objectiveId: string,
  userImportance: number,
  hasCriticalFailure: boolean
): number {
  if (hasCriticalFailure) {
    return 5; // Safety valve: force Critical
  }
  return userImportance;
}
```

### 5B.5 Data Model

```typescript
interface CalibrationData {
  importance_map: Record<string, number>;  // objective_id → importance (1-5)
  calibrated_at?: string;                   // ISO timestamp
}

// Database column
// diagnostic_runs.calibration: JSONB DEFAULT '{}'::jsonb
```

### 5B.6 API Endpoints

#### GET /diagnostic-runs/:id/calibration

Returns current calibration state with objectives and their importance levels.

```typescript
interface CalibrationResponse {
  run_id: string;
  objectives: Array<{
    id: string;
    name: string;
    current_importance: number;  // 1-5
    has_critical_failure: boolean;
    locked: boolean;  // true if Safety Valve active
  }>;
  importance_map: Record<string, number>;
}
```

#### POST /diagnostic-runs/:id/calibration

Saves user's importance preferences.

```typescript
// Request body
interface CalibrationRequest {
  importance_map: Record<string, number>;  // objective_id → importance (1-5)
}

// Response: CalibrationResponse (same as GET)
```

### 5B.7 Flow Integration

```
┌─────────────────────────────────────────────────────────────┐
│ DIAGNOSTIC FLOW WITH CALIBRATION                            │
├─────────────────────────────────────────────────────────────┤
│ 1. Setup (company/industry)                                 │
│ 2. Answer 48 questions                                      │
│ 3. Complete & Score                                         │
│ 4. View Initial Report                                      │
│ 5. [NEW] Calibrate Objectives (/run/:id/calibrate)         │
│ 6. View Personalized Report (scores recalculated)          │
└─────────────────────────────────────────────────────────────┘
```

### 5B.8 UI Configuration

```typescript
// Frontend importance config (src/data/spec.js)
export const IMPORTANCE_CONFIG = {
  5: { label: 'Crit', fullLabel: 'Critical Priority', color: 'text-red-700 bg-red-50 border-red-200' },
  4: { label: 'High', fullLabel: 'High Priority', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  3: { label: 'Med', fullLabel: 'Medium Priority', color: 'text-slate-600 bg-slate-50 border-slate-200' },
  2: { label: 'Low', fullLabel: 'Low Priority', color: 'text-slate-500 bg-slate-50 border-slate-200' },
  1: { label: 'Min', fullLabel: 'Minimal Priority', color: 'text-slate-400 bg-slate-50 border-slate-200' }
};
```

### 5B.9 Report Display

Actions display an importance badge when calibrated (non-default value):

```
┌────────────────────────────────────────────────────────────┐
│ ★ HIGH │ Add Cash Flow to Forecast         │ Structural │
├────────────────────────────────────────────────────────────┤
│ Score adjusted from 12.5 → 15.6 (1.25x importance)        │
└────────────────────────────────────────────────────────────┘
```

**Rule:** Only show importance badge when `importance !== 3` (non-default).

---

## 6. API RESPONSE

### 6.1 Score Response Shape

```typescript
interface ScoreResponse {
  run_id: string;
  pillar_id: string;
  
  // Execution
  execution_score: number;
  questions_answered: number;
  questions_total: number;
  questions_applicable: number;
  
  // Maturity
  potential_level: number;
  actual_level: number;
  level_name: string;
  capped: boolean;
  capped_by: string[];
  capped_reason: string | null;
  
  // Objectives (Traffic Lights)
  objectives: ObjectiveScore[];
  
  // Initiatives (Grouped Actions) — NOT flat list
  initiatives: PrioritizedInitiative[];
  
  // Critical Risks
  critical_risks: CriticalRisk[];
}
```

### 6.2 Initiative Response Shape

```typescript
interface PrioritizedInitiative {
  id: string;
  title: string;
  description: string;
  priority: 'P1' | 'P2' | 'P3';
  theme_id: 'foundation' | 'future' | 'intelligence';
  actions: GroupedAction[];
}

interface GroupedAction {
  question_id: string;
  title: string;           // From expert_action.title
  recommendation: string;  // From expert_action.recommendation
  type: 'quick_win' | 'structural' | 'behavioral' | 'governance';
  is_critical: boolean;
  score: number;
  impact: number;
  complexity: number;
}
```

**⚠️ IMPORTANT:** API must return `PrioritizedInitiative[]` (grouped), NOT `PrioritizedAction[]` (flat list).

---

## 7. UI REQUIREMENTS

### 7.1 No Question IDs in User-Facing UI

**Rule:** Technical question IDs (e.g., `fpa_l1_q02`) must NEVER appear in user-facing UI.

| Location | ❌ Wrong | ✅ Correct |
|----------|----------|------------|
| Capped By | "fpa_l1_q02" | "Extend Budget to Full P&L" |
| Critical Gaps | "X fpa_l1_q02 (L1)" | "X Budget lacks full P&L down to Net Income" |

Use `expert_action.title` or truncated `question.text` instead.

### 7.2 Maturity Level Names

**Rule:** Level names must be consistent everywhere:

```typescript
const LEVEL_NAMES = {
  1: "Emerging",
  2: "Defined",
  3: "Managed",
  4: "Optimized"
};
```

**⚠️ There is NO Level 0. There is NO "Ad-hoc".**

### 7.3 Actions Grouped by Initiative

**Rule:** Recommended Actions section must show Initiative cards containing actions, NOT a flat list.

```
✅ Correct:
┌─────────────────────────────────────────────┐
│ MODERNIZE FORECASTING INFRASTRUCTURE        │
│ A forecast trapped in spreadsheets...       │
├─────────────────────────────────────────────┤
│ • Add Cash Flow to Forecast ⭐               │
│ • Migrate to Collaborative Planning ⭐       │
│ • Implement Monthly Forecast Refresh        │
└─────────────────────────────────────────────┘

❌ Wrong:
• Add Cash Flow to Forecast
• Migrate to Collaborative Planning
• Insert Finance into Approval Workflow
• Build Rapid Response Capability
(flat list mixing different initiatives)
```

---

## 8. DIAGNOSTIC FLOW (UNCHANGED)

### 8.1 Domain Diagnostic (Context Only)
- Company profile
- Org structure
- Global pain points
- Ambition level

❌ No scoring  
❌ No maturity

### 8.2 Pillar Diagnostic (Context Intake)
- Systems & tools
- FTEs / roles
- Pillar pain points
- Complexity drivers
- Ongoing projects

❌ No scoring  
Used only to condition AI narratives.

### 8.3 Evidence Capture
- 48 Questions
- YES / NO / N/A
- Per-question help text
- Critical questions flagged

### 8.4 Report Generation
1. Calculate Execution Score
2. Calculate Maturity (with critical gates)
3. Calculate Objective Traffic Lights (with override)
4. Generate Prioritized Initiatives
5. Identify Critical Risks
6. Render Report

---

## 9. AI ROLE (STRICT, UNCHANGED)

### AI may:
- Generate clarifiers
- Draft narratives
- Explain maturity blockers
- Suggest actions

### AI may NOT:
- Change scores
- Decide maturity
- Override gates
- Infer evidence

---

## 10. AUDITABILITY (UNCHANGED)

- Every answer change is attributable
- Every assignment is logged
- Append-only audit trail
- Full traceability to user and timestamp

---

## 11. CANONICAL SYSTEM RULE

> If a score, maturity level, or insight cannot be explained by pointing to specific evidence and the user who provided it, the system is wrong.

---

## 12. VERIFICATION CHECKLIST

| Check | Expected |
|-------|----------|
| Question count | 48 |
| Critical count | 8 (4 L1 + 4 L2) |
| Initiative count | 9 |
| Min questions per initiative | 4 |
| Maturity levels | 1, 2, 3, 4 (NO Level 0) |
| Level names | Emerging, Defined, Managed, Optimized (NO "Ad-hoc") |
| Critical L2-Q01 score (with 2x) | 25.0 |
| Non-critical L1-Q03 score | 16.0 |
| L2-Q01 ranks above L1-Q03 | ✅ Yes |
| API returns grouped initiatives | ✅ Yes |
| UI shows type badges | ✅ Yes |
| No question IDs in UI | ✅ Yes |
| **VS21 Calibration** | |
| Importance levels | 1-5 (Minimal to Critical) |
| Default importance | 3 (Medium) |
| GET /calibration endpoint | ✅ Yes |
| POST /calibration endpoint | ✅ Yes |
| Safety Valve for criticals | ✅ Locks at 5 |
| Importance badge shown | Only when ≠ 3 |
| calibration JSONB column | ✅ Yes |
