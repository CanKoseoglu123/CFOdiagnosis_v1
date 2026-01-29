-- Fix Stripe RLS policy gaps
-- 1. stripe_customers: Users need INSERT to create their own customer mapping during checkout
-- 2. subscription_overrides: Users need SELECT to detect admin-granted access

-- Allow users to insert their own stripe_customers record (checkout flow)
DROP POLICY IF EXISTS "Users can insert own stripe_customers" ON stripe_customers;
CREATE POLICY "Users can insert own stripe_customers"
  ON stripe_customers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to read their own subscription_overrides (middleware check)
DROP POLICY IF EXISTS "Users can view own subscription_overrides" ON subscription_overrides;
CREATE POLICY "Users can view own subscription_overrides"
  ON subscription_overrides FOR SELECT
  USING (auth.uid() = user_id);
