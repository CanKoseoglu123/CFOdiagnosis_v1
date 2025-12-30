/**
 * VS-32: Simplified Interpretation Engine
 * Main export file
 */

// Types
export * from './types';

// Modules
export { precompute, computeInputHash } from './precompute';
export { generateInterpretation } from './generator';
export { runHeuristics } from './heuristics';
export { generateFallback } from './fallback';
export { orchestrate, OrchestrationResult } from './orchestrator';

// Pillars
export { getPillarPack, PillarPack, SectionConfig } from '../pillars/registry';
