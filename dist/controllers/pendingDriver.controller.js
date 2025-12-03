"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredPendingDrivers = exports.checkPendingRegistration = exports.registerGuestDriver = void 0;
const client_1 = require("@prisma/client");
const upload_service_1 = require("../services/upload.service");
const prisma = new client_1.PrismaClient();
/**
 * Register as guest driver with file uploads (no auth required)
 * POST /api/drivers/register-guest
 */
const registerGuestDriver = async (req, res) => {
    try {
        const files = req.files;
        const { email, phoneNumber, name, dlNumber, panNumber, aadharNumber, permanentAddress, operatingAddress, city, state, pincode, vehicleType, vehicleModel, vehicleNumber, experience, salaryExpectation } = req.body;
        // Validate required fields
        if (!email || !phoneNumber || !name || !dlNumber || !panNumber || !aadharNumber ||
            !permanentAddress || !operatingAddress || !city) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields: email, phoneNumber, name, dlNumber, panNumber, aadharNumber, permanentAddress, operatingAddress, city'
            });
            return;
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
            return;
        }
        // Check if pending registration already exists
        const existingPending = await prisma.pendingDriver.findUnique({
            where: { email }
        });
        if (existingPending && !existingPending.isConverted) {
            res.status(400).json({
                success: false,
                error: 'A pending registration already exists with this email. Please complete authentication or use a different email.'
            });
            return;
        }
        // Check if user already exists with this email
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            res.status(400).json({
                success: false,
                error: 'An account already exists with this email. Please sign in instead.'
            });
            return;
        }
        // Upload images to Cloudinary
        let dlImageUrl, panImageUrl, aadharImageUrl;
        if (files?.dlImage?.[0]) {
            const dlResult = await (0, upload_service_1.uploadImage)(files.dlImage[0].buffer, 'dl-images', `${Date.now()}-dl-${email.replace(/[^a-zA-Z0-9]/g, '-')}`);
            dlImageUrl = dlResult.url;
        }
        if (files?.panImage?.[0]) {
            const panResult = await (0, upload_service_1.uploadImage)(files.panImage[0].buffer, 'pan-images', `${Date.now()}-pan-${email.replace(/[^a-zA-Z0-9]/g, '-')}`);
            panImageUrl = panResult.url;
        }
        if (files?.aadharImage?.[0]) {
            const aadharResult = await (0, upload_service_1.uploadImage)(files.aadharImage[0].buffer, 'aadhar-images', `${Date.now()}-aadhar-${email.replace(/[^a-zA-Z0-9]/g, '-')}`);
            aadharImageUrl = aadharResult.url;
        }
        // Set expiration date (30 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        // Create pending driver registration
        const pendingDriver = await prisma.pendingDriver.create({
            data: {
                email,
                phoneNumber,
                name,
                dlNumber,
                dlImage: dlImageUrl,
                panNumber,
                panImage: panImageUrl,
                aadharNumber,
                aadharImage: aadharImageUrl,
                permanentAddress,
                operatingAddress,
                city,
                state,
                pincode,
                vehicleType,
                vehicleModel,
                vehicleNumber,
                experience: experience ? parseInt(experience) : undefined,
                salaryExpectation: salaryExpectation ? parseInt(salaryExpectation) : undefined,
                expiresAt
            }
        });
        res.status(201).json({
            success: true,
            data: {
                id: pendingDriver.id,
                email: pendingDriver.email,
                expiresAt: pendingDriver.expiresAt
            },
            message: 'Registration details saved successfully. Please complete authentication to activate your driver profile.'
        });
    }
    catch (error) {
        console.error('Error creating pending driver:', error);
        // Handle unique constraint violations
        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0] || 'Field';
            res.status(400).json({
                success: false,
                error: `${field} already exists in pending registrations`
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'Failed to save registration details'
        });
    }
};
exports.registerGuestDriver = registerGuestDriver;
/**
 * Check if pending registration exists
 * GET /api/drivers/pending?email=xxx
 */
const checkPendingRegistration = async (req, res) => {
    try {
        const { email, phoneNumber } = req.query;
        if (!email && !phoneNumber) {
            res.status(400).json({
                success: false,
                error: 'Email or phone number is required'
            });
            return;
        }
        let pendingDriver;
        if (email) {
            pendingDriver = await prisma.pendingDriver.findUnique({
                where: { email: email }
            });
        }
        else if (phoneNumber) {
            pendingDriver = await prisma.pendingDriver.findFirst({
                where: { phoneNumber: phoneNumber }
            });
        }
        if (!pendingDriver || pendingDriver.isConverted) {
            res.status(404).json({
                success: false,
                error: 'No pending registration found'
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
        res.json({
            success: true,
            data: {
                id: pendingDriver.id,
                email: pendingDriver.email,
                name: pendingDriver.name,
                city: pendingDriver.city,
                expiresAt: pendingDriver.expiresAt
            }
        });
    }
    catch (error) {
        console.error('Error checking pending registration:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check pending registration'
        });
    }
};
exports.checkPendingRegistration = checkPendingRegistration;
/**
 * Delete expired pending drivers (cleanup job)
 * This should be called by a cron job or scheduled task
 */
const cleanupExpiredPendingDrivers = async () => {
    try {
        const result = await prisma.pendingDriver.deleteMany({
            where: {
                expiresAt: { lt: new Date() },
                isConverted: false
            }
        });
        console.log(`✅ Cleaned up ${result.count} expired pending drivers`);
        return result.count;
    }
    catch (error) {
        console.error('Error cleaning up pending drivers:', error);
        return 0;
    }
};
exports.cleanupExpiredPendingDrivers = cleanupExpiredPendingDrivers;
