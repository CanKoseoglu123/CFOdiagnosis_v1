/**
 * VS-32: Prompts Index
 *
 * All prompt builders and their input types for the interpretation pipeline.
 */

// Generator prompts
export { buildGeneratorDraftPrompt } from './generator-draft';
export { buildGeneratorRewritePrompt, type RewriteInput } from './generator-rewrite';
export { buildGeneratorFinalizePrompt, type FinalizeInput } from './generator-finalize';

// Critic prompts
export { buildCriticAssessPrompt } from './critic-assess';
export { buildCriticQuestionsPrompt } from './critic-questions';
export { buildCriticFinalPrompt, type CriticFinalInput } from './critic-final';
