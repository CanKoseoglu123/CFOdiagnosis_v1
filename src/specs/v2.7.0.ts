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
 * Content: FP&A Pillar (40 questions, 8 objectives, 8 actions, 3 themes)
 * Question Types:
 * - Theme 1 (Foundation): 15 PROCESS questions (8 critical)
 * - Theme 2 (Future): 2 PROCESS (critical) + 13 BEHAVIORAL
 * - Theme 3 (Intelligence): 10 BEHAVIORAL
 * - TOTAL: 17 Process + 23 Behavioral = 40 questions
 * - CRITICAL: 10 questions (all in Foundation + Forecasting)
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
  // QUESTIONS - 40 total (ordered by theme_order)
  //
  // THEME 1 (FOUNDATION): 15 PROCESS questions (8 critical)
  // THEME 2 (FUTURE): 2 PROCESS (critical) + 13 BEHAVIORAL
  // THEME 3 (INTELLIGENCE): 10 BEHAVIORAL
  // =============================================================================
  questions: [
    // ═══════════════════════════════════════════════════════════════════════════
    // THEME 1: THE FOUNDATION - PROCESS QUESTIONS
    // "Do you have a plan? Do you control it? Do you track against it?"
    // ═══════════════════════════════════════════════════════════════════════════

    // BUDGETING (theme_order: 1, Level 1, 5 questions, 3 critical)
    {
      id: "fpa_l1_q01",
      pillar: "fpa",
      objective_id: "obj_fpa_l1_budget",
      level: 1,
      levelLabel: "Emerging",
      weight: 2,
      text: "Does the company produce an approved annual budget before the fiscal year begins?",
      help: "An approved annual budget should be formally signed off by leadership before the fiscal year starts. This provides a clear financial baseline for the organization.",
      is_critical: true
    },
    {
      id: "fpa_l1_q02",
      pillar: "fpa",
      objective_id: "obj_fpa_l1_budget",
      level: 1,
      levelLabel: "Emerging",
      weight: 2,
      text: "Is there a single, clearly assigned owner responsible for the budget process?",
      help: "A designated budget owner (typically FP&A Director or CFO) should have explicit accountability for the end-to-end budget process, timeline, and quality.",
      is_critical: true
    },
    {
      id: "fpa_l1_q03",
      pillar: "fpa",
      objective_id: "obj_fpa_l1_budget",
      level: 1,
      levelLabel: "Emerging",
      weight: 2,
      text: "Does the budget include a full P&L down to Net Income (not just Revenue/Opex)?",
      help: "A complete budget should cover all P&L lines: Revenue, COGS, Gross Margin, Operating Expenses, EBITDA, Interest, Taxes, and Net Income.",
      is_critical: true
    },
    {
      id: "fpa_l1_q04",
      pillar: "fpa",
      objective_id: "obj_fpa_l1_budget",
      level: 1,
      levelLabel: "Emerging",
      weight: 1,
      text: "Is the budget granular enough to track expenses by department or cost center?",
      help: "Budget granularity at the department/cost center level enables accountability and meaningful variance analysis.",
      is_critical: false
    },
    {
      id: "fpa_l1_q05",
      pillar: "fpa",
      objective_id: "obj_fpa_l1_budget",
      level: 1,
      levelLabel: "Emerging",
      weight: 1,
      text: "Are budget targets formally communicated to department heads in writing?",
      help: "Department heads should receive written documentation of their budget targets, including revenue goals, expense limits, and headcount allocations.",
      is_critical: false
    },

    // FINANCIAL CONTROLS (theme_order: 2, Level 1, 5 questions, 3 critical)
    {
      id: "fpa_l1_q06",
      pillar: "fpa",
      objective_id: "obj_fpa_l1_control",
      level: 1,
      levelLabel: "Emerging",
      weight: 2,
      text: "Is there a formal chart of accounts that is consistent across the organization?",
      help: "A standardized chart of accounts ensures consistent financial reporting and enables meaningful comparisons across departments and time periods.",
      is_critical: true
    },
    {
      id: "fpa_l1_q07",
      pillar: "fpa",
      objective_id: "obj_fpa_l1_control",
      level: 1,
      levelLabel: "Emerging",
      weight: 2,
      text: "Are non-standard journal entries reviewed and approved by a second person?",
      help: "Manual or adjusting journal entries should require review and approval by someone other than the preparer to prevent errors and fraud.",
      is_critical: true
    },
    {
      id: "fpa_l1_q08",
      pillar: "fpa",
      objective_id: "obj_fpa_l1_control",
      level: 1,
      levelLabel: "Emerging",
      weight: 2,
      text: "Is there a documented delegation of authority (DOA) matrix for spending approvals?",
      help: "A DOA matrix defines who can approve expenditures at different dollar thresholds, ensuring appropriate oversight for financial commitments.",
      is_critical: false
    },
    {
      id: "fpa_l1_q09",
      pillar: "fpa",
      objective_id: "obj_fpa_l1_control",
      level: 1,
      levelLabel: "Emerging",
      weight: 1,
      text: "Are bank reconciliations performed and reviewed within 10 days of month-end?",
      help: "Timely bank reconciliations ensure cash balances are accurate and help identify discrepancies, fraud, or errors quickly.",
      is_critical: false
    },
    {
      id: "fpa_l1_q10",
      pillar: "fpa",
      objective_id: "obj_fpa_l1_control",
      level: 1,
      levelLabel: "Emerging",
      weight: 2,
      text: "Is access to the accounting system restricted based on roles (segregation of duties)?",
      help: "Role-based access controls ensure that no single person can both initiate and approve transactions, reducing fraud risk.",
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
      help: "Monthly BvA reports compare actual financial results against budget, providing visibility into performance and enabling timely intervention.",
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
      help: "Material variances should trigger a formal investigation process to understand root causes and determine if corrective action is needed.",
      is_critical: true
    },
    {
      id: "fpa_l2_q03",
      pillar: "fpa",
      objective_id: "obj_fpa_l2_variance",
      level: 2,
      levelLabel: "Defined",
      weight: 2,
      text: "Do department heads meet with Finance monthly to review their BvA performance?",
      help: "Regular BvA review meetings create accountability and ensure department heads understand and own their financial performance.",
      is_critical: false
    },
    {
      id: "fpa_l2_q04",
      pillar: "fpa",
      objective_id: "obj_fpa_l2_variance",
      level: 2,
      levelLabel: "Defined",
      weight: 1,
      text: "Are variance explanations documented in the monthly management reporting package?",
      help: "Written variance explanations in management reports create an audit trail and help leadership understand financial performance.",
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
      help: "Personnel costs typically represent 50-70% of operating expenses. Tracking headcount vs. plan is essential for cost management.",
      is_critical: false
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // THEME 2: THE FUTURE - BEHAVIORAL QUESTIONS
    // "Where are you going? What drives it? Is it connected?"
    // ═══════════════════════════════════════════════════════════════════════════

    // FORECASTING (theme_order: 4, Level 2, 5 questions, 2 critical)
    // Note: q06 and q07 are CRITICAL process questions (preserved)
    //       q08-q10 are BEHAVIORAL questions (rewritten)
    {
      id: "fpa_l2_q06",
      pillar: "fpa",
      objective_id: "obj_fpa_l2_forecast",
      level: 2,
      levelLabel: "Defined",
      weight: 2,
      text: "Is a financial forecast updated at least quarterly (re-forecast)?",
      help: "Regular forecast updates incorporate new information and provide a more accurate view of expected year-end results than a static annual budget.",
      is_critical: true  // PRESERVED: Core forecasting capability
    },
    {
      id: "fpa_l2_q07",
      pillar: "fpa",
      objective_id: "obj_fpa_l2_forecast",
      level: 2,
      levelLabel: "Defined",
      weight: 2,
      text: "Does the forecast project cash flow and liquidity, not just P&L?",
      help: "Cash flow forecasting is essential for managing working capital, timing of expenditures, and ensuring the company can meet its obligations.",
      is_critical: true  // PRESERVED: Liquidity is always critical
    },
    {
      id: "fpa_l2_q08",
      pillar: "fpa",
      objective_id: "obj_fpa_l2_forecast",
      level: 2,
      levelLabel: "Defined",
      weight: 1,
      text: "When the forecast is wrong, does Finance lead a blameless post-mortem to improve future accuracy?",
      help: "Learning organizations treat forecast errors as data, not failures. If misses trigger blame rather than analysis, forecasters learn to sandbag, not improve.",
      is_critical: false  // BEHAVIORAL
    },
    {
      id: "fpa_l2_q09",
      pillar: "fpa",
      objective_id: "obj_fpa_l2_forecast",
      level: 2,
      levelLabel: "Defined",
      weight: 1,
      text: "Does FP&A's forecast carry more weight than Sales' gut feeling in executive decisions?",
      help: "In mature organizations, Finance's forecast is the authoritative number. If Sales or Ops can override it based on 'feeling,' the forecast is theater.",
      is_critical: false  // BEHAVIORAL
    },
    {
      id: "fpa_l2_q10",
      pillar: "fpa",
      objective_id: "obj_fpa_l2_forecast",
      level: 2,
      levelLabel: "Defined",
      weight: 1,
      text: "Can Finance present a pessimistic forecast without being labeled 'not a team player'?",
      help: "Healthy cultures allow Finance to deliver bad news. If pessimistic scenarios are politically dangerous, forecasts become optimistic fiction.",
      is_critical: false  // BEHAVIORAL
    },

    // DRIVER-BASED PLANNING (theme_order: 5, Level 3, 5 questions, 0 critical)
    // ALL BEHAVIORAL - measuring Finance influence and organizational alignment
    {
      id: "fpa_l3_q01",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_driver",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "When Finance says 'the model shows we can't afford this hire,' does leadership accept it or demand the model be 'fixed'?",
      help: "Models are only useful if leadership trusts their output. If 'fixing the model' means overriding inconvenient math, the model is decoration.",
      is_critical: false  // BEHAVIORAL
    },
    {
      id: "fpa_l3_q02",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_driver",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Do business unit leaders understand how their operational decisions (pricing, headcount, churn) flow through to P&L?",
      help: "Driver-based planning fails if operators don't understand the financial consequences of their decisions. Finance must educate, not just report.",
      is_critical: false  // BEHAVIORAL
    },
    {
      id: "fpa_l3_q03",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_driver",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Has Finance ever killed or delayed a project because unit economics didn't work, and leadership accepted the decision?",
      help: "The true test of FP&A influence is whether they can stop a bad decision, not just document it.",
      is_critical: false  // BEHAVIORAL
    },
    {
      id: "fpa_l3_q04",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_driver",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "When a customer segment is unprofitable, does Finance have standing to recommend exiting it?",
      help: "Strategic Finance means having a voice in portfolio decisions. If Finance only reports on customers but can't influence strategy, they're scorekeepers.",
      is_critical: false  // BEHAVIORAL
    },
    {
      id: "fpa_l3_q05",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_driver",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Do executives ask Finance 'what should we do?' rather than just 'make the numbers work'?",
      help: "'Make the numbers work' is a symptom of leadership treating Finance as a service function. 'What should we do?' signals Finance as a strategic partner.",
      is_critical: false  // BEHAVIORAL
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
      text: "When Finance and Sales forecasts differ, is there a defined process to resolve the gap (not just average them)?",
      help: "Averaging conflicting forecasts is lazy consensus. Mature organizations have escalation paths to resolve disagreements with data, not politics.",
      is_critical: false  // BEHAVIORAL
    },
    {
      id: "fpa_l4_q02",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_integrate",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "Do functional leaders (Sales, HR, Ops) trust Finance's data more than their own spreadsheets?",
      help: "If Sales keeps their 'real' forecast in a personal spreadsheet, integration is cosmetic. Trust is the true measure of integration.",
      is_critical: false  // BEHAVIORAL
    },
    {
      id: "fpa_l4_q03",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_integrate",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "Is there a single version of the truth that the CEO uses, or do different executives quote different numbers?",
      help: "Executive misalignment on basic numbers is a symptom of planning fragmentation. One truth, one source.",
      is_critical: false  // BEHAVIORAL
    },
    {
      id: "fpa_l4_q04",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_integrate",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "When the CFO presents to the board, do they ever get surprised by numbers another executive cites?",
      help: "Board meeting surprises indicate either data silos or political sandbagging. Neither is healthy.",
      is_critical: false  // BEHAVIORAL
    },
    {
      id: "fpa_l4_q05",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_integrate",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "Does the 3-year strategic plan actually constrain annual budget decisions, or is it an ignored PowerPoint?",
      help: "Strategy without budget linkage is aspiration. Budget without strategy linkage is incrementalism. They must connect.",
      is_critical: false  // BEHAVIORAL
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
      help: "Scenario planning is useless if leadership only wants to see the good case. Mature organizations demand to see the Bear case.",
      is_critical: false  // BEHAVIORAL
    },
    {
      id: "fpa_l3_q07",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_scenario",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Has the company ever actually activated a contingency plan based on hitting a predefined trigger?",
      help: "Contingency plans that have never been activated are untested theories. Real preparedness means real activation when triggers hit.",
      is_critical: false  // BEHAVIORAL
    },
    {
      id: "fpa_l3_q08",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_scenario",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Do executives know which 2-3 assumptions would break the business if wrong, without Finance having to remind them?",
      help: "If only Finance knows the critical assumptions, the organization is flying blind. Executive fluency in key sensitivities is a maturity marker.",
      is_critical: false  // BEHAVIORAL
    },
    {
      id: "fpa_l3_q09",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_scenario",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "In the last 12 months, has a budget been reallocated mid-year based on scenario analysis (not just executive whim)?",
      help: "Dynamic allocation means actually moving money based on data, not just talking about flexibility.",
      is_critical: false  // BEHAVIORAL
    },
    {
      id: "fpa_l3_q10",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_scenario",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Has Finance modeled 'what happens if our top customer leaves' or 'what happens if the market drops 30%'?",
      help: "Existential scenarios should be modeled before they happen. If you haven't stress-tested catastrophic events, you're hoping, not planning.",
      is_critical: false  // BEHAVIORAL
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
      text: "Does Finance use any automated/algorithmic forecasting, even simple regression or time-series models?",
      help: "Predictive doesn't require PhD-level ML. Even basic statistical forecasting beats pure gut feeling. The bar is 'better than spreadsheet extrapolation.'",
      is_critical: false  // BEHAVIORAL
    },
    {
      id: "fpa_l4_q07",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_predict",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "When an anomaly is detected (unusual spend, revenue spike), does Finance investigate within 48 hours?",
      help: "Anomaly detection is worthless without fast follow-up. The 48-hour rule separates monitoring from actual control.",
      is_critical: false  // BEHAVIORAL
    },
    {
      id: "fpa_l4_q08",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_predict",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "Can Finance answer 'which customers should we fire?' with data, not just opinion?",
      help: "'Fire your worst customers' is controversial but mathematically valid. Finance should be able to model customer profitability at the account level.",
      is_critical: false  // BEHAVIORAL
    },
    {
      id: "fpa_l4_q09",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_predict",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "Does Finance proactively monitor external signals (market trends, competitor moves) that could impact the forecast?",
      help: "Internal-only forecasting ignores half the picture. External signal monitoring (even manual) shows planning sophistication.",
      is_critical: false  // BEHAVIORAL
    },
    {
      id: "fpa_l4_q10",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_predict",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "Is Finance actively experimenting with new analytical methods, or using the same model as 3 years ago?",
      help: "Continuous improvement means experimenting with methods. If your model hasn't evolved, your thinking hasn't either.",
      is_critical: false  // BEHAVIORAL
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
        "fpa_l1_q06", "fpa_l1_q07", "fpa_l1_q08", "fpa_l1_q09", "fpa_l1_q10"
      ],
      threshold: 0.8
    },
    {
      level: 2,
      label: "Defined",
      description: "Structured variance analysis and forecasting processes exist",
      required_evidence_ids: [
        "fpa_l2_q01", "fpa_l2_q02", "fpa_l2_q03", "fpa_l2_q04", "fpa_l2_q05",
        "fpa_l2_q06", "fpa_l2_q07", "fpa_l2_q08", "fpa_l2_q09", "fpa_l2_q10"
      ],
      threshold: 0.8
    },
    {
      level: 3,
      label: "Managed",
      description: "Finance is a strategic partner with organizational influence",
      required_evidence_ids: [
        "fpa_l3_q01", "fpa_l3_q02", "fpa_l3_q03", "fpa_l3_q04", "fpa_l3_q05",
        "fpa_l3_q06", "fpa_l3_q07", "fpa_l3_q08", "fpa_l3_q09", "fpa_l3_q10"
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
