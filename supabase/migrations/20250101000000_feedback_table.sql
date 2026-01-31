-- Feedback collection for beta testing
-- Stores user feedback from the FeedbackButton component

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES diagnostic_runs(id) ON DELETE SET NULL,
  user_id UUID,  -- From auth, nullable for anonymous
  user_email TEXT,
  page TEXT,  -- Which page/tab they were on
  type TEXT CHECK (type IN ('bug', 'confusion', 'suggestion', 'general')),
  message TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying feedback by date
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);

-- No RLS - admin access only via service role or direct Supabase dashboard
-- This table is for internal use, not user-facing queries
