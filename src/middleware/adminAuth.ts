// VS-27b: Admin Authentication Middleware
// Restricts admin routes to users in the ADMIN_EMAILS allowlist

import { Request, Response, NextFunction } from 'express';

// Admin emails - can be extended via ADMIN_EMAILS env var
// Format: comma-separated list of emails
const DEFAULT_ADMIN_EMAILS = ['can@cfolens.com', 'can@cfo-lens.com', 'admin@cfo-lens.com'];

function getAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS;
  if (envEmails) {
    const parsed = envEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    return [...DEFAULT_ADMIN_EMAILS, ...parsed];
  }
  return DEFAULT_ADMIN_EMAILS;
}

/**
 * Middleware to require admin access
 * Uses req.supabase to get current user's email
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Get user details from Supabase Auth
    const { data: { user }, error } = await req.supabase.auth.getUser();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    const userEmail = user.email?.toLowerCase();
    if (!userEmail) {
      return res.status(403).json({ error: 'No email associated with account' });
    }

    const adminEmails = getAdminEmails();
    if (!adminEmails.includes(userEmail)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (err) {
    console.error('Admin auth error:', err);
    return res.status(500).json({ error: 'Authentication check failed' });
  }
}

/**
 * Check if current user is admin (non-blocking)
 * Attaches req.isAdmin = true/false
 */
export async function checkAdmin(req: Request, _res: Response, next: NextFunction) {
  (req as any).isAdmin = false;

  if (!req.userId) {
    return next();
  }

  try {
    const { data: { user } } = await req.supabase.auth.getUser();
    if (user?.email) {
      const adminEmails = getAdminEmails();
      const isAdmin = adminEmails.includes(user.email.toLowerCase());
      (req as any).isAdmin = isAdmin;

      // DEBUG: Log admin check results
      console.log('[DEBUG checkAdmin]', {
        userEmail: user.email,
        isAdmin,
        adminEmailsCount: adminEmails.length
      });
    }
  } catch (err) {
    // Log admin check failures
    console.log('[DEBUG checkAdmin] Error:', err);
  }

  next();
}
