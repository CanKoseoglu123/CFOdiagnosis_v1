-- Migration: 20241223_vs21_calibration_column.sql
-- VS-21: Objective Importance Matrix
--
-- Adds calibration JSONB column to diagnostic_runs for storing
-- user-declared objective importance (1-5 scale).
--
-- JSONB Shape:
-- {
--   "importance_map": {
--     "obj_fpa_l1_budget": 5,
--     "obj_fpa_l2_variance": 3,
--     ...
--   },
--   "locked": ["obj_fpa_l1_budget"]  -- Safety Valve applied
-- }

ALTER TABLE diagnostic_runs
ADD COLUMN IF NOT EXISTS calibration JSONB DEFAULT '{}'::jsonb;
-- Add comment for documentation
COMMENT ON COLUMN diagnostic_runs.calibration IS
'VS-21: User-declared objective importance (1-5 scale). Contains importance_map and locked array for Safety Valve objectives.';
