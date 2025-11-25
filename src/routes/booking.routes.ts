import { Router } from 'express';
import {
  createBooking,
  getUserBookings,
  getDriverBookings,
  updateBookingStatus,
  cancelBooking,
  getDriverFullInfo
} from '../controllers/booking.controller';
import { requireJWT, requireRole } from '../middleware/jwt';
import { UserRole } from '@prisma/client';

const router = Router();

// User routes
router.post('/', requireJWT, requireRole(UserRole.USER), createBooking);
router.get('/my-bookings', requireJWT, requireRole(UserRole.USER), getUserBookings);
router.patch('/:bookingId/cancel', requireJWT, requireRole(UserRole.USER), cancelBooking);
router.get('/driver/:driverId/full-info', requireJWT, requireRole(UserRole.USER), getDriverFullInfo);

// Driver routes
router.get('/driver-requests', requireJWT, requireRole(UserRole.DRIVER), getDriverBookings);
router.patch('/:bookingId/respond', requireJWT, requireRole(UserRole.DRIVER), updateBookingStatus);

export default router;
