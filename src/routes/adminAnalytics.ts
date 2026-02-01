// Admin Analytics Router
// 6 GET endpoints for analytics dashboard, all behind requireAdmin

import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

// Apply admin auth to all routes
router.use(requireAdmin);

// Helper: parse and clamp integer query param
function parseIntParam(value: unknown, defaultVal: number, min: number, max: number): number {
  if (value === undefined || value === null || value === '') return defaultVal;
  const parsed = parseInt(value as string, 10);
  if (isNaN(parsed)) return -1; // Signal invalid
  return Math.max(min, Math.min(max, parsed));
}

// ============================================
// GET /overview?days=30
// ============================================
router.get('/overview', async (req: Request, res: Response) => {
  const days = parseIntParam(req.query.days, 30, 1, 365);
  if (days === -1) {
    return res.status(400).json({ error: 'days must be a number between 1 and 365' });
  }

  try {
    const { data, error } = await req.supabase.rpc('get_analytics_overview', { days_back: days });

    if (error) {
      console.error('Analytics overview RPC error:', error);
      return res.status(500).json({ error: 'Failed to fetch overview analytics' });
    }

    res.json({
      data: data || {},
      meta: { days_back: days, generated_at: new Date().toISOString() }
    });
  } catch (err) {
    console.error('Analytics overview error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// GET /funnel?days=90
// ============================================
router.get('/funnel', async (req: Request, res: Response) => {
  const days = parseIntParam(req.query.days, 90, 1, 365);
  if (days === -1) {
    return res.status(400).json({ error: 'days must be a number between 1 and 365' });
  }

  try {
    const { data, error } = await req.supabase.rpc('get_funnel_analytics', { days_back: days });

    if (error) {
      console.error('Analytics funnel RPC error:', error);
      return res.status(500).json({ error: 'Failed to fetch funnel analytics' });
    }

    res.json({
      data: data || { steps: [], completion_rate: 0, avg_time_to_complete: null },
      meta: { days_back: days, generated_at: new Date().toISOString() }
    });
  } catch (err) {
    console.error('Analytics funnel error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// GET /assessment?days=90
// ============================================
router.get('/assessment', async (req: Request, res: Response) => {
  const days = parseIntParam(req.query.days, 90, 1, 365);
  if (days === -1) {
    return res.status(400).json({ error: 'days must be a number between 1 and 365' });
  }

  try {
    const { data, error } = await req.supabase.rpc('get_assessment_analytics', { days_back: days });

    if (error) {
      console.error('Analytics assessment RPC error:', error);
      return res.status(500).json({ error: 'Failed to fetch assessment analytics' });
    }

    res.json({
      data: data || {
        persona_distribution: [],
        industry_distribution: [],
        revenue_distribution: [],
        progress_distribution: [],
        completion_rate: 0,
        avg_completion_time_hours: null
      },
      meta: { days_back: days, generated_at: new Date().toISOString() }
    });
  } catch (err) {
    console.error('Analytics assessment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// GET /geo?days=90
// ============================================
router.get('/geo', async (req: Request, res: Response) => {
  const days = parseIntParam(req.query.days, 90, 1, 365);
  if (days === -1) {
    return res.status(400).json({ error: 'days must be a number between 1 and 365' });
  }

  try {
    const { data, error } = await req.supabase.rpc('get_geo_analytics', { days_back: days });

    if (error) {
      console.error('Analytics geo RPC error:', error);
      return res.status(500).json({ error: 'Failed to fetch geo analytics' });
    }

    res.json({
      data: data || { country_breakdown: [], city_breakdown: [] },
      meta: { days_back: days, generated_at: new Date().toISOString() }
    });
  } catch (err) {
    console.error('Analytics geo error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// GET /subscriptions
// ============================================
router.get('/subscriptions', async (req: Request, res: Response) => {
  try {
    const { data, error } = await req.supabase.rpc('get_subscription_analytics');

    if (error) {
      console.error('Analytics subscriptions RPC error:', error);
      return res.status(500).json({ error: 'Failed to fetch subscription analytics' });
    }

    res.json({
      data: data || {
        total_users: 0,
        paid_users: 0,
        free_users: 0,
        override_users: 0,
        mrr: 0,
        conversion_rate: 0,
        churn_count: 0,
        subscriptions_by_month: []
      },
      meta: { generated_at: new Date().toISOString() }
    });
  } catch (err) {
    console.error('Analytics subscriptions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// GET /activity?limit=20
// ============================================
router.get('/activity', async (req: Request, res: Response) => {
  const limit = parseIntParam(req.query.limit, 20, 1, 100);
  if (limit === -1) {
    return res.status(400).json({ error: 'limit must be a number between 1 and 100' });
  }

  try {
    const { data, error } = await req.supabase.rpc('get_recent_activity', { limit_count: limit });

    if (error) {
      console.error('Analytics activity RPC error:', error);
      return res.status(500).json({ error: 'Failed to fetch activity feed' });
    }

    res.json({
      data: data || [],
      meta: { limit, generated_at: new Date().toISOString() }
    });
  } catch (err) {
    console.error('Analytics activity error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
