/**
 * CFO Diagnostic Platform - Specification v2.6.4
 *
 * FROZEN SPECIFICATION - Do not modify without version bump
 *
 * Content: FP&A Pillar (40 questions, 8 objectives, 8 actions)
 * Last Updated: 2024-12-20
 */

import { Spec } from "./types";

export const SPEC: Spec = {
  version: "v2.6.4",

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
  // OBJECTIVES (8 total - 2 per level)
  // =============================================================================
  objectives: [
    // Level 1: Emerging
    {
      id: "obj_fpa_l1_budget",
      pillar_id: "fpa",
      level: 1,
      name: "Budget Foundation",
      description: "Establish a formal, owned, and communicated annual budget process",
      action_id: "act_fpa_l1_budget"
    },
    {
      id: "obj_fpa_l1_control",
      pillar_id: "fpa",
      level: 1,
      name: "Financial Controls",
      description: "Implement basic financial controls and segregation of duties",
      action_id: "act_fpa_l1_control"
    },
    // Level 2: Defined
    {
      id: "obj_fpa_l2_variance",
      pillar_id: "fpa",
      level: 2,
      name: "Variance Management",
      description: "Establish monthly variance analysis with accountability",
      action_id: "act_fpa_l2_variance"
    },
    {
      id: "obj_fpa_l2_forecast",
      pillar_id: "fpa",
      level: 2,
      name: "Forecasting Capability",
      description: "Implement rolling forecasts with documented assumptions",
      action_id: "act_fpa_l2_forecast"
    },
    // Level 3: Managed
    {
      id: "obj_fpa_l3_driver",
      pillar_id: "fpa",
      level: 3,
      name: "Driver-Based Planning",
      description: "Link financial models to operational drivers and unit economics",
      action_id: "act_fpa_l3_driver"
    },
    {
      id: "obj_fpa_l3_scenario",
      pillar_id: "fpa",
      level: 3,
      name: "Scenario Planning",
      description: "Build multi-scenario models with trigger-based contingencies",
      action_id: "act_fpa_l3_scenario"
    },
    // Level 4: Optimized
    {
      id: "obj_fpa_l4_integrate",
      pillar_id: "fpa",
      level: 4,
      name: "Integrated Planning",
      description: "Connect planning across functions with live system integration",
      action_id: "act_fpa_l4_integrate"
    },
    {
      id: "obj_fpa_l4_predict",
      pillar_id: "fpa",
      level: 4,
      name: "Predictive Analytics",
      description: "Deploy ML-based forecasting and real-time anomaly detection",
      action_id: "act_fpa_l4_predict"
    }
  ],

  // =============================================================================
  // QUESTIONS - ALL 40 (10 per level)
  // =============================================================================
  questions: [
    // -------------------------------------------------------------------------
    // LEVEL 1: EMERGING (10 questions, ALL critical)
    // -------------------------------------------------------------------------

    // Budget Foundation (obj_fpa_l1_budget) - 5 questions
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
      is_critical: true
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
      is_critical: true
    },

    // Financial Controls (obj_fpa_l1_control) - 5 questions
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
      is_critical: true
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
      is_critical: true
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

    // -------------------------------------------------------------------------
    // LEVEL 2: DEFINED (10 questions, 6 critical)
    // -------------------------------------------------------------------------

    // Variance Management (obj_fpa_l2_variance) - 5 questions
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
      is_critical: true
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
      is_critical: true
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

    // Forecasting Capability (obj_fpa_l2_forecast) - 5 questions
    {
      id: "fpa_l2_q06",
      pillar: "fpa",
      objective_id: "obj_fpa_l2_forecast",
      level: 2,
      levelLabel: "Defined",
      weight: 2,
      text: "Is a financial forecast updated at least quarterly (re-forecast)?",
      help: "Regular forecast updates incorporate new information and provide a more accurate view of expected year-end results than a static annual budget.",
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
      help: "Cash flow forecasting is essential for managing working capital, timing of expenditures, and ensuring the company can meet its obligations.",
      is_critical: true
    },
    {
      id: "fpa_l2_q08",
      pillar: "fpa",
      objective_id: "obj_fpa_l2_forecast",
      level: 2,
      levelLabel: "Defined",
      weight: 1,
      text: "Are forecast assumptions explicitly documented (e.g., \"assuming 5% churn\")?",
      help: "Documenting assumptions makes the forecast transparent, enables sensitivity analysis, and helps identify what drove forecast errors.",
      is_critical: false
    },
    {
      id: "fpa_l2_q09",
      pillar: "fpa",
      objective_id: "obj_fpa_l2_forecast",
      level: 2,
      levelLabel: "Defined",
      weight: 1,
      text: "Is historical forecast accuracy tracked to improve future predictions?",
      help: "Tracking forecast vs. actual over time reveals systematic biases and helps improve forecasting methodology.",
      is_critical: false
    },
    {
      id: "fpa_l2_q10",
      pillar: "fpa",
      objective_id: "obj_fpa_l2_forecast",
      level: 2,
      levelLabel: "Defined",
      weight: 1,
      text: "Does the forecast extend at least 12 months into the future (rolling)?",
      help: "A rolling 12-month forecast provides consistent forward visibility regardless of where you are in the fiscal year.",
      is_critical: false
    },

    // -------------------------------------------------------------------------
    // LEVEL 3: MANAGED (10 questions, none critical)
    // -------------------------------------------------------------------------

    // Driver-Based Planning (obj_fpa_l3_driver) - 5 questions
    {
      id: "fpa_l3_q01",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_driver",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Is the financial model linked to operational drivers (e.g., leads, conversion, headcount)?",
      help: "Driver-based models connect financial outcomes to operational inputs, enabling \"what-if\" analysis and more accurate planning.",
      is_critical: false
    },
    {
      id: "fpa_l3_q02",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_driver",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Can you update a single driver (e.g., price increase) and see the P&L impact instantly?",
      help: "A well-structured model allows instant recalculation when key drivers change, enabling rapid scenario analysis.",
      is_critical: false
    },
    {
      id: "fpa_l3_q03",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_driver",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Are Unit Economics (CAC, LTV, Gross Margin per unit) calculated monthly?",
      help: "Unit economics metrics help understand the fundamental profitability of the business model at a granular level.",
      is_critical: false
    },
    {
      id: "fpa_l3_q04",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_driver",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Is cohort analysis used to understand revenue retention/churn behavior?",
      help: "Cohort analysis tracks customer groups over time to understand retention patterns, LTV, and revenue quality.",
      is_critical: false
    },
    {
      id: "fpa_l3_q05",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_driver",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Are non-financial KPIs reported alongside financial metrics in the same dashboard?",
      help: "Integrating operational and financial KPIs provides a holistic view of business performance and leading indicators.",
      is_critical: false
    },

    // Scenario Planning (obj_fpa_l3_scenario) - 5 questions
    {
      id: "fpa_l3_q06",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_scenario",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Can the model run multiple scenarios (Base, Bull, Bear) simultaneously?",
      help: "Multi-scenario modeling allows leadership to understand the range of possible outcomes and plan accordingly.",
      is_critical: false
    },
    {
      id: "fpa_l3_q07",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_scenario",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Are \"trigger points\" defined that would activate specific contingency plans?",
      help: "Predefined triggers (e.g., revenue drops 20%) that activate specific response plans enable faster crisis response.",
      is_critical: false
    },
    {
      id: "fpa_l3_q08",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_scenario",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Is sensitivity analysis performed on key assumptions (e.g., sensitivity to interest rates)?",
      help: "Sensitivity analysis identifies which assumptions have the biggest impact on financial outcomes.",
      is_critical: false
    },
    {
      id: "fpa_l3_q09",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_scenario",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Is capital allocation (CAPEX/Hiring) dynamically adjusted based on scenario triggers?",
      help: "Dynamic capital allocation allows the organization to scale investment up or down based on actual performance.",
      is_critical: false
    },
    {
      id: "fpa_l3_q10",
      pillar: "fpa",
      objective_id: "obj_fpa_l3_scenario",
      level: 3,
      levelLabel: "Managed",
      weight: 1,
      text: "Are scenarios stress-tested against potential external shocks (e.g., supply chain break)?",
      help: "Stress testing evaluates how the business would perform under extreme but plausible adverse conditions.",
      is_critical: false
    },

    // -------------------------------------------------------------------------
    // LEVEL 4: OPTIMIZED (10 questions, none critical)
    // -------------------------------------------------------------------------

    // Integrated Planning (obj_fpa_l4_integrate) - 5 questions
    {
      id: "fpa_l4_q01",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_integrate",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "Is the planning tool directly integrated with the ERP (no manual data export/import)?",
      help: "Direct ERP integration eliminates manual data transfer, reduces errors, and enables real-time financial visibility.",
      is_critical: false
    },
    {
      id: "fpa_l4_q02",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_integrate",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "Is the planning tool integrated with the CRM/HRIS for live operational data?",
      help: "Integration with CRM and HRIS provides real-time pipeline and headcount data for more accurate forecasting.",
      is_critical: false
    },
    {
      id: "fpa_l4_q03",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_integrate",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "Do different functions (Sales, Ops, Finance) plan in a single connected environment?",
      help: "Unified planning ensures alignment across functions and eliminates version control issues from separate spreadsheets.",
      is_critical: false
    },
    {
      id: "fpa_l4_q04",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_integrate",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "Is the \"close-to-report\" cycle (books closed to dashboard updated) under 3 days?",
      help: "A fast close-to-report cycle enables timely decision-making based on current financial data.",
      is_critical: false
    },
    {
      id: "fpa_l4_q05",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_integrate",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "Are strategic long-range plans (3-5 years) mathematically linked to the annual budget?",
      help: "Linking long-range plans to annual budgets ensures strategic goals translate into operational targets.",
      is_critical: false
    },

    // Predictive Analytics (obj_fpa_l4_predict) - 5 questions
    {
      id: "fpa_l4_q06",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_predict",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "Are machine learning algorithms used to generate a baseline forecast?",
      help: "ML-based forecasting can identify patterns in historical data that humans might miss, improving forecast accuracy.",
      is_critical: false
    },
    {
      id: "fpa_l4_q07",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_predict",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "Does the system automatically flag anomalies in real-time (not month-end)?",
      help: "Real-time anomaly detection enables immediate investigation of unusual transactions or trends.",
      is_critical: false
    },
    {
      id: "fpa_l4_q08",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_predict",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "Is customer lifetime value (CLTV) predicted at an individual customer level?",
      help: "Individual-level CLTV prediction enables targeted retention efforts and more accurate revenue forecasting.",
      is_critical: false
    },
    {
      id: "fpa_l4_q09",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_predict",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "Are external datasets (market trends, macro indicators) automatically ingested?",
      help: "Automatic ingestion of external data enables forecasts that account for market conditions and economic factors.",
      is_critical: false
    },
    {
      id: "fpa_l4_q10",
      pillar: "fpa",
      objective_id: "obj_fpa_l4_predict",
      level: 4,
      levelLabel: "Optimized",
      weight: 1,
      text: "Is the variance between ML prediction and human forecast tracked and analyzed?",
      help: "Comparing ML vs. human forecasts helps identify where each approach adds value and improves overall accuracy.",
      is_critical: false
    }
  ],

  // =============================================================================
  // MATURITY GATES (Sequential, 80% threshold)
  // =============================================================================
  maturityGates: [
    {
      level: 0,
      label: "Ad-hoc",
      description: "No formal financial processes in place",
      required_evidence_ids: [],
      threshold: 1.0
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
      description: "Driver-based models and scenario planning capabilities deployed",
      required_evidence_ids: [
        "fpa_l3_q01", "fpa_l3_q02", "fpa_l3_q03", "fpa_l3_q04", "fpa_l3_q05",
        "fpa_l3_q06", "fpa_l3_q07", "fpa_l3_q08", "fpa_l3_q09", "fpa_l3_q10"
      ],
      threshold: 0.8
    },
    {
      level: 4,
      label: "Optimized",
      description: "Fully integrated planning with predictive analytics",
      required_evidence_ids: [
        "fpa_l4_q01", "fpa_l4_q02", "fpa_l4_q03", "fpa_l4_q04", "fpa_l4_q05",
        "fpa_l4_q06", "fpa_l4_q07", "fpa_l4_q08", "fpa_l4_q09", "fpa_l4_q10"
      ],
      threshold: 0.8
    }
  ],

  // =============================================================================
  // ACTIONS (8 total - 1 per objective)
  // =============================================================================
  actions: [
    // Level 1 Actions
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
    // Level 2 Actions
    {
      id: "act_fpa_l2_variance",
      title: "Deploy Variance Analysis Discipline",
      description: "Generate monthly BvA reports, investigate material variances, conduct monthly reviews with department heads, and document explanations in management reporting.",
      rationale: "Variance analysis creates accountability and enables course correction.",
      priority: "high"
    },
    {
      id: "act_fpa_l2_forecast",
      title: "Implement Rolling Forecast Process",
      description: "Update forecasts at least quarterly, include cash flow projections, document assumptions explicitly, track forecast accuracy, and extend the forecast horizon to 12+ months.",
      rationale: "Rolling forecasts provide forward visibility and reduce budget obsolescence.",
      priority: "high"
    },
    // Level 3 Actions
    {
      id: "act_fpa_l3_driver",
      title: "Build Driver-Based Financial Model",
      description: "Link the financial model to operational drivers, enable instant scenario impact analysis, calculate unit economics monthly, implement cohort analysis, and integrate non-financial KPIs.",
      rationale: "Driver-based models enable faster, more accurate planning tied to business reality.",
      priority: "medium"
    },
    {
      id: "act_fpa_l3_scenario",
      title: "Develop Scenario Planning Capability",
      description: "Build Base/Bull/Bear scenarios, define trigger points for contingency activation, perform sensitivity analysis on key assumptions, enable dynamic capital allocation, and stress-test against external shocks.",
      rationale: "Scenario planning builds organizational resilience and decision readiness.",
      priority: "medium"
    },
    // Level 4 Actions
    {
      id: "act_fpa_l4_integrate",
      title: "Achieve Planning Integration",
      description: "Integrate planning tools with ERP, CRM, and HRIS for live data feeds. Enable cross-functional planning in a single environment, reduce close-to-report cycle to under 3 days, and link long-range plans to annual budgets.",
      rationale: "Integration eliminates manual reconciliation and enables real-time decision making.",
      priority: "medium"
    },
    {
      id: "act_fpa_l4_predict",
      title: "Deploy Predictive Analytics",
      description: "Implement ML-based baseline forecasting, enable real-time anomaly detection, predict individual customer LTV, ingest external market data automatically, and track ML vs. human forecast accuracy.",
      rationale: "Predictive analytics transforms FP&A from reactive reporting to proactive insight generation.",
      priority: "medium"
    }
  ]
};
