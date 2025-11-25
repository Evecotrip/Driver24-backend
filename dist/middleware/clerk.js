"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.optionalAuth = optionalAuth;
const express_1 = require("@clerk/express");
/**
 * Middleware to require authentication
 * Uses Clerk's getAuth to verify the session
 */
function requireAuth(req, res, next) {
    const { userId } = (0, express_1.getAuth)(req);
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
function optionalAuth(req, res, next) {
    const { userId } = (0, express_1.getAuth)(req);
    if (userId) {
        req.userId = userId;
    }
    next();
}
