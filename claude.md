# CFO Lens AI — Project Guide

**Purpose:** Entry point for Claude Code. Orientation, principles, decision framework.
**Philosophy:** Inline the essentials, point to depth.

---

## What We're Building

**CFO Lens AI** is a finance diagnostic platform that helps CFOs assess their FP&A function's maturity, identify gaps, and build action plans. We compress a 6-figure consulting engagement into hours.

**User journey:** Company profiling → Persona classification → 97-question assessment → Calibration → Results & benchmarks → War Room (action planning) → Executive Report (PDF)

**Tech stack:** Express.js + TypeScript (backend, Railway) | React 19 + Vite (frontend, Vercel) | Supabase (PostgreSQL + Auth)

---

## Repository Structure

```
CFOdiagnosis_v1/
├── CLAUDE.md                 # You are here
├── .claude/templates/        # Work mode templates (Plan, Implement, Review)
├── src/                      # Backend (Express + scoring engine)
│   ├── scoring/              # Pure scoring functions
│   ├── gates/                # Critical gate definitions (SSOT)
│   └── interpretation/       # AI layer
├── content/                  # JSON content catalog (questions, practices, gates)
│   ├── questions-*.json      # Split by theme
│   ├── practices.json
│   ├── gates.json            # Score thresholds, critical gates
│   └── pillars/fpa/          # Pillar-specific config
├── cfo-frontend/             # React frontend
│   ├── src/components/       # UI components
│   └── content/blog/         # MDX blog posts
├── spec/                     # Specification documents
│   ├── SPEC.md               # Design contract
│   ├── DESIGN_SYSTEM.md      # Visual design
│   ├── NAVIGATION_PRINCIPLES.md
│   ├── BLOG_STYLE_CRITERIA.md
│   ├── QUESTION_REVIEW_CRITERIA.md    # Universal (all pillars)
│   ├── ACTION_REVIEW_CRITERIA.md      # Universal (all pillars)
│   ├── IMPACT_COMPLEXITY.md           # Cross-pillar methodology
│   ├── QUESTION_SORTING_PRINCIPLES.md
│   └── pillars/fpa/
│       ├── CONTENT_GUIDE.md           # FP&A specific
│       └── IMPACT_ANCHORS.md          # FP&A calibration examples
└── supabase/migrations/      # Database migrations
```

---

## Core Principles (Non-Negotiable)

### 1. Strict Vertical Isolation
Practice → Objective → Theme → Pillar. No sharing across pillars. Enables multi-pillar scalability.

### 2. Scoring is Deterministic
```
Score = (Impact² / Complexity) × CriticalBoost × CombinedMultiplier
```
AI **explains** scores but never **changes** them. Missing answers = 0.

### 3. Content is King
All diagnostic content lives in `content/*.json`. Code reads it; code never hardcodes it.

### 4. Gates from SSOT
Critical gates imported from `src/gates/index.ts`. Never hardcode gate question IDs.

### 5. Fair but Firm
Critical gate failures cap maturity level regardless of score. P1 blockers prevent "Green" status.

### 6. Enterprise Aesthetic
Dense, data-heavy, print-friendly. No shadows, no gradients. CFO cockpit, not consumer app.

---

## Work Modes

Claude Code operates in distinct modes to separate planning from execution. Trigger with prefixes or reference templates in `.claude/templates/`.

### Mode Summary

| Mode | Trigger | Output |
|------|---------|--------|
| **Plan** | `Plan:` or ref `.claude/templates/PLAN.md` | File list, sequence, decisions, risks |
| **Implement** | `Implement:` or ref `.claude/templates/IMPLEMENT.md` | Code changes, one file at a time |
| **Review** | `Review:` or ref `.claude/templates/REVIEW.md` | Change summary, validation status, risks |

### When to Use Each Mode

