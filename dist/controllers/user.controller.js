"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = exports.getCurrentUser = exports.getAllUsers = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Get all users
 */
const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json({ success: true, data: users });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
};
exports.getAllUsers = getAllUsers;
/**
 * Get current user profile
 */
const getCurrentUser = async (req, res) => {
    try {
        if (!req.userId) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { clerkId: req.userId }
        });
        if (!user) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch user' });
    }
};
exports.getCurrentUser = getCurrentUser;
/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id }
        });
        if (!user) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch user' });
    }
};
exports.getUserById = getUserById;
