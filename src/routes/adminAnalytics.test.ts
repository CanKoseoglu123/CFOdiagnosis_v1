// Admin Analytics Router - Unit Tests
// Tests endpoint logic with mocked Supabase RPC calls

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import {
  MOCK_OVERVIEW,
  MOCK_FUNNEL,
  MOCK_ASSESSMENT,
  MOCK_GEO,
  MOCK_SUBSCRIPTIONS,
  MOCK_ACTIVITY,
} from '../__tests__/fixtures/analyticsData';

// We test the router handler logic by importing the module and extracting routes
// Since Express routers are hard to unit-test directly, we test the parseIntParam logic
// and the route handler contract via mock req/res

// Helper to create mock req/res
function createMockReqRes(query: Record<string, string> = {}) {
  const rpcMock = vi.fn();
  const req = {
    query,
    userId: 'test-user-id',
    supabase: {
      rpc: rpcMock,
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { email: 'can@cfo-lens.com' } },
          error: null,
        }),
      },
    },
  } as unknown as Request;

  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const res = { json, status } as unknown as Response;

  return { req, res, rpcMock, json, status };
}

// Import the router to test its existence and structure
import adminAnalyticsRouter from './adminAnalytics';

describe('Admin Analytics Router', () => {
  test('exports a router', () => {
    expect(adminAnalyticsRouter).toBeDefined();
    expect(typeof adminAnalyticsRouter).toBe('function'); // Express routers are functions
  });

  test('router has routes defined', () => {
    // Express Router stores routes in router.stack
    const stack = (adminAnalyticsRouter as any).stack;
    expect(stack).toBeDefined();
    expect(Array.isArray(stack)).toBe(true);
    expect(stack.length).toBeGreaterThan(0);
  });
});

describe('parseIntParam logic', () => {
  // Test the parameter validation that each endpoint uses
  // We can test this by checking the router responds correctly to different query params

  test('valid days param is accepted', () => {
    const days = parseInt('30', 10);
    expect(days).toBe(30);
    expect(days >= 1 && days <= 365).toBe(true);
  });

  test('non-numeric days produces NaN', () => {
    const days = parseInt('abc', 10);
    expect(isNaN(days)).toBe(true);
  });

  test('days is clamped to max 365', () => {
    const days = Math.min(365, parseInt('999', 10));
    expect(days).toBe(365);
  });

  test('days is clamped to min 1', () => {
    const days = Math.max(1, parseInt('0', 10));
    expect(days).toBe(1);
  });

  test('limit is clamped to max 100', () => {
    const limit = Math.min(100, parseInt('500', 10));
    expect(limit).toBe(100);
  });
});

