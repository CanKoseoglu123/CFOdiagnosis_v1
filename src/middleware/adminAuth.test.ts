import { describe, test, expect, vi, beforeEach } from 'vitest';
import { requireAdmin, checkAdmin } from './adminAuth';

function mockReq(overrides: Record<string, unknown> = {}): any {
  return {
    userId: 'user-123',
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { email: 'admin@test.com' } },
          error: null,
        }),
      },
    },
    ...overrides,
  };
}

function mockRes(): any {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
}

beforeEach(() => {
  vi.clearAllMocks();
  // Set ADMIN_EMAILS env var for tests
  process.env.ADMIN_EMAILS = 'admin@test.com,other-admin@test.com';
});

describe('requireAdmin', () => {
  test('returns 401 when no userId', async () => {
    const req = mockReq({ userId: undefined });
    const res = mockRes();
    const next = vi.fn();
    await requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next() for admin user', async () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    await requireAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 403 for non-admin user', async () => {
    const req = mockReq({
      supabase: {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { email: 'nobody@test.com' } },
            error: null,
          }),
        },
      },
    });
    const res = mockRes();
    const next = vi.fn();
    await requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when getUser fails', async () => {
    const req = mockReq({
      supabase: {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Invalid token'),
          }),
        },
      },
    });
    const res = mockRes();
    const next = vi.fn();
    await requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('admin check is case-insensitive', async () => {
    const req = mockReq({
      supabase: {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { email: 'ADMIN@TEST.COM' } },
            error: null,
          }),
        },
      },
    });
    const res = mockRes();
    const next = vi.fn();
    await requireAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('returns 403 when user has no email', async () => {
    const req = mockReq({
      supabase: {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { email: undefined } },
            error: null,
          }),
        },
      },
    });
    const res = mockRes();
    const next = vi.fn();
    await requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns empty list when ADMIN_EMAILS not set', async () => {
    delete process.env.ADMIN_EMAILS;
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    await requireAdmin(req, res, next);
    // With no ADMIN_EMAILS, nobody is admin
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('checkAdmin', () => {
  test('sets isAdmin=true for admin user', async () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    await checkAdmin(req, res, next);
    expect(req.isAdmin).toBe(true);
    expect(next).toHaveBeenCalled();
  });

  test('sets isAdmin=false for non-admin user', async () => {
    const req = mockReq({
      supabase: {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { email: 'nobody@test.com' } },
            error: null,
          }),
        },
      },
    });
    const res = mockRes();
    const next = vi.fn();
    await checkAdmin(req, res, next);
    expect(req.isAdmin).toBe(false);
    expect(next).toHaveBeenCalled();
  });

  test('sets isAdmin=false when no userId', async () => {
    const req = mockReq({ userId: undefined });
    const res = mockRes();
    const next = vi.fn();
    await checkAdmin(req, res, next);
    expect(req.isAdmin).toBe(false);
    expect(next).toHaveBeenCalled();
  });

  test('does not block on auth error', async () => {
    const req = mockReq({
      supabase: {
        auth: {
          getUser: vi.fn().mockRejectedValue(new Error('auth down')),
        },
      },
    });
    const res = mockRes();
    const next = vi.fn();
    await checkAdmin(req, res, next);
    expect(req.isAdmin).toBe(false);
    expect(next).toHaveBeenCalled();
  });
});
