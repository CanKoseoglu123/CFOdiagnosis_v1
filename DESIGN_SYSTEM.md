# Pillar Report Visual Design System — GARTNER ENTERPRISE

**Style:** Dense, data-heavy, print-friendly. Executive boardroom aesthetic.
**Philosophy:** No soft shadows. No gradients. Sharp borders. High contrast.

---

## 1. COLOR PALETTE (Strict Enterprise)

### CSS Variables (add to index.css)

```css
:root {
  /* === BACKGROUNDS === */
  --background: #F4F5F7;          /* Slate Gray - App background */
  --card: #FFFFFF;                /* White - Card surfaces */
  --card-header: #F8F9FA;         /* Slate-50 - Card headers */
  
  /* === TEXT === */
  --navy: #172B4D;                /* Dark Navy - Headlines, scores */
  --slate: #42526E;               /* Slate - Body text */
  --muted: #6B778C;               /* Muted - Secondary text, labels */
  
  /* === BORDERS === */
  --border: #DFE1E6;              /* Sharp gray - All borders */
  --border-strong: #C1C7D0;       /* Darker - Emphasis borders */
  
  /* === PRIMARY ACTION === */
  --primary: #0052CC;             /* Gartner Blue - Buttons, links, active states */
  --primary-hover: #0747A6;       /* Darker blue - Hover state */
  
  /* === STATUS COLORS (Muted, Professional) === */
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

### Tailwind Config (tailwind.config.js)

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        navy: '#172B4D',
        slate: {
          DEFAULT: '#42526E',
          50: '#F8F9FA',
          100: '#F4F5F7',
          200: '#EBECF0',
          300: '#DFE1E6',
          400: '#C1C7D0',
          500: '#6B778C',
        },
        primary: {
          DEFAULT: '#0052CC',
          hover: '#0747A6',
          light: '#DEEBFF',
        },
        status: {
          green: { text: '#006644', bg: '#E3FCEF', border: '#ABF5D1' },
          yellow: { text: '#FF991F', bg: '#FFFAE6', border: '#FFE380' },
          red: { text: '#DE350B', bg: '#FFEBE6', border: '#FFBDAD' },
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    }
  }
}
```

---

## 2. TYPOGRAPHY

### Font

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Type Scale (Enterprise Dense)

| Element | Classes | Example |
|---------|---------|---------|
| **Section Label** | `text-xs font-semibold uppercase tracking-wide text-slate-500` | EXECUTIVE SUMMARY |
| **Page Title** | `text-2xl font-bold text-navy` | FP&A Diagnostic Report |
| **Card Title** | `text-sm font-bold text-navy uppercase tracking-wide` | BUDGETING |
| **Score Number** | `text-5xl font-bold text-navy` | 76 |
| **Body Text** | `text-sm text-slate leading-relaxed` | Regular content |
| **Meta/Label** | `text-xs text-slate-500` | Level 2 of 4 |

### Heading Pattern

```tsx
{/* Section headers - ALWAYS uppercase, small, muted */}
<h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4">
  EXECUTIVE SUMMARY
</h2>
```

---

## 3. COMPONENT PATTERNS

### Cards (Sharp, No Shadows)

```tsx
{/* Base Card - NO shadow, sharp borders */}
<div className="bg-white border border-slate-300 rounded-sm">
  {/* Card Header */}
  <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
    <h3 className="text-sm font-bold text-navy uppercase tracking-wide">
      {title}
    </h3>
  </div>
  {/* Card Body */}
  <div className="p-4">
    {children}
  </div>
</div>

{/* Card with Status Bar (Left Border) */}
<div className="bg-white border border-slate-300 rounded-sm border-l-4 border-l-green-600">
```

### Score Display (Executive Summary)

```tsx
{/* Large Score - No circle, just bold number */}
<div className="text-center">
  <div className="text-6xl font-bold text-navy">{score}</div>
  <div className="text-xs uppercase tracking-wide text-slate-500 mt-1">
    Execution Score
  </div>
</div>

{/* Maturity Level Box */}
<div className="bg-primary-light border border-primary/20 rounded-sm p-4 text-center">
  <div className="text-3xl font-bold text-primary">L{level}</div>
  <div className="text-sm font-semibold text-navy mt-1">{levelName}</div>
  <div className="text-xs text-slate-500">Level {level} of 4</div>
</div>
```

### Traffic Light Cards (Objectives)

