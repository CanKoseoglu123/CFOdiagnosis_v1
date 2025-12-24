/**
 * VS-24: JSON Content Loaders with Zod Validation
 *
 * All content files are validated at module load time.
 * Invalid content will cause the application to fail fast.
 */

import { z } from 'zod';
import {
  QuestionsFileSchema,
  PracticesFileSchema,
  InitiativesFileSchema,
  ObjectivesFileSchema,
  GatesFileSchema,
  Question,
  Practice,
  Initiative,
  Objective,
  GatesConfig
} from './schemas';

// Import JSON files
import questionsJson from '../../content/questions.json';
import practicesJson from '../../content/practices.json';
import initiativesJson from '../../content/initiatives.json';
import objectivesJson from '../../content/objectives.json';
import gatesJson from '../../content/gates.json';

// === VALIDATION CACHE ===
// Validate once at module load, throw if invalid

let _questions: Question[] | null = null;
let _practices: Practice[] | null = null;
let _initiatives: Initiative[] | null = null;
let _objectives: Objective[] | null = null;
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

export function loadPractices(): Practice[] {
  if (!_practices) {
    const validated = validateOnce(practicesJson, PracticesFileSchema, 'practices.json');
    _practices = validated.practices;
  }
  return _practices;
}

export function loadInitiatives(): Initiative[] {
  if (!_initiatives) {
    const validated = validateOnce(initiativesJson, InitiativesFileSchema, 'initiatives.json');
    _initiatives = validated.initiatives;
  }
  return _initiatives;
}

export function loadObjectives(): Objective[] {
  if (!_objectives) {
    const validated = validateOnce(objectivesJson, ObjectivesFileSchema, 'objectives.json');
    _objectives = validated.objectives;
  }
  return _objectives;
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
  const gates = loadGates();

  const questionIds = new Set(questions.map(q => q.id));
  const objectiveIds = new Set(objectives.map(o => o.id));
  const initiativeIds = new Set(initiatives.map(i => i.id));

  // Every question must reference valid objective and initiative
  for (const q of questions) {
    if (!objectiveIds.has(q.objective_id)) {
      throw new Error(`Question ${q.id} references invalid objective: ${q.objective_id}`);
    }
    if (!initiativeIds.has(q.initiative_id)) {
      throw new Error(`Question ${q.id} references invalid initiative: ${q.initiative_id}`);
    }
  }

  // Every practice must reference valid questions
  for (const p of practices) {
    for (const qId of p.question_ids) {
      if (!questionIds.has(qId)) {
        throw new Error(`Practice ${p.id} references invalid question: ${qId}`);
      }
    }
  }

  // Every initiative must reference valid objective
  for (const i of initiatives) {
    if (!objectiveIds.has(i.objective_id)) {
      throw new Error(`Initiative ${i.id} references invalid objective: ${i.objective_id}`);
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

export function getQuestionsByObjective(objectiveId: string): Question[] {
  return loadQuestions().filter(q => q.objective_id === objectiveId);
}

export function getPracticesByLevel(level: 1 | 2 | 3 | 4): Practice[] {
  return loadPractices().filter(p => p.level === level);
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

const PURPOSE_MAP: Record<string, string> = {
  'obj_fpa_l1_budget': 'To establish a formal financial baseline against which performance can be measured',
  'obj_fpa_l1_control': 'To ensure data integrity, prevent fraud, and create a verifiable audit trail',
  'obj_fpa_l2_variance': 'To systematically identify, explain, and correct deviations from the plan',
  'obj_fpa_l2_forecast': 'To provide a realistic, rolling view of future performance as conditions change',
  'obj_fpa_l3_driver': 'To link financial outcomes directly to the operational levers that drive them',
  'obj_fpa_l3_scenario': 'To prepare the organization for volatility by modeling multiple what-if outcomes',
  'obj_fpa_l4_integrate': 'To unify data across functions into a single source of truth',
  'obj_fpa_l4_predict': 'To use algorithms to automate baseline predictions and flag anomalies in real-time'
};

const THEME_ORDER_MAP: Record<string, number> = {
  'obj_fpa_l1_budget': 1,
  'obj_fpa_l1_control': 2,
  'obj_fpa_l2_variance': 3,
  'obj_fpa_l2_forecast': 4,
  'obj_fpa_l3_driver': 5,
  'obj_fpa_l4_integrate': 6,
  'obj_fpa_l3_scenario': 7,
  'obj_fpa_l4_predict': 8
};

/**
 * Build a complete Spec from JSON content files
 */
export function buildSpecFromContent(): Spec {
  const questions = loadQuestions();
  const objectives = loadObjectives();
  const initiatives = loadInitiatives();
  const gates = loadGates();

  // Transform questions to SpecQuestion format
  const specQuestions: SpecQuestion[] = questions.map(q => ({
    id: q.id,
    pillar: 'fpa',
    weight: q.is_critical ? 2 : 1,
    text: q.text,
    is_critical: q.is_critical,
    objective_id: q.objective_id,
    level: q.maturity_level,
    levelLabel: LEVEL_LABELS[q.maturity_level],
    help: q.help,
    initiative_id: q.initiative_id,
    impact: q.impact as 1 | 2 | 3 | 4 | 5,
    complexity: q.complexity as 1 | 2 | 3 | 4 | 5,
    expert_action: q.expert_action
  }));

  // Transform objectives to SpecObjective format
  const specObjectives: SpecObjective[] = objectives.map(o => ({
    id: o.id,
    pillar_id: o.pillar,
    level: o.level,
    name: o.name,
    purpose: PURPOSE_MAP[o.id],
    description: o.description,
    action_id: o.id.replace('obj_', 'act_'),
    theme: o.theme_id as ThemeCode,
    theme_order: THEME_ORDER_MAP[o.id]
  }));

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
    version: 'v2.8.1',
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
