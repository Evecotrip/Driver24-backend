"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const admin_controller_1 = require("../controllers/admin.controller");
const jwt_1 = require("../middleware/jwt");
const router = express_1.default.Router();
// All routes require authentication and admin role
router.use(jwt_1.requireJWT);
// Dashboard overview
router.get('/dashboard/overview', admin_controller_1.getDashboardOverview);
// Booking analytics
router.get('/analytics/bookings', admin_controller_1.getBookingAnalytics);
router.get('/bookings', admin_controller_1.getAllBookings);
router.get('/bookings/driver/:driverId', admin_controller_1.getDriverBookingHistory);
router.get('/bookings/user/:userId', admin_controller_1.getUserBookingHistory);
// User analytics
router.get('/analytics/users', admin_controller_1.getUserAnalytics);
// Driver analytics
router.get('/analytics/drivers', admin_controller_1.getDriverAnalytics);
exports.default = router;
