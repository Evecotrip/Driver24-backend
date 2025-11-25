"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const clerk_1 = require("../middleware/clerk");
const router = (0, express_1.Router)();
// All user routes require authentication
router.get('/', clerk_1.requireAuth, user_controller_1.getAllUsers);
router.get('/me', clerk_1.requireAuth, user_controller_1.getCurrentUser);
router.get('/:id', clerk_1.requireAuth, user_controller_1.getUserById);
exports.default = router;
