"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const driver_controller_1 = require("../controllers/driver.controller");
const pendingDriver_controller_1 = require("../controllers/pendingDriver.controller");
const jwt_1 = require("../middleware/jwt");
const upload_1 = require("../middleware/upload");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Public routes (no auth required) - Guest driver registration
router.post('/register-guest', upload_1.upload.fields([
    { name: 'dlImage', maxCount: 1 },
    { name: 'panImage', maxCount: 1 },
    { name: 'aadharImage', maxCount: 1 }
]), pendingDriver_controller_1.registerGuestDriver);
router.get('/pending', pendingDriver_controller_1.checkPendingRegistration);
// Driver routes - require JWT authentication
router.post('/profile', jwt_1.requireJWT, (0, jwt_1.requireRole)(client_1.UserRole.DRIVER), upload_1.upload.fields([
    { name: 'dlImage', maxCount: 1 },
    { name: 'panImage', maxCount: 1 },
    { name: 'aadharImage', maxCount: 1 }
]), driver_controller_1.createOrUpdateDriverProfile);
router.get('/profile/me', jwt_1.requireJWT, (0, jwt_1.requireRole)(client_1.UserRole.DRIVER), driver_controller_1.getMyDriverProfile);
router.patch('/availability', jwt_1.requireJWT, (0, jwt_1.requireRole)(client_1.UserRole.DRIVER), driver_controller_1.updateAvailability);
// User routes - get drivers by city
router.get('/city/:city', jwt_1.requireJWT, (0, jwt_1.requireRole)(client_1.UserRole.USER, client_1.UserRole.ADMIN), driver_controller_1.getDriversByCity);
// Admin routes
router.get('/all', jwt_1.requireJWT, (0, jwt_1.requireRole)(client_1.UserRole.ADMIN), driver_controller_1.getAllDrivers);
router.get('/pending-verification', jwt_1.requireJWT, (0, jwt_1.requireRole)(client_1.UserRole.ADMIN), driver_controller_1.getPendingDrivers);
router.get('/verified', jwt_1.requireJWT, (0, jwt_1.requireRole)(client_1.UserRole.ADMIN), driver_controller_1.getVerifiedDrivers);
router.patch('/:driverId/verify', jwt_1.requireJWT, (0, jwt_1.requireRole)(client_1.UserRole.ADMIN), driver_controller_1.verifyDriver);
router.post('/bulk-verify', jwt_1.requireJWT, (0, jwt_1.requireRole)(client_1.UserRole.ADMIN), driver_controller_1.bulkVerifyDrivers);
exports.default = router;
