# FP&A Pillar — Content Guide

**Purpose:** FP&A-specific content structure, mappings, and gates.
**Scope:** This document covers ONLY FP&A-specific details.
**Universal rules:** See `QUESTION_REVIEW_CRITERIA.md`, `ACTION_REVIEW_CRITERIA.md`, `IMPACT_COMPLEXITY.md`

---

## Content Inventory

| Theme | File | Questions |
|-------|------|-----------|
| Foundation | `content/questions-foundation.json` | 37 |
| Future | `content/questions-future.json` | 27 |
| Intelligence | `content/questions-intelligence.json` | 33 |
| **Total** | | **97** |

**Other files:**
- `content/practices.json` — 26 practices
- `content/objectives.json` — 9 objectives
- `content/themes.json` — 3 themes
- `content/gates.json` — Critical gates
- `content/pillars/fpa/na-config.json` — N/A rules

---

## Content Hierarchy

```
FP&A Pillar
├── The Foundation (Control & Trust)
│   ├── Budget Discipline
│   │   ├── prac_annual_budget_cycle
│   │   ├── prac_budget_ownership
│   │   └── prac_policy_governance
│   ├── Financial Controls
│   │   ├── prac_chart_of_accounts
│   │   ├── prac_approval_workflows
│   │   └── prac_month_end_rigor
│   └── Performance Monitoring
│       ├── prac_management_reporting
│       ├── prac_budget_vs_actuals
│       └── prac_variance_investigation
│
├── The Future (Speed & Agility)
│   ├── Forecasting Agility
│   │   ├── prac_rolling_forecast_cadence
│   │   ├── prac_cash_flow_visibility
│   │   └── prac_collaborative_systems
│   ├── Driver-Based Planning
│   │   ├── prac_operational_drivers
│   │   └── prac_dynamic_targets
│   └── Scenario Modeling
│       ├── prac_rapid_what_if_capability
│       ├── prac_multi_scenario_management
│       └── prac_stress_testing
│
└── The Intelligence (Value & Influence)
    ├── Strategic Influence
    │   ├── prac_commercial_partnership
    │   ├── prac_strategic_alignment
    │   ├── prac_investment_rigor
    │   └── prac_board_level_impact
    ├── Decision Support
    │   ├── prac_data_visualization
    │   ├── prac_self_service_analytics
    │   └── prac_predictive_analytics
    └── Operational Excellence
        ├── prac_process_automation
        └── prac_service_level_agreements
```

**Total:** 26 practices (not 27 — asymmetric distribution)

---

## Critical Gates

### L1 → L2 (Emerging → Defined)

| Question ID | Capability | Why critical |
|-------------|------------|--------------|
| `fpa_q001` | Annual budget before fiscal year | Can't claim L2 without budget discipline |
| `fpa_q002` | Full P&L in budget | Incomplete budget = incomplete control |
| `fpa_q016` | Unified chart of accounts | Data integrity foundation |
| `fpa_q026` | Monthly management reporting | Basic reporting cadence |

### L2 → L3 (Defined → Managed)

| Question ID | Capability | Why critical |
|-------------|------------|--------------|
| `fpa_q031` | Monthly Budget vs. Actuals | Core FP&A practice |
| `fpa_q033` | Variance threshold investigation | Closes the loop |
| `fpa_q041` | Working capital modeled | Cash implications |
| `fpa_q046` | Multi-user forecasting | Collaboration capability |

**Source:** `content/gates.json` — always import from `src/gates/index.ts`

---

## Pain Point → Practice Mapping

When users select pain points, related practices get a priority boost (1.0× to 2.0×).

