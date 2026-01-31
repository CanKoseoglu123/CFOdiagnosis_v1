/**
 * Stripe Billing Routes
 *
 * API endpoints for subscription management:
 * - GET /api/billing/subscription - Get current subscription status
 * - POST /api/billing/checkout - Create Stripe Checkout session
 * - POST /api/billing/portal - Create Customer Portal session
 * - GET /api/billing/prices - Get available prices
 */

import { Router, Request, Response } from 'express';
import { stripe, getPriceId, getCurrency, isStripeConfigured } from './client';
import { features, isStripeEnabledForUser, isSubscriptionBypassed } from '../config/features';

const router = Router();

// Ensure user is authenticated for all billing routes
router.use((req: Request, res: Response, next) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
});

// ============================================
// GET /api/billing/subscription
// Get current user's subscription status
// ============================================

router.get('/subscription', async (req: Request, res: Response) => {
  try {
    // Check feature flag for this user
    const userEmail = req.userEmail || '';

    // Check email-based bypass before anything else
    if (isSubscriptionBypassed(userEmail)) {
      return res.json({
        status: 'active',
        isPaid: true,
        source: 'bypass'
      });
    }

    if (!isStripeEnabledForUser(userEmail)) {
      return res.json({
        status: 'not_available',
        isPaid: true, // Give full access when Stripe is disabled
        message: 'Subscription features not available'
      });
    }

    // Check for admin override first
    const { data: override } = await req.supabase
      .from('subscription_overrides')
      .select('*')
      .eq('user_id', req.userId)
      .single();

    if (override) {
      // Check if override is expired
      if (override.expires_at && new Date(override.expires_at) < new Date()) {
        // Override expired, continue to check subscription
      } else {
        return res.json({
          status: 'active',
          isPaid: true,
          source: 'override',
          reason: override.reason,
          expiresAt: override.expires_at
        });
      }
    }

    // Check subscription table
    const { data: subscription, error } = await req.supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription:', error);
      return res.status(500).json({ error: 'Failed to fetch subscription' });
    }

    if (!subscription) {
      return res.json({
        status: 'none',
        isPaid: false
      });
    }

    const isPaid = ['active', 'trialing'].includes(subscription.status);

    return res.json({
      status: subscription.status,
      isPaid,
      planType: subscription.plan_type,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    });
  } catch (err) {
    console.error('Error in subscription check:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// POST /api/billing/checkout
// Create a Stripe Checkout session for subscription
// ============================================

router.post('/checkout', async (req: Request, res: Response) => {
  if (!stripe || !isStripeConfigured()) {
    return res.status(503).json({ error: 'Payment system not configured' });
  }

  try {
    const userEmail = req.userEmail;
    if (!userEmail) {
      return res.status(400).json({ error: 'User email required for checkout' });
    }

    // Get user's country for geo-pricing
    const { data: companyProfile } = await req.supabase
      .from('company_profiles')
      .select('country_code')
      .eq('owner_id', req.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const countryCode = companyProfile?.country_code || null;
    const priceId = getPriceId(countryCode);
    const currency = getCurrency(countryCode);

    // Check if customer already exists
    let { data: customerRecord } = await req.supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', req.userId)
      .single();

    let customerId = customerRecord?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          supabase_user_id: req.userId!
        }
      });
      customerId = customer.id;

      // Save customer mapping
      await req.supabase
        .from('stripe_customers')
        .insert({
          user_id: req.userId,
          stripe_customer_id: customerId,
          email: userEmail
        });
    }

    // Create Checkout Session
    const successUrl = `${process.env.FRONTEND_URL || 'https://cfodiagnosisv1.vercel.app'}/pricing?checkout=success`;
    const cancelUrl = `${process.env.FRONTEND_URL || 'https://cfodiagnosisv1.vercel.app'}/pricing?checkout=cancelled`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_update: {
        name: 'auto',
      },
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        supabase_user_id: req.userId!
      },
      subscription_data: {
        metadata: {
          supabase_user_id: req.userId!
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      tax_id_collection: {
        enabled: true
      }
    });

    return res.json({
      url: session.url,
      sessionId: session.id
    });
  } catch (err: any) {
    console.error('Error creating checkout session:', err);
    const detail = err?.message || err?.raw?.message || 'Unknown error';
    return res.status(500).json({ error: `Failed to create checkout session: ${detail}` });
  }
});

// ============================================
// POST /api/billing/portal
// Create a Stripe Customer Portal session
// ============================================

router.post('/portal', async (req: Request, res: Response) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payment system not configured' });
  }

  try {
    // Get customer ID
    const { data: customerRecord, error } = await req.supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', req.userId)
      .single();

    if (error || !customerRecord) {
      return res.status(404).json({ error: 'No billing account found' });
    }

    const returnUrl = `${process.env.FRONTEND_URL || 'https://cfodiagnosisv1.vercel.app'}/dashboard`;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerRecord.stripe_customer_id,
      return_url: returnUrl
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error('Error creating portal session:', err);
    return res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// ============================================
// GET /api/billing/prices
// Get available subscription prices
// ============================================

router.get('/prices', async (req: Request, res: Response) => {
  try {
    // Get user's country for geo-pricing
    const { data: companyProfile } = await req.supabase
      .from('company_profiles')
      .select('country_code')
      .eq('owner_id', req.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const countryCode = companyProfile?.country_code || null;
    const currency = getCurrency(countryCode);

    // Return static pricing info (actual prices come from Stripe)
    return res.json({
      currency,
      countryCode,
      annual: {
        amount: currency === 'eur' ? 299 : 299,
        formatted: currency === 'eur' ? '€299' : '$299',
        interval: 'year',
        priceId: getPriceId(countryCode)
      }
    });
  } catch (err) {
    console.error('Error fetching prices:', err);
    return res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

// ============================================
// GET /api/billing/invoices
// Get user's invoice history
// ============================================

router.get('/invoices', async (req: Request, res: Response) => {
  try {
    const { data: invoices, error } = await req.supabase
      .from('stripe_invoices')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .limit(24);

    if (error) {
      console.error('Error fetching invoices:', error);
      return res.status(500).json({ error: 'Failed to fetch invoices' });
    }

    return res.json({ invoices: invoices || [] });
  } catch (err) {
    console.error('Error in invoice fetch:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
