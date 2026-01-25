/**
 * Feature flags for Stripe subscription system
 *
 * Controls visibility and enforcement of subscription features.
 * Set via environment variables in Vercel dashboard.
 */

export const features = {
  stripe: {
    // Master switch - when false, all Stripe features are hidden
    enabled: import.meta.env.VITE_STRIPE_ENABLED === 'true',

    // When true, free tier limits are enforced
    required: import.meta.env.VITE_SUBSCRIPTION_REQUIRED === 'true',
  },
};

/**
 * Check if Stripe features should be visible.
 */
export function isStripeEnabled() {
  return features.stripe.enabled;
}

/**
 * Check if subscription is required for full access.
 */
export function isSubscriptionRequired() {
  return features.stripe.enabled && features.stripe.required;
}

/**
 * Free tier objective IDs - these are accessible without subscription
 */
export const FREE_TIER_OBJECTIVES = [
  'obj_budget_discipline',
  'obj_strategic_influence',
];

/**
 * Check if an objective is accessible on free tier
 */
export function isFreeTierObjective(objectiveId) {
  return FREE_TIER_OBJECTIVES.includes(objectiveId);
}
