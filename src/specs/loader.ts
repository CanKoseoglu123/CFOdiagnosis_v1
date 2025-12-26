/**
 * VS-24/VS-26: JSON Content Loaders with Zod Validation
 *
 * All content files are validated at module load time.
 * Invalid content will cause the application to fail fast.
 *
 * VS-26: Updated for flat array format (no version wrappers)
 */

import { z } from 'zod';
import {
  QuestionsFileSchema,
  PracticesFileSchema,
  InitiativesFileSchema,
  ObjectivesFileSchema,
  ThemesFileSchema,
  GatesFileSchema,
  Question,
  Practice,
  Initiative,
  Objective,
  Theme,
  GatesConfig
} from './schemas';

// Import JSON files
import questionsJson from '../../content/questions.json';
import practicesJson from '../../content/practices.json';
import initiativesJson from '../../content/initiatives.json';
import objectivesJson from '../../content/objectives.json';
import themesJson from '../../content/themes.json';
import gatesJson from '../../content/gates.json';

// === VALIDATION CACHE ===
// Validate once at module load, throw if invalid

let _questions: Question[] | null = null;
let _practices: Practice[] | null = null;
let _initiatives: Initiative[] | null = null;
let _objectives: Objective[] | null = null;
let _themes: Theme[] | null = null;
let _gates: GatesConfig | null = null;

function validateOnce<T>(
  data: unknown,
  schema: z.ZodType<T>,
  fileName: string
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues.map((e: z.ZodIssue) =>
      `  - ${e.path.join('.')}: ${e.message}`
    ).join('\n');
    throw new Error(`Invalid ${fileName}:\n${errors}`);
  }
  return result.data;
}

// === PUBLIC LOADERS ===

export function loadQuestions(): Question[] {
  if (!_questions) {
    const validated = validateOnce(questionsJson, QuestionsFileSchema, 'questions.json');
    _questions = validated.questions;
  }
  return _questions;
}

// VS-26: Now flat arrays
export function loadPractices(): Practice[] {
  if (!_practices) {
    _practices = validateOnce(practicesJson, PracticesFileSchema, 'practices.json');
  }
  return _practices;
}

export function loadInitiatives(): Initiative[] {
  if (!_initiatives) {
    _initiatives = validateOnce(initiativesJson, InitiativesFileSchema, 'initiatives.json');
  }
  return _initiatives;
}

export function loadObjectives(): Objective[] {
  if (!_objectives) {
    _objectives = validateOnce(objectivesJson, ObjectivesFileSchema, 'objectives.json');
  }
  return _objectives;
}

export function loadThemes(): Theme[] {
  if (!_themes) {
    _themes = validateOnce(themesJson, ThemesFileSchema, 'themes.json');
  }
  return _themes;
}

export function loadGates(): GatesConfig {
  if (!_gates) {
    _gates = validateOnce(gatesJson, GatesFileSchema, 'gates.json');
  }
  return _gates;
}

// === CROSS-REFERENCE VALIDATION ===

