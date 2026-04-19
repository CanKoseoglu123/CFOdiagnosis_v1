// VS-27b: Admin Authentication Middleware
// Restricts admin routes to users in the ADMIN_EMAILS allowlist

import { Request, Response, NextFunction } from 'express';

// Admin emails - configured via ADMIN_EMAILS env var
// Format: comma-separated list of emails
function getAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS;
  if (!envEmails) {
    console.warn('[adminAuth] ADMIN_EMAILS env var not set - no admin access will be granted');
    return [];
  }
  return envEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
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
  req.isAdmin = false;

  if (!req.userId) {
    return next();
  }

  try {
    const { data: { user } } = await req.supabase.auth.getUser();
    if (user?.email) {
      const adminEmails = getAdminEmails();
      req.isAdmin = adminEmails.includes(user.email.toLowerCase());
    }
  } catch {
    // Non-blocking: admin check failure doesn't prevent request
  }

  next();
}
