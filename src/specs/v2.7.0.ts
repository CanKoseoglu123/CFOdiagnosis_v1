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

import { Spec, THEMES, Initiative } from "./types";

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
      is_critical: true,
      initiative_id: "init_budget_discipline",
      impact: 5,
      complexity: 3,
      expert_action: {
        title: "Implement Annual Budget Cycle",
        recommendation: "Establish a formal budget calendar working backwards from fiscal year start. Begin 3-4 months prior. Assign clear ownership for timeline management.",
        type: "structural"
      }
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
      is_critical: true,
      initiative_id: "init_budget_discipline",
      impact: 5,
      complexity: 2,
      expert_action: {
        title: "Extend Budget to Full P&L",
        recommendation: "Add interest expense, tax provision, and below-the-line items to your budget template. Even rough estimates are better than ignoring these lines.",
        type: "quick_win"
      }
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
      is_critical: false,
      initiative_id: "init_budget_discipline",
      impact: 4,
      complexity: 1,
      expert_action: {
        title: "Assign Budget Ownership",
        recommendation: "Create a simple RACI matrix mapping every cost center to a named owner. Publish it. Make budget reviews part of their job description.",
        type: "governance"
      }
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
      is_critical: false,
      initiative_id: "init_budget_discipline",
      impact: 3,
      complexity: 1,
      expert_action: {
        title: "Implement Budget Sign-Off",
        recommendation: "Add a formal sign-off step before budget consolidation. Can be as simple as email confirmation, but documented.",
        type: "quick_win"
      }
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
      is_critical: true,
      initiative_id: "init_financial_controls",
      impact: 5,
      complexity: 4,
      expert_action: {
        title: "Standardize Chart of Accounts",
        recommendation: "Document your canonical CoA. Identify and map local variations. Create governance for new account requests. This is painful but foundational—inconsistent coding makes consolidation and analysis unreliable.",
        type: "structural"
      }
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
      is_critical: false,
      initiative_id: "init_financial_controls",
      impact: 4,
      complexity: 2,
      expert_action: {
        title: "Implement Reconciliation Process",
        recommendation: "Create a monthly reconciliation checklist covering all sub-ledgers (AR, AP, Inventory, Fixed Assets). Document variances and resolution. This catches errors before they compound.",
        type: "structural"
      }
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
      is_critical: false,
      initiative_id: "init_financial_controls",
      impact: 3,
      complexity: 2,
      expert_action: {
        title: "Create Close Checklist",
        recommendation: "Document every step of your close process with owners and deadlines. Start with what you do today, then optimize. A checklist enables delegation, vacation coverage, and continuous improvement.",
        type: "quick_win"
      }
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
      is_critical: false,
      initiative_id: "init_financial_controls",
      impact: 4,
      complexity: 2,
      expert_action: {
        title: "Implement Journal Entry Controls",
        recommendation: "Require documentation and approval for all manual entries above a threshold. Segregate entry from approval. Review recurring entries for automation opportunities. This is audit 101.",
        type: "governance"
      }
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
      is_critical: true,
      initiative_id: "init_feedback_loops",
      impact: 5,
      complexity: 3,
      expert_action: {
        title: "Create Standard Reporting Package",
        recommendation: "Design a consistent monthly pack covering P&L, key metrics, and commentary. Same format every month. Distribute within 10 business days of close. Consistency builds trust; timeliness enables action.",
        type: "structural"
      }
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
      is_critical: true,
      initiative_id: "init_feedback_loops",
      impact: 5,
      complexity: 2,
      expert_action: {
        title: "Implement Monthly BvA Reporting",
        recommendation: "Create a BvA report as part of your standard close. Show budget, actual, variance, and variance %. Distribute to all budget owners. This is the foundation of financial accountability.",
        type: "structural"
      }
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
      is_critical: true,
      initiative_id: "init_feedback_loops",
      impact: 5,
      complexity: 2,
      expert_action: {
        title: "Establish Variance Investigation Protocol",
        recommendation: "Define materiality thresholds (e.g., >10% and >$10K). Require documented explanations for breaches. Review in monthly finance meeting. Variances without follow-up teach people that budgets don't matter.",
        type: "governance"
      }
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
      is_critical: false,
      initiative_id: "init_feedback_loops",
      impact: 3,
      complexity: 2,
      expert_action: {
        title: "Add Variance Commentary",
        recommendation: "Require budget owners to explain variances in writing. Template: What happened? Is it timing or permanent? What action are you taking? Commentary transforms data into accountability.",
        type: "behavioral"
      }
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
      is_critical: false,
      initiative_id: "init_feedback_loops",
      impact: 2,
      complexity: 1,
      expert_action: {
        title: "Define Materiality Thresholds",
        recommendation: "Document escalation thresholds (e.g., >$50K auto-escalates to CFO). Publish and enforce. This focuses attention on what matters and reduces noise.",
        type: "governance"
      }
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
      is_critical: false,
      initiative_id: "init_feedback_loops",
      impact: 3,
      complexity: 1,
      expert_action: {
        title: "Distribute BvA to Budget Owners",
        recommendation: "Send each budget owner their specific BvA report monthly. Don't wait for them to ask. Proactive distribution signals that Finance is a partner, not a gatekeeper.",
        type: "quick_win"
      }
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
      is_critical: true,
      initiative_id: "init_forecast_infrastructure",
      impact: 5,
      complexity: 4,
      expert_action: {
        title: "Migrate to Collaborative Planning",
        recommendation: "Move forecast from desktop Excel to cloud-based solution. Options range from Google Sheets (free) to Adaptive/Pigment (enterprise). Key: multiple users can edit simultaneously without version chaos.",
        type: "structural"
      }
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
      is_critical: true,
      initiative_id: "init_forecast_infrastructure",
      impact: 5,
      complexity: 2,
      expert_action: {
        title: "Add Cash Flow to Forecast",
        recommendation: "Build a 13-week cash flow model alongside your P&L forecast. Start with direct method: receipts and payments. Connect to your P&L drivers. Cash visibility prevents nasty surprises.",
        type: "structural"
      }
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
      is_critical: false,
      initiative_id: "init_forecast_infrastructure",
      impact: 4,
      complexity: 2,
      expert_action: {
        title: "Implement Monthly Forecast Refresh",
        recommendation: "Update forecast within first week after close. Don't re-forecast everything—focus on material changes. A lightweight monthly process beats a heavy quarterly one.",
        type: "behavioral"
      }
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
      is_critical: false,
      initiative_id: "init_forecast_infrastructure",
      impact: 4,
      complexity: 2,
      expert_action: {
        title: "Create R&O Register",
        recommendation: "Maintain a list of upside opportunities and downside risks not in the baseline forecast. Quantify probability and impact. Review monthly. This makes uncertainty visible and manageable.",
        type: "structural"
      }
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
      is_critical: false,
      initiative_id: "init_forecast_infrastructure",
      impact: 4,
      complexity: 3,
      expert_action: {
        title: "Build Scenario Capability",
        recommendation: "Create a base forecast model with driver assumptions that can flex. Define standard scenarios (recession, growth, base). Being able to show 'what if' builds credibility with the board.",
        type: "structural"
      }
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
      is_critical: false,
      initiative_id: "init_operational_excellence",
      impact: 3,
      complexity: 2,
      expert_action: {
        title: "Track Forecast Accuracy",
        recommendation: "Measure forecast vs. actual each month. Track bias (consistently high or low?) and absolute error. Share with leadership. Transparency about accuracy paradoxically builds credibility.",
        type: "behavioral"
      }
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
      is_critical: false,
      initiative_id: "init_budget_discipline",
      impact: 3,
      complexity: 1,
      expert_action: {
        title: "Assign Budget Process Owner",
        recommendation: "Name one person accountable for budget timeline, templates, and consolidation. Doesn't need to be senior—needs to be organized and empowered. Process ownership prevents annual chaos.",
        type: "governance"
      }
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
      is_critical: false,
      initiative_id: "init_financial_controls",
      impact: 4,
      complexity: 2,
      expert_action: {
        title: "Implement Journal Entry Review",
        recommendation: "Define threshold for mandatory review (e.g., >$10K). Implement maker-checker workflow. Document reviewer approval. This is basic internal control that auditors expect.",
        type: "governance"
      }
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
      is_critical: false,
      initiative_id: "init_feedback_loops",
      impact: 3,
      complexity: 2,
      expert_action: {
        title: "Add Forward-Looking Commentary",
        recommendation: "Include a 'Looking Ahead' section in your monthly pack. Cover: next month expectations, risks emerging, actions planned. Shift the conversation from 'what happened' to 'what we're doing about it.'",
        type: "behavioral"
      }
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
      is_critical: false,
      initiative_id: "init_seat_at_table",
      impact: 5,
      complexity: 3,
      expert_action: {
        title: "Build Constraint Credibility",
        recommendation: "Start with constraints that are clearly justified (cash runway, covenant limits). Document leadership agreement. When constraints are respected once, it creates precedent. Credibility is earned incrementally.",
        type: "behavioral"
      }
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
      is_critical: false,
      initiative_id: "init_seat_at_table",
      impact: 5,
      complexity: 3,
      expert_action: {
        title: "Insert Finance into Approval Workflow",
        recommendation: "Establish policy: spending above threshold requires Finance review before commitment. Frame it as 'helping you build the business case' not 'blocking you.' Position shifts from gatekeeper to partner.",
        type: "governance"
      }
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
      is_critical: false,
      initiative_id: "init_seat_at_table",
      impact: 4,
      complexity: 2,
      expert_action: {
        title: "Establish Business Review Cadence",
        recommendation: "Create monthly 1:1s between Finance and each BU leader. Agenda: their forecast, their concerns, their needs from Finance. Relationships built in these meetings create influence opportunities.",
        type: "behavioral"
      }
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
      is_critical: false,
      initiative_id: "init_strategic_influence",
      impact: 5,
      complexity: 4,
      expert_action: {
        title: "Create Challenge Culture",
        recommendation: "Get CEO to explicitly endorse Finance's role in challenging assumptions. Use 'help me understand' framing vs. 'you're wrong.' Start with smaller challenges, build track record of being right.",
        type: "behavioral"
      }
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
      is_critical: false,
      initiative_id: "init_seat_at_table",
      impact: 3,
      complexity: 2,
      expert_action: {
        title: "Establish Update Protocol",
        recommendation: "Define expectation: material changes communicated within 48 hours. Make it easy (Slack channel, simple form). Celebrate good updates publicly. The goal is information flowing toward Finance naturally.",
        type: "behavioral"
      }
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
      is_critical: false,
      initiative_id: "init_forward_visibility",
      impact: 4,
      complexity: 3,
      expert_action: {
        title: "Track Strategic Initiative Performance",
        recommendation: "Get the list of strategic initiatives from the CEO. Define financial KPIs for each. Report progress monthly. Connect initiative spend to results. This makes strategy tangible and Finance indispensable.",
        type: "structural"
      }
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
      is_critical: false,
      initiative_id: "init_strategic_influence",
      impact: 4,
      complexity: 3,
      expert_action: {
        title: "Insert Finance into Pricing",
        recommendation: "Create pricing guardrails: minimum margins, discount approval levels. Provide Sales with a simple tool showing deal profitability. Frame as 'helping you price to win profitably' not 'blocking deals.'",
        type: "governance"
      }
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
      is_critical: false,
      initiative_id: "init_decision_support",
      impact: 4,
      complexity: 3,
      expert_action: {
        title: "Build Rapid Response Capability",
        recommendation: "Create pre-built analysis templates for common questions. Maintain clean, accessible data. Protect analyst capacity from recurring work. Speed comes from preparation, not heroics.",
        type: "structural"
      }
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
      is_critical: false,
      initiative_id: "init_forward_visibility",
      impact: 4,
      complexity: 4,
      expert_action: {
        title: "Connect Budget to Strategy",
        recommendation: "Build a 3-year model that rolls into the annual budget. Link strategic initiatives to financial targets. Budget becomes 'Year 1 of the plan' not a standalone exercise.",
        type: "structural"
      }
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
      is_critical: false,
      initiative_id: "init_forward_visibility",
      impact: 4,
      complexity: 3,
      expert_action: {
        title: "Implement Leading Indicators",
        recommendation: "Identify 5-7 leading indicators for your business (pipeline, NPS, churn signals, etc.). Get data feeds established. Include in monthly pack. You'll see problems 2-3 months earlier.",
        type: "structural"
      }
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
      is_critical: false,
      initiative_id: "init_strategic_influence",
      impact: 5,
      complexity: 4,
      expert_action: {
        title: "Normalize Realistic Forecasting",
        recommendation: "Present ranges instead of points. Lead with 'most likely' but always show downside. Document assumptions clearly. When downside materializes, you've built credibility for next time.",
        type: "behavioral"
      }
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
      is_critical: false,
      initiative_id: "init_strategic_influence",
      impact: 5,
      complexity: 5,
      expert_action: {
        title: "Exercise the No Muscle",
        recommendation: "Identify one marginal project. Build an airtight business case showing negative NPV or unacceptable risk. Present to leadership with recommendation to kill or delay. Win this once and your influence multiplies.",
        type: "behavioral"
      }
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
      is_critical: false,
      initiative_id: "init_strategic_influence",
      impact: 4,
      complexity: 3,
      expert_action: {
        title: "Make Downside Scenarios Actionable",
        recommendation: "Don't just present 'what if bad'—present 'what if bad, and here's what we'd do.' Pre-defined triggers and actions make scenarios useful, not scary. Leaders engage when they see an action plan.",
        type: "behavioral"
      }
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
      is_critical: false,
      initiative_id: "init_forward_visibility",
      impact: 4,
      complexity: 3,
      expert_action: {
        title: "Build Driver Literacy",
        recommendation: "Identify the 3-5 drivers that explain 80% of financial performance. Create a simple 'driver dashboard.' Discuss in every leadership meeting. Repetition creates internalization.",
        type: "structural"
      }
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
      is_critical: false,
      initiative_id: "init_forward_visibility",
      impact: 4,
      complexity: 3,
      expert_action: {
        title: "Implement Stress Testing",
        recommendation: "Model 2-3 stress scenarios: revenue -20%, major customer loss, cost spike. Show impact on cash runway and covenants. Update quarterly. Boards love this—it shows you're thinking ahead.",
        type: "structural"
      }
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
      is_critical: false,
      initiative_id: "init_decision_support",
      impact: 4,
      complexity: 4,
      expert_action: {
        title: "Enable Self-Serve Analytics",
        recommendation: "Deploy BI tool (Power BI, Looker, Tableau) with curated financial datasets. Train power users in each BU. Shift Finance from 'report producer' to 'insight partner.'",
        type: "structural"
      }
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
      is_critical: false,
      initiative_id: "init_operational_excellence",
      impact: 5,
      complexity: 5,
      expert_action: {
        title: "Build Single Source of Truth",
        recommendation: "Create a canonical data layer (data warehouse) that feeds all reports. Eliminate shadow spreadsheets. This is a major project but eliminates 'my numbers don't match yours' forever.",
        type: "structural"
      }
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
      is_critical: false,
      initiative_id: "init_operational_excellence",
      impact: 4,
      complexity: 4,
      expert_action: {
        title: "Automate Data Pipelines",
        recommendation: "Map your critical data flows. Prioritize by volume and error frequency. Implement automated extraction (APIs, scheduled queries). Start with one flow, prove value, expand.",
        type: "structural"
      }
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
      is_critical: false,
      initiative_id: "init_decision_support",
      impact: 3,
      complexity: 5,
      expert_action: {
        title: "Explore Statistical Forecasting",
        recommendation: "Start simple: time series analysis on revenue, seasonality detection. Tools like Prophet (free) can outperform manual forecasts. Don't replace judgment—augment it with data.",
        type: "structural"
      }
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
      is_critical: false,
      initiative_id: "init_decision_support",
      impact: 3,
      complexity: 4,
      expert_action: {
        title: "Build Real-Time Dashboards",
        recommendation: "Identify 3-5 metrics that benefit from real-time visibility (cash, bookings, pipeline). Connect directly to source systems. Reserve for metrics where daily/weekly action is possible.",
        type: "structural"
      }
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
      is_critical: false,
      initiative_id: "init_operational_excellence",
      impact: 5,
      complexity: 4,
      expert_action: {
        title: "Create Strategic Capacity",
        recommendation: "Audit time spent on BAU vs. strategic. Target: 70/30 split. Automate or eliminate low-value BAU work. Protect 'strategic time' in calendars. Capacity is created by saying no to something.",
        type: "behavioral"
      }
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
      is_critical: false,
      initiative_id: "init_operational_excellence",
      impact: 3,
      complexity: 2,
      expert_action: {
        title: "Implement Finance Retrospectives",
        recommendation: "Run a retrospective after each close and budget cycle. What worked? What didn't? Pick one improvement per cycle. Small continuous improvements compound dramatically.",
        type: "behavioral"
      }
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
      is_critical: false,
      initiative_id: "init_operational_excellence",
      impact: 4,
      complexity: 4,
      expert_action: {
        title: "Join Cross-Functional Planning",
        recommendation: "Insert Finance into S&OP or equivalent process. Bring financial lens to operational decisions. Translate operational plans into financial impact. Integration beats sequential hand-offs.",
        type: "governance"
      }
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
      is_critical: false,
      initiative_id: "init_forward_visibility",
      impact: 3,
      complexity: 3,
      expert_action: {
        title: "Integrate External Data",
        recommendation: "Identify 3-5 external indicators relevant to your business. Subscribe to data feeds or track manually. Include in planning assumptions and board materials. Outside-in planning beats navel-gazing.",
        type: "structural"
      }
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
      is_critical: false,
      initiative_id: "init_decision_support",
      impact: 3,
      complexity: 5,
      expert_action: {
        title: "Explore Predictive Analytics",
        recommendation: "Start with one use case: churn prediction, deal probability, cost anomaly detection. Partner with data science team or use simple tools. Prove value on one problem before expanding.",
        type: "structural"
      }
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
  ],

  // =============================================================================
  // INITIATIVES (9 total - V2.1 Initiative Engine)
  // =============================================================================
  initiatives: [
    {
      id: 'init_budget_discipline',
      title: 'Establish Budget Discipline',
      description: 'A credible budget is the foundation of financial management. Without it, variance analysis is meaningless and forecasting has no anchor. Get the basics right first.',
      theme_id: 'foundation',
      objective_id: 'obj_fpa_l1_budget'
    },
    {
      id: 'init_financial_controls',
      title: 'Strengthen Financial Controls',
      description: 'Controls protect the integrity of your numbers. A single chart of accounts, reconciliation discipline, and journal entry governance prevent the errors that destroy credibility.',
      theme_id: 'foundation',
      objective_id: 'obj_fpa_l1_control'
    },
    {
      id: 'init_feedback_loops',
      title: 'Implement Performance Feedback Loops',
      description: 'Budgets without follow-up are just wishes. Monthly BvA, variance investigation, and owner accountability create the feedback loops that drive performance.',
      theme_id: 'foundation',
      objective_id: 'obj_fpa_l2_variance'
    },
    {
      id: 'init_forecast_infrastructure',
      title: 'Modernize Forecasting Infrastructure',
      description: "A forecast trapped in one person's spreadsheet is a liability. Multi-user systems, cash flow integration, regular refresh cycles, and scenario capability create a forecast you can trust.",
      theme_id: 'future',
      objective_id: 'obj_fpa_l2_forecast'
    },
    {
      id: 'init_forward_visibility',
      title: 'Build Forward Visibility',
      description: "Connect finance models to strategy. Track leading indicators, monitor value-creation initiatives, and stress-test the plan. Know where you're going, not just where you've been.",
      theme_id: 'future',
      objective_id: 'obj_fpa_l3_driver'
    },
    {
      id: 'init_seat_at_table',
      title: 'Earn a Seat at the Table',
      description: 'Finance must be consulted before decisions are made, not informed after. This requires building trust through reliability, then proving value through insight.',
      theme_id: 'intelligence',
      objective_id: 'obj_fpa_l3_scenario'
    },
    {
      id: 'init_strategic_influence',
      title: 'Exercise Strategic Influence',
      description: 'The ultimate test of Finance credibility: can you stop a bad project? Can you present uncomfortable truths? Influence comes from courage backed by rigor.',
      theme_id: 'intelligence',
      objective_id: 'obj_fpa_l3_scenario'
    },
    {
      id: 'init_decision_support',
      title: 'Enable Decision Support',
      description: 'Business moves fast. Finance must answer questions in hours, not weeks. Self-serve analytics, rapid ad-hoc analysis, and real-time data access enable this.',
      theme_id: 'intelligence',
      objective_id: 'obj_fpa_l4_predict'
    },
    {
      id: 'init_operational_excellence',
      title: 'Achieve Operational Excellence',
      description: 'Automate the routine to free capacity for the strategic. Data pipelines, integrated systems, streamlined processes, and continuous improvement create the efficiency headroom for high-value work.',
      theme_id: 'intelligence',
      objective_id: 'obj_fpa_l4_predict'
    }
  ]
};

// Extended spec with themes for v2.7.0 API responses
export const specV270WithThemes = {
  ...SPEC,
  themes: THEMES
};

export default SPEC;
