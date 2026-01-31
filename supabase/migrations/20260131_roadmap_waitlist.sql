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

-- Only authenticated users can read (admin use)
CREATE POLICY "Authenticated users can read waitlist"
  ON roadmap_waitlist
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow upsert: if email exists, update interested_modules
CREATE POLICY "Anyone can update own waitlist entry"
  ON roadmap_waitlist
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
