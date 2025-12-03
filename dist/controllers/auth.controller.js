"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeDriverRegistration = exports.refreshToken = exports.getProfile = exports.getProfileByClerkId = exports.selectRole = void 0;
const client_1 = require("@prisma/client");
const jwt_service_1 = require("../services/jwt.service");
const prisma = new client_1.PrismaClient();
/**
 * Select role and generate custom JWT token
 * Accepts clerkId in request body
 */
const selectRole = async (req, res) => {
    try {
        const { clerkId, role, city } = req.body;
        if (!clerkId) {
            res.status(400).json({ success: false, error: 'clerkId is required' });
            return;
        }
        // role cannot be ADMIN
        if (role === client_1.UserRole.ADMIN) {
            res.status(400).json({
                success: false,
                error: 'Role cannot be ADMIN'
            });
            return;
        }
        // Validate role
        if (!role || !Object.values(client_1.UserRole).includes(role)) {
            res.status(400).json({
                success: false,
                error: 'Invalid role. Must be USER or DRIVER'
            });
            return;
        }
        // City is required for USER and DRIVER roles
        if ((role === client_1.UserRole.USER || role === client_1.UserRole.DRIVER) && !city) {
            res.status(400).json({
                success: false,
                error: 'City is required for USER and DRIVER roles'
            });
            return;
        }
        // Get user from database by clerkId
        const user = await prisma.user.findUnique({
            where: { clerkId }
        });
        if (!user) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }
        // Update user role and city
        const updatedUser = await prisma.user.update({
            where: { clerkId },
            data: {
                role,
                city: city || user.city
            }
        });
        // Generate custom JWT token
        const token = (0, jwt_service_1.generateToken)({
            userId: updatedUser.id,
            email: updatedUser.email,
            role: updatedUser.role,
            city: updatedUser.city || undefined
        });
        res.json({
            success: true,
            data: {
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    city: updatedUser.city
                },
                token
            },
            message: 'Role selected successfully. Use this token for API requests.'
        });
    }
    catch (error) {
        console.error('Error selecting role:', error);
        res.status(500).json({ success: false, error: 'Failed to select role' });
    }
};
exports.selectRole = selectRole;
/**
 * Get user profile by clerkId (no auth required - for role checking)
 * If user has a role, also generate and return a JWT token
 */
const getProfileByClerkId = async (req, res) => {
    try {
        const { clerkId } = req.query;
        if (!clerkId || typeof clerkId !== 'string') {
            res.status(400).json({ success: false, error: 'clerkId is required' });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: {
                id: true,
                clerkId: true,
                email: true,
                firstName: true,
                lastName: true,
                username: true,
                profileImageUrl: true,
                role: true,
                city: true,
            }
        });
        if (!user) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }
        // If user has a role, generate JWT token
        let token = null;
        if (user.role) {
            token = (0, jwt_service_1.generateToken)({
                userId: user.id,
                email: user.email,
                role: user.role,
                city: user.city || undefined
            });
        }
        res.json({
            success: true,
            data: {
                user,
                token
            }
        });
    }
    catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch profile' });
    }
};
exports.getProfileByClerkId = getProfileByClerkId;
/**
 * Get current user profile with role (Clerk auth required)
 */
const getProfile = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: {
                driverProfile: true
            }
        });
        if (!user) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch profile' });
    }
};
exports.getProfile = getProfile;
/**
 * Refresh JWT token
 */
const refreshToken = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { clerkId: userId }
        });
        if (!user || !user.role) {
            res.status(400).json({
                success: false,
                error: 'User role not set. Please select a role first.'
            });
            return;
        }
        // Generate new token
        const token = (0, jwt_service_1.generateToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
            city: user.city || undefined
        });
        res.json({ success: true, data: { token } });
    }
    catch (error) {
        console.error('Error refreshing token:', error);
        res.status(500).json({ success: false, error: 'Failed to refresh token' });
    }
};
exports.refreshToken = refreshToken;
/**
 * Complete driver registration after Clerk authentication
 * Links pending driver data to authenticated user
 */
const completeDriverRegistration = async (req, res) => {
    try {
        const userId = req.userId; // Clerk user ID
        const { email } = req.body;
        if (!userId) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
        }
        if (!email) {
            res.status(400).json({ success: false, error: 'Email is required' });
            return;
        }
        // Get user from database
        const user = await prisma.user.findUnique({
            where: { clerkId: userId }
        });
        if (!user) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }
        // Check if user already has a role
        if (user.role) {
            res.status(400).json({
                success: false,
                error: 'User already has a role assigned'
            });
            return;
        }
        // Find pending driver registration
        const pendingDriver = await prisma.pendingDriver.findUnique({
            where: { email }
        });
        if (!pendingDriver) {
            res.status(404).json({
                success: false,
                error: 'No pending registration found with this email'
            });
            return;
        }
        if (pendingDriver.isConverted) {
            res.status(400).json({
                success: false,
                error: 'This registration has already been completed'
            });
            return;
        }
        // Check if expired
        if (new Date() > pendingDriver.expiresAt) {
            res.status(410).json({
                success: false,
                error: 'Pending registration has expired. Please register again.'
            });
            return;
        }
        // Update user with DRIVER role and city
        const updatedUser = await prisma.user.update({
            where: { clerkId: userId },
            data: {
                role: client_1.UserRole.DRIVER,
                city: pendingDriver.city
            }
        });
        // Create driver profile from pending data
        const driver = await prisma.driver.create({
            data: {
                userId: updatedUser.id,
                name: pendingDriver.name,
                phoneNumber: pendingDriver.phoneNumber,
                dlNumber: pendingDriver.dlNumber,
                dlImage: pendingDriver.dlImage,
                panNumber: pendingDriver.panNumber,
                panImage: pendingDriver.panImage,
                aadharNumber: pendingDriver.aadharNumber,
                aadharImage: pendingDriver.aadharImage,
                permanentAddress: pendingDriver.permanentAddress,
                operatingAddress: pendingDriver.operatingAddress,
                city: pendingDriver.city,
                state: pendingDriver.state,
                pincode: pendingDriver.pincode,
                vehicleType: pendingDriver.vehicleType,
                vehicleModel: pendingDriver.vehicleModel,
                vehicleNumber: pendingDriver.vehicleNumber,
                experience: pendingDriver.experience,
                salaryExpectation: pendingDriver.salaryExpectation,
                availability: true
            }
        });
        // Mark pending driver as converted
        await prisma.pendingDriver.update({
            where: { id: pendingDriver.id },
            data: {
                isConverted: true,
                convertedAt: new Date(),
                convertedToUserId: updatedUser.id
            }
        });
        // Generate custom JWT token
        const token = (0, jwt_service_1.generateToken)({
            userId: updatedUser.id,
            email: updatedUser.email,
            role: updatedUser.role,
            city: updatedUser.city || undefined
        });
        res.json({
            success: true,
            data: {
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    city: updatedUser.city
                },
                driver,
                token
            },
            message: 'Driver registration completed successfully!'
        });
    }
    catch (error) {
        console.error('Error completing driver registration:', error);
        // Handle unique constraint violations
        if (error.code === 'P2002') {
            res.status(400).json({
                success: false,
                error: `${error.meta?.target?.[0] || 'Field'} already exists`
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'Failed to complete driver registration'
        });
    }
};
exports.completeDriverRegistration = completeDriverRegistration;
