# 🚀 FINANCE DIAGNOSTIC PLATFORM — SYSTEM SPEC

**Version:** v2.9.0
**Status:** FINAL / FROZEN
**Supersedes:** v2.8.1
**Audience:** Product, Engineering, Design, Content
**Change Type:** Major Content Refactor (3x3x3) & New "Simulator" Engine
**Engineering Review:** Senior review complete — includes implementation warnings

---

## CHANGELOG (v2.8.1 → v2.9.0)

| Change | Before | After |
| :--- | :--- | :--- |
| **Content Hierarchy** | 5 Objectives, Shared Practices | **3x3x3 Model** (3 Themes, 9 Objectives, 28 Unique Practices) |
| **Practice Data Model** | Shared across pillars | **Strict Vertical Isolation** (Unique IDs, No sharing) |
| **Metadata Layer** | None | **Capability Tags** (People, Process, Technology, Data) |
| **New Module** | N/A | **Action Planning & Simulator** (War Room) |
| **Visualization** | Static Results | **Dynamic Radar + Metro Line Drill-Down** |
| **Database** | Diagnostic Runs only | **Action Plans Table** (User commitments) |
| **New Questions** | ~48 total | **60 total** (Includes new "Investment Rigor" practice) |

---

## 1. CORE ARCHITECTURE

### 1.1 The "Strict Vertical" Rule
To support future scalability (e.g., adding Record-to-Report, Order-to-Cash), we enforce **Strict Vertical Isolation**.
* **Rule:** A `Practice` belongs to exactly **one** `Objective`.
* **Rule:** An `Objective` belongs to exactly **one** `Theme` (and one `Pillar`).
* **No Sharing:** Do not reuse a "Reconciliation" practice ID across FP&A and Accounting. Create unique instances (e.g., `prac_fpa_reconciliations` vs `prac_r2r_reconciliations`).

### 1.2 The "Horizontal" Tagging Layer
To enable cross-functional reporting (e.g., "Show me all Automation maturity"), we add a metadata layer to Practices.
* **Field:** `capability_tags` (Array of Strings)
* **Standard Values:** `['People', 'Process', 'Technology', 'Data', 'Governance', 'Culture', 'Risk']`

---

## 2. DATA MODEL (Schema Definitions)

### 2.1 Themes (3 Total)
* **The Foundation:** Control & Trust (Budgeting, Controls, Variance)
* **The Future:** Speed & Agility (Forecasting, Drivers, Scenarios)
* **The Intelligence:** Value & Influence (Partnership, Analytics, OpEx)

### 2.2 Objectives (9 Total)
Aligned 3 per Theme.
1.  Budget Discipline
2.  Financial Controls
3.  Performance Monitoring
4.  Forecasting Agility
5.  Driver-Based Planning
6.  Scenario Modeling
7.  Strategic Influence
8.  Decision Support
9.  Operational Excellence

### 2.3 Practices (28 Total)
* Standard: 3 Practices per Objective.
* **Asymmetry:** "Strategic Influence" contains a 4th practice: **Investment Rigor**.

### 2.4 Questions (60 Total)
* **ID Format:** `fpa_l{level}_q{num}` (e.g., `fpa_l1_q01`, `fpa_l3_q53`)
* **New Fields:**
    * `help`: Contextual tooltip explaining "Why this matters."
    * `expert_action`: Structure containing `{title, recommendation, type}`.

---

## 3. NEW MODULE: ACTION PLANNING & SIMULATOR

### 3.1 Concept
A "War Room" where users select initiatives to simulate future maturity. The UI is dynamic—toggling an action immediately updates the "Projected Score" on the chart.

### 3.2 Database Schema (`action_plans`)
This table stores user commitments. It must be scalable to future pillars (hence `question_id` as TEXT).

```sql
CREATE TABLE action_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  run_id UUID REFERENCES diagnostic_runs(id) ON DELETE CASCADE,
  
  -- Maps to the JSON Question ID (e.g., 'fpa_l1_q01')
  question_id TEXT NOT NULL, 
  
  -- Plan details
  status TEXT CHECK (status IN ('planned', 'in_progress', 'completed', 'dismissed')),
  target_timeline TEXT CHECK (target_timeline IN ('6m', '12m', '24m')),
  assigned_owner TEXT, -- Optional: "John Doe"
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: One plan per question per run
  UNIQUE(run_id, question_id)
);