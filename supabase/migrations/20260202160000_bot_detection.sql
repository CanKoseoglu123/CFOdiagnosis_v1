-- Bot detection: flag bot visits instead of blocking them
-- Adds is_bot column and backfills existing rows based on user-agent and IP patterns

-- 1. Add is_bot column (defaults to false for existing rows)
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT false;

-- Index for fast filtering in analytics queries
CREATE INDEX IF NOT EXISTS idx_visitors_is_bot ON visitors(is_bot) WHERE is_bot = false;

-- 2. Backfill: mark existing rows as bot based on user-agent patterns
UPDATE visitors SET is_bot = true
WHERE is_bot = false
  AND (
    -- User-agent based detection
    user_agent ILIKE '%bot%'
    OR user_agent ILIKE '%crawler%'
    OR user_agent ILIKE '%spider%'
    OR user_agent ILIKE '%headless%'
    OR user_agent ILIKE '%curl%'
    OR user_agent ILIKE '%wget%'
    OR user_agent ILIKE '%python-requests%'
    OR user_agent ILIKE '%python-urllib%'
    OR user_agent ILIKE '%scrapy%'
    OR user_agent ILIKE '%httpclient%'
    OR user_agent ILIKE '%phantom%'
    OR user_agent ILIKE '%selenium%'
    OR user_agent ILIKE '%puppeteer%'
    OR user_agent ILIKE '%lighthouse%'
    OR user_agent ILIKE '%pagespeed%'
    OR user_agent ILIKE '%pingdom%'
    OR user_agent ILIKE '%uptimerobot%'
    OR user_agent ILIKE '%monitoring%'
    OR user_agent ILIKE '%slurp%'
    OR user_agent ILIKE '%semrush%'
    OR user_agent ILIKE '%ahrefs%'
    OR user_agent ILIKE '%mj12bot%'
    OR user_agent ILIKE '%dotbot%'
    OR user_agent ILIKE '%petalbot%'
    OR user_agent ILIKE '%yandexbot%'
    OR user_agent ILIKE '%bingbot%'
    OR user_agent ILIKE '%duckduckbot%'
    OR user_agent ILIKE '%facebookexternalhit%'
    OR user_agent ILIKE '%twitterbot%'
    OR user_agent ILIKE '%linkedinbot%'
    OR user_agent ILIKE '%whatsapp%'
    OR user_agent ILIKE '%telegrambot%'
    OR user_agent ILIKE '%discordbot%'
    OR user_agent ILIKE '%applebot%'
    OR user_agent ILIKE '%bytespider%'
    OR user_agent ILIKE '%gptbot%'
    OR user_agent ILIKE '%claudebot%'
    OR user_agent ILIKE '%chatgpt%'
    OR user_agent ILIKE '%googleother%'
    OR user_agent IS NULL
  );

-- 3. Backfill: mark known cloud/datacenter IP ranges as bots
-- AWS IP ranges (us-west-1 and common ranges)
UPDATE visitors SET is_bot = true
WHERE is_bot = false
  AND ip_address IS NOT NULL
  AND (
    -- AWS EC2/Lambda common ranges
    ip_address::text LIKE '13.52.%' OR ip_address::text LIKE '13.56.%' OR ip_address::text LIKE '13.57.%'
    OR ip_address::text LIKE '18.144.%'
    OR ip_address::text LIKE '50.18.%'
    OR ip_address::text LIKE '52.53.%'
    OR ip_address::text LIKE '54.67.%' OR ip_address::text LIKE '54.151.%' OR ip_address::text LIKE '54.153.%'
    OR ip_address::text LIKE '54.176.%' OR ip_address::text LIKE '54.177.%' OR ip_address::text LIKE '54.183.%'
    OR ip_address::text LIKE '54.193.%' OR ip_address::text LIKE '54.215.%' OR ip_address::text LIKE '54.219.%'
    OR ip_address::text LIKE '3.101.%'
    -- Google Cloud common ranges
    OR ip_address::text LIKE '34.%' OR ip_address::text LIKE '35.%'
    -- Google crawlers
    OR ip_address::text LIKE '66.249.%'
    -- Azure common ranges
    OR ip_address::text LIKE '40.%' OR ip_address::text LIKE '52.%'
    -- DigitalOcean
    OR ip_address::text LIKE '104.131.%' OR ip_address::text LIKE '138.197.%'
    -- Hetzner
    OR ip_address::text LIKE '95.216.%' OR ip_address::text LIKE '135.181.%'
  );

-- 4. Update analytics functions to exclude bots