```tsx
{/* Status card with left bar indicator */}
const STATUS_STYLES = {
  green: {
    border: 'border-l-4 border-l-green-600',
    bg: 'bg-status-green-bg',
    text: 'text-status-green-text',
    icon: CheckCircle
  },
  yellow: {
    border: 'border-l-4 border-l-yellow-500',
    bg: 'bg-status-yellow-bg', 
    text: 'text-status-yellow-text',
    icon: AlertCircle
  },
  red: {
    border: 'border-l-4 border-l-red-600',
    bg: 'bg-status-red-bg',
    text: 'text-status-red-text',
    icon: AlertCircle
  }
};

function ObjectiveCard({ objective }) {
  const style = STATUS_STYLES[objective.status];
  const Icon = style.icon;
  
  return (
    <div className={`bg-white border border-slate-300 rounded-sm ${style.border}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${style.text}`} />
            <h3 className="text-sm font-bold text-navy">{objective.name}</h3>
          </div>
          <span className="text-xs text-slate-500">
            {objective.score}%
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${
              objective.status === 'green' ? 'bg-green-600' :
              objective.status === 'yellow' ? 'bg-yellow-500' : 'bg-red-600'
            }`}
            style={{ width: `${objective.score}%` }}
          />
        </div>
      </div>
    </div>
  );
}
```

### Priority Tabs (Underlined, Excel-style)

```tsx
{/* Tab bar - underlined style, NOT pills */}
<div className="border-b border-slate-300">
  <nav className="flex gap-6">
    {(['P1', 'P2', 'P3'] as const).map(priority => (
      <button
        key={priority}
        onClick={() => setActiveTab(priority)}
        className={`
          py-3 text-sm font-medium border-b-2 -mb-px transition-colors
          ${activeTab === priority 
            ? 'border-primary text-primary' 
            : 'border-transparent text-slate-500 hover:text-slate-700'
          }
        `}
      >
        {PRIORITY_CONFIG[priority].icon} {PRIORITY_CONFIG[priority].label}
        <span className="ml-2 px-1.5 py-0.5 text-xs bg-slate-100 rounded">
          {counts[priority]}
        </span>
      </button>
    ))}
  </nav>
