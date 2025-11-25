"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const express_2 = require("@clerk/express");
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const webhook_routes_1 = __importDefault(require("./routes/webhook.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const driver_routes_1 = __importDefault(require("./routes/driver.routes"));
const booking_routes_1 = __importDefault(require("./routes/booking.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
// Load environment variables
dotenv_1.default.config();
// Initialize Prisma Client
const prisma = new client_1.PrismaClient();
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
            webhooks: '/api/webhooks'
        }
    });
});
// Health check route (no auth required)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});
// Public routes (no auth required - must come BEFORE Clerk middleware)
app.use('/api/webhooks', webhook_routes_1.default); // Clerk webhooks
console.log('📍 Registering /api/auth routes...');
app.use('/api/auth', auth_routes_1.default); // Auth routes (includes public select-role endpoint)
console.log('✅ /api/auth routes registered');
// Clerk authentication middleware (applies to routes below)
app.use((0, express_2.clerkMiddleware)());
// Protected API routes (require JWT authentication)
app.use('/api/drivers', driver_routes_1.default); // Driver routes (require JWT)
app.use('/api/bookings', booking_routes_1.default); // Booking routes (require JWT)
app.use('/api/admin', admin_routes_1.default); // Admin routes (require JWT + ADMIN role)
app.use('/api/users', user_routes_1.default); // User routes (Clerk auth)
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
    await prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});
