-- Analytics Dashboard Enhancements
-- Adds UTM tracking columns and 6 analytics SQL functions
-- Run via: Supabase Dashboard → SQL Editor

-- ============================================
-- UTM TRACKING COLUMNS
-- ============================================

ALTER TABLE visitors ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

-- Index for UTM-based queries
CREATE INDEX IF NOT EXISTS idx_visitors_utm_source ON visitors(utm_source) WHERE utm_source IS NOT NULL;

-- ============================================
-- ANALYTICS SQL FUNCTIONS
-- All SECURITY DEFINER, service_role only
-- ============================================

-- 1. Overview Analytics
-- Returns visitor counts, daily trend, devices, referrers, new vs returning
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

-- 2. Funnel Analytics
-- Returns diagnostic journey step counts from diagnostic_runs.current_step
CREATE OR REPLACE FUNCTION get_funnel_analytics(days_back INTEGER DEFAULT 90)
RETURNS JSON AS $$
DECLARE
  result JSON;
  period_start TIMESTAMPTZ := NOW() - (days_back || ' days')::INTERVAL;
  step_counts JSON;
  total_intro BIGINT;
  total_finalized BIGINT;
BEGIN
  -- Count runs that reached each step (cumulative - if at step X, they passed all prior steps)
  WITH step_data AS (
    SELECT
      current_step,
      COUNT(*) AS cnt
    FROM diagnostic_runs
    WHERE created_at >= period_start
    GROUP BY current_step
  ),
  -- Map steps to ordinal for cumulative counting
  step_order AS (
    SELECT unnest(ARRAY['intro','company_setup','persona','pillar_setup','assessment','calibration','report','finalized']) AS step_name,
           generate_series(1, 8) AS ordinal
  ),
  -- A run at step N means it reached steps 1..N
  cumulative AS (
    SELECT
      so.step_name,
      so.ordinal,
      (
        SELECT COALESCE(SUM(sd.cnt), 0)
        FROM step_data sd
        JOIN step_order so2 ON sd.current_step = so2.step_name
        WHERE so2.ordinal >= so.ordinal
      )::integer AS count
    FROM step_order so
    ORDER BY so.ordinal
  )
  SELECT json_agg(
    json_build_object(
      'name', c.step_name,
      'count', c.count,
      'conversion_pct', CASE
        WHEN c.ordinal = 1 THEN NULL
        ELSE ROUND(
          CASE
            WHEN LAG(c.count) OVER (ORDER BY c.ordinal) = 0 THEN 0
            ELSE (c.count::numeric / LAG(c.count) OVER (ORDER BY c.ordinal) * 100)
          END, 1
        )
      END
    ) ORDER BY c.ordinal
  ) INTO step_counts
  FROM cumulative c;

  -- Completion rate and avg time
  SELECT COUNT(*) INTO total_intro
  FROM diagnostic_runs WHERE created_at >= period_start;

  SELECT COUNT(*) INTO total_finalized
  FROM diagnostic_runs WHERE created_at >= period_start AND current_step = 'finalized';

  SELECT json_build_object(
    'steps', COALESCE(step_counts, '[]'::json),
    'completion_rate', CASE
      WHEN total_intro = 0 THEN 0
      ELSE ROUND((total_finalized::numeric / total_intro * 100), 1)
    END,
    'avg_time_to_complete', (
      SELECT ROUND(EXTRACT(EPOCH FROM AVG(finalized_at - created_at)) / 3600, 1)
      FROM diagnostic_runs
      WHERE created_at >= period_start
        AND finalized_at IS NOT NULL
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- 3. Assessment Analytics
-- Returns persona/industry/revenue distributions and completion metrics
CREATE OR REPLACE FUNCTION get_assessment_analytics(days_back INTEGER DEFAULT 90)
RETURNS JSON AS $$
DECLARE
  result JSON;
  period_start TIMESTAMPTZ := NOW() - (days_back || ' days')::INTERVAL;
BEGIN
  SELECT json_build_object(
    'persona_distribution', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          cp.classification->>'persona' AS persona,
          COUNT(*)::integer AS count
        FROM company_profiles cp
        JOIN diagnostic_runs dr ON dr.company_profile_id = cp.id
        WHERE dr.created_at >= period_start
          AND cp.classification->>'persona' IS NOT NULL
        GROUP BY cp.classification->>'persona'
        ORDER BY count DESC
      ) t
    ),
    'industry_distribution', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          cp.context->>'industry' AS industry,
          COUNT(*)::integer AS count
        FROM company_profiles cp
        JOIN diagnostic_runs dr ON dr.company_profile_id = cp.id
        WHERE dr.created_at >= period_start
          AND cp.context->>'industry' IS NOT NULL
        GROUP BY cp.context->>'industry'
        ORDER BY count DESC
        LIMIT 15
      ) t
    ),
    'revenue_distribution', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          cp.context->>'revenue_range' AS range,
          COUNT(*)::integer AS count
        FROM company_profiles cp
        JOIN diagnostic_runs dr ON dr.company_profile_id = cp.id
        WHERE dr.created_at >= period_start
          AND cp.context->>'revenue_range' IS NOT NULL
        GROUP BY cp.context->>'revenue_range'
        ORDER BY count DESC
      ) t
    ),
    'progress_distribution', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          bucket,
          COUNT(*)::integer AS count
        FROM (
          SELECT
            CASE
              WHEN assessment_progress_pct < 25 THEN '0-25'
              WHEN assessment_progress_pct < 50 THEN '25-50'
              WHEN assessment_progress_pct < 75 THEN '50-75'
              ELSE '75-100'
            END AS bucket
          FROM diagnostic_runs
          WHERE created_at >= period_start
            AND assessment_progress_pct IS NOT NULL
        ) buckets
        GROUP BY bucket
        ORDER BY bucket
      ) t
    ),
    'completion_rate', (
      SELECT CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(
          COUNT(*) FILTER (WHERE current_step = 'finalized')::numeric / COUNT(*) * 100, 1
        )
      END
      FROM diagnostic_runs
      WHERE created_at >= period_start
    ),
    'avg_completion_time_hours', (
      SELECT ROUND(EXTRACT(EPOCH FROM AVG(finalized_at - created_at)) / 3600, 1)
      FROM diagnostic_runs
      WHERE created_at >= period_start
        AND finalized_at IS NOT NULL
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- 4. Geography Analytics
-- Returns country/city breakdowns
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

-- 5. Subscription Analytics
-- Returns MRR, conversion, churn, monthly trend
CREATE OR REPLACE FUNCTION get_subscription_analytics()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(DISTINCT id) FROM auth.users),
    'paid_users', (SELECT COUNT(*) FROM subscriptions WHERE status = 'active'),
    'free_users', (
      SELECT COUNT(DISTINCT u.id)
      FROM auth.users u
      WHERE NOT EXISTS (
        SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.status = 'active'
      )
      AND NOT EXISTS (
        SELECT 1 FROM subscription_overrides so WHERE so.user_id = u.id AND (so.expires_at IS NULL OR so.expires_at > NOW())
      )
    ),
    'override_users', (
      SELECT COUNT(*) FROM subscription_overrides
      WHERE expires_at IS NULL OR expires_at > NOW()
    ),
    'mrr', (
      SELECT COALESCE(SUM(si.amount_paid), 0)::integer
      FROM stripe_invoices si
      JOIN subscriptions s ON s.user_id = si.user_id
      WHERE s.status = 'active'
        AND si.created_at >= date_trunc('month', NOW())
    ),
    'conversion_rate', (
      SELECT CASE
        WHEN (SELECT COUNT(*) FROM auth.users) = 0 THEN 0
        ELSE ROUND(
          (SELECT COUNT(*) FROM subscriptions WHERE status = 'active')::numeric
          / (SELECT COUNT(*) FROM auth.users), 4
        )
      END
    ),
    'churn_count', (
      SELECT COUNT(*)
      FROM subscriptions
      WHERE status = 'canceled'
        AND updated_at >= NOW() - INTERVAL '30 days'
    ),
    'subscriptions_by_month', (
      SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.month), '[]'::json)
      FROM (
        SELECT
          to_char(created_at, 'YYYY-MM') AS month,
          COUNT(*)::integer AS count
        FROM subscriptions
        WHERE status IN ('active', 'canceled')
        GROUP BY to_char(created_at, 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 12
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- 6. Recent Activity Feed
-- UNION of recent events from multiple tables
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
      -- Signups
      (SELECT 'signup' AS event_type, COALESCE(email, 'Unknown user') AS detail, created_at
       FROM auth.users ORDER BY created_at DESC LIMIT limit_count)
      UNION ALL
      -- Runs created
      (SELECT 'run_created' AS event_type, COALESCE(user_email, 'Unknown') AS detail, created_at
       FROM diagnostic_runs ORDER BY created_at DESC LIMIT limit_count)
      UNION ALL
      -- Runs finalized
      (SELECT 'run_finalized' AS event_type, COALESCE(user_email, 'Unknown') AS detail, finalized_at AS created_at
       FROM diagnostic_runs WHERE finalized_at IS NOT NULL ORDER BY finalized_at DESC LIMIT limit_count)
      UNION ALL
      -- Feedback
      (SELECT 'feedback' AS event_type, COALESCE(type || ': ' || LEFT(message, 80), 'Feedback') AS detail, created_at
       FROM feedback ORDER BY created_at DESC LIMIT limit_count)
      UNION ALL
      -- Recent visits
      (SELECT 'visit' AS event_type, COALESCE(country, 'Unknown') || ' - ' || page_path AS detail, created_at
       FROM visitors ORDER BY created_at DESC LIMIT limit_count)
    ) combined
    ORDER BY created_at DESC
    LIMIT limit_count
  ) t;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- ============================================
-- PERMISSIONS
-- ============================================

REVOKE EXECUTE ON FUNCTION get_analytics_overview FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_funnel_analytics FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_assessment_analytics FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_geo_analytics FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_subscription_analytics FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_recent_activity FROM PUBLIC;

GRANT EXECUTE ON FUNCTION get_analytics_overview TO service_role;
GRANT EXECUTE ON FUNCTION get_funnel_analytics TO service_role;
GRANT EXECUTE ON FUNCTION get_assessment_analytics TO service_role;
GRANT EXECUTE ON FUNCTION get_geo_analytics TO service_role;
GRANT EXECUTE ON FUNCTION get_subscription_analytics TO service_role;
GRANT EXECUTE ON FUNCTION get_recent_activity TO service_role;
