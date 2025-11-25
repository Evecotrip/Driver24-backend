import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { verifyToken, JWTPayload } from '../services/jwt.service';

// Extend Express Request to include JWT payload
export interface AuthRequest extends Request {
  userId?: string;
  userRole?: UserRole;
  userCity?: string;
  jwtPayload?: JWTPayload;
}

/**
 * Middleware to verify custom JWT token
 */
export function requireJWT(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        success: false, 
        error: 'No authorization token provided' 
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify and decode token
    const payload = verifyToken(token);
    
    // Attach payload to request
    req.userId = payload.userId;
    req.userRole = payload.role;
    req.userCity = payload.city;
    req.jwtPayload = payload;
    
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    res.status(401).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
}

/**
 * Middleware to require specific role(s)
 */
export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole) {
      res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
      return;
    }

    if (!roles.includes(req.userRole)) {
      res.status(403).json({ 
        success: false, 
        error: `Access denied. Required role: ${roles.join(' or ')}` 
      });
      return;
    }

    next();
  };
}

/**
 * Optional JWT middleware - doesn't fail if no token
 */
export function optionalJWT(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      
      req.userId = payload.userId;
      req.userRole = payload.role;
      req.userCity = payload.city;
      req.jwtPayload = payload;
    }
    
    next();
  } catch (error) {
    // Continue without auth
    next();
  }
}
