"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.decodeToken = decodeToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
/**
 * Generate a custom JWT token with user role
 */
function generateToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: '7d',
        issuer: 'driver-save-backend',
    });
}
/**
 * Verify and decode JWT token
 */
function verifyToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET, {
            issuer: 'driver-save-backend',
        });
        return decoded;
    }
    catch (error) {
        throw new Error('Invalid or expired token');
    }
}
/**
 * Decode token without verification (for debugging)
 */
function decodeToken(token) {
    try {
        return jsonwebtoken_1.default.decode(token);
    }
    catch (error) {
        return null;
    }
}
