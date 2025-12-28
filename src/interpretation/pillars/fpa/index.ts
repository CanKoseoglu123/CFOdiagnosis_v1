/**
 * VS-32: FP&A Pillar Pack Exports
 */

// Configuration
export { FPA_PILLAR_CONFIG, getFPAConfig, getGoldenOutput, getTerminology, getNarrativeTemplate, fillTemplate, generateNarrative } from './config';

// Terminology
export { FPA_TERMINOLOGY, getIndustryTerm, isForbiddenPhrase, countPreferredPhrases } from './terminology';

// Golden Outputs
export { FPA_GOLDEN_OUTPUTS, getGoldenPattern, EXECUTIVE_SUMMARY_PATTERN, CURRENT_STATE_PATTERN, CRITICAL_RISKS_PATTERN, OPPORTUNITIES_PATTERN, PRIORITY_RATIONALE_PATTERN } from './golden-outputs';

// Question Exemplars
export { FPA_QUESTION_EXEMPLARS, CLARIFYING_QUESTION_RULES, getExemplarByType, getExemplarsByEvidenceType, formatExemplarsForPrompt } from './question-exemplars';
