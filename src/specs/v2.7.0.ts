/**
 * CFO Diagnostic Platform - Specification v2.7.0 (Behavioral Edition)
 *
 * CHANGELOG from v2.6.4:
 * - Added Theme layer for UX grouping (foundation, future, intelligence)
 * - Added purpose statements to objectives
 * - Added theme_order for deterministic UI rendering
 * - Moved Budget to "Foundation" theme
 * - Calibrated criticality: 16 → 10 critical questions
 * - BEHAVIORAL REWRITE: 23 questions in Future/Intelligence themes
 *   rewritten from "process existence" to "organizational behavior"
 *
 * Content: FP&A Pillar (48 questions, 8 objectives, 8 actions, 3 themes)
 * Question Types:
 * - Theme 1 (Foundation): L1 (9) + L2 Variance (5) = 14 questions
 * - Theme 2 (Future): L2 Forecast (9) + L3 Driver (8) + L4 Integrate (5) = 22 questions
 * - Theme 3 (Intelligence): L3 Scenario (7) + L4 Predict (5) = 12 questions
 * - TOTAL: 48 questions
 * - CRITICAL: 8 questions (L1: 4, L2: 4)
 *
 * Last Updated: 2024-12-20
 */

import { Spec, THEMES } from "./types";

export const SPEC: Spec = {
  version: "v2.7.0",

  // =============================================================================
  // PILLARS
  // =============================================================================
  pillars: [
    {
      id: "fpa",
      name: "Financial Planning & Analysis",
      description: "Budget, forecast, variance analysis, and strategic planning capabilities",
      weight: 1
    }
  ],

  // =============================================================================
  // OBJECTIVES (8 total, organized by Theme)
  //
  // Theme 1: Foundation (Budget, Control, Variance) - 15 questions
  // Theme 2: Future (Forecast, Driver, Integrate) - 15 questions
  // Theme 3: Intelligence (Scenario, Predict) - 10 questions
  // =============================================================================
  objectives: [
    // ─────────────────────────────────────────────────────────────────────────────
    // THEME: THE FOUNDATION (Performance Management & Control)
    // ─────────────────────────────────────────────────────────────────────────────
    {
      id: "obj_fpa_l1_budget",
      pillar_id: "fpa",
      level: 1,
      name: "Budgeting",
      purpose: "To establish a formal financial baseline against which performance can be measured",
      description: "Establish a formal, owned, and communicated annual budget process",
      action_id: "act_fpa_l1_budget",
      theme: "foundation",
      theme_order: 1
    },
    {
      id: "obj_fpa_l1_control",
      pillar_id: "fpa",
      level: 1,
      name: "Financial Controls",
      purpose: "To ensure data integrity, prevent fraud, and create a verifiable audit trail",
      description: "Implement basic financial controls and segregation of duties",
      action_id: "act_fpa_l1_control",
      theme: "foundation",
      theme_order: 2
    },
    {
      id: "obj_fpa_l2_variance",
      pillar_id: "fpa",
      level: 2,
      name: "Variance Management",
      purpose: "To systematically identify, explain, and correct deviations from the plan",
      description: "Establish monthly variance analysis with accountability",
      action_id: "act_fpa_l2_variance",
      theme: "foundation",
      theme_order: 3
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // THEME: THE FUTURE (Planning & Forecasting)
    // ─────────────────────────────────────────────────────────────────────────────
    {
      id: "obj_fpa_l2_forecast",
      pillar_id: "fpa",
      level: 2,
      name: "Forecasting",
      purpose: "To provide a realistic, rolling view of future performance as conditions change",
      description: "Implement rolling forecasts with documented assumptions",
      action_id: "act_fpa_l2_forecast",
      theme: "future",
      theme_order: 4
    },
    {
      id: "obj_fpa_l3_driver",
      pillar_id: "fpa",
      level: 3,
      name: "Driver-Based Planning",
      purpose: "To link financial outcomes directly to the operational levers that drive them",
      description: "Link financial models to operational drivers and unit economics",
      action_id: "act_fpa_l3_driver",
      theme: "future",
      theme_order: 5
    },
    {
      id: "obj_fpa_l4_integrate",
      pillar_id: "fpa",
      level: 4,
      name: "Integrated Planning",
      purpose: "To unify data across functions into a single source of truth",
      description: "Connect planning across functions with live system integration",
      action_id: "act_fpa_l4_integrate",
      theme: "future",
      theme_order: 6
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // THEME: THE INTELLIGENCE (Strategic Analytics)
    // ─────────────────────────────────────────────────────────────────────────────
    {
      id: "obj_fpa_l3_scenario",
      pillar_id: "fpa",
      level: 3,
      name: "Scenario Planning",
      purpose: "To prepare the organization for volatility by modeling multiple what-if outcomes",
      description: "Build multi-scenario models with trigger-based contingencies",
      action_id: "act_fpa_l3_scenario",
      theme: "intelligence",
      theme_order: 7
    },
    {
      id: "obj_fpa_l4_predict",
      pillar_id: "fpa",
      level: 4,
      name: "Predictive Analytics",
      purpose: "To use algorithms to automate baseline predictions and flag anomalies in real-time",
      description: "Deploy ML-based forecasting and real-time anomaly detection",
      action_id: "act_fpa_l4_predict",
      theme: "intelligence",
      theme_order: 8
    }
  ],

  // =============================================================================
  // QUESTIONS - 44 total (ordered by theme_order)
  //
  // THEME 1 (FOUNDATION): 15 PROCESS questions (8 critical)
  // THEME 2 (FUTURE): 2 PROCESS (critical) + 17 BEHAVIORAL
  // THEME 3 (INTELLIGENCE): 10 BEHAVIORAL
  // =============================================================================
  questions: [
    // ═══════════════════════════════════════════════════════════════════════════
    // THEME 1: THE FOUNDATION - PROCESS QUESTIONS
    // "Do you have a plan? Do you control it? Do you track against it?"
    // ═══════════════════════════════════════════════════════════════════════════

    // BUDGETING (theme_order: 1, Level 1, 4 questions, 2 critical)
    {
      id: "fpa_l1_q01",
      pillar: "fpa",
      objective_id: "obj_fpa_l1_budget",
      level: 1,
      levelLabel: "Emerging",
      weight: 2,
      text: "Does the company produce an approved annual budget before the fiscal year begins?",
      help: "Baseline — Without a budget, 'performance' is just an opinion.",
      is_critical: true
    },
    {
      id: "fpa_l1_q02",
      pillar: "fpa",
      objective_id: "obj_fpa_l1_budget",
      level: 1,
      levelLabel: "Emerging",
      weight: 2,
      text: "Does the budget include a full P&L down to Net Income (not just Revenue/Opex)?",
      help: "Completeness — Revenue-only budgets hide profitability issues.",
      is_critical: true
    },
    {
      id: "fpa_l1_q03",
      pillar: "fpa",
      objective_id: "obj_fpa_l1_budget",
      level: 1,
      levelLabel: "Emerging",
      weight: 1,
      text: "Can every line of budgeted OpEx be mapped to a specific human owner (e.g., department head)?",
      help: "Ownership Mapping — General ledgers hide waste; specific owners reveal it.",
      is_critical: false
    },
    {
      id: "fpa_l1_q04",
      pillar: "fpa",
      objective_id: "obj_fpa_l1_budget",
      level: 1,
      levelLabel: "Emerging",
      weight: 1,
      text: "Do department heads formally sign off on their budget numbers before the year starts?",
      help: "Commitment — Communication ≠ Agreement.",
      is_critical: false
    },

    // FINANCIAL CONTROLS (theme_order: 2, Level 1, 5 questions, 2 critical)
    {
      id: "fpa_l1_q05",
      pillar: "fpa",
      objective_id: "obj_fpa_l1_control",
      level: 1,
      levelLabel: "Emerging",
      weight: 2,
      text: "Is there a single, documented chart of accounts used by all business units?",
      help: "Data Standard — Inconsistent data makes analysis impossible.",
      is_critical: true
    },
    {
      id: "fpa_l1_q06",
      pillar: "fpa",
      objective_id: "obj_fpa_l1_control",
      level: 1,
      levelLabel: "Emerging",
      weight: 1,
      text: "Are spending approvals systematically rejected by Finance when they exceed delegated authority, without escalation to override the controls?",
      help: "Cash Control — Controls only matter if Finance enforces them.",
      is_critical: false
    },
    {
      id: "fpa_l1_q07",
      pillar: "fpa",
      objective_id: "obj_fpa_l1_control",
      level: 1,
      levelLabel: "Emerging",
      weight: 1,
      text: "Are cash reconciliations completed monthly to ensure the reported cash position is real?",
      help: "Cash Reality — Ensuring the P&L matches the bank reality.",
      is_critical: false
    },
    {
      id: "fpa_l1_q08",
      pillar: "fpa",
      objective_id: "obj_fpa_l1_control",
      level: 1,
      levelLabel: "Emerging",
      weight: 1,
      text: "Are system access controls (SoD) enforced to prevent unauthorized changes to the source data that FP&A analyzes?",
      help: "Source Integrity — Linking IT control to FP&A data quality.",
      is_critical: false
    },
    {
      id: "fpa_l1_q09",
      pillar: "fpa",
      objective_id: "obj_fpa_l1_control",
      level: 1,
      levelLabel: "Emerging",
      weight: 2,
      text: "Is there a standard monthly management reporting package distributed to leadership?",
      help: "Reporting Baseline — No pack = flying blind.",
      is_critical: true
    },

    // VARIANCE MANAGEMENT (theme_order: 3, Level 2, 5 questions, 2 critical)
    {
      id: "fpa_l2_q01",
      pillar: "fpa",
      objective_id: "obj_fpa_l2_variance",
      level: 2,
      levelLabel: "Defined",
      weight: 2,
      text: "Is a Budget vs. Actuals (BvA) report generated every month?",
      help: "Feedback Loop — You can't manage what you don't measure.",
      is_critical: true
    },
    {
      id: "fpa_l2_q02",
      pillar: "fpa",
      objective_id: "obj_fpa_l2_variance",
      level: 2,
      levelLabel: "Defined",
      weight: 2,
      text: "Are variances exceeding a defined threshold (e.g., 10%) formally investigated?",
      help: "Consequence — Reports are useless without investigation.",
      is_critical: true
    },
    {
      id: "fpa_l2_q03",
      pillar: "fpa",
      objective_id: "obj_fpa_l2_variance",
      level: 2,
      levelLabel: "Defined",
      weight: 2,
      text: "Do department heads actively review their BvA performance with Finance monthly?",
      help: "Active Ownership — Active ownership vs. passive reporting.",
      is_critical: false
    },
    {
      id: "fpa_l2_q04",
      pillar: "fpa",
      objective_id: "obj_fpa_l2_variance",
      level: 2,
      levelLabel: "Defined",
      weight: 1,
      text: "Can the consolidated financial package be generated in less than 4 hours after books close?",
      help: "Speed to Truth (System) — Manual consolidation is slow and error-prone.",
      is_critical: false
    },
    {
      id: "fpa_l2_q05",
      pillar: "fpa",
      objective_id: "obj_fpa_l2_variance",
      level: 2,
      levelLabel: "Defined",
      weight: 1,
      text: "Does the BvA process include a review of headcount and personnel costs?",
      help: "People Cost — People are 70% of OpEx.",
      is_critical: false
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // THEME 2: THE FUTURE - BEHAVIORAL QUESTIONS
    // "Where are you going? What drives it? Is it connected?"
    // ═══════════════════════════════════════════════════════════════════════════

    // FORECASTING (theme_order: 4, Level 2, 6 questions, 2 critical)
    // Note: q06 and q07 are CRITICAL process questions (preserved)
    //       q08-q11 are BEHAVIORAL questions
    {
      id: "fpa_l2_q06",
      pillar: "fpa",
      objective_id: "obj_fpa_l2_forecast",
      level: 2,
      levelLabel: "Defined",
      weight: 2,
      text: "Is the live forecast stored in a multi-user system (not a single-user spreadsheet)?",
      help: "Collaboration (System) — Single-user spreadsheets kill collaboration.",
      is_critical: true
    },
    {
      id: "fpa_l2_q07",
      pillar: "fpa",
      objective_id: "obj_fpa_l2_forecast",
      level: 2,
      levelLabel: "Defined",
      weight: 2,
      text: "Does the forecast project cash flow and liquidity, not just P&L?",
      help: "Liquidity — Profit ≠ Cash. Blindness here is fatal.",
      is_critical: true
    },
    {
      id: "fpa_l2_q08",
      pillar: "fpa",
      objective_id: "obj_fpa_l2_forecast",
      level: 2,
      levelLabel: "Defined",
      weight: 1,
      text: "When the forecast is wrong, does Finance lead a documented post mortem to improve the process rather than focusing on blame?",
      help: "Culture of Improvement — Blame cultures breed sandbagging (lying).",
      is_critical: false
    },
    {
      id: "fpa_l2_q09",
      pillar: "fpa",
      objective_id: "obj_fpa_l2_forecast",
      level: 2,
      levelLabel: "Defined",
      weight: 1,
      text: "Does Finance have the authority to challenge and adjust operational inputs (e.g. Sales) before they become the official plan?",
      help: "Authority — Is Finance a partner or a data-entry clerk?",
      is_critical: false
    },
    {
      id: "fpa_l2_q10",
      pillar: "fpa",
      objective_id: "obj_fpa_l2_forecast",
      level: 2,
      levelLabel: "Defined",
      weight: 1,
      text: "Can Finance present a true but pessimistic forecast without being labeled 'not a team player'?",
      help: "Truth Telling — The 'Cassandra' problem.",
      is_critical: false
    },
    {
      id: "fpa_l2_q11",
      pillar: "fpa",
      objective_id: "obj_fpa_l2_forecast",
      level: 2,
      levelLabel: "Defined",
      weight: 1,
      text: "Does Finance explicitly track and communicate systematic forecast bias (e.g. persistent optimism or conservatism) to management?",
      help: "Forecast Bias — Optimism and sandbagging destroy planning credibility.",
      is_critical: false
    },
    {
      id: "fpa_l2_q12",
      pillar: "fpa",
      objective_id: "obj_fpa_l2_forecast",
      level: 2,
      levelLabel: "Defined",
      weight: 1,
      text: "Is there a single person clearly accountable for the integrity and delivery of the end-to-end budget process?",
      help: "Accountability — Committees don't deliver quality; owners do.",
      is_critical: false
    },
    {
      id: "fpa_l2_q13",
      pillar: "fpa",
      objective_id: "obj_fpa_l2_forecast",
      level: 2,
      levelLabel: "Defined",
      weight: 1,
      text: "Is there a standard, consistently applied process across all entities governing manual journal entries (e.g. documentation, review, approval)?",
      help: "Manipulation Risk — Ensuring inputs aren't cooked before FP&A sees them.",
      is_critical: false
    },
    {
      id: "fpa_l2_q14",
      pillar: "fpa",
      objective_id: "obj_fpa_l2_forecast",
      level: 2,
      levelLabel: "Defined",
      weight: 1,
      text: "Does the management reporting package include written narrative (what happened, why, what's next), not just data tables?",
      help: "Reporting Quality — Tables without narrative don't drive decisions.",
      is_critical: false
    },

    // DRIVER-BASED PLANNING (theme_order: 5, Level 3, 8 questions, 0 critical)
    // ALL BEHAVIORAL - measuring Finance influence and organizational alignment
    {
      id: "fpa_l3_q01",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_driver",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "When the financial plan shows a project (eg. a Hire) is unaffordable, does leadership accept the constraint rather than demanding the numbers be 'fixed'?",
      help: "Math Matters — Ignoring unit economics leads to ruin.",
      is_critical: false
    },
    {
      id: "fpa_l3_q02",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_driver",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Do business unit leaders explain how their operational decisions (pricing, headcount, etc.) impact P&L?",
      help: "Financial Literacy — Ops needs to understand their own drivers.",
      is_critical: false
    },
    {
      id: "fpa_l3_q03",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_driver",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Has Finance ever killed or delayed a project because unit economics didn't work, and leadership accepted the decision?",
      help: "Influence — The ultimate test: stopping bad decisions.",
      is_critical: false
    },
    {
      id: "fpa_l3_q04",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_driver",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Does Finance actively produce a regular report identifying unprofitable business segments?",
      help: "Value Creation — Identifying where value is destroyed.",
      is_critical: false
    },
    {
      id: "fpa_l3_q05",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_driver",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Do executives regularly ask Finance 'what should we do?' rather than just 'make the numbers work'?",
      help: "Partnership — Advisor vs. Scorekeeper.",
      is_critical: false
    },
    {
      id: "fpa_l3_q11",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_driver",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Does Finance actively track and challenge the financial performance of the key value-creation initiatives (projects, products, or growth bets) underpinning the annual plan and strategic roadmap?",
      help: "Value Creation Focus — FP&A maturity is about steering value, not just explaining variance.",
      is_critical: false
    },
    {
      id: "fpa_l3_q12",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_driver",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Has Finance deliberately stopped, simplified, or automated recurring reports to free up capacity for analysis and decision support?",
      help: "Capacity for Insight — Insight requires stopping low-value work.",
      is_critical: false
    },
    {
      id: "fpa_l3_q13",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_driver",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Can Finance explain the financial outlook primarily using operational drivers (units, capacity, customers) rather than accounting terminology?",
      help: "Business Language — Finance maturity shows when numbers translate into operations.",
      is_critical: false
    },
    {
      id: "fpa_l3_q14",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_scenario",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Are the key KPIs and their definitions consistent across all executive reports?",
      help: "KPI Consistency — Same KPI, different number destroys trust.",
      is_critical: false
    },
    {
      id: "fpa_l3_q15",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_scenario",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Can executives answer routine performance questions from existing reports/dashboards without requesting ad-hoc analysis from FP&A?",
      help: "Self-Serve Maturity — Ad-hoc requests signal immaturity.",
      is_critical: false
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // THEME 3: THE INTELLIGENCE - BEHAVIORAL QUESTIONS
    // "What could happen? What will the machine tell us?"
    // ═══════════════════════════════════════════════════════════════════════════

    // SCENARIO PLANNING (theme_order: 7, Level 3, 5 questions, 0 critical)
    // ALL BEHAVIORAL - measuring leadership engagement with uncertainty
    {
      id: "fpa_l3_q06",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_scenario",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "When Finance presents a downside scenario, does leadership engage with it seriously or dismiss it as 'too negative'?",
      help: "Resilience — Engaging with the 'Bear Case'.",
      is_critical: false
    },
    {
      id: "fpa_l3_q07",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_scenario",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Does the monthly review explicitly track and quantify a Risks and Opportunities (R&O) list distinct from the base budget?",
      help: "R&O Discipline — Forecasts are ranges, not points.",
      is_critical: false
    },
    {
      id: "fpa_l3_q08",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_scenario",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Can executives clearly explain the 2-3 key drivers that determine financial success, without prompting from Finance?",
      help: "Driver Clarity — Focusing on causes, not just effects.",
      is_critical: false
    },
    {
      id: "fpa_l3_q09",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_scenario",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "In the last 12 months, has a budget been formally reallocated mid-year based on changing business reality?",
      help: "Agility — Moving money when reality changes.",
      is_critical: false
    },
    {
      id: "fpa_l3_q10",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_scenario",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Does Finance stress-test models to highlight exactly what happens to cash/profit if specific variables (e.g., volume, price) drop?",
      help: "Stress Testing — Understanding breaking points.",
      is_critical: false
    },

    // INTEGRATED PLANNING (theme_order: 6, Level 4, 5 questions, 0 critical)
    // ALL BEHAVIORAL - measuring trust, alignment, and single source of truth
    {
      id: "fpa_l4_q01",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_integrate",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "Is there a formal 'lock-in' meeting where Sales and Finance must agree on a single number before the forecast is finalized?",
      help: "Alignment — One number, one plan.",
      is_critical: false
    },
    {
      id: "fpa_l4_q02",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_integrate",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "Do functional leaders (Sales, HR, Ops) use Finance's reports as their primary data source (rather than maintaining parallel spreadsheets)?",
      help: "Shadow IT — If Ops uses Excel, the ERP is a graveyard.",
      is_critical: false
    },
    {
      id: "fpa_l4_q03",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_integrate",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "In executive meetings, do all leaders reference the same financial figures?",
      help: "One Truth — The CEO test.",
      is_critical: false
    },
    {
      id: "fpa_l4_q04",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_integrate",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "When the CFO presents to the board, are the numbers aligned with what other executives cite?",
      help: "Board Trust — Misalignment shows up in the boardroom.",
      is_critical: false
    },
    {
      id: "fpa_l4_q05",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_integrate",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "Does the 3-year strategic plan actually impact annual budget decisions?",
      help: "Strategic Linkage — Strategy must constrain the budget.",
      is_critical: false
    },

    // PREDICTIVE ANALYTICS (theme_order: 8, Level 4, 5 questions, 0 critical)
    // ALL BEHAVIORAL - measuring analytical curiosity and operational discipline
    {
      id: "fpa_l4_q06",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_predict",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "Does Finance use any automated algorithmic forecasting (e.g., machine learning) to validate human inputs?",
      help: "Algorithmic Maturity — Beyond simple arithmetic.",
      is_critical: false
    },
    {
      id: "fpa_l4_q07",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_predict",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "Can Finance instantly drill down from the P&L to transaction-level detail (customer/SKU) without running a new offline manual report?",
      help: "Dimensionality (System) — Speed to insight requires drill-down, not new extracts.",
      is_critical: false
    },
    {
      id: "fpa_l4_q08",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_predict",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "Does Finance communicate a profitability ranking of business streams/customers to make it clear where money is actually made?",
      help: "Strategic Courage — Ranking value creators vs. destroyers.",
      is_critical: false
    },
    {
      id: "fpa_l4_q09",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_predict",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "Does Finance proactively monitor and communicate external signals (market trends, competitor moves) that impact the forecast?",
      help: "External Awareness — Looking outside the building.",
      is_critical: false
    },
    {
      id: "fpa_l4_q10",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_predict",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "Is the 'Financial Truth' stored in a robust system with version control, audit trails, and backup (vs. offline spreadsheets that are prone to breaking)?",
      help: "Data Stability (System) — Excel is fragile; Systems are robust.",
      is_critical: false
    }
  ],

  // =============================================================================
  // MATURITY GATES (Sequential, 80% threshold)
  // Note: Gates evaluate by LEVEL, not by Theme
  // =============================================================================
  maturityGates: [
    {
      level: 0,
      label: "Ad-hoc",
      description: "No formal financial planning processes",
      required_evidence_ids: []
    },
    {
      level: 1,
      label: "Emerging",
      description: "Basic financial processes and controls are in place",
      required_evidence_ids: [
        "fpa_l1_q01", "fpa_l1_q02", "fpa_l1_q03", "fpa_l1_q04", "fpa_l1_q05",
        "fpa_l1_q06", "fpa_l1_q07", "fpa_l1_q08", "fpa_l1_q09"
      ],
      threshold: 0.8
    },
    {
      level: 2,
      label: "Defined",
      description: "Structured variance analysis and forecasting processes exist",
      required_evidence_ids: [
        "fpa_l2_q01", "fpa_l2_q02", "fpa_l2_q03", "fpa_l2_q04", "fpa_l2_q05",
        "fpa_l2_q06", "fpa_l2_q07", "fpa_l2_q08", "fpa_l2_q09", "fpa_l2_q10",
        "fpa_l2_q11", "fpa_l2_q12", "fpa_l2_q13", "fpa_l2_q14"
      ],
      threshold: 0.8
    },
    {
      level: 3,
      label: "Managed",
      description: "Finance is a strategic partner with organizational influence",
      required_evidence_ids: [
        "fpa_l3_q01", "fpa_l3_q02", "fpa_l3_q03", "fpa_l3_q04", "fpa_l3_q05",
        "fpa_l3_q06", "fpa_l3_q07", "fpa_l3_q08", "fpa_l3_q09", "fpa_l3_q10",
        "fpa_l3_q11", "fpa_l3_q12", "fpa_l3_q13", "fpa_l3_q14", "fpa_l3_q15"
      ],
      threshold: 0.8
    },
    {
      level: 4,
      label: "Optimized",
      description: "Fully integrated planning with analytical sophistication and organizational trust",
      required_evidence_ids: [
        "fpa_l4_q01", "fpa_l4_q02", "fpa_l4_q03", "fpa_l4_q04", "fpa_l4_q05",
        "fpa_l4_q06", "fpa_l4_q07", "fpa_l4_q08", "fpa_l4_q09", "fpa_l4_q10"
      ],
      threshold: 0.8
    }
  ],

  // =============================================================================
  // ACTIONS (8 total - 1 per objective)
  // Updated with behavioral-aligned descriptions
  // =============================================================================
  actions: [
    // Foundation Actions
    {
      id: "act_fpa_l1_budget",
      title: "Establish Formal Budget Process",
      description: "Create an annual budget with clear ownership, full P&L coverage, departmental granularity, and formal communication to stakeholders.",
      rationale: "Without a formal budget, there is no baseline for financial control or performance measurement.",
      priority: "critical"
    },
    {
      id: "act_fpa_l1_control",
      title: "Implement Financial Control Framework",
      description: "Establish a consistent chart of accounts, journal entry review process, delegation of authority matrix, timely bank reconciliations, and role-based system access.",
      rationale: "Basic controls prevent fraud, errors, and ensure audit readiness.",
      priority: "critical"
    },
    {
      id: "act_fpa_l2_variance",
      title: "Deploy Variance Analysis Discipline",
      description: "Generate monthly BvA reports, investigate material variances, conduct monthly reviews with department heads, and document explanations in management reporting.",
      rationale: "Variance analysis creates accountability and enables course correction.",
      priority: "high"
    },
    // Future Actions (updated for behavioral focus)
    {
      id: "act_fpa_l2_forecast",
      title: "Build Forecast Credibility",
      description: "Update forecasts quarterly with cash flow projections, conduct blameless post-mortems on misses, and establish Finance as the authoritative voice on forward-looking numbers.",
      rationale: "A forecast no one trusts is worse than no forecast. Credibility is the currency of FP&A.",
      priority: "high"
    },
    {
      id: "act_fpa_l3_driver",
      title: "Establish Finance as Strategic Partner",
      description: "Link models to operational drivers, ensure leadership accepts model outputs, and give Finance standing to kill bad projects based on economics.",
      rationale: "Driver-based models are useless if Finance cannot influence decisions. The goal is strategic partnership, not scorekeeping.",
      priority: "medium"
    },
    {
      id: "act_fpa_l4_integrate",
      title: "Create Single Source of Truth",
      description: "Resolve forecast conflicts with defined processes, build trust so functional leaders abandon shadow spreadsheets, and ensure the CEO never gets surprised by conflicting numbers.",
      rationale: "Integration is about trust and alignment, not just technology. One truth, one source.",
      priority: "medium"
    },
    // Intelligence Actions (updated for behavioral focus)
    {
      id: "act_fpa_l3_scenario",
      title: "Build Organizational Resilience",
      description: "Present downside scenarios leadership will engage with, activate contingency plans when triggers hit, and ensure executives understand the assumptions that could break the business.",
      rationale: "Scenario planning is useless if leadership only wants to see the good case. Resilience requires confronting uncomfortable possibilities.",
      priority: "medium"
    },
    {
      id: "act_fpa_l4_predict",
      title: "Evolve Analytical Capabilities",
      description: "Implement basic algorithmic forecasting, investigate anomalies within 48 hours, monitor external signals, and continuously experiment with new methods.",
      rationale: "Predictive analytics starts with curiosity and discipline, not PhD-level ML. The bar is continuous improvement.",
      priority: "medium"
    }
  ]
};

// Extended spec with themes for v2.7.0 API responses
export const specV270WithThemes = {
  ...SPEC,
  themes: THEMES
};

export default SPEC;
