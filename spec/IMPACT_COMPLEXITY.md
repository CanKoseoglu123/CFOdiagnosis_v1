# Impact & Complexity Calibration Framework

> **Scope:** Cross-pillar methodology applicable to all Finance function assessments (FP&A, Treasury, Tax, Internal Audit, etc.)

---

## Overview

Impact and Complexity are the two fundamental dimensions used to prioritize diagnostic actions. They combine in the scoring formula to surface high-ROI opportunities:

```
Score = (Impact² / Complexity) × CriticalBoost × CombinedMultiplier
```

This document defines the **standardized framework** that applies across all pillars. Pillar-specific anchor examples are documented separately (e.g., `IMPACT_COMPLEXITY_FPA.md`).

---

## Why Standardized?

| Approach | Pros | Cons |
|----------|------|------|
| **Pillar-Specific** | Precise calibration per domain | Incomparable scores; 9× maintenance burden |
| **Standardized** | Comparable across pillars; CFO can prioritize holistically | May miss nuances |
| **Hybrid (Chosen)** | Universal definitions + pillar-specific anchors | Requires upfront calibration |

**Decision:** Standardized definitions with pillar-specific anchor examples.

**Rationale:**
1. CFOs view the full finance stack—cross-pillar comparability is essential
2. Resource allocation requires apples-to-apples comparison
3. One mental model for users and content authors
4. Maintainability at scale (9 pillars planned)

---

## Impact: Value Creation Potential (1–5)

Impact measures the magnitude of benefit when a capability is in place.

### Definitions

| Score | Label | Definition | CFO Mental Model |
|-------|-------|------------|------------------|
| **5** | Transformational | Directly enables strategic outcomes, competitive advantage, or board-level decisions | "This changes how we run the company" |
| **4** | High | Significantly improves decision quality, reduces material risk, or creates cross-functional value | "Leadership uses this weekly" |
| **3** | Moderate | Improves efficiency, quality, or control within the function | "Meaningful process improvement" |
| **2** | Low | Incremental improvement to existing capability | "Nice to have, not essential" |

> **Note:** Impact 1 ("Minimal") is excluded by design. We do not assess capabilities with minimal strategic value—they don't belong in a diagnostic focused on improvement priorities.

### Impact Drivers (Universal)

These drivers apply regardless of pillar:

| Driver | Question to Ask |
|--------|-----------------|
| **Decision Velocity** | How much faster can leadership act with this capability? |
| **Risk Reduction** | What exposure is mitigated? Is it existential or incremental? |
| **Value Visibility** | Can we see and measure the outcome? |
| **Cross-Functional Reach** | Who benefits beyond Finance? |
| **Strategic Enablement** | Does this unlock other capabilities or initiatives? |

### Impact Calibration Rules

1. **Reserve Impact 5 for true breakthroughs** — If everything is "transformational," nothing is
2. **Ask "so what?"** — A capability that doesn't change decisions is lower impact
3. **Consider the counterfactual** — What happens without this? If the answer is "minor inconvenience," it's Impact 2–3
4. **Board test** — Would a Board care about this capability? If yes, Impact 4–5

---

## Complexity: Implementation Friction (1–5)

Complexity measures the resources, time, and organizational effort to close the gap.

### Definitions

| Score | Label | Definition | CFO Mental Model |
|-------|-------|------------|------------------|
| **5** | Transformational | Multi-year program, significant capital, cross-enterprise change management | "Board approval, multi-quarter execution" |
| **4** | High | Major project (6–12 months), technology investment, multiple stakeholders | "Budget cycle decision, dedicated PM" |
| **3** | Moderate | Structured initiative (3–6 months), defined scope, internal resources | "Quarterly project, team effort" |
| **2** | Low | Targeted improvement (1–3 months), limited dependencies | "Sprint or focus area, one owner" |
| **1** | Quick Win | Policy/process change within existing resources | "Can be done this month" |

### Complexity Drivers (Universal)

