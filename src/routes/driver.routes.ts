import { Router } from 'express';
import {
  createOrUpdateDriverProfile,
  getMyDriverProfile,
  getDriversByCity,
  getAllDrivers,
  verifyDriver,
  getPendingDrivers,
  getVerifiedDrivers,
  bulkVerifyDrivers,
  updateAvailability
} from '../controllers/driver.controller';
import { requireJWT, requireRole } from '../middleware/jwt';
import { UserRole } from '@prisma/client';

const router = Router();

// Driver routes - require JWT authentication
router.post('/profile', requireJWT, requireRole(UserRole.DRIVER), createOrUpdateDriverProfile);
router.get('/profile/me', requireJWT, requireRole(UserRole.DRIVER), getMyDriverProfile);
router.patch('/availability', requireJWT, requireRole(UserRole.DRIVER), updateAvailability);

// User routes - get drivers by city
router.get('/city/:city', requireJWT, requireRole(UserRole.USER, UserRole.ADMIN), getDriversByCity);

// Admin routes
router.get('/all', requireJWT, requireRole(UserRole.ADMIN), getAllDrivers);
router.get('/pending', requireJWT, requireRole(UserRole.ADMIN), getPendingDrivers);
router.get('/verified', requireJWT, requireRole(UserRole.ADMIN), getVerifiedDrivers);
router.patch('/:driverId/verify', requireJWT, requireRole(UserRole.ADMIN), verifyDriver);
router.post('/bulk-verify', requireJWT, requireRole(UserRole.ADMIN), bulkVerifyDrivers);

export default router;
