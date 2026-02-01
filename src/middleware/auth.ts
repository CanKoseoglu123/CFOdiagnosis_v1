/**
 * Authentication middleware
 * Requires a valid authenticated user on the request.
 */

import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}