export function validateCrossReferences(): void {
  const questions = loadQuestions();
  const practices = loadPractices();
  const initiatives = loadInitiatives();
  const objectives = loadObjectives();
  const themes = loadThemes();
  const gates = loadGates();

  const questionIds = new Set(questions.map(q => q.id));
  const practiceIds = new Set(practices.map(p => p.id));
  const objectiveIds = new Set(objectives.map(o => o.id));
  const initiativeIds = new Set(initiatives.map(i => i.id));
  const themeIds = new Set(themes.map(t => t.id));

  // v2.9.0: Every question must reference valid practice and initiative
  for (const q of questions) {
    if (!practiceIds.has(q.practice_id)) {
      throw new Error(`Question ${q.id} references invalid practice: ${q.practice_id}`);
    }
    if (!initiativeIds.has(q.initiative_id)) {
      throw new Error(`Question ${q.id} references invalid initiative: ${q.initiative_id}`);
    }
  }

  // VS-26: Every practice must reference valid objective
  for (const p of practices) {
    if (!objectiveIds.has(p.objective_id)) {
      throw new Error(`Practice ${p.id} references invalid objective: ${p.objective_id}`);
    }
  }

  // Every initiative must reference valid objective and theme
  for (const i of initiatives) {
    if (!objectiveIds.has(i.objective_id)) {
      throw new Error(`Initiative ${i.id} references invalid objective: ${i.objective_id}`);
    }
    if (!themeIds.has(i.theme_id)) {
      throw new Error(`Initiative ${i.id} references invalid theme: ${i.theme_id}`);
    }
  }

  // Every objective must reference valid theme
  for (const o of objectives) {
    if (!themeIds.has(o.theme_id)) {
      throw new Error(`Objective ${o.id} references invalid theme: ${o.theme_id}`);
    }
  }

  // Critical gates must reference valid questions
  for (const qId of gates.critical_gates.l1_to_l2) {
    if (!questionIds.has(qId)) {
      throw new Error(`Critical gate l1_to_l2 references invalid question: ${qId}`);
    }
  }
  for (const qId of gates.critical_gates.l2_to_l3) {
    if (!questionIds.has(qId)) {
      throw new Error(`Critical gate l2_to_l3 references invalid question: ${qId}`);
    }
  }
}

// === CONVENIENCE LOOKUPS ===

export function getQuestionById(id: string): Question | undefined {
  return loadQuestions().find(q => q.id === id);
}

export function getQuestionsByLevel(level: 1 | 2 | 3 | 4): Question[] {
  return loadQuestions().filter(q => q.maturity_level === level);
}

export function getCriticalQuestions(): Question[] {
  return loadQuestions().filter(q => q.is_critical);
}

export function getQuestionsByInitiative(initiativeId: string): Question[] {
  return loadQuestions().filter(q => q.initiative_id === initiativeId);
}

// v2.9.0: Get questions by objective via practice_id → practice.objective_id lookup
export function getQuestionsByObjective(objectiveId: string): Question[] {
  const practices = loadPractices();
  const practiceIdsForObjective = new Set(
    practices.filter(p => p.objective_id === objectiveId).map(p => p.id)
  );
  return loadQuestions().filter(q => practiceIdsForObjective.has(q.practice_id));
}

// v2.9.0: Get practices by level via question.practice_id
export function getPracticesByLevel(level: 1 | 2 | 3 | 4): Practice[] {
  const questions = loadQuestions();
  const practices = loadPractices();
  const levelQuestions = questions.filter(q => q.maturity_level === level);
  const levelPracticeIds = new Set(levelQuestions.map(q => q.practice_id));
  return practices.filter(p => levelPracticeIds.has(p.id));
}

export function getObjectiveById(id: string): Objective | undefined {
  return loadObjectives().find(o => o.id === id);
}

export function getInitiativeById(id: string): Initiative | undefined {
  return loadInitiatives().find(i => i.id === id);
}

export function getPracticeById(id: string): Practice | undefined {
  return loadPractices().find(p => p.id === id);
}

export function getPracticesByObjective(objectiveId: string): Practice[] {
  return loadPractices().filter(p => p.objective_id === objectiveId);
}

// VS-26: Get practices by theme through objectives
export function getPracticesByTheme(themeId: string): Practice[] {
  const objectives = loadObjectives();
  const themeObjectiveIds = new Set(
    objectives.filter(o => o.theme_id === themeId).map(o => o.id)
  );
  return loadPractices().filter(p => themeObjectiveIds.has(p.objective_id));
}

export function getThemeById(id: string): Theme | undefined {
  return loadThemes().find(t => t.id === id);
}

// === SPEC BUILDER ===

import { Spec, SpecQuestion, SpecObjective, MaturityGateSpec, ActionDefinition, SpecPillar, THEMES, ThemeCode } from './types';

const LEVEL_LABELS: Record<number, string> = {
  1: 'Emerging',
  2: 'Defined',
  3: 'Managed',
  4: 'Optimized'
};

