-- Stripe Subscriptions Schema
-- Purpose: Store Stripe customer, subscription, and invoice data
-- Run via: Supabase Dashboard → SQL Editor

-- ============================================
-- TABLES
-- ============================================

-- Stripe customer ↔ Supabase user mapping
CREATE TABLE IF NOT EXISTS stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Subscription status (cached from Stripe webhooks)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  plan_type TEXT NOT NULL DEFAULT 'annual',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Invoice history for billing portal
CREATE TABLE IF NOT EXISTS stripe_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  amount_paid INTEGER,
  currency TEXT DEFAULT 'usd',
  status TEXT,
  invoice_pdf TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook event log for idempotency
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  payload JSONB
);

-- Admin-granted free access overrides
CREATE TABLE IF NOT EXISTS subscription_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by TEXT NOT NULL,
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add country_code to company_profiles for geo-pricing (EUR vs USD)
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS country_code TEXT;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_overrides ENABLE ROW LEVEL SECURITY;

-- Users can read their own records
DROP POLICY IF EXISTS "Users can view own stripe_customers" ON stripe_customers;
CREATE POLICY "Users can view own stripe_customers"
  ON stripe_customers FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own invoices" ON stripe_invoices;
CREATE POLICY "Users can view own invoices"
  ON stripe_invoices FOR SELECT
  USING (auth.uid() = user_id);

-- Service role (backend) can do everything
DROP POLICY IF EXISTS "Service role full access stripe_customers" ON stripe_customers;
CREATE POLICY "Service role full access stripe_customers"
  ON stripe_customers FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access subscriptions" ON subscriptions;
CREATE POLICY "Service role full access subscriptions"
  ON subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access invoices" ON stripe_invoices;
CREATE POLICY "Service role full access invoices"
  ON stripe_invoices FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access webhook_events" ON stripe_webhook_events;
CREATE POLICY "Service role full access webhook_events"
  ON stripe_webhook_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access overrides" ON subscription_overrides;
CREATE POLICY "Service role full access overrides"
  ON subscription_overrides FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_user_id ON stripe_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_stripe_id ON stripe_webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_subscription_overrides_user_id ON subscription_overrides(user_id);
