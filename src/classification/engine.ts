// VS-27b: Classification Engine
// Classifies companies into one of 6 personas based on 9 context inputs

import {
  PersonaId,
  PersonaDefinition,
  PersonasConfig,
  ScoringMatrix,
  ClassificationContext,
  ClassificationResult,
  DetectedFlag,
  DetectedModifier,
  ScoringDetail,
  ConfidenceLevel,
  ValidationResult,
  ScoreMap
} from './types';

// Import default data (loaded at runtime)
import defaultPersonas from '../data/personas.json';
import defaultScoringMatrix from '../data/scoringMatrix.json';

// ============================================
// Constants
// ============================================

const PERSONA_IDS: PersonaId[] = ['platform', 'growth', 'margin', 'governance', 'stewardship', 'resilience'];

const REQUIRED_FIELDS = [
  'ownership_structure',
  'change_appetite',
  'legal_entities',
  'revenue_trajectory',
  'debt_pressure',
  'ma_intensity',
  'gross_margin_band',
  'audit_rigor',
  'erp_strategy'
] as const;

// Mapping for legacy legal_entities values to classification bands
const LEGAL_ENTITIES_MAPPING: Record<string, string> = {
  '1_3': 'under_6',
  '4_10': 'under_6',
  '1_5': 'under_6',
  '6_10': '6_to_25',
  '11_25': '6_to_25',
  '26_50': 'over_25',
  '50_plus': 'over_25'
};

// ============================================
// Validation
// ============================================

/**
 * Validates that all 9 required classification fields are present
 */
export function validateContext(context: Partial<ClassificationContext>): ValidationResult {
  const missing = REQUIRED_FIELDS.filter(field => !context[field as keyof ClassificationContext]);

  return {
    valid: missing.length === 0,
    missing: missing as string[],
    complete: REQUIRED_FIELDS.length - missing.length,
    total: REQUIRED_FIELDS.length
  };
}

// ============================================
// Value Normalization
// ============================================

/**
 * Normalizes legal_entities value to classification bands
 */
function normalizeLegalEntities(value: string): string {
  return LEGAL_ENTITIES_MAPPING[value] || value;
}

/**
 * Normalizes context values for consistent scoring
 */
function normalizeContext(context: ClassificationContext): ClassificationContext {
  return {
    ...context,
    legal_entities: normalizeLegalEntities(context.legal_entities)
  };
}

// ============================================
// Tie-Breaker Logic
// ============================================

/**
 * Tie-breaker based on stakeholder pressure indicators
 * Used when top two personas are within 2 points
 */
function applyTieBreaker(
  context: ClassificationContext,
  persona1: PersonaId,
  persona2: PersonaId
): PersonaId {
  const stakeholderPriority: Record<PersonaId, string[]> = {
    resilience: ['restructuring', 'severe_decline'],
    governance: ['public', 'listed', 'group_global'],
    platform: ['over_25', '26_50', '50_plus', '3_plus_deals', 'fragmented'],
    growth: ['vc_backed', 'hyper_growth'],
    stewardship: ['family_owned', 'maintain'],
    margin: ['low', 'decline']
  };

  const contextValues = Object.values(context);

  // Check each persona's trigger values
  for (const persona of [persona1, persona2]) {
    const triggers = stakeholderPriority[persona] || [];
    for (const trigger of triggers) {
      if (contextValues.includes(trigger)) {
        return persona;
      }
    }
  }

  // Default: return first (higher raw score)
  return persona1;
}

// ============================================
// Confidence Calculation
// ============================================

/**
 * Calculate confidence level based on score spread and data completeness
 */
function calculateConfidence(
  scores: ScoreMap,
  matrix: ScoringMatrix
): ConfidenceLevel {
  // Factor 1: Score spread (bigger gap = more confident)
  const sortedScores = Object.values(scores).sort((a, b) => b - a);
  const scoreSpread = sortedScores[0] - sortedScores[1];

  // Factor 2: Primary score strength relative to max possible
  const maxPossible = matrix.inputs.reduce((sum, input) => {
    const maxForInput = Math.max(
      ...input.values.map(v =>
        Math.max(...Object.values(v.scores || {}))
      )
    );
    return sum + maxForInput;
  }, 0);
  const scoreStrength = sortedScores[0] / maxPossible;

  // Simplified confidence (all fields are now mandatory)
  if (scoreSpread >= 5 && scoreStrength >= 0.4) return 'high';
  if (scoreSpread >= 3 && scoreStrength >= 0.25) return 'medium';
  return 'low';
}

