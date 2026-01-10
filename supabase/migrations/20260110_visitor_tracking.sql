-- Visitor tracking for analytics
-- Stores page visits with location and device information

CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Session info
  session_id TEXT,  -- Optional browser session ID for grouping visits
  user_id UUID,  -- From auth, nullable for anonymous visitors

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

-- No RLS - admin access only via service role
-- This is analytics data for internal use only
