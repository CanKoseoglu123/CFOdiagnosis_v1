
# Pillar Report Visual Design System v2.0 — GARTNER ENTERPRISE

**Status:** CANONICAL / FROZEN
**Audience:** Product, Engineering, Design
**Applies to:** All Pillar Reports, Assessments, Simulator, and Executive Views

---

## 0. DESIGN PHILOSOPHY (NON‑NEGOTIABLE)

**Style:** Dense, data‑heavy, print‑friendly. Executive boardroom aesthetic.
**Visual Language:** Sharp borders, no soft shadows, no gradients, high contrast.
**Mental Model:** CFO cockpit, not a consumer app.

This system optimizes for:

* Scanability over decoration
* Information density over whitespace aesthetics
* Predictability over creativity
* Audit‑grade output (screen + print)

If a design choice trades clarity for visual delight, it is wrong.

---

## 1. LAYOUT & CONTAINERS — ENTERPRISE CANVAS (CANONICAL)

### 1.1 Core Principle

The application uses a **fixed enterprise canvas** with a persistent sidebar and centered content containers. Layout is **explicit, declared, and enforced** — never implicit.

### 1.2 Sidebar Behavior

* **Width:** Fixed `280px` (desktop)
* **Visibility:** Always visible
* **Collapsing:** Not allowed
* **Purpose:** Orientation, not interaction

Enterprise users rely on spatial memory. The sidebar must never move.

---

### 1.3 Enterprise Width Scale (MANDATORY)

Every page MUST declare exactly one max‑width.

| Context           | Max Width            | Intent                       |
| ----------------- | -------------------- | ---------------------------- |
| Auth / Login      | `max-w-md` (448px)   | Focus, zero distraction      |
| Setup & Forms     | `max-w-5xl` (1024px) | Efficient 2‑column workflows |
| Assessment        | `max-w-6xl` (1152px) | Split‑view readability       |
| Reports / Cockpit | `max-w-7xl` (1280px) | High‑density analytics       |

**Rule:** No page may rely on implicit defaults or `w-full` layouts.

---

### 1.4 Mandatory Canvas Shell

```tsx
<div className="flex min-h-screen bg-slate-100">
  <Sidebar className="w-[280px] flex-shrink-0" />

  <main className="flex-1 p-8 overflow-y-auto">
    <div className={`mx-auto w-full ${maxWidthClass}`}>
      {children}
    </div>
  </main>
</div>
```

This shell is the **only allowed page wrapper**.

---

## 2. COLOR SYSTEM (STRICT ENTERPRISE)

### 2.1 CSS Variables

```css
:root {
  --background: #F4F5F7;
  --card: #FFFFFF;
  --card-header: #F8F9FA;

  --navy: #172B4D;
  --slate: #42526E;
  --muted: #6B778C;

  --border: #DFE1E6;
  --border-strong: #C1C7D0;

  --primary: #0052CC;
  --primary-hover: #0747A6;

  --status-green-text: #006644;
  --status-green-bg: #E3FCEF;
  --status-green-border: #ABF5D1;

  --status-yellow-text: #FF991F;
  --status-yellow-bg: #FFFAE6;
  --status-yellow-border: #FFE380;

  --status-red-text: #DE350B;
  --status-red-bg: #FFEBE6;
  --status-red-border: #FFBDAD;
}
```

No alternative palettes are permitted.

---

## 3. TYPOGRAPHY (ENTERPRISE DENSE)

### 3.1 Font

**Inter** — system fallback only.

### 3.2 Type Scale

| Usage         | Classes                                                        |
| ------------- | -------------------------------------------------------------- |
| Section Label | `text-xs font-semibold uppercase tracking-wide text-slate-500` |
| Page Title    | `text-2xl font-bold text-navy`                                 |
| Card Title    | `text-sm font-bold text-navy uppercase tracking-wide`          |
| Body          | `text-sm text-slate leading-relaxed`                           |
| Meta          | `text-xs text-slate-500`                                       |

### 3.3 Section Header Pattern

```tsx
<h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4">
  EXECUTIVE SUMMARY
</h2>
```

Sentence‑case headings are not allowed.

---

## 4. COMPONENT FOUNDATIONS

### 4.1 Cards (No Shadows)

```tsx
<div className="bg-white border border-slate-300 rounded-sm">
  <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
    <h3 className="text-sm font-bold text-navy uppercase tracking-wide">Title</h3>
  </div>
  <div className="p-4">{children}</div>
</div>
```

Shadows are forbidden. Use borders only.

---

### 4.2 Status Indicators

* Left border = status
* Color never stands alone; always paired with text or icon

---

### 4.3 Score Display

Numbers are primary. Shapes are decorative and avoided.

```tsx
<div className="text-6xl font-bold text-navy">76</div>
```

---

## 5. ACTION & INITIATIVE PRESENTATION

### 5.1 Initiative Cards

* White header
* Expand/collapse only
* Critical count always visible

Actions are **grouped by initiative**. Flat lists are forbidden.

---

### 5.2 Action Rows

* Single‑line, scannable
* Icons for criticals
* Compact type badges

No multiline prose inside action rows.

---

## 6. NAVIGATION PATTERNS

### 6.1 Priority Tabs

* Underlined tabs only
* No pill buttons
* Excel‑style affordance

---

## 7. SPACING SYSTEM

| Token       | Value | Usage            |
| ----------- | ----- | ---------------- |
| `gap-2`     | 8px   | Tight clusters   |
| `gap-3`     | 12px  | Grids            |
| `gap-4`     | 16px  | Card internals   |
| `space-y-6` | 24px  | Sections         |
| `p-4`       | 16px  | Standard padding |

Spacing must feel deliberate, never loose.

---

## 8. ICONOGRAPHY

* Library: `lucide-react`
* Icons replace emoji everywhere
* Icons support meaning; never decorate

---

## 9. PRINT & PDF RULES

```css
@media print {
  .bg-slate-100 { background: white !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  button, .no-print { display: none !important; }
  .page-break { page-break-before: always; }
}
```

Print output must be board‑ready without modification.

---

## 10. FINAL DESIGN LAWS

| Law                    | Enforcement            |
| ---------------------- | ---------------------- |
| No shadows             | Borders only           |
| No rounded gimmicks    | `rounded-sm` only      |
| No implicit layouts    | Width must be declared |
| No emoji               | Icons only             |
| No freeform creativity | Follow system          |

---

**If a UI element cannot be explained to a CFO in one sentence, it does not belong in this system.**
