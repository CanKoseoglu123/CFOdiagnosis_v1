-- Fix analytics to count unique visitors by IP address instead of session_id
-- session_id is per-tab (sessionStorage), so each new tab = new "session"
-- IP address is a much better proxy for unique human visitors

CREATE OR REPLACE FUNCTION get_analytics_overview(days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
  period_start TIMESTAMPTZ := NOW() - (days_back || ' days')::INTERVAL;
  prev_period_start TIMESTAMPTZ := NOW() - (days_back * 2 || ' days')::INTERVAL;
  today_start TIMESTAMPTZ := date_trunc('day', NOW());
BEGIN
  SELECT json_build_object(
    'total_visitors', (SELECT COUNT(DISTINCT ip_address) FROM visitors WHERE ip_address IS NOT NULL),
    'total_page_views', (SELECT COUNT(*) FROM visitors),
    'unique_sessions', (SELECT COUNT(DISTINCT session_id) FROM visitors WHERE session_id IS NOT NULL AND created_at >= period_start),
    'today', (SELECT COUNT(DISTINCT ip_address) FROM visitors WHERE ip_address IS NOT NULL AND created_at >= today_start),
    'today_page_views', (SELECT COUNT(*) FROM visitors WHERE created_at >= today_start),
    'period', (SELECT COUNT(DISTINCT ip_address) FROM visitors WHERE ip_address IS NOT NULL AND created_at >= period_start),
    'period_page_views', (SELECT COUNT(*) FROM visitors WHERE created_at >= period_start),
    'previous_period', (SELECT COUNT(DISTINCT ip_address) FROM visitors WHERE ip_address IS NOT NULL AND created_at >= prev_period_start AND created_at < period_start),
    'visitors_by_day', (
      SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.date), '[]'::json)
      FROM (
        SELECT
          date_trunc('day', created_at)::date::text AS date,
          COUNT(*)::integer AS count,
          COUNT(DISTINCT ip_address)::integer AS unique_visitors
        FROM visitors
        WHERE created_at >= period_start
        GROUP BY date_trunc('day', created_at)::date
        ORDER BY date_trunc('day', created_at)::date
      ) t
    ),
    'devices', json_build_object(
      'desktop', (SELECT COUNT(DISTINCT ip_address) FROM visitors WHERE device_type = 'desktop' AND ip_address IS NOT NULL AND created_at >= period_start),
      'mobile', (SELECT COUNT(DISTINCT ip_address) FROM visitors WHERE device_type = 'mobile' AND ip_address IS NOT NULL AND created_at >= period_start),
      'tablet', (SELECT COUNT(DISTINCT ip_address) FROM visitors WHERE device_type = 'tablet' AND ip_address IS NOT NULL AND created_at >= period_start)
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
          COUNT(DISTINCT ip_address)::integer AS count
        FROM visitors
        WHERE created_at >= period_start
          AND referrer_type = 'external'
          AND ip_address IS NOT NULL
        GROUP BY domain
        ORDER BY count DESC
        LIMIT 10
      ) t
    ),
    'new_vs_returning', json_build_object(
      'new', (
        SELECT COUNT(DISTINCT ip_address)
        FROM visitors
        WHERE created_at >= period_start
          AND ip_address IS NOT NULL
          AND ip_address NOT IN (
            SELECT DISTINCT ip_address FROM visitors
            WHERE created_at < period_start AND ip_address IS NOT NULL
          )
      ),
      'returning', (
        SELECT COUNT(DISTINCT ip_address)
        FROM visitors
        WHERE created_at >= period_start
          AND ip_address IS NOT NULL
          AND ip_address IN (
            SELECT DISTINCT ip_address FROM visitors
            WHERE created_at < period_start AND ip_address IS NOT NULL
          )
      )
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- Also update geo analytics to count unique visitors by IP
CREATE OR REPLACE FUNCTION get_geo_analytics(days_back INTEGER DEFAULT 90)
RETURNS JSON AS $$
DECLARE
  result JSON;
  period_start TIMESTAMPTZ := NOW() - (days_back || ' days')::INTERVAL;
BEGIN
  SELECT json_build_object(
    'country_breakdown', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          country,
          country_code,
          COUNT(DISTINCT ip_address)::integer AS count,
          COUNT(DISTINCT session_id)::integer AS unique_sessions
        FROM visitors
        WHERE created_at >= period_start
          AND country IS NOT NULL
        GROUP BY country, country_code
        ORDER BY count DESC
        LIMIT 20
      ) t
    ),
    'city_breakdown', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          city,
          region,
          country,
          COUNT(DISTINCT ip_address)::integer AS count
        FROM visitors
        WHERE created_at >= period_start
          AND city IS NOT NULL
        GROUP BY city, region, country
        ORDER BY count DESC
        LIMIT 20
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;
