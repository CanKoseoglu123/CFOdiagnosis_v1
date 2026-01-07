-- VS-27d: Cache benchmark commentary on diagnostic runs
alter table diagnostic_runs
add column if not exists benchmark_commentary jsonb;
