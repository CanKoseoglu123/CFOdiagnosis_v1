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
  device_type TEXT,  -- 'mobile', 'tablet', 'desktop'
  browser TEXT,
  os TEXT,

  -- Location info (from IP geolocation)
  ip_address INET,
  country TEXT,
  country_code TEXT,
  region TEXT,
  city TEXT,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  timezone TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
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

-- Policy: Allow anonymous inserts (for /track endpoint)
CREATE POLICY "Allow anonymous visitor tracking inserts"
  ON visitors
  FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- SQL Functions for efficient statistics aggregation
-- These run aggregations at the database level, not in Node.js
-- ============================================================

-- Function to get top N items by a column (countries, pages, etc.)
CREATE OR REPLACE FUNCTION get_visitor_stats_by_column(
  column_name TEXT,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(item TEXT, count BIGINT) AS $$
BEGIN
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

-- Grant execute permissions to authenticated and anon roles for tracking
GRANT EXECUTE ON FUNCTION get_visitor_stats_by_column TO service_role;
GRANT EXECUTE ON FUNCTION get_visitor_device_stats TO service_role;
GRANT EXECUTE ON FUNCTION get_visitor_counts TO service_role;
