/**
 * Subscription Authentication Middleware
 *
 * Provides functions to check subscription status and protect routes.
 */

import { Request, Response, NextFunction } from 'express';
import { features, isSubscriptionRequired, FREE_TIER_OBJECTIVES, isSubscriptionBypassed } from '../config/features';

/**
 * Check if user has active subscription or override
 */
export async function hasActiveSubscription(req: Request): Promise<boolean> {
  // If subscription not required, everyone has access
  if (!isSubscriptionRequired()) {
    return true;
  }

  if (!req.userId) {
    return false;
  }

  // Check email-based bypass
  if (req.userEmail && isSubscriptionBypassed(req.userEmail)) {
    return true;
  }

  try {
    // Check for admin override first
    const { data: override } = await req.supabase
      .from('subscription_overrides')
      .select('expires_at')
      .eq('user_id', req.userId)
      .single();

    if (override) {
      // Check if override is expired
      if (!override.expires_at || new Date(override.expires_at) > new Date()) {
        return true;
      }
    }

    // Check subscription
    const { data: subscription } = await req.supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', req.userId)
      .single();

    if (subscription && ['active', 'trialing'].includes(subscription.status)) {
      return true;
    }

    return false;
  } catch (err) {
    console.error('Error checking subscription:', err);
    return false;
  }
}

/**
 * Get subscription tier info
 * Returns 'paid', 'free', or 'override'
 */
export async function getSubscriptionTier(req: Request): Promise<{
  tier: 'paid' | 'free' | 'override';
  accessibleObjectives: string[] | 'all';
}> {
  // If subscription not required, everyone is "paid"
  if (!isSubscriptionRequired()) {
    return { tier: 'paid', accessibleObjectives: 'all' };
  }

  if (!req.userId) {
    return { tier: 'free', accessibleObjectives: [...FREE_TIER_OBJECTIVES] };
  }

  // Check email-based bypass
  if (req.userEmail && isSubscriptionBypassed(req.userEmail)) {
    return { tier: 'override', accessibleObjectives: 'all' };
  }

  try {
    // Check for override
    const { data: override } = await req.supabase
      .from('subscription_overrides')
      .select('expires_at')
      .eq('user_id', req.userId)
      .single();

    if (override) {
      if (!override.expires_at || new Date(override.expires_at) > new Date()) {
        return { tier: 'override', accessibleObjectives: 'all' };
      }
    }

    // Check subscription
    const { data: subscription } = await req.supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', req.userId)
      .single();

    if (subscription && ['active', 'trialing'].includes(subscription.status)) {
      return { tier: 'paid', accessibleObjectives: 'all' };
    }

    return { tier: 'free', accessibleObjectives: [...FREE_TIER_OBJECTIVES] };
  } catch (err) {
    console.error('Error getting subscription tier:', err);
    return { tier: 'free', accessibleObjectives: [...FREE_TIER_OBJECTIVES] };
  }
}

/**
 * Middleware to require active subscription
 * Returns 403 if user doesn't have paid access
 */
export async function requireSubscription(req: Request, res: Response, next: NextFunction) {
  const hasAccess = await hasActiveSubscription(req);

  if (!hasAccess) {
    return res.status(403).json({
      error: 'Subscription required',
      code: 'SUBSCRIPTION_REQUIRED',
      upgradeUrl: '/pricing'
    });
  }

  next();
}

/**
 * Middleware that attaches subscription info to request
 * Does not block, just enriches request
 */
export async function attachSubscriptionInfo(req: Request, _res: Response, next: NextFunction) {
  const tierInfo = await getSubscriptionTier(req);
  req.subscriptionTier = tierInfo.tier;
  req.accessibleObjectives = tierInfo.accessibleObjectives;
  next();
}

/**
 * Check if an objective is accessible to the user
 */
export function canAccessObjective(req: Request, objectiveId: string): boolean {
  const accessible = req.accessibleObjectives;

  if (accessible === 'all') {
    return true;
  }

  return Array.isArray(accessible) ? accessible.includes(objectiveId) : false;
}
