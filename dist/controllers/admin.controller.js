"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardOverview = exports.getUserBookingHistory = exports.getDriverBookingHistory = exports.getDriverAnalytics = exports.getUserAnalytics = exports.getBookingAnalytics = exports.getAllBookings = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Get all bookings with filters (ADMIN only)
 */
const getAllBookings = async (req, res) => {
    try {
        const userRole = req.userRole;
        if (userRole !== client_1.UserRole.ADMIN) {
            res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
            return;
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;
        const driverId = req.query.driverId;
        const userId = req.query.userId;
        const skip = (page - 1) * limit;
        // Build where clause
        const whereClause = {};
        if (status)
            whereClause.status = status;
        if (driverId)
            whereClause.driverId = driverId;
        if (userId)
            whereClause.userId = userId;
        const [bookings, totalCount] = await Promise.all([
            prisma.booking.findMany({
                where: whereClause,
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            city: true,
                            profileImageUrl: true
                        }
                    },
                    driver: {
                        include: {
                            user: {
                                select: {
                                    email: true,
                                    firstName: true,
                                    lastName: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.booking.count({ where: whereClause })
        ]);
        const totalPages = Math.ceil(totalCount / limit);
        res.json({
            success: true,
            data: bookings,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    }
    catch (error) {
        console.error('Get all bookings error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch bookings'
        });
    }
};
exports.getAllBookings = getAllBookings;
/**
 * Get booking analytics (ADMIN only)
 */
const getBookingAnalytics = async (req, res) => {
    try {
        const userRole = req.userRole;
        if (userRole !== client_1.UserRole.ADMIN) {
            res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
            return;
        }
        // Get total bookings by status
        const bookingsByStatus = await prisma.booking.groupBy({
            by: ['status'],
            _count: {
                id: true
            }
        });
        // Get total bookings
        const totalBookings = await prisma.booking.count();
        // Get bookings this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const bookingsThisMonth = await prisma.booking.count({
            where: {
                createdAt: {
                    gte: startOfMonth
                }
            }
        });
        // Get bookings today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const bookingsToday = await prisma.booking.count({
            where: {
                createdAt: {
                    gte: startOfDay
                }
            }
        });
        // Get top drivers by bookings
        const topDrivers = await prisma.booking.groupBy({
            by: ['driverId'],
            _count: {
                id: true
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            },
            take: 10
        });
        // Fetch driver details for top drivers
        const topDriversWithDetails = await Promise.all(topDrivers.map(async (item) => {
            const driver = await prisma.driver.findUnique({
                where: { id: item.driverId },
                include: {
                    user: {
                        select: {
                            email: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            });
            return {
                driver,
                bookingCount: item._count.id
            };
        }));
        // Get recent bookings (last 7 days grouped by day)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentBookings = await prisma.booking.findMany({
            where: {
                createdAt: {
                    gte: sevenDaysAgo
                }
            },
            select: {
                createdAt: true,
                status: true
            }
        });
        // Group by date
        const bookingsByDate = {};
        recentBookings.forEach(booking => {
            const date = booking.createdAt.toISOString().split('T')[0];
            bookingsByDate[date] = (bookingsByDate[date] || 0) + 1;
        });
        res.json({
            success: true,
            data: {
                overview: {
                    totalBookings,
                    bookingsThisMonth,
                    bookingsToday,
                    bookingsByStatus: bookingsByStatus.reduce((acc, item) => {
                        if (item.status) { // Safety check for null status
                            acc[item.status] = item._count.id;
                        }
                        return acc;
                    }, {})
                },
                topDrivers: topDriversWithDetails,
                recentTrend: bookingsByDate
            }
        });
    }
    catch (error) {
        console.error('Get booking analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch booking analytics'
        });
    }
};
exports.getBookingAnalytics = getBookingAnalytics;
/**
 * Get user analytics (ADMIN only)
 */
const getUserAnalytics = async (req, res) => {
    try {
        const userRole = req.userRole;
        if (userRole !== client_1.UserRole.ADMIN) {
            res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
            return;
        }
        // Total users by role
        const usersByRole = await prisma.user.groupBy({
            by: ['role'],
            _count: {
                id: true
            }
        });
        // Total users
        const totalUsers = await prisma.user.count();
        // Users registered this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const usersThisMonth = await prisma.user.count({
            where: {
                createdAt: {
                    gte: startOfMonth
                }
            }
        });
        // Users registered today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const usersToday = await prisma.user.count({
            where: {
                createdAt: {
                    gte: startOfDay
                }
            }
        });
        // Most active users (by booking count)
        const activeUsers = await prisma.booking.groupBy({
            by: ['userId'],
            _count: {
                id: true
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            },
            take: 10
        });
        // Fetch user details for active users
        const activeUsersWithDetails = await Promise.all(activeUsers.map(async (item) => {
            const user = await prisma.user.findUnique({
                where: { id: item.userId },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    city: true,
                    profileImageUrl: true,
                    createdAt: true
                }
            });
            return {
                user,
                bookingCount: item._count.id
            };
        }));
        // User registration trend (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentUsers = await prisma.user.findMany({
            where: {
                createdAt: {
                    gte: sevenDaysAgo
                }
            },
            select: {
                createdAt: true,
                role: true
            }
        });
        // Group by date
        const usersByDate = {};
        recentUsers.forEach(user => {
            const date = user.createdAt.toISOString().split('T')[0];
            usersByDate[date] = (usersByDate[date] || 0) + 1;
        });
        res.json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    usersThisMonth,
                    usersToday,
                    usersByRole: usersByRole.reduce((acc, item) => {
                        if (item.role) { // Filter out null roles
                            acc[item.role] = item._count.id;
                        }
                        return acc;
                    }, {})
                },
                activeUsers: activeUsersWithDetails,
                registrationTrend: usersByDate
            }
        });
    }
    catch (error) {
        console.error('Get user analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user analytics'
        });
    }
};
exports.getUserAnalytics = getUserAnalytics;
/**
 * Get driver analytics (ADMIN only)
 */