CREATE OR REPLACE FUNCTION get_analytics_overview(days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
  period_start TIMESTAMPTZ := NOW() - (days_back || ' days')::INTERVAL;
  prev_period_start TIMESTAMPTZ := NOW() - (days_back * 2 || ' days')::INTERVAL;
  today_start TIMESTAMPTZ := date_trunc('day', NOW());
BEGIN
  SELECT json_build_object(
    'total_visitors', (SELECT COUNT(DISTINCT ip_address) FROM visitors WHERE ip_address IS NOT NULL AND is_bot = false),
    'total_page_views', (SELECT COUNT(*) FROM visitors WHERE is_bot = false),
    'unique_sessions', (SELECT COUNT(DISTINCT session_id) FROM visitors WHERE session_id IS NOT NULL AND created_at >= period_start AND is_bot = false),
    'today', (SELECT COUNT(DISTINCT ip_address) FROM visitors WHERE ip_address IS NOT NULL AND created_at >= today_start AND is_bot = false),
    'today_page_views', (SELECT COUNT(*) FROM visitors WHERE created_at >= today_start AND is_bot = false),
    'period', (SELECT COUNT(DISTINCT ip_address) FROM visitors WHERE ip_address IS NOT NULL AND created_at >= period_start AND is_bot = false),
    'period_page_views', (SELECT COUNT(*) FROM visitors WHERE created_at >= period_start AND is_bot = false),
    'previous_period', (SELECT COUNT(DISTINCT ip_address) FROM visitors WHERE ip_address IS NOT NULL AND created_at >= prev_period_start AND created_at < period_start AND is_bot = false),
    'visitors_by_day', (
      SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.date), '[]'::json)
      FROM (
        SELECT
          date_trunc('day', created_at)::date::text AS date,
          COUNT(*)::integer AS count,
          COUNT(DISTINCT ip_address)::integer AS unique_visitors
        FROM visitors
        WHERE created_at >= period_start AND is_bot = false
        GROUP BY date_trunc('day', created_at)::date
        ORDER BY date_trunc('day', created_at)::date
      ) t
    ),
    'devices', json_build_object(
      'desktop', (SELECT COUNT(DISTINCT ip_address) FROM visitors WHERE device_type = 'desktop' AND ip_address IS NOT NULL AND created_at >= period_start AND is_bot = false),
      'mobile', (SELECT COUNT(DISTINCT ip_address) FROM visitors WHERE device_type = 'mobile' AND ip_address IS NOT NULL AND created_at >= period_start AND is_bot = false),
      'tablet', (SELECT COUNT(DISTINCT ip_address) FROM visitors WHERE device_type = 'tablet' AND ip_address IS NOT NULL AND created_at >= period_start AND is_bot = false)
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
          AND is_bot = false
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
          AND is_bot = false
          AND ip_address NOT IN (
            SELECT DISTINCT ip_address FROM visitors
            WHERE created_at < period_start AND ip_address IS NOT NULL AND is_bot = false
          )
      ),
      'returning', (
        SELECT COUNT(DISTINCT ip_address)
        FROM visitors
        WHERE created_at >= period_start
          AND ip_address IS NOT NULL
          AND is_bot = false
          AND ip_address IN (
            SELECT DISTINCT ip_address FROM visitors
            WHERE created_at < period_start AND ip_address IS NOT NULL AND is_bot = false
          )
      )
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

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
          AND is_bot = false
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
          AND is_bot = false
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

-- Update activity feed to exclude bot visits (but keep other event types)
CREATE OR REPLACE FUNCTION get_recent_activity(limit_count INTEGER DEFAULT 20)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  IF limit_count < 1 OR limit_count > 100 THEN
    limit_count := 20;
  END IF;

  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result
  FROM (
    SELECT event_type, detail, created_at FROM (
      (SELECT 'signup' AS event_type, COALESCE(email, 'Unknown user') AS detail, created_at
       FROM auth.users ORDER BY created_at DESC LIMIT limit_count)
      UNION ALL
      (SELECT 'run_created' AS event_type, COALESCE(user_email, 'Unknown') AS detail, created_at
       FROM diagnostic_runs ORDER BY created_at DESC LIMIT limit_count)
      UNION ALL
      (SELECT 'run_finalized' AS event_type, COALESCE(user_email, 'Unknown') AS detail, finalized_at AS created_at
       FROM diagnostic_runs WHERE finalized_at IS NOT NULL ORDER BY finalized_at DESC LIMIT limit_count)
      UNION ALL
      (SELECT 'feedback' AS event_type, COALESCE(type || ': ' || LEFT(message, 80), 'Feedback') AS detail, created_at
       FROM feedback ORDER BY created_at DESC LIMIT limit_count)
      UNION ALL
      (SELECT 'visit' AS event_type, COALESCE(country, 'Unknown') || ' - ' || page_path AS detail, created_at
       FROM visitors WHERE is_bot = false ORDER BY created_at DESC LIMIT limit_count)
    ) combined
    ORDER BY created_at DESC
    LIMIT limit_count
  ) t;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;
