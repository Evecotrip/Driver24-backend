"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const booking_controller_1 = require("../controllers/booking.controller");
const jwt_1 = require("../middleware/jwt");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// User routes
router.post('/', jwt_1.requireJWT, (0, jwt_1.requireRole)(client_1.UserRole.USER), booking_controller_1.createBooking);
router.get('/my-bookings', jwt_1.requireJWT, (0, jwt_1.requireRole)(client_1.UserRole.USER), booking_controller_1.getUserBookings);
router.patch('/:bookingId/cancel', jwt_1.requireJWT, (0, jwt_1.requireRole)(client_1.UserRole.USER), booking_controller_1.cancelBooking);
router.get('/driver/:driverId/full-info', jwt_1.requireJWT, (0, jwt_1.requireRole)(client_1.UserRole.USER), booking_controller_1.getDriverFullInfo);
// Driver routes
router.get('/driver-requests', jwt_1.requireJWT, (0, jwt_1.requireRole)(client_1.UserRole.DRIVER), booking_controller_1.getDriverBookings);
router.patch('/:bookingId/respond', jwt_1.requireJWT, (0, jwt_1.requireRole)(client_1.UserRole.DRIVER), booking_controller_1.updateBookingStatus);
exports.default = router;
