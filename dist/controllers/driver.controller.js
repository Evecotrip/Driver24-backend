"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAvailability = exports.bulkVerifyDrivers = exports.getVerifiedDrivers = exports.getPendingDrivers = exports.verifyDriver = exports.getAllDrivers = exports.getDriversByCity = exports.getMyDriverProfile = exports.createOrUpdateDriverProfile = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Create or update driver profile
 * Only users with DRIVER role can create/update their profile
 */
const createOrUpdateDriverProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const userRole = req.userRole;
        if (!userId || userRole !== client_1.UserRole.DRIVER) {
            res.status(403).json({
                success: false,
                error: 'Only users with DRIVER role can create driver profiles'
            });
            return;
        }
        const { name, phoneNumber, rcNumber, rcImage, dlNumber, dlImage, permanentAddress, operatingAddress, city, state, pincode, vehicleType, vehicleModel, vehicleNumber, experience, salaryExpectation, availability } = req.body;
        // Validate required fields
        if (!name || !phoneNumber || !rcNumber || !dlNumber || !permanentAddress || !operatingAddress || !city) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields: name, phoneNumber, rcNumber, dlNumber, permanentAddress, operatingAddress, city'
            });
            return;
        }
        // Check if driver profile already exists
        const existingDriver = await prisma.driver.findUnique({
            where: { userId }
        });
        let driver;
        if (existingDriver) {
            // Update existing profile
            driver = await prisma.driver.update({
                where: { userId },
                data: {
                    name,
                    phoneNumber,
                    rcNumber,
                    rcImage,
                    dlNumber,
                    dlImage,
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
                    availability: availability !== undefined ? availability : true
                }
            });
        }
        else {
            // Create new profile
            driver = await prisma.driver.create({
                data: {
                    userId,
                    name,
                    phoneNumber,
                    rcNumber,
                    rcImage,
                    dlNumber,
                    dlImage,
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
                    availability: availability !== undefined ? availability : true
                }
            });
        }
        res.json({
            success: true,
            data: driver,
            message: existingDriver ? 'Driver profile updated successfully' : 'Driver profile created successfully'
        });
    }
    catch (error) {
        console.error('Error creating/updating driver profile:', error);
        // Handle unique constraint violations
        if (error.code === 'P2002') {
            res.status(400).json({
                success: false,
                error: `${error.meta?.target?.[0] || 'Field'} already exists`
            });
            return;
        }
        res.status(500).json({ success: false, error: 'Failed to create/update driver profile' });
    }
};
exports.createOrUpdateDriverProfile = createOrUpdateDriverProfile;
/**
 * Get driver profile by user ID (for the logged-in driver)
 */
const getMyDriverProfile = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
        }
        const driver = await prisma.driver.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true,
                        profileImageUrl: true
                    }
                }
            }
        });
        if (!driver) {
            res.status(404).json({ success: false, error: 'Driver profile not found' });
            return;
        }
        res.json({ success: true, data: driver });
    }
    catch (error) {
        console.error('Error fetching driver profile:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch driver profile' });
    }
};
exports.getMyDriverProfile = getMyDriverProfile;
/**
 * Get all drivers by city (for users) with pagination and filters
 */
const getDriversByCity = async (req, res) => {
    try {
        const { city } = req.params;
        const userRole = req.userRole;
        // Only USER and ADMIN can view drivers
        if (userRole !== client_1.UserRole.USER && userRole !== client_1.UserRole.ADMIN) {
            res.status(403).json({
                success: false,
                error: 'Only users with USER or ADMIN role can view drivers'
            });
            return;
        }
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Filter parameters
        const minSalary = req.query.minSalary ? parseInt(req.query.minSalary) : undefined;
        const maxSalary = req.query.maxSalary ? parseInt(req.query.maxSalary) : undefined;
        const minExperience = req.query.minExperience ? parseInt(req.query.minExperience) : undefined;
        const maxExperience = req.query.maxExperience ? parseInt(req.query.maxExperience) : undefined;
        // Build where clause with filters 
        const whereClause = {
            city: {
                equals: city,
                mode: 'insensitive'
            },
            availability: true,
            isVerified: true // Only show verified drivers to users
        };
        // Add salary filters
        if (minSalary !== undefined || maxSalary !== undefined) {
            whereClause.salaryExpectation = {};
            if (minSalary !== undefined) {
                whereClause.salaryExpectation.gte = minSalary;
            }
            if (maxSalary !== undefined) {
                whereClause.salaryExpectation.lte = maxSalary;
            }
        }
        // Add experience filters
        if (minExperience !== undefined || maxExperience !== undefined) {
            whereClause.experience = {};
            if (minExperience !== undefined) {
                whereClause.experience.gte = minExperience;
            }
            if (maxExperience !== undefined) {
                whereClause.experience.lte = maxExperience;
            }
        }
        // Get total count for pagination
        const totalCount = await prisma.driver.count({ where: whereClause });
        // Get paginated drivers
        const drivers = await prisma.driver.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true,
                        profileImageUrl: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip,
            take: limit
        });
        res.json({
            success: true,
            data: drivers,
            count: drivers.length,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
                hasNextPage: page < Math.ceil(totalCount / limit),
                hasPrevPage: page > 1
            }
        });
    }
    catch (error) {
        console.error('Error fetching drivers:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch drivers' });
    }
};
exports.getDriversByCity = getDriversByCity;
/**
 * Get all drivers (for admin)
 */
