-- Contact Messages Table
-- Stores messages submitted via the public contact form

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_name TEXT,
  category TEXT CHECK (category IN ('general', 'demo', 'partnership', 'support')) DEFAULT 'general',
  message TEXT NOT NULL,
  status TEXT CHECK (status IN ('new', 'read', 'archived')) DEFAULT 'new',
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_contact_messages_status ON contact_messages(status);
CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- RLS: Service role only (admin access via backend)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON contact_messages FOR ALL
  USING (auth.role() = 'service_role');
