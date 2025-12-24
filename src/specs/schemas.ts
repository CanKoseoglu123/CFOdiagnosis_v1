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
