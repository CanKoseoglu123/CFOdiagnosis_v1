// src/gates/index.ts
// Centralized gate loader - SSOT for critical gates
// All critical gate arrays MUST be imported from this module

import { loadGates } from '../specs/loader';

// Load gates configuration once at module initialization
const gates = loadGates();

// =============================================================================
// EXPORTED CONSTANTS (derived from content/gates.json)
// =============================================================================

/**
 * L1 Critical Questions - Must pass all to unlock Level 2
 * Source: content/gates.json -> critical_gates.l1_to_l2
 */
export const L1_CRITICALS: readonly string[] = gates.critical_gates.l1_to_l2;

/**
 * L2 Critical Questions - Must pass all to unlock Level 3
 * Source: content/gates.json -> critical_gates.l2_to_l3
 */
export const L2_CRITICALS: readonly string[] = gates.critical_gates.l2_to_l3;

/**
 * All Critical Questions - Combined L1 + L2 criticals
 */
export const ALL_CRITICALS: readonly string[] = [...L1_CRITICALS, ...L2_CRITICALS];

// =============================================================================
// SCORE THRESHOLDS
// =============================================================================

/**
 * Score thresholds for maturity level progression
 * Source: content/gates.json -> score_thresholds
 */
export const SCORE_THRESHOLDS = {
  LEVEL_2: gates.score_thresholds.level_2,
  LEVEL_3: gates.score_thresholds.level_3,
  LEVEL_4: gates.score_thresholds.level_4,
} as const;

// =============================================================================
// LEVEL NAMES
// =============================================================================

/**
 * Human-readable maturity level names
 * Source: content/gates.json -> level_names
 */
export const LEVEL_NAMES = gates.level_names;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type { GatesConfig } from '../specs/schemas';
