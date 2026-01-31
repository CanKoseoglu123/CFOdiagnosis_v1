-- Roadmap waitlist: captures email + interested modules from /roadmap page
CREATE TABLE IF NOT EXISTS roadmap_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  interested_modules TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT roadmap_waitlist_email_unique UNIQUE (email)
);

-- Enable RLS
ALTER TABLE roadmap_waitlist ENABLE ROW LEVEL SECURITY;

-- No INSERT policy — all writes go through the SECURITY DEFINER function below.
-- SELECT restricted to service_role only (admin via dashboard or backend with service key).
-- No RLS policy needed for service_role as it bypasses RLS by default.

-- Secure upsert function: inserts or updates interested_modules on email conflict.
-- SECURITY DEFINER runs with the function owner's privileges, bypassing RLS.
CREATE OR REPLACE FUNCTION public.upsert_roadmap_waitlist(
  p_email TEXT,
  p_modules TEXT[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate email: non-empty, basic format, RFC 5321 max length
  IF p_email IS NULL OR length(trim(p_email)) = 0 THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;

  IF length(p_email) > 320 OR p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;

  INSERT INTO roadmap_waitlist (email, interested_modules)
  VALUES (p_email, p_modules)
  ON CONFLICT (email)
  DO UPDATE SET interested_modules = EXCLUDED.interested_modules;
END;
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.upsert_roadmap_waitlist(TEXT, TEXT[]) TO anon, authenticated;
