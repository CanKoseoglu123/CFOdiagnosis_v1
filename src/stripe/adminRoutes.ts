/**
 * Stripe Admin Routes
 *
 * Admin-only endpoints for subscription management:
 * - GET /api/admin/subscriptions - List all subscriptions
 * - POST /api/admin/subscriptions/:userId/grant - Grant free access
 * - POST /api/admin/subscriptions/:userId/revoke - Revoke override
 * - GET /api/admin/subscriptions/:userId - Get user subscription details
 */

import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/adminAuth';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Apply admin auth to all routes
router.use(requireAdmin);

// Service role client for admin operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

// ============================================
// GET /api/admin/subscriptions
// List all users with subscription status
// ============================================

router.get('/', async (req: Request, res: Response) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Admin client not configured' });
  }

  try {
    // Get filter from query
    const statusFilter = req.query.status as string | undefined;
    const emailSearch = req.query.email as string | undefined;

    // Get all users
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000
    });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    // Get all subscriptions
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*');

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      return res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }

    // Get all overrides
    const { data: overrides, error: overrideError } = await supabaseAdmin
      .from('subscription_overrides')
      .select('*');

    if (overrideError) {
      console.error('Error fetching overrides:', overrideError);
      return res.status(500).json({ error: 'Failed to fetch overrides' });
    }

    // Build subscription map
    const subMap = new Map(subscriptions?.map(s => [s.user_id, s]) || []);
    const overrideMap = new Map(overrides?.map(o => [o.user_id, o]) || []);

    // Combine user data with subscription status
    let results = users.users.map(user => {
      const subscription = subMap.get(user.id);
      const override = overrideMap.get(user.id);

      let status = 'free';
      let isPaid = false;

      if (override) {
        // Check if override is expired
        if (override.expires_at && new Date(override.expires_at) < new Date()) {
          status = subscription?.status || 'free';
          isPaid = ['active', 'trialing'].includes(subscription?.status);
        } else {
          status = 'override';
          isPaid = true;
        }
      } else if (subscription) {
        status = subscription.status;
        isPaid = ['active', 'trialing'].includes(subscription.status);
      }

      return {
        userId: user.id,
        email: user.email,
        createdAt: user.created_at,
        status,
        isPaid,
        subscription: subscription ? {
          planType: subscription.plan_type,
          currentPeriodEnd: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        } : null,
        override: override ? {
          grantedBy: override.granted_by,
          reason: override.reason,
          expiresAt: override.expires_at,
          createdAt: override.created_at
        } : null
      };
    });

    // Apply filters
    if (statusFilter) {
      results = results.filter(r => {
        if (statusFilter === 'paid') return r.isPaid;
        if (statusFilter === 'free') return !r.isPaid;
        if (statusFilter === 'override') return r.status === 'override';
        if (statusFilter === 'active') return r.status === 'active';
        if (statusFilter === 'canceled') return r.status === 'canceled';
        return true;
      });
    }

    if (emailSearch) {
      const search = emailSearch.toLowerCase();
      results = results.filter(r => r.email?.toLowerCase().includes(search));
    }

    // Sort by created date, newest first
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({
      total: results.length,
      users: results
    });
  } catch (err) {
    console.error('Error in admin subscriptions list:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// GET /api/admin/subscriptions/:userId
// Get detailed subscription info for a user
// ============================================

router.get('/:userId', async (req: Request, res: Response) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Admin client not configured' });
  }

  const { userId } = req.params;

  try {
    // Get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get subscription
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get override
    const { data: override } = await supabaseAdmin
      .from('subscription_overrides')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get invoices
    const { data: invoices } = await supabaseAdmin
      .from('stripe_invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get diagnostic runs count
    const { count: runsCount } = await supabaseAdmin
      .from('diagnostic_runs')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        emailConfirmedAt: user.email_confirmed_at
      },
      subscription,
      override,
      invoices: invoices || [],
      diagnosticRuns: runsCount || 0
    });
  } catch (err) {
    console.error('Error fetching user subscription:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// POST /api/admin/subscriptions/:userId/grant
// Grant free access override to a user
// ============================================

router.post('/:userId/grant', async (req: Request, res: Response) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Admin client not configured' });
  }

  const { userId } = req.params;
  const { reason, expiresAt } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'Reason is required' });
  }

  try {
    // Verify user exists
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get admin email
    const { data: { user: adminUser } } = await req.supabase.auth.getUser();
    const grantedBy = adminUser?.email || 'admin';

    // Upsert override
    const { data, error } = await supabaseAdmin
      .from('subscription_overrides')
      .upsert({
        user_id: userId,
        granted_by: grantedBy,
        reason,
        expires_at: expiresAt || null,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error granting access:', error);
      return res.status(500).json({ error: 'Failed to grant access' });
    }

    console.log(`[Admin] Access granted to ${user.email} by ${grantedBy}: ${reason}`);

    return res.json({
      success: true,
      override: data
    });
  } catch (err) {
    console.error('Error granting access:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// POST /api/admin/subscriptions/:userId/revoke
// Revoke access override from a user
// ============================================

router.post('/:userId/revoke', async (req: Request, res: Response) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Admin client not configured' });
  }

  const { userId } = req.params;

  try {
    // Delete override
    const { error } = await supabaseAdmin
      .from('subscription_overrides')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error revoking access:', error);
      return res.status(500).json({ error: 'Failed to revoke access' });
    }

    // Get admin email for logging
    const { data: { user: adminUser } } = await req.supabase.auth.getUser();
    console.log(`[Admin] Access revoked for ${userId} by ${adminUser?.email || 'admin'}`);

    return res.json({ success: true });
  } catch (err) {
    console.error('Error revoking access:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
