/**
 * VS-25: Interpretation Layer
 * VS-32a: Single-Call Overview Generator
 * VS-32b: Quality Heuristics Layer
 *
 * Main export file for the interpretation module.
 */

// Types
export * from './types';

// Config
export * from './config';

// Tonality
export * from './tonality';

// Validation (VS-25 legacy)
export { assessHeuristics, countWords, checkWordLimit } from './validation/quality-assessment';

// VS-32b: Quality Heuristics
export { runHeuristics, formatViolationsForRetry } from './validation/heuristics';

// Questions
export { prioritizeGaps, getActionableGaps, groupGapsByObjective } from './questions/prioritizer';

// Agents
export { Generator, Critic } from './agents';

// VS-32a: Single-call generator
export { generateOverview } from './agents/generator';

// VS-32a: Precompute
export { precomputeInput } from './precompute';

// VS-32a: Evidence validation
export { validateEvidenceId, validateAllEvidence } from './evidence';

// Pipeline
export {
  createSession,
  getSession,
  getSessionByRunId,
  updateSessionStatus,
  getQuestions,
  saveAnswers,
  getReport,
  runPipeline,
  resumePipeline,
  PipelineResult,
} from './pipeline';
