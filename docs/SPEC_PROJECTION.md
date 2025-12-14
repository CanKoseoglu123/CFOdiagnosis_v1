# Spec Projection Pattern

## Overview

This codebase uses **spec projection** — a deliberate architectural choice where different parts of the system consume different views (projections) of the same canonical spec.

This is **not** duplication. It's separation of concerns.

---

## The Two Projections

### 1. Validation Spec (`src/spec.ts`)

**Consumer:** `validateRun.ts`

**Purpose:** Input contract enforcement

**Shape:**
```typescript
{
  id: string;
  type: "string" | "number";
  required: boolean;
}
```

**Responsibility:**
- Ensures inputs conform to expected types
- Gates the `completed` status
- Prevents garbage data from entering scoring

---

### 2. Aggregation Spec (`src/specs/v2.6.4.ts` → `toAggregateSpec`)

**Consumer:** `aggregateResults.ts`

**Purpose:** Weighted scoring and rollups

**Shape:**
```typescript
{
  id: string;
  pillar: string;
  weight: number;
}
```

**Responsibility:**
- Maps questions to pillars
- Defines contribution weights
- Enables hierarchical score aggregation

---

## Why Not Unify?

Validation and aggregation have **orthogonal concerns**:

| Concern | Validation | Aggregation |
|---------|------------|-------------|
| Cares about type? | ✅ Yes | ❌ No |
| Cares about required? | ✅ Yes | ❌ No |
| Cares about weight? | ❌ No | ✅ Yes |
| Cares about pillar? | ❌ No | ✅ Yes |

Merging them creates:
- Bloated types with optional fields everywhere
- Coupling between unrelated concerns
- Fragile code where changes ripple unnecessarily

---

## The Adapter

`toAggregateSpec.ts` is the **boundary** between the canonical spec and the aggregation engine.

```
FullSpec (canonical)
       │
       ▼
  toAggregateSpec()
       │
       ▼
AggregateSpec (projected)
       │
       ▼
  aggregateResults()
```

If the canonical spec shape changes, only the adapter needs updating. The aggregation engine remains untouched.

---

## Rule

> **Specs are immutable per version.**
>
> Never modify a released spec. Create a new version.

This ensures historical runs remain reproducible.
