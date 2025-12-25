/**
 * VS-24: Zod Schemas for Content Validation
 *
 * All content files are validated against these schemas at build time.
 * Invalid content will cause the build to fail fast.
 */

import { z } from 'zod';

// === ENUMS ===

export const MaturityLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4)
]);

export const ActionTypeSchema = z.enum([
  'quick_win',
  'structural',
  'behavioral',
  'governance'
]);

export const ThemeIdSchema = z.enum([
  'foundation',
  'future',
  'intelligence'
]);

// === EXPERT ACTION ===

export const ExpertActionSchema = z.object({
  title: z.string().min(5).max(100),
  recommendation: z.string().min(20).max(500),
  type: ActionTypeSchema
});

// === QUESTION ===

export const QuestionSchema = z.object({
  id: z.string().regex(/^fpa_l[1-4]_q\d{2}$/, 'Invalid question ID format'),
  text: z.string().min(20).max(300),
  help: z.string().min(10).max(500),
  maturity_level: MaturityLevelSchema,
  is_critical: z.boolean(),
  objective_id: z.string().regex(/^obj_fpa_/, 'Must start with obj_fpa_'),
  initiative_id: z.string().regex(/^init_/, 'Must start with init_'),
  impact: z.number().int().min(1).max(5),
  complexity: z.number().int().min(1).max(5),
  expert_action: ExpertActionSchema
});

export const QuestionsFileSchema = z.object({
  version: z.string(),
  pillar: z.literal('fpa'),
  questions: z.array(QuestionSchema)
    .min(48)
    .max(48)
    .refine((items) => {
      const ids = items.map(i => i.id);
      return new Set(ids).size === ids.length;
    }, { message: "Duplicate question IDs found" })
});

// === PRACTICE ===

export const PracticeSchema = z.object({
  id: z.string().regex(/^prac_/, 'Must start with prac_'),
  name: z.string().min(3).max(50),
  short_name: z.string().min(2).max(30),
  level: MaturityLevelSchema,
  question_ids: z.array(z.string()).min(1).max(6)
});

export const PracticesFileSchema = z.object({
  version: z.string(),
  practices: z.array(PracticeSchema)
    .min(21)
    .max(21)
    .refine((items) => {
      const ids = items.map(i => i.id);
      return new Set(ids).size === ids.length;
    }, { message: "Duplicate practice IDs found" })
});

// === INITIATIVE ===

export const InitiativeSchema = z.object({
  id: z.string().regex(/^init_/, 'Must start with init_'),
  title: z.string().min(10).max(100),
  description: z.string().min(50).max(500),
  theme_id: ThemeIdSchema,
  objective_id: z.string().regex(/^obj_fpa_/, 'Must start with obj_fpa_')
});

export const InitiativesFileSchema = z.object({
  version: z.string(),
  initiatives: z.array(InitiativeSchema)
    .min(9)
    .max(9)
    .refine((items) => {
      const ids = items.map(i => i.id);
      return new Set(ids).size === ids.length;
    }, { message: "Duplicate initiative IDs found" })
});

// === OBJECTIVE ===

export const ObjectiveSchema = z.object({
  id: z.string().regex(/^obj_fpa_/, 'Must start with obj_fpa_'),
  name: z.string().min(3).max(50),
  description: z.string().min(10).max(200),
  pillar: z.literal('fpa'),
  level: MaturityLevelSchema,
  theme_id: ThemeIdSchema,
  thresholds: z.object({
    green: z.number().int().min(1).max(100),
    yellow: z.number().int().min(1).max(100)
  }).refine(data => data.green > data.yellow, {
    message: 'Green threshold must be higher than yellow'
  })
});

export const ObjectivesFileSchema = z.object({
  version: z.string(),
  objectives: z.array(ObjectiveSchema)
    .min(8)
    .max(8)
    .refine((items) => {
      const ids = items.map(i => i.id);
      return new Set(ids).size === ids.length;
    }, { message: "Duplicate objective IDs found" })
});

// === GATES ===

export const GatesFileSchema = z.object({
  version: z.string(),
  score_thresholds: z.object({
    level_2: z.number().int(),
    level_3: z.number().int(),
    level_4: z.number().int()
  }),
  critical_gates: z.object({
    l1_to_l2: z.array(z.string()).min(4).max(4),
    l2_to_l3: z.array(z.string()).min(4).max(4)
  }),
  level_names: z.record(z.string(), z.string())
});

// === TYPE EXPORTS ===

export type Question = z.infer<typeof QuestionSchema>;
export type Practice = z.infer<typeof PracticeSchema>;
export type Initiative = z.infer<typeof InitiativeSchema>;
export type Objective = z.infer<typeof ObjectiveSchema>;
export type ExpertAction = z.infer<typeof ExpertActionSchema>;
export type MaturityLevel = z.infer<typeof MaturityLevelSchema>;
export type ActionType = z.infer<typeof ActionTypeSchema>;
export type ThemeId = z.infer<typeof ThemeIdSchema>;
export type GatesConfig = z.infer<typeof GatesFileSchema>;

// === THEME CONFIG (Hardcoded - rarely changes) ===

export const THEME_CONFIG: Record<ThemeId, { label: string; description: string }> = {
  foundation: {
    label: "The Foundation",
    description: "Build the basics: budgeting, controls, reporting"
  },
  future: {
    label: "The Future",
    description: "See what's coming: forecasting, visibility"
  },
  intelligence: {
    label: "The Intelligence",
    description: "Drive decisions: strategic influence, analytics"
  }
};

// === VS25: CONTEXT INTAKE SCHEMAS ===

