# FP&A Diagnostic Questions Reference

**Version:** v2.7.0
**Pillar:** FP&A (Financial Planning & Analysis)
**Total Questions:** 40
**Critical Questions:** 10

---

## Summary by Level

| Level | Label | Questions | Critical | Threshold |
|-------|-------|-----------|----------|-----------|
| 1 | Emerging | 10 | 6 (60%) | 80% |
| 2 | Defined | 10 | 4 (40%) | 80% |
| 3 | Managed | 10 | 0 (0%) | 80% |
| 4 | Optimized | 10 | 0 (0%) | 80% |

---

## Objectives Overview

| ID | Level | Name | Questions | Action |
|----|-------|------|-----------|--------|
| obj_fpa_l1_budget | 1 | Budget Foundation | 5 | act_fpa_l1_budget |
| obj_fpa_l1_control | 1 | Financial Controls | 5 | act_fpa_l1_control |
| obj_fpa_l2_variance | 2 | Variance Management | 5 | act_fpa_l2_variance |
| obj_fpa_l2_forecast | 2 | Forecasting Capability | 5 | act_fpa_l2_forecast |
| obj_fpa_l3_driver | 3 | Driver-Based Planning | 5 | act_fpa_l3_driver |
| obj_fpa_l3_scenario | 3 | Scenario Planning | 5 | act_fpa_l3_scenario |
| obj_fpa_l4_integrate | 4 | Integrated Planning | 5 | act_fpa_l4_integrate |
| obj_fpa_l4_predict | 4 | Predictive Analytics | 5 | act_fpa_l4_predict |

---

## Level 1: Emerging (Foundation)

### Objective: Budget Foundation (obj_fpa_l1_budget)

| ID | Question | Critical | Rationale |
|----|----------|----------|-----------|
| fpa_l1_q01 | Does the company produce an approved annual budget before the fiscal year begins? | YES | No budget = no financial baseline |
| fpa_l1_q02 | Is there a single, clearly assigned owner responsible for the budget process? | YES | Unclear ownership = process failure |
| fpa_l1_q03 | Does the budget include a full P&L down to Net Income (not just Revenue/Opex)? | YES | Incomplete P&L = blind spots |
| fpa_l1_q04 | Is the budget granular enough to track expenses by department or cost center? | YES | No granularity = no accountability |
| fpa_l1_q05 | Are budget targets formally communicated to department heads in writing? | YES | Undocumented targets = misalignment |

### Objective: Financial Controls (obj_fpa_l1_control)

| ID | Question | Critical | Rationale |
|----|----------|----------|-----------|
| fpa_l1_q06 | Is there a formal chart of accounts that is consistent across the organization? | YES | Inconsistent CoA = unreliable reporting |
| fpa_l1_q07 | Are non-standard journal entries reviewed and approved by a second person? | YES | No review = fraud/error risk |
| fpa_l1_q08 | Is there a documented delegation of authority (DOA) matrix for spending approvals? | YES | No DOA = uncontrolled spending |
| fpa_l1_q09 | Are bank reconciliations performed and reviewed within 10 days of month-end? | YES | Late recon = cash blind spot |
| fpa_l1_q10 | Is access to the accounting system restricted based on roles (segregation of duties)? | YES | No SoD = audit failure |

---

## Level 2: Defined (Process Maturity)

### Objective: Variance Management (obj_fpa_l2_variance)

| ID | Question | Critical | Rationale |
|----|----------|----------|-----------|
| fpa_l2_q01 | Is a Budget vs. Actuals (BvA) report generated every month? | YES | No BvA = no visibility |
| fpa_l2_q02 | Are variances exceeding a defined threshold (e.g., 10%) formally investigated? | YES | Uninvestigated variance = hidden problems |
| fpa_l2_q03 | Do department heads meet with Finance monthly to review their BvA performance? | YES | No meetings = no accountability |
| fpa_l2_q04 | Are variance explanations documented in the monthly management reporting package? | YES | Undocumented = lost institutional knowledge |
| fpa_l2_q05 | Does the BvA process include a review of headcount and personnel costs? | NO | Important but not foundational |

### Objective: Forecasting Capability (obj_fpa_l2_forecast)

| ID | Question | Critical | Rationale |
|----|----------|----------|-----------|
| fpa_l2_q06 | Is a financial forecast updated at least quarterly (re-forecast)? | YES | Stale forecast = flying blind |
| fpa_l2_q07 | Does the forecast project cash flow and liquidity, not just P&L? | YES | No cash forecast = liquidity risk |
| fpa_l2_q08 | Are forecast assumptions explicitly documented (e.g., "assuming 5% churn")? | NO | Good practice but not critical |
| fpa_l2_q09 | Is historical forecast accuracy tracked to improve future predictions? | NO | Optimization, not foundation |
| fpa_l2_q10 | Does the forecast extend at least 12 months into the future (rolling)? | NO | Best practice, not critical |

---

## Level 3: Managed (Optimization)

### Objective: Driver-Based Planning (obj_fpa_l3_driver)

