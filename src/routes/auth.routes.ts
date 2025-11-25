import { Router } from 'express';
import { selectRole, getProfile, getProfileByClerkId, refreshToken } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/clerk';

const router = Router();

// Debug logging
console.log('🔧 Auth routes loaded');

// Public routes - no auth required
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

// These routes require Clerk authentication
router.post('/refresh-token', requireAuth, refreshToken);

export default router;
