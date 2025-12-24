// src/components/report/index.js
// VS-22 v2: All report components

export { default as MaturityBanner } from './MaturityBanner';
export { default as SummaryTable } from './SummaryTable';
export { default as StrengthsBar } from './StrengthsBar';
export { default as CriticalRisksCard } from './CriticalRisksCard';
export { default as HighValueCard } from './HighValueCard';

// Legacy exports (if needed for backward compatibility)
export { default as HeaderBar } from './HeaderBar';
export { default as StatBox } from './StatBox';
export { default as TabButton } from './TabButton';
export { default as ExecutiveSummary } from './ExecutiveSummary';
export { default as ScoreCard } from './ScoreCard';
export { default as MaturityCard } from './MaturityCard';
export { default as AssessmentCard } from './AssessmentCard';
export { default as ObjectiveCard } from './ObjectiveCard';
export { default as PriorityTabs, PrioritySectionHeader } from './PriorityTabs';
export { default as InitiativeCard } from './InitiativeCard';
export { default as ActionRow } from './ActionRow';
export { default as MaturityLadder } from './MaturityLadder';
export { CappedWarning, OnTrackBanner } from './CappedWarning';
export { default as EmptyState } from './EmptyState';
export { default as StrategicRoadmap } from './StrategicRoadmap';

// VS-25: Interpretation components
export { default as InterpretationSection } from './InterpretationSection';
export { default as InterpretationLoader } from './InterpretationLoader';
export { default as InterpretationQuestions } from './InterpretationQuestions';
export { default as InterpretedReport } from './InterpretedReport';
