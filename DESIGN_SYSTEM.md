
# Pillar Report Visual Design System v2.1 — CFO LENS AI ENTERPRISE

**Status:** CANONICAL
**Audience:** Product, Engineering, Design
**Applies to:** All Pages, Reports, Assessments, Simulator, and Executive Views
**Last Updated:** January 2026

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
| Landing (public)  | `max-w-5xl` (1024px) | Marketing content            |

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

### 2.0 Reference Pages

The following pages exemplify correct color usage and should be used as reference:
- **Landing Page** — Brand colors, marketing sections
- **Maturity Footprint Grid** — Evidence state colors, status indicators
- **Executive Report Page** — Print-optimized, professional navy tones
- **ObjectivesPracticesOverview** — Systematic navy gradation for data viz

**Note:** Benchmark Tab uses the correct navy scale concept but needs migration to use CHART_COLORS constants instead of inline hex values.

---

### 2.1 Brand Colors (CANONICAL)

These colors define the CFO Lens AI brand identity. Use via `BRAND_COLORS` import from `Logo.jsx`.

```js
// src/components/Logo.jsx
export const BRAND_COLORS = {
  navy: '#1a365d',    // Primary brand navy - headlines, buttons, dark UI
  gold: '#c9a050',    // Accent gold - highlights, CTAs, premium feel
  lightBlue: '#94a3b8' // Secondary - subtle backgrounds, disabled states
};
```

| Color | Hex | Usage |
|-------|-----|-------|
| **Brand Navy** | `#1a365d` | Primary headlines, buttons, dark headers |
| **Brand Gold** | `#c9a050` | Accent highlights, CTAs, premium indicators |
| **Light Blue** | `#94a3b8` | Subtle backgrounds, disabled states |

---

### 2.2 Extended Navy Scale (Data Visualization)

For charts, bars, and data-dense components (Benchmark, Footprint):

| Name | Hex | Usage |
|------|-----|-------|
| **Navy Darkest** | `#001a33` | Objective headers (ObjectivesPracticesOverview) |
| **Navy Dark** | `#003366` | Proven state, high-confidence data |
| **Navy Medium** | `#0b2d5b` | Chart bars (BenchmarkTab) |
| **Navy Light** | `#336699` | Partial state |
| **Navy Lightest** | `#6699CC` | Gap/opportunity state |
| **Navy Projection** | `rgba(11, 45, 91, 0.18)` | Projected improvements (hatched) |

---

### 2.3 UI Foundation Colors

```css
:root {
  /* === BACKGROUNDS === */
  --background: #F4F5F7;     /* App background */
  --card: #FFFFFF;           /* Card surfaces */
  --card-header: #F8F9FA;    /* Card headers, table headers */

  /* === TEXT === */
  --navy: #172B4D;           /* Headlines, scores (legacy - prefer BRAND_COLORS.navy) */
  --slate: #42526E;          /* Body text */
  --muted: #6B778C;          /* Secondary text, labels */

  /* === BORDERS === */
  --border: #DFE1E6;         /* Default borders */
  --border-strong: #C1C7D0;  /* Emphasis borders, dividers */

  /* === PRIMARY ACTION === */
  --primary: #0052CC;        /* Gartner Blue - interactive elements */
  --primary-hover: #0747A6;  /* Hover state */
  --primary-light: #DEEBFF;  /* Selected backgrounds */
}
```

---

### 2.4 Status Colors (Semantic)

For maturity states, alerts, and validation feedback:

```css
:root {
  /* === GREEN (Proven / Success / Strength) === */
  --status-green-text: #006644;
  --status-green-bg: #E3FCEF;
  --status-green-border: #ABF5D1;

  /* === YELLOW/AMBER (Partial / Warning / Opportunity) === */
  --status-yellow-text: #FF991F;
  --status-yellow-bg: #FFFAE6;
  --status-yellow-border: #FFE380;

  /* === RED (Gap / Error / Critical) === */
  --status-red-text: #DE350B;
  --status-red-bg: #FFEBE6;
  --status-red-border: #FFBDAD;

  /* === ORANGE (Targets / Benchmarks) === */
  --status-orange: #FF991F;  /* Target markers in charts */
}
```

---

### 2.5 Evidence State Colors (Maturity Footprint)

Consistent across all footprint/evidence visualizations:

| State | Tailwind Classes | Hex Background |
|-------|------------------|----------------|
| **Proven**         | `bg-emerald-50` (`bg-emerald-100` if critical) | Light green |
| **Partial**        | `bg-amber-50` (`bg-amber-100` if critical)   | Light amber |
| **Gap/Not Proven** | `bg-slate-50` (`bg-red-100` if critical)     | Light gray / red |

For the navy-based visualization (ObjectivesPracticesOverview):
| State | Hex |
|-------|-----|
| **Proven** | `#003366` |
| **Partial** | `#336699` |
| **Gap** | `#6699CC` |

