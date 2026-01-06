// VS-27b: Classification Engine Types
// TypeScript interfaces for persona classification

// ============================================
// Persona Types
// ============================================

export type PersonaId = 'platform' | 'growth' | 'margin' | 'governance' | 'stewardship' | 'resilience';

export interface PersonaDefinition {
  id: PersonaId;
  name: string;
  tagline: string;
  description: string;
  corePain: string;
  icon: string;
  color: string;
}

export interface PersonasConfig {
  version: string;
  personas: Record<PersonaId, PersonaDefinition>;
}

// ============================================
// Scoring Matrix Types
// ============================================

export interface ScoreMap {
  platform: number;
  growth: number;
  margin: number;
  governance: number;
  stewardship: number;
  resilience: number;
}

export interface InputValue {
  value: string;
  label: string;
  scores: ScoreMap;
  hidden?: boolean;
}

export interface ScoringInput {
  id: string;
  label: string;
  values: InputValue[];
}

export interface FlagDefinition {
  label: string;
  effect: string;
}

export interface ModifierDefinition {
  trigger: string[];
  triggerField: string;
  boost: number;
  description: string;
}

export interface ScoringMatrix {
  version: string;
  inputs: ScoringInput[];
  flags: {
    threshold: number;
    definitions: Record<string, FlagDefinition>;
  };
  modifiers: Record<string, ModifierDefinition>;
}

// ============================================
// Classification Context (Input)
// ============================================

export interface ClassificationContext {
  // Required classification fields (9 total)
  ownership_structure: string;
  change_appetite: string;
  legal_entities: string;
  revenue_trajectory: string;
  debt_pressure: string;
  ma_intensity: string;
  gross_margin_band: string;
  audit_rigor: string;
  erp_strategy: string;

  // Optional company info (stored but not used for classification)
  name?: string;
  industry?: string;
  revenue_range?: string;
  employee_count?: string;
  finance_ftes?: string;
  finance_structure?: string;
}

// ============================================
// Classification Result (Output)
// ============================================

export interface DetectedFlag {
  persona: PersonaId;
  score: number;
  percentage: number;
  label: string;
  effect: string;
}

export interface DetectedModifier {
  id: string;
  trigger: string[];
  triggerField: string;
  boost: number;
  description: string;
}

export interface ScoringDetail {
  input: string;
  value: string;
  persona: PersonaId;
  points: number;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ClassificationResult {
  // Primary classification
  persona: PersonaId;
  personaDetails: PersonaDefinition;

  // Score breakdown
  scores: ScoreMap;
  primaryScore: number;

  // Secondary influences
  flags: DetectedFlag[];

  // Detected modifiers (not applied in VS-27b, deferred to VS-27e)
  modifiers: DetectedModifier[];

  // Confidence based on score spread
  confidence: ConfidenceLevel;

  // Debug/audit info
  scoringDetails: ScoringDetail[];
  computedAt: string;
}

// ============================================
// Validation Types
// ============================================

export interface ValidationResult {
  valid: boolean;
  missing: string[];
  complete: number;
  total: number;
}

// ============================================
// Database Types
// ============================================

export interface CompanyProfile {
  id: string;
  user_id: string;
  name: string;
  context: ClassificationContext;
  classification: ClassificationResult | null;
  created_at: string;
  updated_at: string;
}

export interface ScoringMatrixRow {
  id: string;
  version: string;
  matrix: ScoringMatrix;
  active: boolean;
  created_by: string | null;
  created_at: string;
}
