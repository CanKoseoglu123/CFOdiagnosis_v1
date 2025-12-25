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

// EUR-based revenue ranges
export const RevenueRangeSchema = z.enum([
  '0_50m',
  '50m_100m',
  '100m_250m',
  '250m_500m',
  'over_500m'
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

export const OwnershipStructureSchema = z.enum([
  'pe_backed',
  'listed',
  'family_owned',
  'corporate_subsidiary'
]);

export const ChangeAppetiteSchema = z.enum([
  'optimize',    // Fix basics, low disruption
  'standardize', // Scale, medium disruption
  'transform'    // Reinvent, high disruption
]);

// Finance FTE ranges
export const FinanceFTERangeSchema = z.enum([
  '1_10',
  '10_20',
  '21_35',
  '36_50',
  'over_50'
]);

// Legal entity ranges
export const LegalEntityRangeSchema = z.enum([
  '1_3',
  '4_10',
  '11_25',
  'over_25'
]);

// Pillar Context Enums

// Expanded planning tools (13 options)
export const PlanningToolsSchema = z.enum([
  'excel',
  'adaptive_insights',
  'anaplan',
  'planful',
  'oracle_pbcs',
  'sap_analytics',
  'board',
  'prophix',
  'workday_adaptive',
  'power_bi',
  'tableau',
  'hyperion',
  'tm1_cognos'
]);

// Team size ranges
export const TeamSizeSchema = z.enum([
  '1_3',
  '4_10',
  '11_25',
  '26_50',
  'over_50'
]);

// Forecast frequency
export const ForecastFrequencySchema = z.enum([
  'annual',
  'semi_annual',
  'quarterly',
  'monthly',
  'rolling'
]);

// Budget process types
export const BudgetProcessSchema = z.enum([
  'top_down',
  'bottom_up',
  'hybrid',
  'driver_based',
  'zero_based'
]);

// Expanded pain points (8 options)
export const PainPointsSchema = z.enum([
  'forecast_accuracy',
  'slow_budget_cycles',
  'limited_business_buyin',
  'manual_consolidation',
  'disconnected_tools',
  'lack_driver_models',
  'poor_scenario_planning',
  'weak_business_partnering'
]);

// User roles
export const UserRoleSchema = z.enum([
  'cfo',
  'finance_director',
  'fpa_manager',
  'fpa_analyst',
  'controller',
  'business_partner'
]);

// Company Context Object
export const CompanyContextSchema = z.object({
  name: z.string().min(1).max(100),
  industry: IndustrySchema,
  revenue_range: RevenueRangeSchema,
  employee_count: EmployeeCountSchema,
  finance_ftes: FinanceFTERangeSchema.optional(),
  legal_entities: LegalEntityRangeSchema.optional(),
  finance_structure: FinanceStructureSchema,
  ownership_structure: OwnershipStructureSchema,
  change_appetite: ChangeAppetiteSchema
});

// Pillar Context Object (FP&A Specific)
export const PillarContextSchema = z.object({
  // Tools & Technology
  tools: z.array(PlanningToolsSchema).min(1).max(13),
  other_tool: z.string().max(100).optional(),
  // Team & Process
  team_size: TeamSizeSchema.optional(),
  forecast_frequency: ForecastFrequencySchema.optional(),
  budget_process: BudgetProcessSchema.optional(),
  // Pain Points
  pain_points: z.array(PainPointsSchema).max(5).optional(),
  other_pain_point: z.string().max(100).optional(),
  // Additional Context
  user_role: UserRoleSchema.optional(),
  other_role: z.string().max(100).optional(),
  additional_context: z.string().max(500).optional()
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
export type OwnershipStructure = z.infer<typeof OwnershipStructureSchema>;
export type ChangeAppetite = z.infer<typeof ChangeAppetiteSchema>;
export type FinanceFTERange = z.infer<typeof FinanceFTERangeSchema>;
export type LegalEntityRange = z.infer<typeof LegalEntityRangeSchema>;
export type PlanningTools = z.infer<typeof PlanningToolsSchema>;
export type TeamSize = z.infer<typeof TeamSizeSchema>;
export type ForecastFrequency = z.infer<typeof ForecastFrequencySchema>;
export type BudgetProcess = z.infer<typeof BudgetProcessSchema>;
export type PainPoints = z.infer<typeof PainPointsSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
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

// EUR-based revenue labels
export const REVENUE_RANGE_LABELS: Record<RevenueRange, string> = {
  '0_50m': '0 - 50m€',
  '50m_100m': '50 - 100m€',
  '100m_250m': '100 - 250m€',
  '250m_500m': '250 - 500m€',
  over_500m: '500m€+'
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

export const OWNERSHIP_STRUCTURE_LABELS: Record<OwnershipStructure, string> = {
  pe_backed: 'PE Backed',
  listed: 'Listed',
  family_owned: 'Family Owned',
  corporate_subsidiary: 'Corporate Subsidiary'
};

export const CHANGE_APPETITE_LABELS: Record<ChangeAppetite, { label: string; description: string }> = {
  optimize: { label: 'Optimize', description: 'Fix basics, low disruption' },
  standardize: { label: 'Standardize', description: 'Scale processes, medium disruption' },
  transform: { label: 'Transform', description: 'Reinvent the function, high disruption' }
};

export const FINANCE_FTE_LABELS: Record<FinanceFTERange, string> = {
  '1_10': '1 - 10',
  '10_20': '10 - 20',
  '21_35': '21 - 35',
  '36_50': '36 - 50',
  over_50: '50+'
};

export const LEGAL_ENTITY_LABELS: Record<LegalEntityRange, string> = {
  '1_3': '1 - 3',
  '4_10': '4 - 10',
  '11_25': '11 - 25',
  over_25: '25+'
};

export const PLANNING_TOOLS_LABELS: Record<PlanningTools, string> = {
  excel: 'Excel (primary)',
  adaptive_insights: 'Adaptive Insights',
  anaplan: 'Anaplan',
  planful: 'Planful',
  oracle_pbcs: 'Oracle PBCS/EPBCS',
  sap_analytics: 'SAP Analytics Cloud',
  board: 'Board',
  prophix: 'Prophix',
  workday_adaptive: 'Workday Adaptive Planning',
  power_bi: 'Power BI',
  tableau: 'Tableau',
  hyperion: 'Hyperion',
  tm1_cognos: 'TM1/Cognos'
};

export const TEAM_SIZE_LABELS: Record<TeamSize, string> = {
  '1_3': '1 - 3',
  '4_10': '4 - 10',
  '11_25': '11 - 25',
  '26_50': '26 - 50',
  over_50: '50+'
};

export const FORECAST_FREQUENCY_LABELS: Record<ForecastFrequency, string> = {
  annual: 'Annual only',
  semi_annual: 'Semi-annual',
  quarterly: 'Quarterly',
  monthly: 'Monthly',
  rolling: 'Rolling'
};

export const BUDGET_PROCESS_LABELS: Record<BudgetProcess, string> = {
  top_down: 'Top-down only',
  bottom_up: 'Bottom-up only',
  hybrid: 'Hybrid (top-down + bottom-up)',
  driver_based: 'Driver-based',
  zero_based: 'Zero-based budgeting'
};

export const PAIN_POINTS_LABELS: Record<PainPoints, string> = {
  forecast_accuracy: 'Forecast accuracy issues',
  slow_budget_cycles: 'Slow budget cycles',
  limited_business_buyin: 'Limited business buy-in',
  manual_consolidation: 'Manual consolidation',
  disconnected_tools: 'Disconnected planning tools',
  lack_driver_models: 'Lack of driver-based models',
  poor_scenario_planning: 'Poor scenario planning',
  weak_business_partnering: 'Weak business partnering'
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  cfo: 'CFO',
  finance_director: 'Finance Director',
  fpa_manager: 'FP&A Manager',
  fpa_analyst: 'FP&A Analyst',
  controller: 'Controller',
  business_partner: 'Business Partner'
};
