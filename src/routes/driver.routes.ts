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
import {
  registerGuestDriver,
  checkPendingRegistration
} from '../controllers/pendingDriver.controller';
import { requireJWT, requireRole } from '../middleware/jwt';
import { upload } from '../middleware/upload';
import { UserRole } from '@prisma/client';

const router = Router();

// Public routes (no auth required) - Guest driver registration
router.post('/register-guest',
  upload.fields([
    { name: 'dlImage', maxCount: 1 },
    { name: 'panImage', maxCount: 1 },
    { name: 'aadharImage', maxCount: 1 }
  ]),
  registerGuestDriver
);
router.get('/pending', checkPendingRegistration);

// Driver routes - require JWT authentication
router.post('/profile',
  requireJWT,
  requireRole(UserRole.DRIVER),
  upload.fields([
    { name: 'dlImage', maxCount: 1 },
    { name: 'panImage', maxCount: 1 },
    { name: 'aadharImage', maxCount: 1 }
  ]),
  createOrUpdateDriverProfile
);
router.get('/profile/me', requireJWT, requireRole(UserRole.DRIVER), getMyDriverProfile);
router.patch('/availability', requireJWT, requireRole(UserRole.DRIVER), updateAvailability);

// User routes - get drivers by city
router.get('/city/:city', requireJWT, requireRole(UserRole.USER, UserRole.ADMIN), getDriversByCity);

// Admin routes
router.get('/all', requireJWT, requireRole(UserRole.ADMIN), getAllDrivers);
router.get('/pending-verification', requireJWT, requireRole(UserRole.ADMIN), getPendingDrivers);
router.get('/verified', requireJWT, requireRole(UserRole.ADMIN), getVerifiedDrivers);
router.patch('/:driverId/verify', requireJWT, requireRole(UserRole.ADMIN), verifyDriver);
router.post('/bulk-verify', requireJWT, requireRole(UserRole.ADMIN), bulkVerifyDrivers);

export default router;