| Pain Point | Display Name | Practices Boosted |
|------------|--------------|-------------------|
| `data_wrangling` | Endless manual data gathering | `prac_collaborative_systems`, `prac_process_automation`, `prac_self_service_analytics` |
| `forecast_accuracy` | Forecasting accuracy & credibility | `prac_rolling_forecast_cadence`, `prac_operational_drivers`, `prac_dynamic_targets`, `prac_predictive_analytics` |
| `partner_engagement` | Business partners don't engage | `prac_commercial_partnership`, `prac_strategic_alignment`, `prac_variance_investigation`, `prac_data_visualization` |
| `budget_cycle` | Endless budget process | `prac_annual_budget_cycle`, `prac_rolling_forecast_cadence`, `prac_process_automation` |
| `bandwidth` | Talent & bandwidth constraints | `prac_process_automation`, `prac_service_level_agreements` |
| `tech_fragmentation` | Technology stack fragmentation | `prac_collaborative_systems`, `prac_chart_of_accounts`, `prac_process_automation` |
| `scenario_planning` | Scenario planning gaps | `prac_rapid_what_if_capability`, `prac_multi_scenario_management`, `prac_stress_testing` |
| `communication` | Communicating to non-finance execs | `prac_data_visualization`, `prac_board_level_impact`, `prac_operational_drivers` |
| `realtime_visibility` | Real-time visibility gaps | `prac_month_end_rigor`, `prac_self_service_analytics`, `prac_management_reporting` |
| `data_silos` | Data silos across systems | `prac_collaborative_systems`, `prac_chart_of_accounts`, `prac_self_service_analytics` |

**Boost formula:** `ContextModifier = min(2.0, 1.0 × 1.5^matching_count)`

---

## Question Sorting Order

Questions in theme files follow this hierarchy:

1. **By Objective** (Foundation → Future → Intelligence)
2. **By Practice within Objective** (logical flow)
3. **By Maturity Level within Practice** (L1 → L2 → L3 → L4)

### Practice Order by Objective

| Objective | Practice Order | Rationale |
|-----------|----------------|-----------|
| Budget Discipline | Annual Budget Cycle → Budget Ownership → Policy & Governance | Create → Assign → Enforce |
| Financial Controls | Chart of Accounts → Approval Workflows → Month-End Rigor | Structure → Control → Close |
| Performance Monitoring | Management Reporting → Budget vs Actuals → Variance Investigation | Report → Compare → Investigate |
| Forecasting Agility | Rolling Forecast Cadence → Cash Flow Visibility → Collaborative Systems | Cadence → Cash → Collaboration |
| Driver-Based Planning | Operational Drivers → Dynamic Targets | Identify → Link |
| Scenario Modeling | Rapid What-If → Multi-Scenario Management → Stress Testing | Build one → Manage many → Test extremes |
| Strategic Influence | Commercial Partnership → Strategic Alignment → Investment Rigor → Board-Level Impact | Partner → Align → Govern → Influence |
| Decision Support | Data Visualization → Self-Service Analytics → Predictive Analytics | Visualize → Enable → Predict |
| Operational Excellence | Process Automation → Service Level Agreements | Automate → Formalize |

**Tools:**
```bash
node scripts/sort-questions.js
node scripts/renumber-questions.js
```

---

## FP&A-Specific Maturity Expectations

| Level | What it means for FP&A |
|-------|------------------------|
| L1 Foundational | Budget exists, basic reporting in place |
| L2 Structured | Formalized processes, clear ownership, regular cadence |
| L3 Optimized | Driver-based, proactive, cross-functional integration |
| L4 Advanced | Predictive, automated, strategic partnership |

---

## Workflow: Adding an FP&A Question

1. **Identify practice** — Which of the 26 practices does this belong to?
2. **Determine level** — L1 (basic) to L4 (advanced)
3. **Write question** — Binary, plain language, FP&A-centric
4. **Write help text** — Why this matters
5. **Score Impact/Complexity** — Use `IMPACT_ANCHORS.md` for calibration
6. **Write expert_action** — Title, recommendation, type
7. **Apply universal criteria** — `QUESTION_REVIEW_CRITERIA.md` (13 points)
8. **Add to JSON** — `content/questions-{theme}.json`
9. **Validate** — `npm run test:vs24`
10. **Sort** — `node scripts/sort-questions.js`

---

## Related Documents

| Document | What it provides |
|----------|------------------|
| `QUESTION_REVIEW_CRITERIA.md` | Universal 13-point checklist |
| `ACTION_REVIEW_CRITERIA.md` | Universal 11-point checklist |
| `IMPACT_COMPLEXITY.md` | Cross-pillar scoring methodology |
| `IMPACT_ANCHORS.md` | FP&A-specific calibration examples |
| `QUESTION_SORTING_PRINCIPLES.md` | Full sorting rules |

---

*This guide is FP&A-specific. When adding Treasury, Tax, or other pillars, create a parallel `spec/pillars/{pillar}/CONTENT_GUIDE.md`.*