// Action definitions (8 total - 1 per objective)
const ACTIONS: ActionDefinition[] = [
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
    id: "act_fpa_l3_scenario",
    title: "Build Organizational Resilience",
    description: "Present downside scenarios leadership will engage with, activate contingency plans when triggers hit, and ensure executives understand the assumptions that could break the business.",
    rationale: "Scenario planning is useless if leadership only wants to see the good case. Resilience requires confronting uncomfortable possibilities.",
    priority: "medium"
  },
  {
    id: "act_fpa_l4_integrate",
    title: "Create Single Source of Truth",
    description: "Resolve forecast conflicts with defined processes, build trust so functional leaders abandon shadow spreadsheets, and ensure the CEO never gets surprised by conflicting numbers.",
    rationale: "Integration is about trust and alignment, not just technology. One truth, one source.",
    priority: "medium"
  },
  {
    id: "act_fpa_l4_predict",
    title: "Evolve Analytical Capabilities",
    description: "Implement basic algorithmic forecasting, investigate anomalies within 48 hours, monitor external signals, and continuously experiment with new methods.",
    rationale: "Predictive analytics starts with curiosity and discipline, not PhD-level ML. The bar is continuous improvement.",
    priority: "medium"
  }
];

const PILLARS: SpecPillar[] = [
  {
    id: "fpa",
    name: "Financial Planning & Analysis",
    description: "Budget, forecast, variance analysis, and strategic planning capabilities",
    weight: 1
  }
];

// VS-26: Updated for new objective IDs
const PURPOSE_MAP: Record<string, string> = {
  'obj_budget_discipline': 'To establish a formal financial baseline against which performance can be measured',
  'obj_financial_controls': 'To ensure data integrity, prevent fraud, and create a verifiable audit trail',
  'obj_performance_monitoring': 'To systematically identify, explain, and correct deviations from the plan',
  'obj_forecasting_agility': 'To provide a realistic, rolling view of future performance as conditions change',
  'obj_driver_based_planning': 'To link financial outcomes directly to the operational levers that drive them',
  'obj_scenario_modeling': 'To prepare the organization for volatility by modeling multiple what-if outcomes',
  'obj_strategic_influence': 'To shape strategic decisions through financial insight and business partnership',
  'obj_decision_support': 'To democratize data and enable faster business decisions',
  'obj_operational_excellence': 'To run the finance function with maximum efficiency'
};

// VS-26: Theme ordering for display purposes
const THEME_ORDER_MAP: Record<string, number> = {
  'obj_budget_discipline': 1,
  'obj_financial_controls': 2,
  'obj_performance_monitoring': 3,
  'obj_forecasting_agility': 4,
  'obj_driver_based_planning': 5,
  'obj_scenario_modeling': 6,
  'obj_strategic_influence': 7,
  'obj_decision_support': 8,
  'obj_operational_excellence': 9
};

// v2.9.0: Derive objective level from questions via practice_id
function getObjectiveLevel(objectiveId: string, questions: Question[], practices: Practice[]): 1 | 2 | 3 | 4 {
  // Get practices for this objective
  const objPracticeIds = new Set(
    practices.filter(p => p.objective_id === objectiveId).map(p => p.id)
  );
  // Get questions that link to these practices
  const objQuestions = questions.filter(q => objPracticeIds.has(q.practice_id));
  if (objQuestions.length === 0) return 1;
  // Use the most common level among questions
  const levelCounts = objQuestions.reduce((acc: Record<number, number>, q) => {
    acc[q.maturity_level] = (acc[q.maturity_level] || 0) + 1;
    return acc;
  }, {});
  const maxLevel = Object.entries(levelCounts).reduce(
    (max, [level, count]) => count > max.count ? { level: Number(level), count } : max,
    { level: 1, count: 0 }
  );
  return maxLevel.level as 1 | 2 | 3 | 4;
}

