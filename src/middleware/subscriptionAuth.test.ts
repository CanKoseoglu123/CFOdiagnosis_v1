import { describe, test, expect, vi, beforeEach } from 'vitest';
import { hasActiveSubscription, getSubscriptionTier, requireSubscription, attachSubscriptionInfo, canAccessObjective } from './subscriptionAuth';

// Mock the features config
vi.mock('../config/features', () => ({
  isSubscriptionRequired: vi.fn(() => true),
  FREE_TIER_OBJECTIVES: ['obj_budget_discipline', 'obj_strategic_influence'],
  isSubscriptionBypassed: vi.fn(() => false),
}));

import { isSubscriptionRequired, isSubscriptionBypassed } from '../config/features';

function mockReq(overrides: Record<string, unknown> = {}): any {
  return {
    userId: 'user-123',
    userEmail: 'test@example.com',
    supabase: {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    ...overrides,
  };
}

function mockRes(): any {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    headersSent: false,
  };
  return res;
}

function chainedSupabase(result: { data: unknown; error?: unknown }) {
  const chain: any = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue(result);
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  (isSubscriptionRequired as any).mockReturnValue(true);
  (isSubscriptionBypassed as any).mockReturnValue(false);
});

describe('hasActiveSubscription', () => {
  test('returns true when subscription is not required', async () => {
    (isSubscriptionRequired as any).mockReturnValue(false);
    const req = mockReq();
    expect(await hasActiveSubscription(req)).toBe(true);
  });

  test('returns false when no userId', async () => {
    const req = mockReq({ userId: undefined });
    expect(await hasActiveSubscription(req)).toBe(false);
  });

  test('returns true when email is bypassed', async () => {
    (isSubscriptionBypassed as any).mockReturnValue(true);
    const req = mockReq();
    expect(await hasActiveSubscription(req)).toBe(true);
  });

  test('returns true when active subscription exists', async () => {
    const supabase = chainedSupabase({ data: null });
    // First call (overrides) returns null, second call (subscriptions) returns active
    let callCount = 0;
    supabase.single = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve({ data: null });
      return Promise.resolve({ data: { status: 'active' } });
    });
    const req = mockReq({ supabase });
    expect(await hasActiveSubscription(req)).toBe(true);
  });

  test('returns true when trialing subscription exists', async () => {
    const supabase = chainedSupabase({ data: null });
    let callCount = 0;
    supabase.single = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve({ data: null });
      return Promise.resolve({ data: { status: 'trialing' } });
    });
    const req = mockReq({ supabase });
    expect(await hasActiveSubscription(req)).toBe(true);
  });

  test('returns false when subscription is canceled', async () => {
    const supabase = chainedSupabase({ data: null });
    let callCount = 0;
    supabase.single = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve({ data: null });
      return Promise.resolve({ data: { status: 'canceled' } });
    });
    const req = mockReq({ supabase });
    expect(await hasActiveSubscription(req)).toBe(false);
  });

  test('returns true when valid override exists', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const supabase = chainedSupabase({ data: { expires_at: futureDate } });
    const req = mockReq({ supabase });
    expect(await hasActiveSubscription(req)).toBe(true);
  });

  test('returns true when override has no expiry (permanent)', async () => {
    const supabase = chainedSupabase({ data: { expires_at: null } });
    const req = mockReq({ supabase });
    expect(await hasActiveSubscription(req)).toBe(true);
  });

  test('throws on DB error instead of silently degrading', async () => {
    const supabase = chainedSupabase({ data: null });
    supabase.single = vi.fn().mockRejectedValue(new Error('DB connection failed'));
    const req = mockReq({ supabase });
    await expect(hasActiveSubscription(req)).rejects.toThrow('DB connection failed');
  });
});

describe('getSubscriptionTier', () => {
  test('returns paid tier when subscription not required', async () => {
    (isSubscriptionRequired as any).mockReturnValue(false);
    const req = mockReq();
    const result = await getSubscriptionTier(req);
    expect(result.tier).toBe('paid');
    expect(result.accessibleObjectives).toBe('all');
  });

  test('returns free tier when no userId', async () => {
    const req = mockReq({ userId: undefined });
    const result = await getSubscriptionTier(req);
    expect(result.tier).toBe('free');
    expect(result.accessibleObjectives).toEqual(['obj_budget_discipline', 'obj_strategic_influence']);
  });

  test('returns override tier when email bypassed', async () => {
    (isSubscriptionBypassed as any).mockReturnValue(true);
    const req = mockReq();
    const result = await getSubscriptionTier(req);
    expect(result.tier).toBe('override');
    expect(result.accessibleObjectives).toBe('all');
  });

  test('throws on DB error instead of silently degrading', async () => {
    const supabase = chainedSupabase({ data: null });
    supabase.single = vi.fn().mockRejectedValue(new Error('timeout'));
    const req = mockReq({ supabase });
    await expect(getSubscriptionTier(req)).rejects.toThrow('timeout');
  });
});

describe('requireSubscription middleware', () => {
  test('calls next() when user has access', async () => {
    (isSubscriptionRequired as any).mockReturnValue(false);
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    await requireSubscription(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 403 when user lacks subscription', async () => {
    const req = mockReq({ userId: undefined });
    const res = mockRes();
    const next = vi.fn();
    await requireSubscription(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'SUBSCRIPTION_REQUIRED',
    }));
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 503 on DB error', async () => {
    const supabase = chainedSupabase({ data: null });
    supabase.single = vi.fn().mockRejectedValue(new Error('DB down'));
    const req = mockReq({ supabase });
    const res = mockRes();
    const next = vi.fn();
    await requireSubscription(req, res, next);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'SERVICE_UNAVAILABLE',
    }));
  });
});

describe('attachSubscriptionInfo middleware', () => {
  test('attaches tier info to request', async () => {
    (isSubscriptionRequired as any).mockReturnValue(false);
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    await attachSubscriptionInfo(req, res, next);
    expect(req.subscriptionTier).toBe('paid');
    expect(req.accessibleObjectives).toBe('all');
    expect(next).toHaveBeenCalled();
  });

  test('returns 503 on DB error', async () => {
    const supabase = chainedSupabase({ data: null });
    supabase.single = vi.fn().mockRejectedValue(new Error('connection reset'));
    const req = mockReq({ supabase });
    const res = mockRes();
    const next = vi.fn();
    await attachSubscriptionInfo(req, res, next);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('canAccessObjective', () => {
  test('returns true when accessibleObjectives is "all"', () => {
    const req = { accessibleObjectives: 'all' } as any;
    expect(canAccessObjective(req, 'obj_anything')).toBe(true);
  });

  test('returns true when objective is in accessible list', () => {
    const req = { accessibleObjectives: ['obj_budget_discipline', 'obj_strategic_influence'] } as any;
    expect(canAccessObjective(req, 'obj_budget_discipline')).toBe(true);
  });

  test('returns false when objective is not in accessible list', () => {
    const req = { accessibleObjectives: ['obj_budget_discipline'] } as any;
    expect(canAccessObjective(req, 'obj_forecasting_agility')).toBe(false);
  });

  test('returns false when accessibleObjectives is undefined', () => {
    const req = {} as any;
    expect(canAccessObjective(req, 'obj_budget_discipline')).toBe(false);
  });
});
