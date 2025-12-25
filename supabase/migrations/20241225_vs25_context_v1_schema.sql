-- VS25: Context Intake v1 Schema
-- Extends the existing context JSONB column with structured v1 schema
-- Philosophy: "Data for Intelligence, not just Record Keeping"

-- The context column already exists (from VS18), but we add a CHECK constraint
-- to ensure version key is present for new entries

-- Add comment documenting the v1 schema
COMMENT ON COLUMN diagnostic_runs.context IS
'JSONB storing intake context. Schema v1 structure:
{
  version: "v1",
  company: { name, industry, revenue_range, employee_count, finance_structure, change_appetite },
  pillar: { ftes, systems[], complexity: { business_units, currencies, legal_entities }, pain_points[], ongoing_projects }
}
Legacy entries (pre-v1) may only have { company_name, industry }.';

-- Create an index for querying by industry (common filter)
CREATE INDEX IF NOT EXISTS idx_diagnostic_runs_context_industry
ON diagnostic_runs ((context->>'industry'))
WHERE context->>'industry' IS NOT NULL;

-- Create an index for querying by change_appetite (for action prioritization)
CREATE INDEX IF NOT EXISTS idx_diagnostic_runs_context_change_appetite
ON diagnostic_runs ((context->'company'->>'change_appetite'))
WHERE context->'company'->>'change_appetite' IS NOT NULL;

-- Function to validate context schema (optional, for future use)
CREATE OR REPLACE FUNCTION validate_context_v1(ctx JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- If context has version key, validate v1 structure
  IF ctx ? 'version' AND ctx->>'version' = 'v1' THEN
    -- Must have company and pillar objects
    IF NOT (ctx ? 'company' AND ctx ? 'pillar') THEN
      RETURN FALSE;
    END IF;
    -- Company must have required fields
    IF NOT (ctx->'company' ? 'name' AND ctx->'company' ? 'industry') THEN
      RETURN FALSE;
    END IF;
  END IF;
  -- Legacy contexts (no version) or valid v1 pass
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Note: We don't add a CHECK constraint to avoid breaking legacy data
-- Validation is handled at the API layer with Zod