// ============================================
// Main Classification Function
// ============================================

/**
 * Main classification function
 * @param context - Company context with 9 classification inputs
 * @param customMatrix - Optional custom scoring matrix (from admin)
 * @returns Classification result with persona, scores, flags, modifiers
 */
export function classifyCompany(
  context: ClassificationContext,
  customMatrix?: ScoringMatrix
): ClassificationResult {
  const matrix = customMatrix || (defaultScoringMatrix as ScoringMatrix);
  const personas = defaultPersonas as PersonasConfig;

  // Normalize context values
  const normalizedContext = normalizeContext(context);

  // Step 1: Initialize scores
  const scores: ScoreMap = {
    platform: 0,
    growth: 0,
    margin: 0,
    governance: 0,
    stewardship: 0,
    resilience: 0
  };

  // Step 2: Calculate scores from each input
  const scoringDetails: ScoringDetail[] = [];

  for (const input of matrix.inputs) {
    const contextValue = normalizedContext[input.id as keyof ClassificationContext];
    if (!contextValue) continue;

    const valueConfig = input.values.find(v => v.value === contextValue);
    if (!valueConfig || !valueConfig.scores) continue;

    // Add scores for this input
    for (const [personaId, points] of Object.entries(valueConfig.scores)) {
      if (points > 0) {
        scores[personaId as PersonaId] += points;
        scoringDetails.push({
          input: input.id,
          value: contextValue,
          persona: personaId as PersonaId,
          points: points
        });
      }
    }
  }

  // Step 3: Find primary persona (highest score)
  const sortedPersonas = PERSONA_IDS
    .map(id => ({ id, score: scores[id] }))
    .sort((a, b) => b.score - a.score);

  let primaryId = sortedPersonas[0].id;
  const primaryScore = sortedPersonas[0].score;

  // Step 4: Apply tie-breaker if within 2 points
  if (sortedPersonas.length > 1) {
    const secondaryScore = sortedPersonas[1].score;
    if (primaryScore - secondaryScore <= 2) {
      primaryId = applyTieBreaker(
        normalizedContext,
        sortedPersonas[0].id,
        sortedPersonas[1].id
      );
    }
  }

  // Step 5: Determine flags (secondary influences)
  const flags: DetectedFlag[] = [];
  const flagThreshold = primaryScore * (matrix.flags?.threshold || 0.75);

  for (const { id, score } of sortedPersonas.slice(1)) {
    if (score >= flagThreshold && matrix.flags?.definitions?.[id]) {
      const flagDef = matrix.flags.definitions[id];
      flags.push({
        persona: id,
        score: score,
        percentage: Math.round((score / primaryScore) * 100),
        label: flagDef.label,
        effect: flagDef.effect
      });
    }
  }

  // Step 6: Check for modifiers (e.g., PE/VC velocity boost)
  // Note: Modifiers are detected but NOT applied in VS-27b (deferred to VS-27e)
  const modifiers: DetectedModifier[] = [];
  if (matrix.modifiers) {
    for (const [modId, modConfig] of Object.entries(matrix.modifiers)) {
      const fieldValue = normalizedContext[modConfig.triggerField as keyof ClassificationContext];
      if (fieldValue && modConfig.trigger.includes(fieldValue)) {
        modifiers.push({
          id: modId,
          ...modConfig
        });
      }
    }
  }

  // Step 7: Calculate confidence
  const confidence = calculateConfidence(scores, matrix);

  // Step 8: Build result
  return {
    persona: primaryId,
    personaDetails: personas.personas[primaryId],
    scores: scores,
    primaryScore: primaryScore,
    flags: flags,
    modifiers: modifiers,
    confidence: confidence,
    scoringDetails: scoringDetails,
    computedAt: new Date().toISOString()
  };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get persona definition by ID
 */
export function getPersona(personaId: PersonaId): PersonaDefinition | null {
  const personas = defaultPersonas as PersonasConfig;
  return personas.personas[personaId] || null;
}

/**
 * Get all persona definitions
 */
export function getAllPersonas(): Record<PersonaId, PersonaDefinition> {
  const personas = defaultPersonas as PersonasConfig;
  return personas.personas;
}

/**
 * Get default scoring matrix
 */
export function getDefaultScoringMatrix(): ScoringMatrix {
  return defaultScoringMatrix as ScoringMatrix;
}
