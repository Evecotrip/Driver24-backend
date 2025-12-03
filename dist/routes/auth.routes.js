"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectedAuthRouter = void 0;
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const clerk_1 = require("../middleware/clerk");
const router = (0, express_1.Router)();
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
}, auth_controller_1.selectRole);
// Get user profile by clerkId (no auth) - for checking if user has selected role
router.get('/profile', (req, res, next) => {
    // If clerkId is in query params, use the public endpoint
    if (req.query.clerkId) {
        return (0, auth_controller_1.getProfileByClerkId)(req, res);
    }
    // Otherwise, require Clerk auth
    next();
}, clerk_1.requireAuth, auth_controller_1.getProfile);
exports.default = router;
// ============================================
// PROTECTED ROUTES (Require Clerk auth)
// Export separately to be registered after clerkMiddleware
// ============================================
exports.protectedAuthRouter = (0, express_1.Router)();
// These routes require Clerk authentication
exports.protectedAuthRouter.post('/refresh-token', clerk_1.requireAuth, auth_controller_1.refreshToken);
exports.protectedAuthRouter.post('/complete-driver-registration', clerk_1.requireAuth, auth_controller_1.completeDriverRegistration);
