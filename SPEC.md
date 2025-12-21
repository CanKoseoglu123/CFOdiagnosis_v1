🚀 FINANCE DIAGNOSTIC PLATFORM — SYSTEM SPEC
Version: v2.7.0
Status: FINAL / FROZEN
 Supersedes: v2.6.4
 Audience: Product, Engineering, Design, Content
 Change Type: Feature Addition (Theme Layer) + Content Calibration + Behavioral Rewrite

 See spec/SPEC_v2.7.0.md for complete specification with changelog.

0. PURPOSE OF THE SYSTEM
The Finance Diagnostic evaluates how reliably an organisation executes real finance workflows, based on observable, auditable evidence, and positions the organisation on explicit maturity levels using deterministic gates.
It produces:
Execution completeness scores


Gated maturity levels (non-linear)


Capability, Pillar, and Finance roll-ups


Explicit gaps and critical risks


Deterministic, prioritised actions


Executive-grade (Gartner-style) reports


Full auditability (who changed what, when)


Non-negotiable principles
Reality before taxonomy


Evidence before opinion


Deterministic logic for scores & maturity


AI is explanatory, never authoritative


Multi-player safe by design



1. CANONICAL DIAGNOSTIC LAYER MODEL (L0–L5)
This model is normative.
 All system design, data structures, and UX must align to it.
Layer
Name
Scope
What it is
Purpose
Example
L0
Workflow Reality Layer
All pillars (universal)
Process-based workflows defined by trigger, sequence, artifact, decision
Capture how work actually happens
Rolling Forecast Update / Month-End Close
L1
Domain
All pillars
The business function being diagnosed
Sets top-level boundary
Finance
L2
Pillar
Per pillar
Navigational grouping of related objectives
Orientation, reporting, UX (not logic)
FP&A
L3
Objective
Per capability
Outcome the business expects
Defines what “good” looks like
Reliable financial outlook
L4
Activity
Per objective
Recurring or trigger-based actions
Describe what actually happens
Update forecast assumptions
L5
Evidence
Per activity
Binary, observable proof of maturity
Anchor diagnostic in reality
Actuals pulled from ERP

👉 Only L5 Evidence is directly assessed.
 All scores, maturity, narratives, and actions are derived.

2. DIAGNOSTIC DESIGN & BUILD SEQUENCE (NORMATIVE)
This sequence governs how diagnostics are defined and evolved.
 It is not optional and prevents taxonomy-first failure.
Step
Layer(s)
Description
Principle
—
The diagnostic is built from reality upward, not from taxonomy downward.
1. Identify L0 Workflows
L0
Capture core, repeatable finance workflows with trigger, artifact, decision.
2. Define Objectives
L3
Define what “good” looks like from a CFO perspective.
3. Decompose Activities
L4
Break objectives into observable recurring activities.
4. Specify Evidence
L5
Define binary, observable evidence anchored in real artefacts.
5. Group Capability Areas
L2
Group objectives and activities into capability areas (containers, not logic).
6. Assign Domains & Pillars
L1
Organise for navigation and reporting only.


3. END-TO-END DIAGNOSTIC FLOW (UNCHANGED)
3.1 Domain Diagnostic (Context Only)
Company profile


Org structure


Global pain points


Ambition level


❌ No scoring
 ❌ No maturity

3.2 Pillar Overview & Selection
Pillar list


Status only



3.3 Pillar Diagnostic (Context Intake)
Systems & tools


FTEs / roles


Pillar pain points


Complexity drivers


Ongoing projects


❌ No scoring
 Used only to condition AI narratives.

3.4 Capability Execution Loop
For each capability:
Evidence capture (YES / NO / N/A)


Derived execution state (system-only)


Clarifying questions (AI, non-scoring)


Capability narrative (draft)


User refinement


Capability completion


❌ No capability report shown.

3.5 Pillar Report (First Visible Output)
Execution score


Maturity level


Critical risks


Themes & actions


Tech-stack observations



3.6 Finance Report (Final Output)
Overall execution score


Finance maturity


Pillar comparison


Systemic risks


Enterprise actions



4. SCORING MODEL (UNCHANGED)
Execution score:
sum(earned_points) / sum(possible_points)

TRUE → (1,1)


FALSE → (0,1)


N/A → (0,0)


If denominator = 0 → NOT_IN_SCOPE.

5. CRITICAL RISK MODEL (UNCHANGED)
Any critical evidence = FALSE → CRITICAL_RISK


Does not affect score or maturity


Overrides optimistic UI language



6. MATURITY MODEL (GATED, UNCHANGED)
Core Rule
Maturity = highest level whose prerequisites are fully satisfied.
Defined at Workflow level


Rolled up via weakest-link logic


NOT_APPLICABLE excluded


Roll-ups:
capability_maturity = min(applicable workflow maturity)
pillar_maturity     = min(applicable capability maturity)
finance_maturity    = min(applicable pillar maturity)


7. AI ROLE (STRICT, UNCHANGED)
AI may:
Generate clarifiers


Draft narratives


Explain maturity blockers


Suggest actions


AI may not:
Change scores


Decide maturity


Override gates


Infer evidence



8. ACCESS & DELEGATION MODEL (FROM v2.6.3)
Roles
Run Owner (CFO)


Delegate (Contributor)


Scope
RUN


PILLAR


CAPABILITY


MVP Rule
Delegation is database-only (concierge).
 UI is Post-MVP.

9. AUDITABILITY (FROM v2.6.3)
Every answer change is attributable


Every assignment is logged


Append-only audit trail



10. UI PRINCIPLES (GARTNER-STYLE)
Executive-first


Calm, neutral palette


No gamification


Drill-down ends at evidence


Risk overrides aesthetics



11. MVP SCOPE (UNCHANGED)
Included:
1–2 pillars


Full scoring & maturity logic


Deterministic actions


Professional UI baseline


Excluded:
Benchmarks


CMS


Multi-language


Delegation UI



12. CANONICAL SYSTEM RULE
If a score, maturity level, or insight cannot be explained by pointing to specific evidence and the user who provided it, the system is wrong.


