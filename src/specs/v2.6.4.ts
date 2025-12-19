// src/specs/v2.6.4.ts
// Finance Diagnostic Spec — FP&A Pillar (MVP)

import { Spec } from "./types";

export const SPEC: Spec = {
  version: "v2.6.4",

  // ============================================================
  // PILLARS
  // ============================================================
  pillars: [
    {
      id: "fpa",
      name: "Financial Planning & Analysis",
      weight: 1,
    },
  ],

  // ============================================================
  // QUESTIONS (Evidence Items)
  // ============================================================
  questions: [
    // --- Level 1: Emerging ---
    {
      id: "fpa_annual_budget",
      pillar: "fpa",
      weight: 2,
      text: "Do you have a documented annual budget that is formally approved by leadership?",
      is_critical: true,
      trigger_action_id: "act_create_budget",
      level: 1,
      levelLabel: "Emerging",
      help: "This means a written budget document that covers all revenue and expenses, reviewed and signed off by executives before the fiscal year starts.",
    },
    {
      id: "fpa_budget_owner",
      pillar: "fpa",
      weight: 2,
      text: "Is there a single person accountable for owning and maintaining the budget process?",
      is_critical: true,
      trigger_action_id: "act_assign_budget_owner",
      level: 1,
      levelLabel: "Emerging",
      help: "One named individual (not a committee) who is responsible for the budget timeline, templates, consolidation, and coordination.",
    },

    // --- Level 2: Defined ---
    {
      id: "fpa_variance_analysis",
      pillar: "fpa",
      weight: 1,
      text: "Do you perform monthly variance analysis comparing actuals to budget?",
      is_critical: false,
      trigger_action_id: "act_implement_variance",
      level: 2,
      levelLabel: "Defined",
      help: "A regular monthly process that compares what actually happened to what was budgeted, with explanations for significant differences.",
    },
    {
      id: "fpa_rolling_forecast",
      pillar: "fpa",
      weight: 1,
      text: "Do you maintain a rolling forecast that is updated at least quarterly?",
      is_critical: false,
      trigger_action_id: "act_implement_forecast",
      level: 2,
      levelLabel: "Defined",
      help: "A forecast that always looks 4-6 quarters ahead and is refreshed at least every quarter with the latest information.",
    },

    // --- Level 3: Managed ---
    {
      id: "fpa_driver_based",
      pillar: "fpa",
      weight: 1,
      text: "Is your financial forecast driver-based, linked to operational metrics (e.g., headcount, pipeline, units)?",
      is_critical: false,
      trigger_action_id: "act_implement_drivers",
      level: 3,
      levelLabel: "Managed",
      help: "Your forecast is built from operational assumptions (like number of customers, average deal size) rather than just trending historical numbers.",
    },
    {
      id: "fpa_scenario_modeling",
      pillar: "fpa",
      weight: 1,
      text: "Do you routinely model multiple scenarios (base case, upside, downside) for planning?",
      is_critical: false,
      trigger_action_id: "act_implement_scenarios",
      level: 3,
      levelLabel: "Managed",
      help: "You regularly create best-case, worst-case, and expected-case versions of your forecast to prepare for different outcomes.",
    },

    // --- Level 4: Optimized ---
    {
      id: "fpa_integrated_planning",
      pillar: "fpa",
      weight: 1,
      text: "Is financial planning formally integrated with operational planning (sales, HR, operations)?",
      is_critical: false,
      trigger_action_id: "act_integrate_planning",
      level: 4,
      levelLabel: "Optimized",
      help: "Finance and operational teams use shared assumptions, aligned timelines, and connected systems — not separate spreadsheets.",
    },
    {
      id: "fpa_predictive",
      pillar: "fpa",
      weight: 1,
      text: "Do you use predictive analytics or machine learning to improve forecast accuracy?",
      is_critical: false,
      trigger_action_id: "act_implement_predictive",
      level: 4,
      levelLabel: "Optimized",
      help: "You use statistical models or ML algorithms to predict outcomes like demand, churn, or cash flow — beyond simple trending.",
    },
  ],

  // ============================================================
  // MATURITY GATES
  // Sequential: must satisfy N-1 before N
  // ============================================================
  maturityGates: [
    {
      level: 0,
      label: "Ad-hoc",
      required_evidence_ids: [],
    },
    {
      level: 1,
      label: "Emerging",
      required_evidence_ids: ["fpa_annual_budget", "fpa_budget_owner"],
    },
    {
      level: 2,
      label: "Defined",
      required_evidence_ids: ["fpa_variance_analysis", "fpa_rolling_forecast"],
    },
    {
      level: 3,
      label: "Managed",
      required_evidence_ids: ["fpa_driver_based", "fpa_scenario_modeling"],
    },
    {
      level: 4,
      label: "Optimized",
      required_evidence_ids: ["fpa_integrated_planning", "fpa_predictive"],
    },
  ],

  // ============================================================
  // ACTIONS (Expert-written recommendations)
  // ============================================================
  actions: [
    // --- Level 1 Actions ---
    {
      id: "act_create_budget",
      title: "Establish a Formal Annual Budget",
      description:
        "Create a documented annual budget that covers all revenue streams, operating expenses, and capital expenditures. The budget should be reviewed and formally approved by executive leadership before the fiscal year begins.",
      rationale:
        "Without a formal budget, the organization cannot set financial targets, measure performance, or make informed resource allocation decisions. This is the foundation of financial planning.",
      priority: "critical",
    },
    {
      id: "act_assign_budget_owner",
      title: "Assign a Budget Process Owner",
      description:
        "Designate a single individual (typically in Finance) who is accountable for the end-to-end budget process, including timeline, templates, consolidation, and stakeholder coordination.",
      rationale:
        "Distributed ownership leads to inconsistent assumptions, missed deadlines, and gaps in coverage. A single owner ensures process integrity and accountability.",
      priority: "critical",
    },

    // --- Level 2 Actions ---
    {
      id: "act_implement_variance",
      title: "Implement Monthly Variance Analysis",
      description:
        "Establish a monthly close process that compares actual results to budget. Document significant variances (typically >5% or >$X threshold) with explanations and corrective actions.",
      rationale:
        "Variance analysis transforms the budget from a static document into a management tool. It enables early detection of problems and creates accountability for results.",
      priority: "high",
    },
    {
      id: "act_implement_forecast",
      title: "Implement Rolling Forecasts",
      description:
        "Move beyond the static annual budget by maintaining a rolling forecast that extends 4-6 quarters ahead and is updated at least quarterly. The forecast should incorporate the latest actuals and business intelligence.",
      rationale:
        "Annual budgets become stale quickly. Rolling forecasts provide leadership with a continuously updated view of expected performance, enabling more agile decision-making.",
      priority: "high",
    },

    // --- Level 3 Actions ---
    {
      id: "act_implement_drivers",
      title: "Transition to Driver-Based Planning",
      description:
        "Rebuild your forecast model to link financial outcomes to operational drivers (e.g., revenue = customers × average deal size × win rate). Identify 5-10 key drivers that explain 80% of financial variability.",
      rationale:
        "Driver-based models create transparency into what moves the numbers. They enable better scenario analysis and help operational leaders understand their financial impact.",
      priority: "high",
    },
    {
      id: "act_implement_scenarios",
      title: "Establish Scenario Modeling Capability",
      description:
        "Develop the ability to quickly model base, upside, and downside scenarios. Define trigger points that would cause the organization to shift plans (e.g., if revenue falls below X, implement cost reduction plan Y).",
      rationale:
        "Single-point forecasts create false precision. Scenario modeling prepares leadership for multiple futures and speeds up response time when conditions change.",
      priority: "high",
    },

    // --- Level 4 Actions ---
    {
      id: "act_integrate_planning",
      title: "Integrate Financial and Operational Planning",
      description:
        "Break down silos between Finance and operational teams (Sales, HR, Operations). Establish a unified planning calendar, shared assumptions, and integrated systems that connect operational plans to financial outcomes.",
      rationale:
        "Disconnected planning leads to misaligned targets and surprises. Integrated planning ensures the financial plan reflects operational reality and vice versa.",
      priority: "medium",
    },
    {
      id: "act_implement_predictive",
      title: "Implement Predictive Analytics",
      description:
        "Leverage statistical models or machine learning to improve forecast accuracy. Start with high-value use cases like demand forecasting, churn prediction, or cash flow modeling. Measure and track forecast accuracy over time.",
      rationale:
        "Human judgment has limits. Predictive analytics can identify patterns in historical data that improve accuracy and reduce bias in forecasting.",
      priority: "medium",
    },
  ],
};