/**
 * Build a complete Spec from JSON content files
 * v2.9.0: Now uses practice_id → practice.objective_id to derive objective
 */
export function buildSpecFromContent(): Spec {
  const questions = loadQuestions();
  const practices = loadPractices();
  const objectives = loadObjectives();
  const initiatives = loadInitiatives();
  const gates = loadGates();

  // v2.9.0: Build practice_id → objective_id lookup
  const practiceToObjective: Record<string, string> = {};
  for (const p of practices) {
    practiceToObjective[p.id] = p.objective_id;
  }

  // Transform questions to SpecQuestion format
  // v2.9.0: Derive objective_id from practice_id
  const specQuestions: SpecQuestion[] = questions.map(q => ({
    id: q.id,
    pillar: 'fpa',
    weight: q.is_critical ? 2 : 1,
    text: q.text,
    is_critical: q.is_critical,
    objective_id: practiceToObjective[q.practice_id] || '',  // v2.9.0: Derived from practice
    practice_id: q.practice_id,  // v2.9.0: Include practice_id in spec
    level: q.maturity_level,
    levelLabel: LEVEL_LABELS[q.maturity_level],
    help: q.help,
    initiative_id: q.initiative_id,
    impact: q.impact as 1 | 2 | 3 | 4 | 5,
    complexity: q.complexity as 1 | 2 | 3 | 4 | 5,
    expert_action: q.expert_action
  }));

  // v2.9.0: Transform objectives with practices lookup for level derivation
  const specObjectives: SpecObjective[] = objectives.map(o => {
    const level = getObjectiveLevel(o.id, questions, practices);
    return {
      id: o.id,
      pillar_id: 'fpa',  // Hardcoded for now, single-pillar
      level,
      name: o.title,  // 'title' in new schema
      purpose: PURPOSE_MAP[o.id] || o.description,
      description: o.description,
      action_id: o.id.replace('obj_', 'act_'),
      theme: o.theme_id as ThemeCode,
      theme_order: THEME_ORDER_MAP[o.id] || 99
    };
  });

  // Build maturity gates from gates.json
  const maturityGates: MaturityGateSpec[] = [
    {
      level: 0,
      label: "Ad-hoc",
      description: "No formal financial planning processes",
      required_evidence_ids: []
    },
    {
      level: 1,
      label: gates.level_names['1'],
      description: "Basic financial processes and controls are in place",
      required_evidence_ids: specQuestions.filter(q => q.level === 1).map(q => q.id),
      threshold: 0.8
    },
    {
      level: 2,
      label: gates.level_names['2'],
      description: "Structured variance analysis and forecasting processes exist",
      required_evidence_ids: specQuestions.filter(q => q.level === 2).map(q => q.id),
      threshold: 0.8
    },
    {
      level: 3,
      label: gates.level_names['3'],
      description: "Finance is a strategic partner with organizational influence",
      required_evidence_ids: specQuestions.filter(q => q.level === 3).map(q => q.id),
      threshold: 0.8
    },
    {
      level: 4,
      label: gates.level_names['4'],
      description: "Fully integrated planning with analytical sophistication and organizational trust",
      required_evidence_ids: specQuestions.filter(q => q.level === 4).map(q => q.id),
      threshold: 0.8
    }
  ];

  return {
    version: 'v2.9.0',  // v2.9.0: practice_id schema
    pillars: PILLARS,
    questions: specQuestions,
    objectives: specObjectives,
    maturityGates,
    actions: ACTIONS,
    initiatives: initiatives.map(i => ({
      id: i.id,
      title: i.title,
      description: i.description,
      theme_id: i.theme_id as ThemeCode,
      objective_id: i.objective_id
    })),
    practices: practices.map(p => ({
      id: p.id,
      objective_id: p.objective_id,
      title: p.title,
      capability_tags: p.capability_tags || []
    }))
  };
}

/**
 * Build spec with themes for API responses
 */
export function buildSpecWithThemes() {
  return {
    ...buildSpecFromContent(),
    themes: THEMES
  };
}
