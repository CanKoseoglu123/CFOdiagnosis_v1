-- VS-27b: Classification Engine Database Schema
-- Creates company_profiles and scoring_matrix tables for persona classification

-- ============================================
-- Table: company_profiles
-- Stores company-level context and classification
-- Multi-pillar ready: diagnostic_runs link to this via FK
-- ============================================

CREATE TABLE IF NOT EXISTS company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Company identification
  name VARCHAR(255) NOT NULL,

  -- Company context (all classification inputs + other company fields)
  -- Includes: ownership_structure, change_appetite, legal_entities,
  -- revenue_trajectory, debt_pressure, ma_intensity, gross_margin_band,
  -- audit_rigor, erp_strategy, plus industry, revenue_range, etc.
  context JSONB NOT NULL DEFAULT '{}',

  -- Classification result (computed by backend engine)
  -- Schema: { persona, scores, flags, modifiers, confidence, computedAt }
  classification JSONB,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_company_profiles_user_id
ON company_profiles(user_id);

-- Enable RLS
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own company profiles
CREATE POLICY "Users can manage own company profiles"
  ON company_profiles FOR ALL
  USING (auth.uid() = user_id);


-- ============================================
-- Table: scoring_matrix
-- Admin-editable persona scoring weights
-- Only one matrix can be active at a time
-- ============================================

CREATE TABLE IF NOT EXISTS scoring_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(50) NOT NULL,
  matrix JSONB NOT NULL,
  active BOOLEAN DEFAULT false,
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure only one active matrix at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_scoring_matrix_single_active
ON scoring_matrix(active) WHERE active = true;

-- Enable RLS (service role only)
ALTER TABLE scoring_matrix ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users to read active matrix
-- Writes are done via service role in backend
CREATE POLICY "Authenticated users can read active matrix"
  ON scoring_matrix FOR SELECT
  TO authenticated
  USING (active = true);


-- ============================================
-- Alter: diagnostic_runs
-- Add foreign key to company_profiles
-- ============================================

ALTER TABLE diagnostic_runs
ADD COLUMN IF NOT EXISTS company_profile_id UUID REFERENCES company_profiles(id);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_diagnostic_runs_company_profile
ON diagnostic_runs(company_profile_id);


-- ============================================
-- Trigger: Update updated_at on company_profiles
-- ============================================

CREATE OR REPLACE FUNCTION update_company_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_company_profiles_updated_at ON company_profiles;
CREATE TRIGGER trigger_company_profiles_updated_at
  BEFORE UPDATE ON company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_company_profiles_updated_at();
