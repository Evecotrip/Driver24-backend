import { Router } from 'express';
import { selectRole, getProfile, getProfileByClerkId, refreshToken, completeDriverRegistration } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/clerk';

const router = Router();

// Debug logging
console.log('🔧 Auth routes loaded');

// ============================================
// PUBLIC ROUTES (No Clerk auth required)
// ============================================

// Select role - public endpoint (no Clerk auth needed)
router.post('/select-role', (req, res, next) => {
  console.log('✅ /select-role route hit!');
  console.log('Request body:', req.body);
  next();
}, selectRole);

// Get user profile by clerkId (no auth) - for checking if user has selected role
router.get('/profile', (req, res, next) => {
  // If clerkId is in query params, use the public endpoint
  if (req.query.clerkId) {
    return getProfileByClerkId(req, res);
  }
  // Otherwise, require Clerk auth
  next();
}, requireAuth, getProfile);

export default router;

// ============================================
// PROTECTED ROUTES (Require Clerk auth)
// Export separately to be registered after clerkMiddleware
// ============================================
export const protectedAuthRouter = Router();

// These routes require Clerk authentication
protectedAuthRouter.post('/refresh-token', requireAuth, refreshToken);
protectedAuthRouter.post('/complete-driver-registration', requireAuth, completeDriverRegistration);
