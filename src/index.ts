import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { clerkMiddleware } from '@clerk/express';
import userRoutes from './routes/user.routes';
import webhookRoutes from './routes/webhook.routes';
import authRoutes, { protectedAuthRouter } from './routes/auth.routes';
import driverRoutes from './routes/driver.routes';
import bookingRoutes from './routes/booking.routes';
import adminRoutes from './routes/admin.routes';
import uploadRoutes from './routes/upload.routes';
import { prisma } from './lib/prisma';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/webhooks', webhookRoutes); // Clerk webhooks
console.log('📍 Registering public /api/auth routes...');
app.use('/api/auth', authRoutes); // Public auth routes (select-role, profile by clerkId)
console.log('✅ Public /api/auth routes registered');

// ============================================
// CLERK MIDDLEWARE
// ============================================
app.use(clerkMiddleware());
console.log('🔒 Clerk middleware registered');

// ============================================
// PROTECTED ROUTES (AFTER Clerk middleware)
// ============================================
console.log('📍 Registering protected /api/auth routes...');
app.use('/api/auth', protectedAuthRouter); // Protected auth routes (refresh-token, complete-driver-registration)
console.log('✅ Protected /api/auth routes registered');

app.use('/api/drivers', driverRoutes); // Driver routes (require JWT)
app.use('/api/bookings', bookingRoutes); // Booking routes (require JWT)
app.use('/api/admin', adminRoutes); // Admin routes (require JWT + ADMIN role)
app.use('/api/users', userRoutes); // User routes (Clerk auth)
app.use('/api/upload', uploadRoutes); // Upload routes (require JWT)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