const getDriverAnalytics = async (req, res) => {
    try {
        const userRole = req.userRole;
        if (userRole !== client_1.UserRole.ADMIN) {
            res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
            return;
        }
        // Total drivers
        const totalDrivers = await prisma.driver.count();
        // Verified drivers
        const verifiedDrivers = await prisma.driver.count({
            where: { isVerified: true }
        });
        // Available drivers
        const availableDrivers = await prisma.driver.count({
            where: {
                isVerified: true,
                availability: true
            }
        });
        // Drivers by city
        const driversByCity = await prisma.driver.groupBy({
            by: ['city'],
            _count: {
                id: true
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            },
            take: 10
        });
        // Drivers by vehicle type
        const driversByVehicle = await prisma.driver.groupBy({
            by: ['vehicleType'],
            _count: {
                id: true
            },
            where: {
                vehicleType: {
                    not: null
                }
            }
        }).then(results => results.filter(item => item.vehicleType !== null));
        // Average salary expectation
        const salaryStats = await prisma.driver.aggregate({
            _avg: {
                salaryExpectation: true
            },
            _min: {
                salaryExpectation: true
            },
            _max: {
                salaryExpectation: true
            },
            where: {
                salaryExpectation: {
                    not: null
                }
            }
        });
        // Average experience
        const experienceStats = await prisma.driver.aggregate({
            _avg: {
                experience: true
            },
            where: {
                experience: {
                    not: null
                }
            }
        });
        // Top performing drivers (by accepted bookings)
        const topPerformers = await prisma.booking.groupBy({
            by: ['driverId'],
            where: {
                status: client_1.BookingStatus.ACCEPTED
            },
            _count: {
                id: true
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            },
            take: 10
        });
        // Fetch driver details for top performers
        const topPerformersWithDetails = await Promise.all(topPerformers.map(async (item) => {
            const driver = await prisma.driver.findUnique({
                where: { id: item.driverId },
                include: {
                    user: {
                        select: {
                            email: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            });
            return {
                driver,
                acceptedBookings: item._count.id
            };
        }));
        // Driver registration trend (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentDrivers = await prisma.driver.findMany({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo
                }
            },
            select: {
                createdAt: true,
                isVerified: true
            }
        });
        // Group by date
        const driversByDate = {};
        recentDrivers.forEach(driver => {
            const date = driver.createdAt.toISOString().split('T')[0];
            driversByDate[date] = (driversByDate[date] || 0) + 1;
        });
        res.json({
            success: true,
            data: {
                overview: {
                    totalDrivers,
                    verifiedDrivers,
                    availableDrivers,
                    pendingVerification: totalDrivers - verifiedDrivers,
                    averageSalaryExpectation: salaryStats._avg.salaryExpectation || 0,
                    minSalaryExpectation: salaryStats._min.salaryExpectation || 0,
                    maxSalaryExpectation: salaryStats._max.salaryExpectation || 0,
                    averageExperience: experienceStats._avg.experience || 0
                },
                driversByCity: driversByCity.map(item => ({
                    city: item.city,
                    count: item._count.id
                })),
                driversByVehicle: driversByVehicle.map(item => ({
                    vehicleType: item.vehicleType,
                    count: item._count.id
                })),
                topPerformers: topPerformersWithDetails,
                registrationTrend: driversByDate
            }
        });
    }
    catch (error) {
        console.error('Get driver analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch driver analytics'
        });
    }
};
exports.getDriverAnalytics = getDriverAnalytics;
/**
 * Get specific driver's booking history (ADMIN only)
 */