| Driver | Low Complexity | High Complexity |
|--------|----------------|-----------------|
| **Technology** | Configuration, existing tools | New system implementation |
| **Data** | Data exists and is clean | Data doesn't exist or needs remediation |
| **Organizational Change** | Single team, minimal training | Cross-enterprise, significant change management |
| **Stakeholder Alignment** | One decision-maker | Multiple executives, competing priorities |
| **Regulatory/Compliance** | No audit implications | Audit trail, approval gates, compliance burden |
| **Dependencies** | Standalone | Requires other projects to complete first |
| **Budget** | Within existing budget | Requires incremental funding approval |

### Complexity Calibration Rules

1. **Be realistic, not optimistic** — Most initiatives take longer than expected
2. **Include change management** — Technology is often the easy part
3. **Consider data debt** — "We just need to pull the data" often hides months of work
4. **Factor in organizational readiness** — A simple solution in a resistant culture is complex

---

## Target Distribution

Impact scores should follow a bell curve to ensure differentiation:

| Impact | Target % | Rationale |
|--------|----------|-----------|
| **5** | ~15–20% | Reserved for genuine strategic breakthroughs |
| **4** | ~35% | Significant improvements that leadership values |
| **3** | ~35% | Standard good practices, solid improvements |
| **2** | ~10–15% | Foundational hygiene, building blocks |

Complexity typically follows a natural distribution based on question maturity level:
- L1 questions: Lower complexity (building foundations)
- L4 questions: Higher complexity (advanced capabilities)

---

## Scoring Formula Implications

The formula `(Impact² / Complexity)` creates these prioritization effects:

| Impact | Complexity | Score | Priority |
|--------|------------|-------|----------|
| 5 | 1 | 25.0 | **Quick Win** — Do immediately |
| 5 | 3 | 8.3 | **Strategic** — Plan and resource |
| 5 | 5 | 5.0 | **Investment** — Major initiative |
| 4 | 1 | 16.0 | **Quick Win** — Easy improvement |
| 4 | 4 | 4.0 | **Balanced** — Standard project |
| 3 | 1 | 9.0 | **Quick Win** — Low-hanging fruit |
| 3 | 5 | 1.8 | **Deprioritize** — High effort, modest return |

**Key insight:** Impact is squared, making it disproportionately valuable. A high-impact item is worth pursuing even at higher complexity.

---

## Calibration Process

When adding or reviewing questions:

### Step 1: Draft Scores
Assign initial Impact and Complexity based on definitions.

### Step 2: Anchor Check
Compare against pillar-specific anchor examples. Is this question truly in the same tier?

### Step 3: Distribution Check
Review overall distribution. If >25% are Impact 5, recalibrate.

### Step 4: SME Validation
Does the scoring match practitioner experience? Would a CFO agree?

### Step 5: Output Test
Run sample diagnostics. Do high-scoring items intuitively feel "most important"?

---

## Cross-Pillar Consistency

When building new pillars (Treasury, Tax, etc.):

1. **Use the same definitions** — Impact 5 means "transformational" everywhere
2. **Create pillar-specific anchors** — Document 2–3 examples per level
3. **Cross-validate** — Treasury "Impact 5" should feel equivalent to FP&A "Impact 5"
4. **Review with CFO lens** — If the CFO had to choose between two Impact 5 items from different pillars, would they feel equivalent?

---

## Anti-Patterns

### Impact Inflation
**Symptom:** >40% of questions rated Impact 4–5
**Cause:** Every capability feels important to the SME who wrote it
**Fix:** Apply the "Board test" — would a Board member care?

### Complexity Deflation
**Symptom:** Most items rated Complexity 1–2
**Cause:** Underestimating change management and data work
**Fix:** Ask "how long did this actually take at the last company?"

### False Precision
**Symptom:** Debate over Impact 3 vs. 4 for every question
**Cause:** Over-indexing on exact scores
**Fix:** Use anchor examples; accept that some items are borderline

---

## Governance

- **Owner:** Product team
- **Review Cadence:** When adding new pillars or after major content updates
- **Change Process:** Update this document, then cascade to pillar-specific anchors
- **Escalation Path:** When content authors disagree on scores, escalate to Product Owner for final decision. Document the rationale in the pillar anchors file.

---

## Related Documents

- `IMPACT_COMPLEXITY_FPA.md` — FP&A pillar anchor examples
- `CLAUDE.md` — Project reference (summary definitions)
- `spec/SPEC_v3.1.0.md` — Full specification