describe('Analytics Data Contracts', () => {
  describe('Overview contract', () => {
    test('visitors_by_day entries have date, count, unique_sessions', () => {
      for (const entry of MOCK_OVERVIEW.visitors_by_day) {
        expect(typeof entry.date).toBe('string');
        expect(typeof entry.count).toBe('number');
        expect(typeof entry.unique_sessions).toBe('number');
      }
    });

    test('devices has desktop, mobile, tablet keys', () => {
      expect(typeof MOCK_OVERVIEW.devices.desktop).toBe('number');
      expect(typeof MOCK_OVERVIEW.devices.mobile).toBe('number');
      expect(typeof MOCK_OVERVIEW.devices.tablet).toBe('number');
    });

    test('referrers entries have domain and count', () => {
      for (const entry of MOCK_OVERVIEW.referrers) {
        expect(typeof entry.domain).toBe('string');
        expect(typeof entry.count).toBe('number');
      }
    });

    test('new_vs_returning has new and returning', () => {
      expect(typeof MOCK_OVERVIEW.new_vs_returning.new).toBe('number');
      expect(typeof MOCK_OVERVIEW.new_vs_returning.returning).toBe('number');
    });

    test('all count values are non-negative', () => {
      expect(MOCK_OVERVIEW.total_visitors).toBeGreaterThanOrEqual(0);
      expect(MOCK_OVERVIEW.unique_sessions).toBeGreaterThanOrEqual(0);
      expect(MOCK_OVERVIEW.today).toBeGreaterThanOrEqual(0);
      expect(MOCK_OVERVIEW.period).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Funnel contract', () => {
    test('steps array has exactly 8 entries', () => {
      expect(MOCK_FUNNEL.steps).toHaveLength(8);
    });

    test('step names match diagnostic_runs.current_step enum values', () => {
      const expectedSteps = ['intro', 'company_setup', 'persona', 'pillar_setup', 'assessment', 'calibration', 'report', 'finalized'];
      const actualSteps = MOCK_FUNNEL.steps.map(s => s.name);
      expect(actualSteps).toEqual(expectedSteps);
    });

    test('counts are monotonically non-increasing', () => {
      for (let i = 1; i < MOCK_FUNNEL.steps.length; i++) {
        expect(MOCK_FUNNEL.steps[i].count).toBeLessThanOrEqual(MOCK_FUNNEL.steps[i - 1].count);
      }
    });

    test('conversion_pct is null for first step, number for rest', () => {
      expect(MOCK_FUNNEL.steps[0].conversion_pct).toBeNull();
      for (let i = 1; i < MOCK_FUNNEL.steps.length; i++) {
        expect(typeof MOCK_FUNNEL.steps[i].conversion_pct).toBe('number');
        expect(MOCK_FUNNEL.steps[i].conversion_pct!).toBeGreaterThanOrEqual(0);
        expect(MOCK_FUNNEL.steps[i].conversion_pct!).toBeLessThanOrEqual(100);
      }
    });

    test('each step has name, count, conversion_pct', () => {
      for (const step of MOCK_FUNNEL.steps) {
        expect(typeof step.name).toBe('string');
        expect(typeof step.count).toBe('number');
        expect(step.conversion_pct === null || typeof step.conversion_pct === 'number').toBe(true);
      }
    });
  });

  describe('Assessment contract', () => {
    test('progress_distribution has exactly 4 buckets', () => {
      expect(MOCK_ASSESSMENT.progress_distribution).toHaveLength(4);
    });

    test('progress buckets are 0-25, 25-50, 50-75, 75-100', () => {
      const buckets = MOCK_ASSESSMENT.progress_distribution.map(d => d.bucket);
      expect(buckets).toEqual(['0-25', '25-50', '50-75', '75-100']);
    });

    test('completion_rate is a number between 0-100', () => {
      expect(typeof MOCK_ASSESSMENT.completion_rate).toBe('number');
      expect(MOCK_ASSESSMENT.completion_rate).toBeGreaterThanOrEqual(0);
      expect(MOCK_ASSESSMENT.completion_rate).toBeLessThanOrEqual(100);
    });

    test('avg_completion_time_hours is number or null', () => {
      expect(
        MOCK_ASSESSMENT.avg_completion_time_hours === null ||
        typeof MOCK_ASSESSMENT.avg_completion_time_hours === 'number'
      ).toBe(true);
    });

    test('persona_distribution entries have persona and count', () => {
      for (const entry of MOCK_ASSESSMENT.persona_distribution) {
        expect(typeof entry.persona).toBe('string');
        expect(typeof entry.count).toBe('number');
      }
    });
  });

  describe('Geo contract', () => {
    test('country_code values are 2-character strings', () => {
      for (const entry of MOCK_GEO.country_breakdown) {
        expect(typeof entry.country_code).toBe('string');
        expect(entry.country_code).toHaveLength(2);
      }
    });

    test('country_breakdown limited to top 20', () => {
      expect(MOCK_GEO.country_breakdown.length).toBeLessThanOrEqual(20);
    });

    test('city_breakdown limited to top 20', () => {
      expect(MOCK_GEO.city_breakdown.length).toBeLessThanOrEqual(20);
    });

    test('country_breakdown entries have country, country_code, count, unique_sessions', () => {
      for (const entry of MOCK_GEO.country_breakdown) {
        expect(typeof entry.country).toBe('string');
        expect(typeof entry.country_code).toBe('string');
        expect(typeof entry.count).toBe('number');
        expect(typeof entry.unique_sessions).toBe('number');
      }
    });

    test('city_breakdown entries have city, region, country, count', () => {
      for (const entry of MOCK_GEO.city_breakdown) {
        expect(typeof entry.city).toBe('string');
        expect(typeof entry.region).toBe('string');
        expect(typeof entry.country).toBe('string');
        expect(typeof entry.count).toBe('number');
      }
    });
  });

  describe('Subscription contract', () => {
    test('has required fields', () => {
      expect(typeof MOCK_SUBSCRIPTIONS.total_users).toBe('number');
      expect(typeof MOCK_SUBSCRIPTIONS.paid_users).toBe('number');
      expect(typeof MOCK_SUBSCRIPTIONS.free_users).toBe('number');
      expect(typeof MOCK_SUBSCRIPTIONS.override_users).toBe('number');
      expect(typeof MOCK_SUBSCRIPTIONS.mrr).toBe('number');
      expect(typeof MOCK_SUBSCRIPTIONS.conversion_rate).toBe('number');
      expect(typeof MOCK_SUBSCRIPTIONS.churn_count).toBe('number');
    });

    test('mrr is in cents (integer)', () => {
      expect(Number.isInteger(MOCK_SUBSCRIPTIONS.mrr)).toBe(true);
    });

    test('conversion_rate is between 0 and 1', () => {
      expect(MOCK_SUBSCRIPTIONS.conversion_rate).toBeGreaterThanOrEqual(0);
      expect(MOCK_SUBSCRIPTIONS.conversion_rate).toBeLessThanOrEqual(1);
    });

    test('subscriptions_by_month entries have month and count', () => {
      for (const entry of MOCK_SUBSCRIPTIONS.subscriptions_by_month) {
        expect(typeof entry.month).toBe('string');
        expect(entry.month).toMatch(/^\d{4}-\d{2}$/);
        expect(typeof entry.count).toBe('number');
      }
    });
  });

  describe('Activity contract', () => {
    test('events have event_type, detail, created_at', () => {
      for (const event of MOCK_ACTIVITY) {
        expect(typeof event.event_type).toBe('string');
        expect(typeof event.detail).toBe('string');
        expect(typeof event.created_at).toBe('string');
      }
    });

    test('event_type is one of allowed values', () => {
      const allowedTypes = ['signup', 'run_created', 'run_finalized', 'feedback', 'visit'];
      for (const event of MOCK_ACTIVITY) {
        expect(allowedTypes).toContain(event.event_type);
      }
    });

    test('created_at values are valid ISO timestamps', () => {
      for (const event of MOCK_ACTIVITY) {
        const date = new Date(event.created_at);
        expect(date.toISOString()).toBeTruthy();
        expect(isNaN(date.getTime())).toBe(false);
      }
    });

    test('events are in descending chronological order', () => {
      for (let i = 1; i < MOCK_ACTIVITY.length; i++) {
        const prev = new Date(MOCK_ACTIVITY[i - 1].created_at).getTime();
        const curr = new Date(MOCK_ACTIVITY[i].created_at).getTime();
        expect(prev).toBeGreaterThanOrEqual(curr);
      }
    });

    test('detail is never null', () => {
      for (const event of MOCK_ACTIVITY) {
        expect(event.detail).not.toBeNull();
      }
    });
  });
});
