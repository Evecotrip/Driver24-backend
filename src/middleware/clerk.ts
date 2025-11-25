import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';

// Extend Express Request to include userId from Clerk
export interface AuthRequest extends Request {
  userId?: string;
}

/**
 * Middleware to require authentication
 * Uses Clerk's getAuth to verify the session
 */
export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const { userId } = getAuth(req);
  
  if (!userId) {
    res.status(401).json({ 
      success: false, 
      error: 'Unauthorized - Authentication required' 
    });
    return;
  }

  // Attach user ID to request for use in controllers
  req.userId = userId;
  next();
}

/**
 * Optional auth middleware - doesn't fail if no token
 * Attaches userId to request if authenticated
 */
export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const { userId } = getAuth(req);
  
  if (userId) {
    req.userId = userId;
  }
  
  next();
}