| ID | Question | Critical | Rationale |
|----|----------|----------|-----------|
| fpa_l3_q01 | Is the financial model linked to operational drivers (e.g., leads, conversion, headcount)? | NO | Advanced capability |
| fpa_l3_q02 | Can you update a single driver (e.g., price increase) and see the P&L impact instantly? | NO | Advanced capability |
| fpa_l3_q03 | Are Unit Economics (CAC, LTV, Gross Margin per unit) calculated monthly? | NO | Advanced capability |
| fpa_l3_q04 | Is cohort analysis used to understand revenue retention/churn behavior? | NO | Advanced capability |
| fpa_l3_q05 | Are non-financial KPIs reported alongside financial metrics in the same dashboard? | NO | Advanced capability |

### Objective: Scenario Planning (obj_fpa_l3_scenario)

| ID | Question | Critical | Rationale |
|----|----------|----------|-----------|
| fpa_l3_q06 | Can the model run multiple scenarios (Base, Bull, Bear) simultaneously? | NO | Advanced capability |
| fpa_l3_q07 | Are "trigger points" defined that would activate specific contingency plans? | NO | Advanced capability |
| fpa_l3_q08 | Is sensitivity analysis performed on key assumptions (e.g., sensitivity to interest rates)? | NO | Advanced capability |
| fpa_l3_q09 | Is capital allocation (CAPEX/Hiring) dynamically adjusted based on scenario triggers? | NO | Advanced capability |
| fpa_l3_q10 | Are scenarios stress-tested against potential external shocks (e.g., supply chain break)? | NO | Advanced capability |

---

## Level 4: Optimized (Advanced/Analytics)

### Objective: Integrated Planning (obj_fpa_l4_integrate)

| ID | Question | Critical | Rationale |
|----|----------|----------|-----------|
| fpa_l4_q01 | Is the planning tool directly integrated with the ERP (no manual data export/import)? | NO | Excellence tier |
| fpa_l4_q02 | Is the planning tool integrated with the CRM/HRIS for live operational data? | NO | Excellence tier |
| fpa_l4_q03 | Do different functions (Sales, Ops, Finance) plan in a single connected environment? | NO | Excellence tier |
| fpa_l4_q04 | Is the "close-to-report" cycle (books closed to dashboard updated) under 3 days? | NO | Excellence tier |
| fpa_l4_q05 | Are strategic long-range plans (3-5 years) mathematically linked to the annual budget? | NO | Excellence tier |

### Objective: Predictive Analytics (obj_fpa_l4_predict)

| ID | Question | Critical | Rationale |
|----|----------|----------|-----------|
| fpa_l4_q06 | Are machine learning algorithms used to generate a baseline forecast? | NO | Excellence tier |
| fpa_l4_q07 | Does the system automatically flag anomalies in real-time (not month-end)? | NO | Excellence tier |
| fpa_l4_q08 | Is customer lifetime value (CLTV) predicted at an individual customer level? | NO | Excellence tier |
| fpa_l4_q09 | Are external datasets (market trends, macro indicators) automatically ingested? | NO | Excellence tier |
| fpa_l4_q10 | Is the variance between ML prediction and human forecast tracked and analyzed? | NO | Excellence tier |

---

## Critical Risk Philosophy

### "Silence is a Risk" Rule

Any question marked as **Critical = YES** that receives:
- `false` (explicit NO)
- `null` (unanswered)
- `undefined` (not submitted)

...will generate a **CRITICAL RISK** in the report.

### Why These Questions Are Critical

| Level | # Critical | Rationale |
|-------|------------|-----------|
| 1 | 6/10 | Foundation questions. Failure here = no financial control baseline |
| 2 | 4/10 | Core process questions. Some are "nice to have" not "must have" |
| 3 | 0/10 | Optimization. Absence is a gap, not a risk |
| 4 | 0/10 | Excellence. Absence is expected for most organizations |

---

## Actions Summary

| Action ID | Title | Triggered By | Priority |
|-----------|-------|--------------|----------|
| act_fpa_l1_budget | Establish Formal Budget Process | obj_fpa_l1_budget incomplete | HIGH (if critical risk) |
| act_fpa_l1_control | Implement Financial Control Framework | obj_fpa_l1_control incomplete | HIGH (if critical risk) |
| act_fpa_l2_variance | Deploy Variance Analysis Discipline | obj_fpa_l2_variance incomplete | HIGH (if critical risk) |
| act_fpa_l2_forecast | Implement Rolling Forecast Process | obj_fpa_l2_forecast incomplete | HIGH (if critical risk) |
| act_fpa_l3_driver | Build Driver-Based Financial Model | obj_fpa_l3_driver incomplete | MEDIUM |
| act_fpa_l3_scenario | Develop Scenario Planning Capability | obj_fpa_l3_scenario incomplete | MEDIUM |
| act_fpa_l4_integrate | Achieve Planning Integration | obj_fpa_l4_integrate incomplete | MEDIUM |
| act_fpa_l4_predict | Deploy Predictive Analytics | obj_fpa_l4_predict incomplete | MEDIUM |

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| 2024-12-20 | v2.6.4 | Initial 40-question FP&A content release |
| 2024-12-21 | v2.7.0 | Behavioral Edition - Theme layer, criticality calibration (10 critical) |

---

## File Reference

- **Spec Implementation:** `src/specs/v2.7.0.ts`
- **Types:** `src/specs/types.ts`
- **Tests:** `src/tests/vs9-qa.test.ts`