</div>
```

### Initiative Card (Dense, Data-Heavy)

```tsx
function InitiativeCard({ initiative, isExpanded, onToggle }) {
  return (
    <div className="bg-white border border-slate-300 rounded-sm overflow-hidden">
      {/* Header - White bg, dark text */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-navy">{initiative.title}</h3>
          
          {/* Critical count badge - High contrast */}
          {initiative.actions.filter(a => a.is_critical).length > 0 && (
            <span className="px-1.5 py-0.5 bg-red-700 text-white text-[10px] font-semibold uppercase tracking-wider rounded-sm">
              {initiative.actions.filter(a => a.is_critical).length} Critical
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {initiative.actions.length} actions
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
      
      {/* Body - Slate background */}
      {isExpanded && (
        <div className="bg-slate-50 border-t border-slate-200 p-4 space-y-2">
          {initiative.actions.map(action => (
            <ActionRow key={action.question_id} action={action} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Action Row (Compact, Scannable)

```tsx
const TYPE_STYLES = {
  quick_win: { label: 'Quick', color: 'text-green-700 bg-green-50 border-green-200' },
  structural: { label: 'Structural', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  behavioral: { label: 'Behavioral', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  governance: { label: 'Governance', color: 'text-orange-700 bg-orange-50 border-orange-200' }
};

function ActionRow({ action }) {
  const typeStyle = TYPE_STYLES[action.type];
  
  return (
    <div className="flex items-center gap-3 py-2 px-3 bg-white border border-slate-200 rounded-sm">
      {/* Critical indicator */}
      {action.is_critical && (
        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
      )}
      
      {/* Title */}
      <span className="flex-1 text-sm text-navy font-medium truncate">
        {action.title}
      </span>
      
      {/* Type badge - compact */}
      <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border rounded-sm ${typeStyle.color}`}>
        {typeStyle.label}
      </span>
      
      {/* Score */}
      <span className="text-xs text-slate-500 w-12 text-right">
        {action.score.toFixed(1)}
      </span>
    </div>
  );
}
```

### Capped Warning Banner (Enterprise Alert)

```tsx
<div className="bg-status-yellow-bg border border-status-yellow-border rounded-sm p-4">
  <div className="flex items-start gap-3">
    <AlertCircle className="w-5 h-5 text-status-yellow-text flex-shrink-0 mt-0.5" />
    <div>
      <h4 className="text-sm font-bold text-navy">Maturity Capped</h4>
      <p className="text-sm text-slate mt-1">
        Score ({score}%) qualifies for Level {potentialLevel}, capped at Level {actualLevel}:
      </p>
      <ul className="mt-2 space-y-1">
        {cappedByTitles.map(title => (
          <li key={title} className="flex items-center gap-2 text-sm text-slate">
            <X className="w-3 h-3 text-red-600" />
            {title}
          </li>
        ))}
      </ul>
    </div>
  </div>
</div>
```

---

## 4. LAYOUT PATTERNS

### Page Container (Dense)

```tsx
<div className="min-h-screen bg-slate-100">
  <div className="max-w-6xl mx-auto px-6 py-8">
    {/* Content */}
  </div>
</div>
```

### Section Spacing (Tighter)

```tsx
<div className="space-y-6">
  <section>{/* Executive Summary */}</section>
  <section>{/* Objectives */}</section>
  <section>{/* Recommended Actions */}</section>
</div>
```

### Section Header Pattern

```tsx
<div className="mb-4">
  <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
    OBJECTIVE HEALTH CHECK
  </h2>
  <p className="text-sm text-slate mt-1">
    Performance across finance capabilities
  </p>
</div>
```

### Grid Layouts

```tsx
{/* 4-column for objectives (dense) */}
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

{/* 3-column for executive summary */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
```

### Spacing Scale (Tighter than before)

| Token | Value | Usage |
|-------|-------|-------|
| `gap-2` | 8px | Within tight groups |
| `gap-3` | 12px | Grid items |
| `gap-4` | 16px | Card sections |
| `space-y-6` | 24px | Major sections |
| `p-4` | 16px | Card padding |
| `py-8` | 32px | Page padding |

---

## 5. ICONS (lucide-react)

```tsx
import { 
  CheckCircle,   // Green status
  AlertCircle,   // Yellow/Red status, Criticals
  Lock,          // Capped indicator
  Unlock,        // P1 Unlock
  Zap,           // P2 Optimize
  Target,        // P3 Future / Objectives
  ChevronDown,   // Expand/collapse
  ChevronRight,  // Navigation
  X,             // Failed items
  Check          // Passed items
} from 'lucide-react';
```

**Note:** Use icons instead of emoji for enterprise feel. No ⭐🏗️🧠📋 in production.

---

## 6. CONFIG MAPPINGS

```typescript
// Priority Config (No emoji in enterprise)
const PRIORITY_CONFIG = {
  P1: { 
    icon: Unlock, 
    label: 'Unlock', 
    tabClass: 'text-red-700',
    badgeClass: 'bg-red-700 text-white'
  },
  P2: { 
    icon: Zap, 
    label: 'Optimize',
    tabClass: 'text-yellow-700',
    badgeClass: 'bg-yellow-600 text-white'
  },
  P3: { 
    icon: Target, 
    label: 'Future',
    tabClass: 'text-blue-700',
    badgeClass: 'bg-blue-600 text-white'
  }
};

// Maturity Levels (NO Level 0)
const LEVEL_CONFIG = {
  1: { name: 'Emerging', color: 'text-red-700' },
  2: { name: 'Defined', color: 'text-yellow-700' },
  3: { name: 'Managed', color: 'text-blue-700' },
  4: { name: 'Optimized', color: 'text-green-700' }
};

// Effort Labels
const EFFORT_CONFIG = {
  1: { label: 'Low', class: 'text-green-700' },
  2: { label: 'Low', class: 'text-green-700' },
  3: { label: 'Med', class: 'text-yellow-700' },
  4: { label: 'High', class: 'text-orange-700' },
  5: { label: 'High', class: 'text-red-700' }
};
```

---

## 7. PRINT STYLES

```css
@media print {
  /* Remove backgrounds for printing */
  .bg-slate-100 { background: white !important; }
  
  /* Ensure borders print */
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  
  /* Hide interactive elements */
  button, .no-print { display: none !important; }
  
  /* Force page breaks */
  .page-break { page-break-before: always; }
  
  /* Expand all collapsibles */
  [data-collapsed] { display: block !important; }
}
```

---

## 8. DESIGN PRINCIPLES SUMMARY

| Principle | Implementation |
|-----------|----------------|
| **No soft shadows** | Use `border` only, no `shadow-*` |
| **Sharp corners** | Use `rounded-sm` (2px), not `rounded-lg` |
| **High contrast borders** | `border-slate-300` on white cards |
| **Dense spacing** | `p-4` not `p-6`, `gap-3` not `gap-6` |
| **Uppercase labels** | `text-xs uppercase tracking-wide text-slate-500` |
| **Muted status colors** | Professional greens/yellows/reds, not vibrant |
| **Underlined tabs** | `border-b-2` not pill buttons |
| **Icons not emoji** | Lucide icons for enterprise feel |
| **Print-friendly** | High contrast, no gradients |
