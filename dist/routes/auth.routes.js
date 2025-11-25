"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const clerk_1 = require("../middleware/clerk");
const router = (0, express_1.Router)();
// Debug logging
console.log('🔧 Auth routes loaded');
// Public routes - no auth required
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
// These routes require Clerk authentication
router.post('/refresh-token', clerk_1.requireAuth, auth_controller_1.refreshToken);
exports.default = router;
