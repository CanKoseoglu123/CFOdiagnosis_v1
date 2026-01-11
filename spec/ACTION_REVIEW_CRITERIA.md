# Action Review Criteria

**Version:** 1.0
**Last Updated:** 2026-01-11
**Purpose:** Standard framework for evaluating action recommendations before release

---

## Criteria

| # | Criterion | What We're Checking | Pass If... |
|---|-----------|---------------------|------------|
| 1 | **Actionable First Step** | Reader knows what to do Monday morning | Action implies a concrete first move, not just an aspiration |
| 2 | **Outcome-Oriented Title** | Title describes the result, not the activity | "Implement Budget Sign-Off" not "Work on Budget Approval Process" |
| 3 | **CFO Resonance** | Would a CFO recognize this as valuable? | Connects to credibility, control, or decision quality—not just efficiency |
| 4 | **Owner Clarity** | Who should do this is obvious | Finance team, business owner, or cross-functional—never ambiguous |
| 5 | **Plain Language** | No jargon or consultant-speak | A non-finance executive could understand what's being recommended |
| 6 | **Type-Appropriate Detail** | Specificity matches action type | Quick wins = exact steps; Structural = directional guidance |
| 7 | **Proportional Effort** | Recommendation matches the problem size | Doesn't over-engineer a simple fix or understate a major change |
| 8 | **Standalone Clarity** | Recommendation makes sense without reading the question | Reader understands the gap and fix without parent context |
| 9 | **Measurable Progress** | Reader can tell when they're done | Includes completion state or directional progress indicator |
| 10 | **Business Impact Link** | "So what?" is answered | Why this matters to P&L, cash, decision speed, or risk is clear |
| 11 | **Maturity-Appropriate Complexity** | Action sophistication matches the level | L1 = simple/foundational; L4 = advanced/sophisticated |

### Field Mapping

| Criterion | Applies to Title | Applies to Recommendation |
|-----------|------------------|---------------------------|
| 1. Actionable First Step | | ✓ |
| 2. Outcome-Oriented Title | ✓ | |
| 3. CFO Resonance | ✓ | ✓ |
| 4. Owner Clarity | | ✓ |
| 5. Plain Language | ✓ | ✓ |
| 6. Type-Appropriate Detail | | ✓ |
| 7. Proportional Effort | | ✓ |
| 8. Standalone Clarity | ✓ | ✓ |
| 9. Measurable Progress | | ✓ |
| 10. Business Impact Link | | ✓ |
| 11. Maturity-Appropriate Complexity | ✓ | ✓ |

---

## Maturity-Appropriate Complexity Guide

| Level | Action Complexity | Example |
|-------|-------------------|---------|
| L1 | Basic, any company can do this | "Create a budget template with revenue and cost lines" |
| L2 | Structured, requires some process discipline | "Implement monthly variance review with documented owners" |
| L3 | Integrated, cross-functional coordination | "Link forecast drivers to operational KPIs from Sales and Ops" |
| L4 | Advanced, may require technology or specialized skills | "Deploy ML-based demand sensing with automated forecast adjustment" |

**Red flags:**
- L1 action requiring system implementation
- L4 action that's just "do the basics"
- Any level assuming capabilities from higher levels

---

## Action Type Definitions

| Type | Label | What It Means | Detail Level |
|------|-------|---------------|--------------|
| `quick_win` | **Quick Win** | Achievable in days with minimal coordination | High — specific steps, exact deliverables |
| `structural` | **Structural** | Requires process or system changes | Medium — directional, key milestones |
| `behavioral` | **Behavioral** | Requires changing how people work | Medium — describe the behavior change, not just training |
| `governance` | **Governance** | Establishes rules, policies, or oversight | Low-Medium — define the policy intent, not implementation details |

---

## CFO Lens: What Finance Leaders Care About

When reviewing, ask: *"If a CFO read this action, would they..."*

1. **See credibility impact?** — Does this protect or enhance Finance's standing with the business?
2. **Recognize the risk?** — Is the cost of inaction obvious?
3. **Trust the recommendation?** — Is this based on experience, not theory?
4. **Act on it?** — Or would they delegate because it's too tactical for their level?

**Red flags:**
- Actions that sound like consulting templates
- Recommendations requiring specialized knowledge without acknowledging it
- Vague verbs: "enhance," "optimize," "leverage," "align"
- Missing "who" — no clear owner

---

## Specificity Guide by Type

### Quick Wins — Be Prescriptive
**Good:** "Add a sign-off checkbox to the budget template. Require email confirmation before consolidation."
**Bad:** "Implement a sign-off mechanism for budget approval."

### Structural — Be Directional
**Good:** "Move forecasting to a multi-user system. Evaluate tools that support driver-based models and scenario capability."
**Bad:** "Create a new forecasting process that enables better collaboration."

### Behavioral — Describe the Shift
**Good:** "Require variance owners to explain root causes, not just numbers. Build investigation into the monthly review agenda."
**Bad:** "Train the team on variance analysis best practices."

### Governance — Define the Rule
**Good:** "Establish a policy requiring CFO approval for forecast changes >10% of prior guidance."
**Bad:** "Create governance around forecast accuracy."

---

## Anti-Patterns (Common Failures)

| Anti-Pattern | Example | Why It Fails |
|--------------|---------|--------------|
| **Vague verbs** | "Optimize the budgeting process" | No concrete action; what does "optimize" mean? |
| **Jargon overload** | "Implement integrated planning leveraging cross-functional synergies" | CFO would cringe; FP&A manager can't execute |
| **Missing owner** | "Ensure variance analysis happens monthly" | Who ensures it? Finance? Business? |
| **Circular logic** | "Improve forecasting accuracy by making better forecasts" | Recommendation restates the problem |
| **Boil the ocean** | "Transform the finance operating model" | Too big; no starting point |
| **Consultant template** | "Develop a center of excellence for financial planning" | Sounds impressive, means nothing specific |

---

## Objective-Level Check: Zero-to-L4 Completeness

Beyond individual action quality, review the **complete set of actions within each objective** to ensure:

| Check | What We're Checking | Pass If... |
|-------|---------------------|------------|
| **Coverage** | Every maturity level has at least one action | L1, L2, L3, L4 all represented |
| **Progression** | Actions build logically from basic to advanced | L1 actions don't assume L3 capabilities exist |
| **Sufficiency** | Doing all actions delivers the objective | No missing steps that would leave gaps |
| **No Leaps** | Adjacent levels connect naturally | L2 actions follow from L1 completion |

**Test:** If an organization at Level 0 executes every action in sequence (L1 → L2 → L3 → L4), do they arrive at full maturity for this objective? If not, what's missing?

---

## Review Process

### Per-Action Review
1. Review actions grouped by **Objective**
2. For each action, assess against all 11 criteria (use field mapping to check title vs recommendation)
3. Flag issues with specific criterion number (e.g., "Fails #5 - jargon: 'synergies'")
4. Test the CFO lens questions
5. Verify type-appropriate detail level
6. Propose revision or recommend removal

### Objective-Level Review
7. After individual review, assess each objective's action set for Zero-to-L4 completeness
8. Flag gaps: missing levels, logical leaps, or insufficient coverage
9. Re-review flagged actions after revision

---

## Usage

Apply this framework when:
- Adding new questions with actions to the diagnostic
- Reviewing existing actions for clarity and actionability
- Responding to user feedback about recommendation quality
- Ensuring consistency across initiative groupings
