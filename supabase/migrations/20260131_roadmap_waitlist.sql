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

-- Allow anonymous inserts (public waitlist form)
CREATE POLICY "Anyone can join waitlist"
  ON roadmap_waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- SELECT restricted to service_role only (admin via dashboard or backend with service key).
-- No RLS policy needed for service_role as it bypasses RLS by default.
-- No UPDATE policy — upsert handled via SECURITY DEFINER function below.

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
  INSERT INTO roadmap_waitlist (email, interested_modules)
  VALUES (p_email, p_modules)
  ON CONFLICT (email)
  DO UPDATE SET interested_modules = EXCLUDED.interested_modules;
END;
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.upsert_roadmap_waitlist(TEXT, TEXT[]) TO anon, authenticated;
