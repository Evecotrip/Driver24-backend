import express from 'express';
import { 
  getAllBookings,
  getBookingAnalytics,
  getUserAnalytics,
  getDriverAnalytics,
  getDriverBookingHistory,
  getUserBookingHistory,
  getDashboardOverview
} from '../controllers/admin.controller';
import { requireJWT } from '../middleware/jwt';

const router = express.Router();

// All routes require authentication and admin role
router.use(requireJWT);

// Dashboard overview
router.get('/dashboard/overview', getDashboardOverview);

// Booking analytics
router.get('/analytics/bookings', getBookingAnalytics);
router.get('/bookings', getAllBookings);
router.get('/bookings/driver/:driverId', getDriverBookingHistory);
router.get('/bookings/user/:userId', getUserBookingHistory);

// User analytics
router.get('/analytics/users', getUserAnalytics);

// Driver analytics
router.get('/analytics/drivers', getDriverAnalytics);

export default router;