---

### 2.6 Chart Colors (Benchmark / Executive)

```js
// Benchmark bars
const CHART_COLORS = {
  achieved: '#0b2d5b',      // Solid navy bar
  projected: 'rgba(11, 45, 91, 0.18)', // Hatched extension
  target: 'var(--status-orange)', // Orange target marker (#FF991F)
  criticalMarker: '#EF4444', // Red-500 for critical priority
  highMarker: '#F59E0B'      // Amber-500 for high priority
};
```

---

### 2.7 Page-Specific Guidance

| Page | Primary Colors | Notes |
|------|----------------|-------|
| **Landing** | BRAND_COLORS.navy, BRAND_COLORS.gold | White bg, marketing focus |
| **Auth** | Should use `BRAND_COLORS.navy` | ⚠️ Currently uses Indigo - needs fix to match Landing |
| **Setup** | Blue-600, slate-800 header | Professional onboarding |
| **Calibration** | Primary, amber-500 (Top Priority) | Interactive selections |
| **Report/Overview** | Status colors, slate UI | Data presentation |
| **Benchmark** | Navy scale, orange targets | Charts and comparisons |
| **Footprint** | Evidence state colors | Maturity visualization |
| **Executive** | BRAND_COLORS, print-optimized | PDF export ready |

---

### 2.8 Color Usage Rules

1. **Never use inline hex values** — always reference CSS variables or BRAND_COLORS
2. **Gold (#c9a050)** is reserved for premium highlights and CTAs
3. **Primary blue (#0052CC)** is for interactive elements only
4. **Status colors** must always include both text AND background
5. **Navy variations** — use BRAND_COLORS.navy for UI, extended scale for charts
6. **No gradients, no shadows** — borders only per design philosophy. Exception: `repeating-linear-gradient` may be used to create hatched patterns for data visualizations.

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

## 11. KNOWN ISSUES & MIGRATION TASKS

### 11.1 Color Inconsistencies to Fix

| File | Issue | Fix Required |
|------|-------|--------------|
| `AuthPage.jsx` | Uses Indigo `#4F46E5` instead of brand navy | Replace with `BRAND_COLORS.navy` to match Landing page |
| `CompanySetupPage.jsx` | Uses Tailwind `blue-600` inconsistently | Standardize to --primary or BRAND_COLORS |
| `ExecutiveReportPage.jsx` | Defines local `NAVY = '#1e3a5f'` | Import from BRAND_COLORS instead |

### 11.2 Navy Consolidation

The codebase has 5+ navy shades. Consolidation plan:

1. **UI/Headlines**: Use `BRAND_COLORS.navy` (`#1a365d`)
2. **Charts/Data Viz**: Use Extended Navy Scale (Section 2.2)
3. **Legacy CSS vars**: Keep `--navy: #172B4D` for backwards compatibility
4. **Deprecate**: Inline hex values like `#1e3a5f`, `#103b6d`

### 11.3 Files Using Correct Patterns ✅

These files exemplify correct color usage:
- `LandingPage.jsx` — Uses BRAND_COLORS consistently
- `MaturityFootprintGrid.jsx` — Evidence states with Tailwind classes
- `ObjectivesPracticesOverview.jsx` — Systematic navy gradation
- `AppShell.css` — Design system colors documented in comments

**Note:** `BenchmarkTab.jsx` follows the extended navy scale concept but still uses inline hex values. It should be migrated to use CHART_COLORS constants.

### 11.4 Migration Priority

1. **High**: AuthPage (user-facing, brand inconsistency)
2. **Medium**: Setup pages (onboarding flow)
3. **Low**: Internal components using legacy --navy

---

## 12. APPENDIX: COLOR QUICK REFERENCE

```
BRAND IDENTITY
━━━━━━━━━━━━━━
Navy:  #1a365d  ████████  Headlines, Buttons, Dark UI
Gold:  #c9a050  ████████  Accents, CTAs, Premium

DATA VISUALIZATION (Navy Scale)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Darkest:  #001a33  ████████  Headers
Dark:     #003366  ████████  Proven
Medium:   #0b2d5b  ████████  Charts
Light:    #336699  ████████  Partial
Lightest: #6699CC  ████████  Gap

STATUS COLORS (text / background)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Green:  #006644 / #E3FCEF  ████████ (text)  Success, Proven
Amber:  #FF991F / #FFFAE6  ████████ (text)  Warning, Partial
Red:    #DE350B / #FFEBE6  ████████ (text)  Error, Critical

UI FOUNDATION
━━━━━━━━━━━━━
Background: #F4F5F7  ████████
Card:       #FFFFFF  ████████
Border:     #DFE1E6  ████████
Text:       #42526E  ████████
Muted:      #6B778C  ████████
Primary:    #0052CC  ████████
```

---

**If a UI element cannot be explained to a CFO in one sentence, it does not belong in this system.**
