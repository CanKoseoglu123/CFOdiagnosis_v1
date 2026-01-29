/**
 * Stripe Webhook Handler
 *
 * Processes Stripe events to sync subscription status to database.
 * Uses idempotency log to prevent duplicate processing.
 */

import { Request, Response, Router } from 'express';
import Stripe from 'stripe';
import { stripe } from './client';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Service role client for webhook updates (bypasses RLS)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

/**
 * Check if event has already been processed (idempotency)
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  if (!supabaseAdmin) return false;

  const { data } = await supabaseAdmin
    .from('stripe_webhook_events')
    .select('id')
    .eq('stripe_event_id', eventId)
    .single();

  return !!data;
}

/**
 * Mark event as processed
 */
async function markEventProcessed(eventId: string, eventType: string, payload?: any): Promise<void> {
  if (!supabaseAdmin) return;

  await supabaseAdmin
    .from('stripe_webhook_events')
    .insert({
      stripe_event_id: eventId,
      event_type: eventType,
      payload: payload ? JSON.parse(JSON.stringify(payload)) : null
    });
}

/**
 * Get user ID from Stripe customer ID
 */
async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  if (!supabaseAdmin) return null;

  const { data } = await supabaseAdmin
    .from('stripe_customers')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  return data?.user_id || null;
}

/**
 * Handle checkout.session.completed
 * Called when user completes Stripe Checkout
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  if (!supabaseAdmin) return;

  const userId = session.metadata?.supabase_user_id;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId || !subscriptionId) {
    console.error('[Webhook] Missing userId or subscriptionId in checkout session');
    return;
  }

  // Fetch subscription details from Stripe
  if (!stripe) return;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Upsert subscription record
  await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscriptionId,
      status: subscription.status,
      plan_type: 'annual',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

  console.log(`[Webhook] Subscription created for user ${userId}: ${subscription.status}`);
}

/**
 * Handle customer.subscription.updated
 * Called when subscription status changes
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  if (!supabaseAdmin) return;

  const customerId = subscription.customer as string;
  const userId = await getUserIdFromCustomer(customerId);

  if (!userId) {
    // Try to get from metadata
    const metaUserId = subscription.metadata?.supabase_user_id;
    if (!metaUserId) {
      console.error(`[Webhook] No user found for customer ${customerId}`);
      return;
    }
  }

  const targetUserId = userId || subscription.metadata?.supabase_user_id;

  // Update subscription record
  await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id: targetUserId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      plan_type: 'annual',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

  console.log(`[Webhook] Subscription updated for user ${targetUserId}: ${subscription.status}`);
}

/**
 * Handle customer.subscription.deleted
 * Called when subscription is canceled and period ends
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  if (!supabaseAdmin) return;

  const customerId = subscription.customer as string;
  const userId = await getUserIdFromCustomer(customerId);

  if (!userId) {
    console.error(`[Webhook] No user found for deleted subscription customer ${customerId}`);
    return;
  }

  // Update to canceled status
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  console.log(`[Webhook] Subscription deleted for user ${userId}`);
}

/**
 * Handle invoice.paid
 * Called when invoice is successfully paid
 */
async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  if (!supabaseAdmin) return;

  const customerId = invoice.customer as string;
  const userId = await getUserIdFromCustomer(customerId);

  if (!userId) {
    console.error(`[Webhook] No user found for invoice customer ${customerId}`);
    return;
  }

  // Record invoice
  await supabaseAdmin
    .from('stripe_invoices')
    .upsert({
      user_id: userId,
      stripe_invoice_id: invoice.id,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      invoice_pdf: invoice.invoice_pdf
    }, {
      onConflict: 'stripe_invoice_id'
    });

  console.log(`[Webhook] Invoice recorded for user ${userId}: ${invoice.amount_paid / 100} ${invoice.currency}`);
}

/**
 * Handle invoice.payment_failed
 * Called when payment fails
 */
async function handleInvoiceFailed(invoice: Stripe.Invoice): Promise<void> {
  if (!supabaseAdmin) return;

  const customerId = invoice.customer as string;
  const userId = await getUserIdFromCustomer(customerId);

  if (!userId) return;

  // Update subscription to past_due
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  console.log(`[Webhook] Payment failed for user ${userId}`);
}

// ============================================
// POST /webhooks/stripe
// Main webhook endpoint - receives all Stripe events
// ============================================

router.post('/', async (req: Request, res: Response) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('[Webhook] Missing signature or webhook secret');
    return res.status(400).json({ error: 'Missing signature' });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    // Note: req.body must be raw buffer for signature verification
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err: any) {
    console.error(`[Webhook] Signature verification failed: ${err.message}`);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Idempotency check
  if (await isEventProcessed(event.id)) {
    console.log(`[Webhook] Event ${event.id} already processed, skipping`);
    return res.json({ received: true, status: 'already_processed' });
  }

  console.log(`[Webhook] Processing event: ${event.type} (${event.id})`);

  try {
    // Handle specific event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoiceFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await markEventProcessed(event.id, event.type);

    return res.json({ received: true });
  } catch (err) {
    console.error(`[Webhook] Error processing ${event.type}:`, err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
