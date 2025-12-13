\# SPEC v2.6.4 — FROZEN



Status: LOCKED  

Last updated: YYYY-MM-DD  



This specification is canonical.



Rules:

\- No edits without version bump

\- Spec violations are BLOCKERS

\- Implementation must follow this spec, not vice versa





🚀 FINANCE DIAGNOSTIC PLATFORM — SYSTEM SPEC

Version: v2.6.4

Status: FINAL / FROZEN

&nbsp;Supersedes: v2.6.3

&nbsp;Audience: Product, Engineering, Design, Content

&nbsp;Change Type: Clarification \& formalisation (no logic change)



0\. PURPOSE OF THE SYSTEM

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





Deterministic logic for scores \& maturity





AI is explanatory, never authoritative





Multi-player safe by design







1\. CANONICAL DIAGNOSTIC LAYER MODEL (L0–L5)

This model is normative.

&nbsp;All system design, data structures, and UX must align to it.

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

FP\&A

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

&nbsp;All scores, maturity, narratives, and actions are derived.



2\. DIAGNOSTIC DESIGN \& BUILD SEQUENCE (NORMATIVE)

This sequence governs how diagnostics are defined and evolved.

&nbsp;It is not optional and prevents taxonomy-first failure.

Step

Layer(s)

Description

Principle

—

The diagnostic is built from reality upward, not from taxonomy downward.

1\. Identify L0 Workflows

L0

Capture core, repeatable finance workflows with trigger, artifact, decision.

2\. Define Objectives

L3

Define what “good” looks like from a CFO perspective.

3\. Decompose Activities

L4

Break objectives into observable recurring activities.

4\. Specify Evidence

L5

Define binary, observable evidence anchored in real artefacts.

5\. Group Capability Areas

L2

Group objectives and activities into capability areas (containers, not logic).

6\. Assign Domains \& Pillars

L1

Organise for navigation and reporting only.





3\. END-TO-END DIAGNOSTIC FLOW (UNCHANGED)

3.1 Domain Diagnostic (Context Only)

Company profile





Org structure





Global pain points





Ambition level





❌ No scoring

&nbsp;❌ No maturity



3.2 Pillar Overview \& Selection

Pillar list





Status only







3.3 Pillar Diagnostic (Context Intake)

Systems \& tools





FTEs / roles





Pillar pain points





Complexity drivers





Ongoing projects





❌ No scoring

&nbsp;Used only to condition AI narratives.



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





Themes \& actions





Tech-stack observations







3.6 Finance Report (Final Output)

Overall execution score





Finance maturity





Pillar comparison





Systemic risks





Enterprise actions







4\. SCORING MODEL (UNCHANGED)

Execution score:

sum(earned\_points) / sum(possible\_points)



TRUE → (1,1)





FALSE → (0,1)





N/A → (0,0)





If denominator = 0 → NOT\_IN\_SCOPE.



5\. CRITICAL RISK MODEL (UNCHANGED)

Any critical evidence = FALSE → CRITICAL\_RISK





Does not affect score or maturity





Overrides optimistic UI language







6\. MATURITY MODEL (GATED, UNCHANGED)

Core Rule

Maturity = highest level whose prerequisites are fully satisfied.

Defined at Workflow level





Rolled up via weakest-link logic





NOT\_APPLICABLE excluded





Roll-ups:

capability\_maturity = min(applicable workflow maturity)

pillar\_maturity     = min(applicable capability maturity)

finance\_maturity    = min(applicable pillar maturity)





7\. AI ROLE (STRICT, UNCHANGED)

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







8\. ACCESS \& DELEGATION MODEL (FROM v2.6.3)

Roles

Run Owner (CFO)





Delegate (Contributor)





Scope

RUN





PILLAR





CAPABILITY





MVP Rule

Delegation is database-only (concierge).

&nbsp;UI is Post-MVP.



9\. AUDITABILITY (FROM v2.6.3)

Every answer change is attributable





Every assignment is logged





Append-only audit trail







10\. UI PRINCIPLES (GARTNER-STYLE)