// Company Context Enums
export const IndustrySchema = z.enum([
  'saas',
  'manufacturing',
  'retail_ecom',
  'professional_services',
  'fintech',
  'healthcare',
  'other'
]);

export const RevenueRangeSchema = z.enum([
  'under_10m',
  '10m_50m',
  '50m_250m',
  'over_250m'
]);

export const EmployeeCountSchema = z.enum([
  '1_50',
  '51_200',
  '201_1000',
  'over_1000'
]);

export const FinanceStructureSchema = z.enum([
  'centralized',
  'decentralized',
  'hybrid'
]);

export const ChangeAppetiteSchema = z.enum([
  'optimize',    // Fix basics, low disruption
  'standardize', // Scale, medium disruption
  'transform'    // Reinvent, high disruption
]);

// Pillar Context Enums
export const SystemsSchema = z.enum([
  'excel_sheets',      // Manual
  'anaplan_adaptive',  // Modern CPM
  'sap_oracle',        // Legacy ERP
  'bi_tools',          // Tableau, PowerBI
  'other'
]);

export const PainPointsSchema = z.enum([
  'long_budget_cycles',
  'data_accuracy',
  'manual_consolidation',
  'lack_of_insights',
  'business_partnership'
]);

// Company Context Object
export const CompanyContextSchema = z.object({
  name: z.string().min(1).max(100),
  industry: IndustrySchema,
  revenue_range: RevenueRangeSchema,
  employee_count: EmployeeCountSchema,
  finance_structure: FinanceStructureSchema,
  change_appetite: ChangeAppetiteSchema
});

// Pillar Context Object (FP&A Specific)
export const PillarContextSchema = z.object({
  ftes: z.number().min(0).max(100).multipleOf(0.5),
  systems: z.array(SystemsSchema).min(1).max(5),
  complexity: z.object({
    business_units: z.number().int().min(1).max(50),
    currencies: z.number().int().min(1).max(20),
    legal_entities: z.number().int().min(1).max(50)
  }),
  pain_points: z.array(PainPointsSchema).max(3),
  ongoing_projects: z.string().max(200).optional()
});

// Full Context v1 Schema
export const DiagnosticContextV1Schema = z.object({
  version: z.literal('v1'),
  company: CompanyContextSchema,
  pillar: PillarContextSchema
});

// Legacy Context Schema (pre-v1)
export const LegacyContextSchema = z.object({
  company_name: z.string().optional(),
  industry: z.string().optional()
});

// Union of all context versions
export const DiagnosticContextSchema = z.union([
  DiagnosticContextV1Schema,
  LegacyContextSchema
]);

// Type exports
export type Industry = z.infer<typeof IndustrySchema>;
export type RevenueRange = z.infer<typeof RevenueRangeSchema>;
export type EmployeeCount = z.infer<typeof EmployeeCountSchema>;
export type FinanceStructure = z.infer<typeof FinanceStructureSchema>;
export type ChangeAppetite = z.infer<typeof ChangeAppetiteSchema>;
export type Systems = z.infer<typeof SystemsSchema>;
export type PainPoints = z.infer<typeof PainPointsSchema>;
export type CompanyContext = z.infer<typeof CompanyContextSchema>;
export type PillarContext = z.infer<typeof PillarContextSchema>;
export type DiagnosticContextV1 = z.infer<typeof DiagnosticContextV1Schema>;
export type DiagnosticContext = z.infer<typeof DiagnosticContextSchema>;

// === CONTEXT DISPLAY LABELS ===

export const INDUSTRY_LABELS: Record<Industry, string> = {
  saas: 'SaaS',
  manufacturing: 'Manufacturing',
  retail_ecom: 'Retail / E-commerce',
  professional_services: 'Professional Services',
  fintech: 'Fintech',
  healthcare: 'Healthcare',
  other: 'Other'
};

export const REVENUE_RANGE_LABELS: Record<RevenueRange, string> = {
  under_10m: '< $10M',
  '10m_50m': '$10M - $50M',
  '50m_250m': '$50M - $250M',
  over_250m: '$250M+'
};

export const EMPLOYEE_COUNT_LABELS: Record<EmployeeCount, string> = {
  '1_50': '1 - 50',
  '51_200': '51 - 200',
  '201_1000': '201 - 1,000',
  over_1000: '1,000+'
};

export const FINANCE_STRUCTURE_LABELS: Record<FinanceStructure, string> = {
  centralized: 'Centralized',
  decentralized: 'Decentralized (BU-led)',
  hybrid: 'Hybrid'
};

export const CHANGE_APPETITE_LABELS: Record<ChangeAppetite, { label: string; description: string }> = {
  optimize: { label: 'Optimize', description: 'Fix basics, low disruption' },
  standardize: { label: 'Standardize', description: 'Scale processes, medium disruption' },
  transform: { label: 'Transform', description: 'Reinvent the function, high disruption' }
};

export const SYSTEMS_LABELS: Record<Systems, string> = {
  excel_sheets: 'Excel / Google Sheets',
  anaplan_adaptive: 'Anaplan / Adaptive Insights',
  sap_oracle: 'SAP / Oracle EPM',
  bi_tools: 'BI Tools (Tableau, PowerBI)',
  other: 'Other'
};

export const PAIN_POINTS_LABELS: Record<PainPoints, string> = {
  long_budget_cycles: 'Long Budget Cycles',
  data_accuracy: 'Data Accuracy / Trust Issues',
  manual_consolidation: 'Manual Consolidation',
  lack_of_insights: 'Lack of Actionable Insights',
  business_partnership: 'Weak Business Partnership'
};