| Task Scope | Mode Sequence |
|------------|---------------|
| Single file, clear scope | Implement directly |
| 2-3 files, low risk | Implement → Review |
| 3+ files OR crosses layers | Plan → [confirm] → Implement → Review |
| Scoring/gates/migrations | Plan → [confirm] → Implement → Review → [approve] |

### Approver Gates

**Require explicit "proceed" before implementing:**
- Any change to `src/gates/`
- Any change to `src/scoring/`
- Any database migration
- Any deletion of content or code
- Changes spanning 5+ files

**Format:** State the change, then stop. Do not proceed without explicit confirmation.

### Mode Behaviors

**Plan Mode (auto-reviews):**
1. **Draft** — List files, dependencies, decisions, risks
2. **Self-Review** — Check against:
   - Does this touch approver-gate paths? (gates, scoring, migrations)
   - Are there missing dependencies?
   - Is the scope creeping beyond the request?
   - What could break?
3. **Refine** — Adjust plan based on review findings
4. **Output** — Present final plan with review notes
5. **Wait** — "Ready to implement? Confirm or adjust."

DO NOT write code or make changes during planning.

**Implement Mode (auto-reviews):**
1. **Execute** — One file at a time, validate before next
2. **If blocked twice** — Stop, report error, wait for guidance
3. **Self-Review** — After all changes, check:
   - Did changes stay within scope?
   - Any regressions introduced?
   - What might break?
4. **Output** — Summary of changes + review notes
5. **End with** — "Manual checks recommended: [list]"

DO NOT work around blockers.

**Review Mode (standalone):**
Use when reviewing changes made outside of Implement mode, or for deeper review.
- Summarize changes, list validations run, flag what might break
- DO NOT make additional changes
- End with: "Manual checks recommended: [list]"

### Quick Triggers Reference

**Work modes:**
- `Plan: [task]` — Enters planning mode
- `Implement: [task]` — Direct implementation (use for simple tasks)
- `Review: [changes]` — Post-implementation review

**Content auditor agent:**
- "audit the questions" — Full content audit
- "validate questions-foundation.json" — Single file audit
- "check fpa_q015" — Single question audit
- "calibrate impact scores" — Score distribution check

**Approver gates (Claude MUST stop and wait):**
- Any mention of `src/gates/` or `src/scoring/`
- "add migration" or "change database"
- "delete" + file/content reference

---

## Decision Framework

### Adding or Editing Questions

**Inline essentials (memorize these):**
- Binary clarity: Yes/No without "it depends"
- Plain language: No jargon a non-finance exec couldn't understand
- FP&A centricity: Tests FP&A capability, not just outcomes
- Capability over tools: Tests skill/process maturity, not software features
- Maturity fit: L1=basic, L2=structured, L3=optimized, L4=advanced/predictive

**Impact scoring guide:**
| Score | Meaning | CFO test |
|-------|---------|----------|
| 5 | Transformational | "Changes how we run the company" |
| 4 | High | "Leadership uses this weekly" |
| 3 | Moderate | "Meaningful process improvement" |
| 2 | Low | "Nice to have, not essential" |

**Complexity scoring guide:**
| Score | Meaning | Timeline |
|-------|---------|----------|
| 5 | Transformational | Multi-quarter, board approval |
| 4 | High | 6-12 months, dedicated PM |
| 3 | Moderate | 3-6 months, team effort |
| 2 | Low | 1-3 months, one owner |
| 1 | Quick win | This month, policy change |

**Workflow:**
1. Read `spec/QUESTION_REVIEW_CRITERIA.md` — full 13-point checklist
2. Read `spec/pillars/fpa/CONTENT_GUIDE.md` — practices, gates, mappings
3. Read `spec/pillars/fpa/IMPACT_ANCHORS.md` — calibrate against examples
4. Edit `content/questions-{theme}.json`
5. Run `npm run test:vs24`
6. Run `node scripts/sort-questions.js`

---

### Adding or Editing Actions

