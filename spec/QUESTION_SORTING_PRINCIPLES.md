# Question Sorting Principles

**Version:** 1.0
**Last Updated:** 2025-01-10
**Purpose:** Define the canonical order of questions in `content/questions.json`

---

## Overview

Questions are sorted using a three-level hierarchy:

1. **By Objective** (9 objectives in theme order)
2. **By Practice within Objective** (logical flow sequence)
3. **By Maturity Level within Practice** (L1 → L2 → L3 → L4)

---

## Rule 1: Objective Order

Objectives follow theme progression: Foundation → Future → Intelligence

| Order | Theme | Objective |
|-------|-------|-----------|
| 1 | Foundation | Budget Discipline |
| 2 | Foundation | Financial Controls |
| 3 | Foundation | Performance Monitoring |
| 4 | Future | Forecasting Agility |
| 5 | Future | Driver-Based Planning |
| 6 | Future | Scenario Modeling |
| 7 | Intelligence | Strategic Influence |
| 8 | Intelligence | Decision Support |
| 9 | Intelligence | Operational Excellence |

---

## Rule 2: Practice Order within Objective

Practices are ordered by **logical flow**: what you do first → what depends on it.

| Objective | Practice Order | Rationale |
|-----------|----------------|-----------|
| Budget Discipline | Annual Budget Cycle → Budget Ownership → Policy & Governance | Create budget → Assign ownership → Enforce rules |
| Financial Controls | Chart of Accounts → Approval Workflows → Month-End Rigor | Structure data → Control spending → Close books |
| Performance Monitoring | Management Reporting → Budget vs Actuals → Variance Investigation | Report results → Compare to plan → Investigate gaps |
| Forecasting Agility | Rolling Forecast Cadence → Cash Flow Visibility → Collaborative Systems | Establish cadence → Add cash view → Enable collaboration |
| Driver-Based Planning | Operational Drivers → Dynamic Targets → Continuous Planning | Identify drivers → Link to targets → Update continuously |
| Scenario Modeling | Rapid What-If → Multi-Scenario Management → Stress Testing | Build one scenario → Manage multiple → Test extremes |
| Strategic Influence | Commercial Partnership → Strategic Alignment → Investment Rigor → Board-Level Impact | Partner with ops → Align to strategy → Govern investments → Influence Board |
| Decision Support | Data Visualization → Self-Service Analytics → Predictive Analytics | Visualize data → Enable self-service → Add prediction |
| Operational Excellence | Process Automation → Service Level Agreements | Automate processes → Formalize SLAs |

---

## Rule 3: Level Order within Practice

Questions within a practice are sorted by maturity level: **L1 → L2 → L3 → L4**

Within the same level, sort by question ID number (e.g., `fpa_l1_q01` before `fpa_l1_q02`).

---

## Tooling

Run the sort script to reorder questions.json:

```bash
node scripts/sort-questions.js
```

---

## Usage

Apply these principles when:
- Adding new questions to the diagnostic
- Reviewing question order after content changes
- Validating that questions.json matches the expected structure
