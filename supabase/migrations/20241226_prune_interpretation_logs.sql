-- Prune Interpretation Logs (30-day retention)
-- Scheduled via pg_cron to run daily at 3:00 AM UTC

-- 1. Create the Pruning Function
CREATE OR REPLACE FUNCTION prune_interpretation_logs()
RETURNS void AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete logs older than 30 days
  DELETE FROM interpretation_ai_conversations
  WHERE created_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Log the result (visible in Postgres logs)
  RAISE NOTICE 'Pruned % interpretation log rows.', deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 2. Enable pg_cron Extension (Attempt to enable)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Schedule the Job (Run daily at 3:00 AM UTC)
-- Uses "ON CONFLICT" logic implicitly via the named job 'daily_log_prune'
SELECT cron.schedule(
  'daily_log_prune',
  '0 3 * * *',
  'SELECT prune_interpretation_logs()'
);