**Inline essentials (memorize these):**
- Actionable first step: Reader knows what to do Monday morning
- Outcome-oriented title: "Implement Budget Sign-Off" not "Work on Process"
- Owner clarity: Finance team, business owner, or cross-functional—never ambiguous
- Plain language: No jargon, no consultant-speak
- Type-appropriate detail: Quick wins = exact steps; Structural = directional

**Action types:**
| Type | Meaning | Detail level |
|------|---------|--------------|
| `quick_win` | Days, minimal coordination | High — specific steps |
| `structural` | Process/system changes | Medium — key milestones |
| `behavioral` | How people work | Medium — behavior change |
| `governance` | Rules, policies, oversight | Low-Medium — policy intent |

**Workflow:**
1. Read `spec/ACTION_REVIEW_CRITERIA.md` — full 11-point checklist
2. Check Zero-to-L4 completeness for the objective
3. Edit `expert_action` field in question JSON

---

### Building UI

**Inline essentials (memorize these):**
- No shadows — borders only
- No gradients — flat colors
- No rounded gimmicks — `rounded-sm` maximum
- Use `BRAND_COLORS` from `Logo.jsx`, never inline hex
- Enterprise width scale: Auth=448px, Setup=1024px, Report=1280px

**Brand colors:**
```js
navy: '#1a365d'    // Headlines, buttons, dark UI
gold: '#c9a050'    // Accents, CTAs, premium
```

**Workflow:**
1. Read `spec/DESIGN_SYSTEM.md` — full color system, typography, components
2. Read `spec/NAVIGATION_PRINCIPLES.md` — if touching navigation
3. Follow existing component patterns

---

### Writing Blog Posts

**Inline essentials (memorize these):**
- SecretCFO voice: Sharp, peer-to-peer, rooted in real FP&A pressure
- Open with pressure moment: Board question, leadership tension, the silence
- You/We voice: Never "I" — avoids one-man-show feel
- Plain language: Non-native English speaker can understand
- 800-1200 words, 5-7 headlines for scanning
- Single CTA linking to diagnostic

**Workflow:**
1. Read `spec/BLOG_STYLE_CRITERIA.md` — full criteria, pressure moments library
2. Create `.mdx` file in `cfo-frontend/content/blog/`
3. Add images to `cfo-frontend/public/blog/`

---

### Touching Scoring Logic

**Key numbers (memorize these):**
| Level | Name | Threshold | Gate requirement |
|-------|------|-----------|------------------|
| 1 | Emerging | < 40% | — |
| 2 | Defined | ≥ 40% | Pass L1 critical gates |
| 3 | Managed | ≥ 65% | Pass L1 + L2 critical gates |
| 4 | Optimized | ≥ 85% | Pass all critical gates |

**Multipliers:**
| Calibration level | Multiplier |
|-------------------|------------|
| 5 Critical | 1.50× |
| 4 High | 1.25× |
| 3 Medium | 1.00× |
| 2 Low | 0.75× |
| 1 Minimal | 0.50× |

**Context modifier (pain points):** 1.0× base, ×1.5 per match, capped at 2.0×

**Combined multiplier cap:** `min(2.0, ImportanceFactor × ContextModifier)`

**Workflow:**
1. Read `spec/SPEC.md` — scoring philosophy, invariants
2. Scoring functions are pure — no side effects
3. Test with `npm run test:all`

---

### Adding a New Pillar

**Workflow:**
1. Read `spec/SPEC.md` — Strict Vertical Rule, extension points
2. Create `content/pillars/{pillar_id}/` with config
3. Create `spec/pillars/{pillar_id}/CONTENT_GUIDE.md`
4. Create `spec/pillars/{pillar_id}/IMPACT_ANCHORS.md`
5. Create pillar pack in `src/interpretation/pillars/{pillar_id}/`
6. Register in `src/interpretation/pillars/registry.ts`

---

## Quick Commands