const getDriverBookingHistory = async (req, res) => {
    try {
        const userRole = req.userRole;
        const { driverId } = req.params;
        if (userRole !== client_1.UserRole.ADMIN) {
            res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
            return;
        }
        const driver = await prisma.driver.findUnique({
            where: { id: driverId },
            include: {
                user: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
        if (!driver) {
            res.status(404).json({
                success: false,
                error: 'Driver not found'
            });
            return;
        }
        const bookings = await prisma.booking.findMany({
            where: { driverId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        city: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        // Calculate stats
        const stats = {
            totalBookings: bookings.length,
            acceptedBookings: bookings.filter(b => b.status === client_1.BookingStatus.ACCEPTED).length,
            rejectedBookings: bookings.filter(b => b.status === client_1.BookingStatus.REJECTED).length,
            pendingBookings: bookings.filter(b => b.status === client_1.BookingStatus.PENDING).length,
            completedBookings: bookings.filter(b => b.status === client_1.BookingStatus.COMPLETED).length,
            cancelledBookings: bookings.filter(b => b.status === client_1.BookingStatus.CANCELLED).length
        };
        res.json({
            success: true,
            data: {
                driver,
                stats,
                bookings
            }
        });
    }
    catch (error) {
        console.error('Get driver booking history error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch driver booking history'
        });
    }
};
exports.getDriverBookingHistory = getDriverBookingHistory;
/**
 * Get specific user's booking history (ADMIN only)
 */
const getUserBookingHistory = async (req, res) => {
    try {
        const userRole = req.userRole;
        const { userId } = req.params;
        if (userRole !== client_1.UserRole.ADMIN) {
            res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                city: true,
                profileImageUrl: true,
                createdAt: true
            }
        });
        if (!user) {
            res.status(404).json({
                success: false,
                error: 'User not found'
            });
            return;
        }
        const bookings = await prisma.booking.findMany({
            where: { userId },
            include: {
                driver: {
                    include: {
                        user: {
                            select: {
                                email: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        // Calculate stats
        const stats = {
            totalBookings: bookings.length,
            acceptedBookings: bookings.filter(b => b.status === client_1.BookingStatus.ACCEPTED).length,
            rejectedBookings: bookings.filter(b => b.status === client_1.BookingStatus.REJECTED).length,
            pendingBookings: bookings.filter(b => b.status === client_1.BookingStatus.PENDING).length,
            completedBookings: bookings.filter(b => b.status === client_1.BookingStatus.COMPLETED).length,
            cancelledBookings: bookings.filter(b => b.status === client_1.BookingStatus.CANCELLED).length
        };
        res.json({
            success: true,
            data: {
                user,
                stats,
                bookings
            }
        });
    }
    catch (error) {
        console.error('Get user booking history error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user booking history'
        });
    }
};
exports.getUserBookingHistory = getUserBookingHistory;
/**
 * Get dashboard overview (ADMIN only)
 */
const getDashboardOverview = async (req, res) => {
    try {
        const userRole = req.userRole;
        if (userRole !== client_1.UserRole.ADMIN) {
            res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
            return;
        }
        // Get counts
        const [totalUsers, totalDrivers, verifiedDrivers, totalBookings, pendingBookings, acceptedBookings] = await Promise.all([
            prisma.user.count({ where: { role: client_1.UserRole.USER } }),
            prisma.driver.count(),
            prisma.driver.count({ where: { isVerified: true } }),
            prisma.booking.count(),
            prisma.booking.count({ where: { status: client_1.BookingStatus.PENDING } }),
            prisma.booking.count({ where: { status: client_1.BookingStatus.ACCEPTED } })
        ]);
        // Get recent activity
        const recentBookings = await prisma.booking.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                },
                driver: {
                    select: {
                        name: true,
                        city: true
                    }
                }
            }
        });
        const recentUsers = await prisma.user.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true
            }
        });
        res.json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    totalDrivers,
                    verifiedDrivers,
                    pendingVerification: totalDrivers - verifiedDrivers,
                    totalBookings,
                    pendingBookings,
                    acceptedBookings
                },
                recentActivity: {
                    bookings: recentBookings,
                    users: recentUsers
                }
            }
        });
    }
    catch (error) {
        console.error('Get dashboard overview error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard overview'
        });
    }
};
exports.getDashboardOverview = getDashboardOverview;
