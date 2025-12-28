/**
 * VS-32: Pillar Registry
 *
 * Central registry for all pillar configurations.
 * Add new pillars here as they are implemented.
 */

import { PillarInterpretationConfig, LoopConfig, DEFAULT_LOOP_CONFIG } from './types';
import { FPA_PILLAR_CONFIG } from './fpa/config';
import { SHARED_FORBIDDEN_PATTERNS, SHARED_ANTI_PATTERNS, assessTextQuality } from './shared';

// ============================================================
// PILLAR REGISTRY
// ============================================================

/**
 * Registry of all available pillar configurations.
 */
const PILLAR_REGISTRY: Record<string, PillarInterpretationConfig> = {
  fpa: FPA_PILLAR_CONFIG,
  // Future pillars:
  // treasury: TREASURY_PILLAR_CONFIG,
  // tax: TAX_PILLAR_CONFIG,
  // accounting: ACCOUNTING_PILLAR_CONFIG,
};

/**
 * Get a pillar configuration by ID.
 * @throws Error if pillar not found
 */
export function getPillarConfig(pillarId: string): PillarInterpretationConfig {
  const config = PILLAR_REGISTRY[pillarId.toLowerCase()];
  if (!config) {
    throw new Error(`Unknown pillar: ${pillarId}. Available pillars: ${Object.keys(PILLAR_REGISTRY).join(', ')}`);
  }
  return config;
}

/**
 * Get all available pillar IDs.
 */
export function getAvailablePillars(): string[] {
  return Object.keys(PILLAR_REGISTRY);
}

/**
 * Check if a pillar is available.
 */
export function isPillarAvailable(pillarId: string): boolean {
  return pillarId.toLowerCase() in PILLAR_REGISTRY;
}

// ============================================================
// COMBINED PATTERN ACCESS
// ============================================================

/**
 * Get all forbidden patterns for a pillar (shared + pillar-specific).
 */
export function getAllForbiddenPatterns(pillarId: string): string[] {
  const config = getPillarConfig(pillarId);
  return [...SHARED_FORBIDDEN_PATTERNS, ...config.pillar_forbidden_patterns];
}

/**
 * Get all anti-patterns for a pillar (shared + pillar-specific).
 */
export function getAllAntiPatterns(pillarId: string): string[] {
  const config = getPillarConfig(pillarId);
  return [...SHARED_ANTI_PATTERNS, ...config.pillar_anti_patterns];
}

/**
 * Assess text quality with pillar-specific patterns.
 */
export function assessPillarTextQuality(
  text: string,
  pillarId: string
): ReturnType<typeof assessTextQuality> & {
  pillar_forbidden_matches: string[];
  pillar_anti_pattern_matches: string[];
} {
  const baseAssessment = assessTextQuality(text);
  const config = getPillarConfig(pillarId);

  // Check pillar-specific forbidden patterns
  const pillarForbidden: string[] = [];
  for (const pattern of config.pillar_forbidden_patterns) {
    const regex = new RegExp(pattern, 'gi');
    if (regex.test(text)) {
      pillarForbidden.push(pattern);
    }
  }

  // Check pillar-specific anti-patterns
  const pillarAnti: string[] = [];
  for (const pattern of config.pillar_anti_patterns) {
    if (text.toLowerCase().includes(pattern.toLowerCase())) {
      pillarAnti.push(pattern);
    }
  }

  // Adjust overall quality based on pillar findings
  let overallQuality = baseAssessment.overall_quality;
  if (pillarForbidden.length > 0) {
    overallQuality = 'poor';
  } else if (pillarAnti.length > 2 && overallQuality === 'good') {
    overallQuality = 'acceptable';
  }

  return {
    ...baseAssessment,
    pillar_forbidden_matches: pillarForbidden,
    pillar_anti_pattern_matches: pillarAnti,
    overall_quality: overallQuality,
  };
}

// ============================================================
// LOOP CONFIG ACCESS
// ============================================================

/**
 * Get loop configuration with optional overrides.
 */
export function getLoopConfig(overrides?: Partial<LoopConfig>): LoopConfig {
  return {
    ...DEFAULT_LOOP_CONFIG,
    ...overrides,
  };
}

// ============================================================
// RE-EXPORTS
// ============================================================

// Types
export * from './types';

// Shared patterns
export {
  SHARED_FORBIDDEN_PATTERNS,
  SHARED_ANTI_PATTERNS,
  CONTEXT_STUFFING_PATTERNS,
  QUALITY_SIGNALS,
  checkForbiddenPatterns,
  checkAntiPatterns,
  detectContextStuffing,
  countQualitySignals,
  assessTextQuality,
} from './shared';

// FP&A pillar
export * from './fpa';