```bash
# Development
npm run dev                    # Backend localhost:3000
cd cfo-frontend && npm run dev # Frontend Vite server

# Testing
npm run test:all               # All tests
npm run test:vs24              # Content validation

# Content tools
node scripts/sort-questions.js
node scripts/renumber-questions.js

# Build
npm run build                  # Backend
cd cfo-frontend && npm run build
```

---

## Key URLs

| Environment | URL |
|-------------|-----|
| Frontend | https://cfodiagnosisv1.vercel.app |
| Backend API | https://cfodiagnosisv1-production.up.railway.app |
| GitHub | https://github.com/CanKoseoglu123/CFOdiagnosis_v1 |
| Health check | `GET /health` |

---

## Infrastructure: Email (Resend)

**Domain:** `cfo-lens.com`

**How it works:** Supabase Auth sends magic-link and transactional emails via Resend SMTP. DNS records are managed in Vercel.

| Component | Detail |
|-----------|--------|
| SMTP host | `smtp.resend.com` (port 465) |
| SMTP username | `resend` |
| SMTP password | Resend API key (`RESEND_API_KEY`) |
| Sender address | `noreply@cfo-lens.com` |

**DNS records (Vercel):**

| Type | Name | Purpose |
|------|------|---------|
| TXT | `resend._domainkey` | DKIM signing (value from Resend dashboard) |
| MX | `send` | Bounce/feedback handling (priority 10) |
| TXT | `send` | SPF (`v=spf1 include:amazonses.com ~all`) |
| TXT | `_dmarc` | DMARC policy (`v=DMARC1; p=none;`) |

**Env variable:** `RESEND_API_KEY` — set in Railway (backend) and Supabase SMTP config.

---

## Anti-Patterns (Do NOT)

| Anti-pattern | Why it's wrong |
|--------------|----------------|
| Hardcode gate question IDs | Use `src/gates/index.ts` |
| Inline hex colors | Use `BRAND_COLORS` or CSS variables |
| Add shadows or gradients | Enterprise aesthetic forbids them |
| Let AI change scores | AI explains, never grades |
| Skip reading spec docs | They exist for a reason |
| Duplicate content across docs | Single source of truth |
| Put implementation details here | This file is for orientation |
| Skip Plan mode on 3+ file changes | Leads to scope creep and missed dependencies |
| Work around blockers | Stop and report after 2 failed attempts |
| Proceed without approval on gates | Scoring/gates/migrations require explicit "proceed" |

---

## Document Map

| Document | Purpose | When to read |
|----------|---------|--------------|
| `.claude/templates/PLAN.md` | Planning mode | Multi-file changes |
| `.claude/templates/IMPLEMENT.md` | Worker mode | During implementation |
| `.claude/templates/REVIEW.md` | Review mode | After implementation |
| `spec/SPEC.md` | Design contract, invariants | Architecture decisions, scoring logic |
| `spec/DESIGN_SYSTEM.md` | Visual design | Any UI work |
| `spec/NAVIGATION_PRINCIPLES.md` | Nav rules | Navigation changes |
| `spec/BLOG_STYLE_CRITERIA.md` | Writing voice | Blog posts |
| `spec/QUESTION_REVIEW_CRITERIA.md` | 13-point checklist | Adding/editing questions |
| `spec/ACTION_REVIEW_CRITERIA.md` | 11-point checklist | Adding/editing actions |
| `spec/IMPACT_COMPLEXITY.md` | Scoring methodology | Calibrating Impact/Complexity |
| `spec/QUESTION_SORTING_PRINCIPLES.md` | Ordering rules | Reordering questions |
| `spec/pillars/fpa/CONTENT_GUIDE.md` | FP&A specifics | FP&A content work |
| `spec/pillars/fpa/IMPACT_ANCHORS.md` | FP&A calibration | FP&A Impact/Complexity |

---

*This guide tells you how to think and where to look. Implementation lives in code and spec docs.*
