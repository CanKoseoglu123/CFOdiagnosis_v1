/**
 * N/A Configuration Loader
 *
 * Loads pillar-specific N/A rules that determine which questions
 * can be marked as "Not Applicable" during assessment.
 *
 * Architecture:
 * - Each pillar has its own na-config.json in content/pillars/{pillar}/
 * - This keeps question files clean and enables pillar-specific rules
 * - Rules are loaded once and cached for performance
 */

import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Context conditions that suggest when N/A is appropriate.
 * Keys are context field names, values are arrays of matching values.
 */
export interface NAContextConditions {
  debt_pressure?: string[];
  revenue_trajectory?: string[];
  ma_intensity?: string[];
  legal_entities?: string[];
  ownership_structure?: string[];
  [key: string]: string[] | undefined;
}

/**
 * Single N/A rule defining when a question can be marked N/A.
 */
export interface NARule {
  /** The question ID that allows N/A */
  question_id: string;
  /** Context conditions that suggest N/A (for future smart hints) */
  context_conditions?: NAContextConditions;
  /** Human-readable explanation for why this question can be N/A */
  rationale: string;
}

/**
 * Complete N/A configuration for a pillar.
 */
export interface NAConfig {
  pillar: string;
  version: string;
  description?: string;
  na_rules: NARule[];
}

// =============================================================================
// ZOD SCHEMAS FOR VALIDATION
// =============================================================================

const NAContextConditionsSchema = z.record(z.string(), z.array(z.string())).optional();

const NARuleSchema = z.object({
  question_id: z.string().regex(/^fpa_q\d{3}$/, 'Question ID must match pattern fpa_qNNN'),
  context_conditions: NAContextConditionsSchema,
  rationale: z.string().min(10, 'Rationale must be at least 10 characters')
});

const NAConfigSchema = z.object({
  pillar: z.string(),
  version: z.string(),
  description: z.string().optional(),
  na_rules: z.array(NARuleSchema)
});

// Type assertion helper for Zod -> NAConfig
type ZodNAConfig = z.infer<typeof NAConfigSchema>;

// =============================================================================
// CACHE
// =============================================================================

const _naConfigCache: Map<string, NAConfig> = new Map();

// =============================================================================
// LOADER FUNCTIONS
// =============================================================================

/**
 * Load N/A configuration for a pillar.
 * Validates the JSON against the schema and caches the result.
 *
 * @param pillar - The pillar ID (e.g., 'fpa')
 * @returns The validated NAConfig
 * @throws Error if config file not found or validation fails
 */
export function loadNAConfig(pillar: string): NAConfig {
  // Check cache first
  const cached = _naConfigCache.get(pillar);
  if (cached) {
    return cached;
  }

  // Build path to config file
  const configPath = path.join(
    __dirname,
    '..',
    '..',
    'content',
    'pillars',
    pillar,
    'na-config.json'
  );

  // Check if file exists
  if (!fs.existsSync(configPath)) {
    // Return empty config if no N/A rules defined for pillar
    const emptyConfig: NAConfig = {
      pillar,
      version: '1.0.0',
      na_rules: []
    };
    _naConfigCache.set(pillar, emptyConfig);
    return emptyConfig;
  }

  // Load and parse JSON
  const rawContent = fs.readFileSync(configPath, 'utf-8');
  let jsonData: unknown;
  try {
    jsonData = JSON.parse(rawContent);
  } catch (e) {
    throw new Error(`Invalid JSON in ${configPath}: ${e}`);
  }

  // Validate against schema
  const result = NAConfigSchema.safeParse(jsonData);
  if (!result.success) {
    const errors = result.error.issues.map((e: z.ZodIssue) =>
      `  - ${e.path.join('.')}: ${e.message}`
    ).join('\n');
    throw new Error(`Invalid na-config.json for pillar "${pillar}":\n${errors}`);
  }

  // Cache and return (cast to NAConfig since Zod inferred type is compatible)
  const config = result.data as NAConfig;
  _naConfigCache.set(pillar, config);
  return config;
}

/**
 * Check if a question allows N/A answers.
 *
 * @param pillar - The pillar ID
 * @param questionId - The question ID to check
 * @returns true if the question allows N/A
 */
export function allowsNA(pillar: string, questionId: string): boolean {
  const config = loadNAConfig(pillar);
  return config.na_rules.some(rule => rule.question_id === questionId);
}

/**
 * Get the N/A rule for a specific question.
 *
 * @param pillar - The pillar ID
 * @param questionId - The question ID
 * @returns The NARule if found, undefined otherwise
 */
export function getNARule(pillar: string, questionId: string): NARule | undefined {
  const config = loadNAConfig(pillar);
  return config.na_rules.find(r => r.question_id === questionId);
}

/**
 * Get context conditions that suggest N/A for a question.
 *
 * @param pillar - The pillar ID
 * @param questionId - The question ID
 * @returns The context conditions if defined, null otherwise
 */
export function getNAConditions(pillar: string, questionId: string): NAContextConditions | null {
  const rule = getNARule(pillar, questionId);
  return rule?.context_conditions ?? null;
}

/**
 * Get all question IDs that allow N/A for a pillar.
 *
 * @param pillar - The pillar ID
 * @returns Array of question IDs that allow N/A
 */
export function getNAQuestionIds(pillar: string): string[] {
  const config = loadNAConfig(pillar);
  return config.na_rules.map(r => r.question_id);
}

/**
 * Check if a context matches the N/A conditions for a question.
 * Used for future "smart hint" functionality.
 *
 * @param pillar - The pillar ID
 * @param questionId - The question ID
 * @param context - The company context to check
 * @returns true if context suggests N/A is appropriate
 */
export function contextSuggestsNA(
  pillar: string,
  questionId: string,
  context: Record<string, unknown>
): boolean {
  const conditions = getNAConditions(pillar, questionId);
  if (!conditions) {
    return false;
  }

  // Check if ALL conditions match (AND logic)
  for (const [field, allowedValues] of Object.entries(conditions)) {
    if (!allowedValues) continue;

    const contextValue = context[field];
    if (typeof contextValue !== 'string') {
      return false; // Context field missing or wrong type
    }

    if (!allowedValues.includes(contextValue)) {
      return false; // Value doesn't match any allowed value
    }
  }

  return true;
}

/**
 * Clear the cache (useful for testing).
 */
export function clearNAConfigCache(): void {
  _naConfigCache.clear();
}
