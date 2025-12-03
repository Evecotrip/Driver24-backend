"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_2 = require("@clerk/express");
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const webhook_routes_1 = __importDefault(require("./routes/webhook.routes"));
const auth_routes_1 = __importStar(require("./routes/auth.routes"));
const driver_routes_1 = __importDefault(require("./routes/driver.routes"));
const booking_routes_1 = __importDefault(require("./routes/booking.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const prisma_1 = require("./lib/prisma");
// Load environment variables
dotenv_1.default.config();
// Initialize Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Log all requests for debugging
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    next();
});
// Welcome route
app.get('/', (req, res) => {
    res.json({
        message: 'Driver Save API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            drivers: '/api/drivers',
            bookings: '/api/bookings',
            admin: '/api/admin',
            users: '/api/users',
            upload: '/api/upload',
            webhooks: '/api/webhooks'
        }
    });
});
// Health check route (no auth required)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});
// ============================================
// PUBLIC ROUTES (BEFORE Clerk middleware)
// ============================================
app.use('/api/webhooks', webhook_routes_1.default); // Clerk webhooks
console.log('📍 Registering public /api/auth routes...');
app.use('/api/auth', auth_routes_1.default); // Public auth routes (select-role, profile by clerkId)
console.log('✅ Public /api/auth routes registered');
// ============================================
// CLERK MIDDLEWARE
// ============================================
app.use((0, express_2.clerkMiddleware)());
console.log('🔒 Clerk middleware registered');
// ============================================
// PROTECTED ROUTES (AFTER Clerk middleware)
// ============================================
console.log('📍 Registering protected /api/auth routes...');
app.use('/api/auth', auth_routes_1.protectedAuthRouter); // Protected auth routes (refresh-token, complete-driver-registration)
console.log('✅ Protected /api/auth routes registered');
app.use('/api/drivers', driver_routes_1.default); // Driver routes (require JWT)
app.use('/api/bookings', booking_routes_1.default); // Booking routes (require JWT)
app.use('/api/admin', admin_routes_1.default); // Admin routes (require JWT + ADMIN role)
app.use('/api/users', user_routes_1.default); // User routes (Clerk auth)
app.use('/api/upload', upload_routes_1.default); // Upload routes (require JWT)
// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});
// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await prisma_1.prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await prisma_1.prisma.$disconnect();
    process.exit(0);
});
