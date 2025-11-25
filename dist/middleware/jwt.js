"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireJWT = requireJWT;
exports.requireRole = requireRole;
exports.optionalJWT = optionalJWT;
const jwt_service_1 = require("../services/jwt.service");
/**
 * Middleware to verify custom JWT token
 */
function requireJWT(req, res, next) {
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
        const payload = (0, jwt_service_1.verifyToken)(token);
        // Attach payload to request
        req.userId = payload.userId;
        req.userRole = payload.role;
        req.userCity = payload.city;
        req.jwtPayload = payload;
        next();
    }
    catch (error) {
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
function requireRole(...roles) {
    return (req, res, next) => {
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
function optionalJWT(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const payload = (0, jwt_service_1.verifyToken)(token);
            req.userId = payload.userId;
            req.userRole = payload.role;
            req.userCity = payload.city;
            req.jwtPayload = payload;
        }
        next();
    }
    catch (error) {
        // Continue without auth
        next();
    }
}
