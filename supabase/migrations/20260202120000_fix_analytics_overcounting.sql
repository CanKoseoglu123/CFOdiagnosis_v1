-- Fix analytics overcounting: count unique sessions instead of page views
-- The original get_analytics_overview counted every row (page view) as a "visitor"
-- This fix changes all headline metrics to COUNT(DISTINCT session_id)

CREATE OR REPLACE FUNCTION get_analytics_overview(days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
  period_start TIMESTAMPTZ := NOW() - (days_back || ' days')::INTERVAL;
  prev_period_start TIMESTAMPTZ := NOW() - (days_back * 2 || ' days')::INTERVAL;
  today_start TIMESTAMPTZ := date_trunc('day', NOW());
BEGIN
  SELECT json_build_object(
    'total_visitors', (SELECT COUNT(DISTINCT session_id) FROM visitors WHERE session_id IS NOT NULL),
    'total_page_views', (SELECT COUNT(*) FROM visitors),
    'unique_sessions', (SELECT COUNT(DISTINCT session_id) FROM visitors WHERE session_id IS NOT NULL AND created_at >= period_start),
    'today', (SELECT COUNT(DISTINCT session_id) FROM visitors WHERE session_id IS NOT NULL AND created_at >= today_start),
    'today_page_views', (SELECT COUNT(*) FROM visitors WHERE created_at >= today_start),
    'period', (SELECT COUNT(DISTINCT session_id) FROM visitors WHERE session_id IS NOT NULL AND created_at >= period_start),
    'period_page_views', (SELECT COUNT(*) FROM visitors WHERE created_at >= period_start),
    'previous_period', (SELECT COUNT(DISTINCT session_id) FROM visitors WHERE session_id IS NOT NULL AND created_at >= prev_period_start AND created_at < period_start),
    'visitors_by_day', (
      SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.date), '[]'::json)
      FROM (
        SELECT
          date_trunc('day', created_at)::date::text AS date,
          COUNT(*)::integer AS count,
          COUNT(DISTINCT session_id)::integer AS unique_sessions
        FROM visitors
        WHERE created_at >= period_start
        GROUP BY date_trunc('day', created_at)::date
        ORDER BY date_trunc('day', created_at)::date
      ) t
    ),
    'devices', json_build_object(
      'desktop', (SELECT COUNT(DISTINCT session_id) FROM visitors WHERE device_type = 'desktop' AND session_id IS NOT NULL AND created_at >= period_start),
      'mobile', (SELECT COUNT(DISTINCT session_id) FROM visitors WHERE device_type = 'mobile' AND session_id IS NOT NULL AND created_at >= period_start),
      'tablet', (SELECT COUNT(DISTINCT session_id) FROM visitors WHERE device_type = 'tablet' AND session_id IS NOT NULL AND created_at >= period_start)
    ),
    'referrers', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          CASE
            WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
            WHEN referrer ~ '^https?://' THEN
              substring(referrer FROM 'https?://([^/]+)')
            ELSE referrer
          END AS domain,
          COUNT(DISTINCT session_id)::integer AS count
        FROM visitors
        WHERE created_at >= period_start
          AND referrer_type = 'external'
          AND session_id IS NOT NULL
        GROUP BY domain
        ORDER BY count DESC
        LIMIT 10
      ) t
    ),
    'new_vs_returning', json_build_object(
      'new', (
        SELECT COUNT(DISTINCT session_id)
        FROM visitors
        WHERE created_at >= period_start
          AND session_id IS NOT NULL
          AND session_id NOT IN (
            SELECT DISTINCT session_id FROM visitors
            WHERE created_at < period_start AND session_id IS NOT NULL
          )
      ),
      'returning', (
        SELECT COUNT(DISTINCT session_id)
        FROM visitors
        WHERE created_at >= period_start
          AND session_id IS NOT NULL
          AND session_id IN (
            SELECT DISTINCT session_id FROM visitors
            WHERE created_at < period_start AND session_id IS NOT NULL
          )
      )
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;
