-- Visitor tracking for analytics
-- Stores page visits with location and device information

CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Session info
  session_id TEXT,  -- Optional browser session ID for grouping visits
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- From auth, nullable for anonymous visitors

  -- Visit details
  page_path TEXT NOT NULL,
  referrer TEXT,

  -- Device/browser info
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop', 'unknown')),
  browser TEXT,
  os TEXT,

  -- Location info (from IP geolocation)
  ip_address INET,
  country TEXT,
  country_code TEXT CHECK (country_code IS NULL OR length(country_code) = 2),
  region TEXT,
  city TEXT,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  timezone TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints for data integrity
  CONSTRAINT valid_page_path CHECK (page_path ~ '^/[a-zA-Z0-9/_-]*$' OR page_path = '/'),
  CONSTRAINT valid_session_id CHECK (session_id IS NULL OR session_id ~ '^session_[0-9]+_[a-z0-9]+$'),
  CONSTRAINT valid_latitude CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  CONSTRAINT valid_longitude CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
);

-- Indexes for common queries
CREATE INDEX idx_visitors_created_at ON visitors(created_at DESC);
CREATE INDEX idx_visitors_page_path ON visitors(page_path);
CREATE INDEX idx_visitors_country ON visitors(country);
CREATE INDEX idx_visitors_session_id ON visitors(session_id);
CREATE INDEX idx_visitors_device_type ON visitors(device_type);

-- Enable RLS for security (PII protection)
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access (for admin endpoints)
CREATE POLICY "Service role has full access to visitors"
  ON visitors
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policy: Allow inserts only with valid data structure (no direct client access)
-- The backend validates and inserts via service role, this is a fallback safety
CREATE POLICY "Allow validated visitor tracking inserts"
  ON visitors
  FOR INSERT
  WITH CHECK (
    -- Must have a valid page_path
    page_path IS NOT NULL AND
    page_path ~ '^/[a-zA-Z0-9/_-]*$' AND
    -- device_type must be valid if provided
    (device_type IS NULL OR device_type IN ('mobile', 'tablet', 'desktop', 'unknown')) AND
    -- session_id must match expected format if provided
    (session_id IS NULL OR session_id ~ '^session_[0-9]+_[a-z0-9]+$') AND
    -- Prevent future timestamps
    (created_at IS NULL OR created_at <= NOW() + INTERVAL '1 minute')
  );

-- ============================================================
-- SQL Functions for efficient statistics aggregation
-- These run aggregations at the database level, not in Node.js
-- ============================================================

-- Whitelist of allowed columns for stats queries (prevents SQL injection)
CREATE OR REPLACE FUNCTION get_visitor_stats_by_column(
  column_name TEXT,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(item TEXT, count BIGINT) AS $$
BEGIN
  -- SECURITY: Whitelist allowed columns to prevent SQL injection
  IF column_name NOT IN ('country', 'page_path', 'device_type', 'browser', 'os', 'country_code', 'region', 'city') THEN
    RAISE EXCEPTION 'Invalid column name: %. Allowed: country, page_path, device_type, browser, os, country_code, region, city', column_name;
  END IF;

  -- Limit must be reasonable
  IF limit_count < 1 OR limit_count > 100 THEN
    limit_count := 10;
  END IF;

  RETURN QUERY EXECUTE format(
    'SELECT %I::TEXT AS item, COUNT(*)::BIGINT AS count
     FROM visitors
     WHERE %I IS NOT NULL
     GROUP BY %I
     ORDER BY count DESC
     LIMIT %L',
    column_name, column_name, column_name, limit_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get device type breakdown
CREATE OR REPLACE FUNCTION get_visitor_device_stats()
RETURNS TABLE(device_type TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
    SELECT COALESCE(v.device_type, 'unknown')::TEXT AS device_type,
           COUNT(*)::BIGINT AS count
    FROM visitors v
    GROUP BY v.device_type
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get visitor counts (total, today, last 7 days)
CREATE OR REPLACE FUNCTION get_visitor_counts()
RETURNS TABLE(
  total BIGINT,
  today BIGINT,
  last_7_days BIGINT
) AS $$
DECLARE
  today_start TIMESTAMPTZ := date_trunc('day', NOW());
  week_start TIMESTAMPTZ := NOW() - INTERVAL '7 days';
BEGIN
  RETURN QUERY
    SELECT
      (SELECT COUNT(*) FROM visitors)::BIGINT AS total,
      (SELECT COUNT(*) FROM visitors WHERE created_at >= today_start)::BIGINT AS today,
      (SELECT COUNT(*) FROM visitors WHERE created_at >= week_start)::BIGINT AS last_7_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Combined stats function for efficiency (single call instead of 4)
CREATE OR REPLACE FUNCTION get_visitor_all_stats(
  top_limit INTEGER DEFAULT 10
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  today_start TIMESTAMPTZ := date_trunc('day', NOW());
  week_start TIMESTAMPTZ := NOW() - INTERVAL '7 days';
BEGIN
  SELECT json_build_object(
    'total', (SELECT COUNT(*) FROM visitors),
    'today', (SELECT COUNT(*) FROM visitors WHERE created_at >= today_start),
    'last_7_days', (SELECT COUNT(*) FROM visitors WHERE created_at >= week_start),
    'top_countries', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT country AS item, COUNT(*) AS count
        FROM visitors
        WHERE country IS NOT NULL
        GROUP BY country
        ORDER BY count DESC
        LIMIT top_limit
      ) t
    ),
    'top_pages', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT page_path AS item, COUNT(*) AS count
        FROM visitors
        WHERE page_path IS NOT NULL
        GROUP BY page_path
        ORDER BY count DESC
        LIMIT top_limit
      ) t
    ),
    'devices', (
      SELECT COALESCE(json_object_agg(COALESCE(device_type, 'unknown'), count), '{}'::json)
      FROM (
        SELECT device_type, COUNT(*) AS count
        FROM visitors
        GROUP BY device_type
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to service role only
GRANT EXECUTE ON FUNCTION get_visitor_stats_by_column TO service_role;
GRANT EXECUTE ON FUNCTION get_visitor_device_stats TO service_role;
GRANT EXECUTE ON FUNCTION get_visitor_counts TO service_role;
GRANT EXECUTE ON FUNCTION get_visitor_all_stats TO service_role;
