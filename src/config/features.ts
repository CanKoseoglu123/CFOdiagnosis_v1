/**
 * Feature flags for Stripe subscription system
 *
 * Controls visibility and enforcement of subscription features.
 * Set via environment variables in Railway dashboard.
 */

export const features = {
  stripe: {
    // Master switch - when false, all Stripe features are hidden
    enabled: process.env.STRIPE_ENABLED === 'true',

    // When true, free tier limits are enforced
    required: process.env.SUBSCRIPTION_REQUIRED === 'true',

    // Comma-separated list of emails that can access Stripe features
    // even when enabled=false (for testing)
    testUsers: (process.env.STRIPE_TEST_USERS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean),
  },
};

/**
 * Check if Stripe features should be visible to a specific user.
 * Returns true if:
 * - Stripe is globally enabled, OR
 * - User's email is in the test users list
 */
export function isStripeEnabledForUser(email: string): boolean {
  if (features.stripe.enabled) return true;
  return features.stripe.testUsers.includes(email.toLowerCase());
}

/**
 * Check if subscription is required for full access.
 * Only true when both enabled AND required flags are set.
 */
export function isSubscriptionRequired(): boolean {
  return features.stripe.enabled && features.stripe.required;
}

/**
 * Free tier objective IDs - these are accessible without subscription
 */
export const FREE_TIER_OBJECTIVES = [
  'obj_budget_discipline',
  'obj_strategic_influence',
] as const;

/**
 * Check if an objective is accessible on free tier
 */
export function isFreeTierObjective(objectiveId: string): boolean {
  return (FREE_TIER_OBJECTIVES as readonly string[]).includes(objectiveId);
}