Executive-first





Calm, neutral palette





No gamification





Drill-down ends at evidence





Risk overrides aesthetics







11\. MVP SCOPE (UNCHANGED)

Included:

1–2 pillars





Full scoring \& maturity logic





Deterministic actions





Professional UI baseline





Excluded:

Benchmarks





CMS





Multi-language





Delegation UI







12\. CANONICAL SYSTEM RULE

If a score, maturity level, or insight cannot be explained by pointing to specific evidence and the user who provided it, the system is wrong.





🔒 API \& DATA MODEL — FINAL

Version: v2.6.4

Status: FROZEN

&nbsp;Supersedes: v2.6.3 API

&nbsp;Change Type: Clarification only (no logic change)



1\. CORE HIERARCHY (ENFORCED)

Pillar → Capability → Workflow → Activity → Evidence



No duplication. No shortcuts.



2\. RUN \& CONTEXT

diagnostic\_runs

\- id

\- domain

\- status

\- version

\- created\_at



run\_domain\_context

\- run\_id

\- company\_profile\_json

\- org\_structure\_json

\- global\_pain\_points\_json

\- ambition\_level





3\. PILLARS \& CONTEXT

pillars

\- id

\- name

\- order



run\_pillars

\- run\_id

\- pillar\_id

\- status



run\_pillar\_context

\- run\_id

\- pillar\_id

\- systems\_json

\- fte\_json

\- pain\_points\_json

\- complexity\_factors\_json

\- ongoing\_projects\_json





4\. CAPABILITIES

capabilities

\- id

\- pillar\_id

\- name

\- order



run\_capabilities

\- run\_id

\- capability\_id

\- status





5\. WORKFLOWS (STATIC)

workflows

\- id

\- capability\_id

\- name

\- trigger\_description

\- artifact\_description

\- decision\_description

\- criticality\_weight





6\. RUN-SPECIFIC WORKFLOW STATE

run\_workflows

\- run\_id

\- workflow\_id

\- applicability (APPLICABLE | NOT\_APPLICABLE)

\- applicability\_reason





7\. ACTIVITIES (L4)

activities

\- id

\- workflow\_id

\- name

\- description

\- order





8\. EVIDENCE (L5)

evidence\_items

\- id

\- activity\_id

\- question\_text

\- is\_critical



run\_evidence\_answers

\- run\_id

\- evidence\_id

\- status

\- justification

\- reference

\- updated\_by\_user\_id





9\. DERIVED EXECUTION SCORES

derived\_execution\_scores

\- run\_id

\- workflow\_id

\- capability\_id

\- pillar\_id

\- earned\_points

\- possible\_points

\- execution\_score

\- critical\_risk\_flag





10\. MATURITY MODEL

maturity\_levels

\- level

\- label

\- description



workflow\_maturity\_gates

\- workflow\_id

\- maturity\_level

\- required\_evidence\_ids\[]



derived\_workflow\_maturity

\- run\_id

\- workflow\_id

\- achieved\_level

\- blocking\_level

\- blocking\_evidence\_ids\[]

\- maturity\_status



derived\_maturity\_rollups

\- run\_id

\- capability\_id

\- capability\_maturity

\- pillar\_id

\- pillar\_maturity

\- finance\_maturity





11\. DELEGATION (NEW IN v2.6.3, CONFIRMED)

run\_assignments

\- id

\- run\_id

\- user\_email

\- scope\_type (RUN | PILLAR | CAPABILITY)

\- scope\_id

\- status (PENDING | ACTIVE)

\- created\_at





12\. AUDIT LOGGING

run\_audit\_logs

\- id

\- run\_id

\- user\_id

\- entity\_type (ANSWER | ASSIGNMENT)

\- entity\_id

\- previous\_value (jsonb)

\- new\_value (jsonb)

\- changed\_at





13\. FINAL GUARDRails

Evidence answers are the only authority





Applicability is run-specific





Maturity ignores NOT\_APPLICABLE





All hierarchy enforced by FK





All changes auditable