const getAllDrivers = async (req, res) => {
    try {
        const userRole = req.userRole;
        if (userRole !== client_1.UserRole.ADMIN) {
            res.status(403).json({
                success: false,
                error: 'Only admins can view all drivers'
            });
            return;
        }
        const { verified, city } = req.query;
        const drivers = await prisma.driver.findMany({
            where: {
                ...(verified !== undefined && { isVerified: verified === 'true' }),
                ...(city && { city: { equals: city, mode: 'insensitive' } })
            },
            include: {
                user: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true,
                        profileImageUrl: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json({ success: true, data: drivers, count: drivers.length });
    }
    catch (error) {
        console.error('Error fetching all drivers:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch drivers' });
    }
};
exports.getAllDrivers = getAllDrivers;
/**
 * Verify driver (admin only)
 */
const verifyDriver = async (req, res) => {
    try {
        const { driverId } = req.params;
        const userRole = req.userRole;
        const adminId = req.userId;
        if (userRole !== client_1.UserRole.ADMIN) {
            res.status(403).json({
                success: false,
                error: 'Only admins can verify drivers'
            });
            return;
        }
        const driver = await prisma.driver.update({
            where: { id: driverId },
            data: {
                isVerified: true,
                verifiedAt: new Date(),
                verifiedBy: adminId
            }
        });
        res.json({
            success: true,
            data: driver,
            message: 'Driver verified successfully'
        });
    }
    catch (error) {
        console.error('Error verifying driver:', error);
        res.status(500).json({ success: false, error: 'Failed to verify driver' });
    }
};
exports.verifyDriver = verifyDriver;
/**
 * Get pending verification drivers (admin only)
 */
const getPendingDrivers = async (req, res) => {
    try {
        const userRole = req.userRole;
        if (userRole !== client_1.UserRole.ADMIN) {
            res.status(403).json({
                success: false,
                error: 'Only admins can view pending drivers'
            });
            return;
        }
        const drivers = await prisma.driver.findMany({
            where: {
                isVerified: false
            },
            include: {
                user: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true,
                        profileImageUrl: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json({ success: true, data: drivers, count: drivers.length });
    }
    catch (error) {
        console.error('Error fetching pending drivers:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch pending drivers' });
    }
};
exports.getPendingDrivers = getPendingDrivers;
/**
 * Get verified drivers (admin only)
 */
const getVerifiedDrivers = async (req, res) => {
    try {
        const userRole = req.userRole;
        if (userRole !== client_1.UserRole.ADMIN) {
            res.status(403).json({
                success: false,
                error: 'Only admins can view verified drivers'
            });
            return;
        }
        const drivers = await prisma.driver.findMany({
            where: {
                isVerified: true
            },
            include: {
                user: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true,
                        profileImageUrl: true
                    }
                }
            },
            orderBy: {
                verifiedAt: 'desc'
            }
        });
        res.json({ success: true, data: drivers, count: drivers.length });
    }
    catch (error) {
        console.error('Error fetching verified drivers:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch verified drivers' });
    }
};
exports.getVerifiedDrivers = getVerifiedDrivers;
/**
 * Bulk verify drivers (admin only)
 */
const bulkVerifyDrivers = async (req, res) => {
    try {
        const userRole = req.userRole;
        const adminId = req.userId;
        const { driverIds } = req.body;
        if (userRole !== client_1.UserRole.ADMIN) {
            res.status(403).json({
                success: false,
                error: 'Only admins can verify drivers'
            });
            return;
        }
        if (!Array.isArray(driverIds) || driverIds.length === 0) {
            res.status(400).json({
                success: false,
                error: 'driverIds must be a non-empty array'
            });
            return;
        }
        const result = await prisma.driver.updateMany({
            where: {
                id: {
                    in: driverIds
                }
            },
            data: {
                isVerified: true,
                verifiedAt: new Date(),
                verifiedBy: adminId
            }
        });
        res.json({
            success: true,
            data: { count: result.count },
            message: `${result.count} driver(s) verified successfully`
        });
    }
    catch (error) {
        console.error('Error bulk verifying drivers:', error);
        res.status(500).json({ success: false, error: 'Failed to verify drivers' });
    }
};
exports.bulkVerifyDrivers = bulkVerifyDrivers;
/**
 * Update driver availability
 */
const updateAvailability = async (req, res) => {
    try {
        const userId = req.userId;
        const userRole = req.userRole;
        const { availability } = req.body;
        if (userRole !== client_1.UserRole.DRIVER) {
            res.status(403).json({
                success: false,
                error: 'Only drivers can update their availability'
            });
            return;
        }
        if (typeof availability !== 'boolean') {
            res.status(400).json({
                success: false,
                error: 'Availability must be a boolean value'
            });
            return;
        }
        const driver = await prisma.driver.update({
            where: { userId },
            data: { availability }
        });
        res.json({
            success: true,
            data: driver,
            message: `Availability updated to ${availability ? 'available' : 'unavailable'}`
        });
    }
    catch (error) {
        console.error('Error updating availability:', error);
        res.status(500).json({ success: false, error: 'Failed to update availability' });
    }
};
exports.updateAvailability = updateAvailability;
