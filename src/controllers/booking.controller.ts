import { Request, Response } from 'express';
import { PrismaClient, BookingStatus, UserRole } from '@prisma/client';
import { AuthRequest } from '../middleware/jwt';

const prisma = new PrismaClient();

/**
 * Create a booking request (USER only)
 */
export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    const { driverId, pickupLocation, dropLocation, scheduledDate, notes } = req.body;

    // Only users can create bookings
    if (userRole !== UserRole.USER) {
      res.status(403).json({ 
        success: false, 
        error: 'Only users can create booking requests' 
      });
      return;
    }

    if (!driverId) {
      res.status(400).json({ 
        success: false, 
        error: 'Driver ID is required' 
      });
      return;
    }

    // Check if driver exists and is verified
    const driver = await prisma.driver.findUnique({
      where: { id: driverId }
    });

    if (!driver) {
      res.status(404).json({ 
        success: false, 
        error: 'Driver not found' 
      });
      return;
    }

    if (!driver.isVerified) {
      res.status(400).json({ 
        success: false, 
        error: 'Driver is not verified yet' 
      });
      return;
    }

    // Check if user already has a pending booking with this driver
    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId: userId!,
        driverId,
        status: BookingStatus.PENDING
      }
    });

    if (existingBooking) {
      res.status(400).json({ 
        success: false, 
        error: 'You already have a pending request with this driver' 
      });
      return;
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId: userId!,
        driverId,
        pickupLocation,
        dropLocation,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        notes,
        status: BookingStatus.PENDING
      },
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
      }
    });

    res.json({ 
      success: true, 
      data: booking,
      message: 'Booking request sent successfully' 
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, error: 'Failed to create booking' });
  }
};

/**
 * Get user's bookings (USER only)
 */
export const getUserBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;

    if (userRole !== UserRole.USER) {
      res.status(403).json({ 
        success: false, 
        error: 'Access denied' 
      });
      return;
    }

    const bookings = await prisma.booking.findMany({
      where: { userId: userId! },
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

    res.json({ success: true, data: bookings, count: bookings.length });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
  }
};

/**
 * Get driver's bookings (DRIVER only)
 */
export const getDriverBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;

    if (userRole !== UserRole.DRIVER) {
      res.status(403).json({ 
        success: false, 
        error: 'Only drivers can access this endpoint' 
      });
      return;
    }

    // Get driver profile
    const driver = await prisma.driver.findUnique({
      where: { userId: userId! }
    });

    if (!driver) {
      res.status(404).json({ 
        success: false, 
        error: 'Driver profile not found' 
      });
      return;
    }

    const bookings = await prisma.booking.findMany({
      where: { driverId: driver.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
            city: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: bookings, count: bookings.length });
  } catch (error) {
    console.error('Error fetching driver bookings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
  }
};

/**
 * Update booking status (DRIVER only - accept/reject)
 */
export const updateBookingStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    const { bookingId } = req.params;
    const { status, driverResponse } = req.body;

    if (userRole !== UserRole.DRIVER) {
      res.status(403).json({ 
        success: false, 
        error: 'Only drivers can update booking status' 
      });
      return;
    }

    if (!status || ![BookingStatus.ACCEPTED, BookingStatus.REJECTED].includes(status)) {
      res.status(400).json({ 
        success: false, 
        error: 'Valid status (ACCEPTED or REJECTED) is required' 
      });
      return;
    }

    // Get driver profile
    const driver = await prisma.driver.findUnique({
      where: { userId: userId! }
    });

    if (!driver) {
      res.status(404).json({ 
        success: false, 
        error: 'Driver profile not found' 
      });
      return;
    }

    // Check if booking exists and belongs to this driver
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      res.status(404).json({ 
        success: false, 
        error: 'Booking not found' 
      });
      return;
    }

    if (booking.driverId !== driver.id) {
      res.status(403).json({ 
        success: false, 
        error: 'This booking does not belong to you' 
      });
      return;
    }

    if (booking.status !== BookingStatus.PENDING) {
      res.status(400).json({ 
        success: false, 
        error: 'This booking has already been responded to' 
      });
      return;
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status,
        driverResponse,
        respondedAt: new Date()
      },
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

    res.json({ 
      success: true, 
      data: updatedBooking,
      message: `Booking ${status.toLowerCase()} successfully` 
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ success: false, error: 'Failed to update booking' });
  }
};

/**
 * Cancel booking (USER only)
 */
export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    const { bookingId } = req.params;

    if (userRole !== UserRole.USER) {
      res.status(403).json({ 
        success: false, 
        error: 'Only users can cancel bookings' 
      });
      return;
    }

    // Check if booking exists and belongs to this user
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      res.status(404).json({ 
        success: false, 
        error: 'Booking not found' 
      });
      return;
    }

    if (booking.userId !== userId) {
      res.status(403).json({ 
        success: false, 
        error: 'This booking does not belong to you' 
      });
      return;
    }

    if (booking.status !== BookingStatus.PENDING) {
      res.status(400).json({ 
        success: false, 
        error: 'Only pending bookings can be cancelled' 
      });
      return;
    }

    // Update booking status to cancelled
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED }
    });

    res.json({ 
      success: true, 
      data: updatedBooking,
      message: 'Booking cancelled successfully' 
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel booking' });
  }
};

/**
 * Get driver full info (USER only - only if booking is accepted)
 */
export const getDriverFullInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    const { driverId } = req.params;

    if (userRole !== UserRole.USER) {
      res.status(403).json({ 
        success: false, 
        error: 'Access denied' 
      });
      return;
    }

    // Check if user has an accepted booking with this driver
    const acceptedBooking = await prisma.booking.findFirst({
      where: {
        userId: userId!,
        driverId,
        status: BookingStatus.ACCEPTED
      }
    });

    if (!acceptedBooking) {
      res.status(403).json({ 
        success: false, 
        error: 'You can only view full details of drivers who have accepted your booking request' 
      });
      return;
    }

    // Get full driver info including phone number
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
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
      res.status(404).json({ 
        success: false, 
        error: 'Driver not found' 
      });
      return;
    }

    res.json({ success: true, data: driver });
  } catch (error) {
    console.error('Error fetching driver full info:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch driver info' });
  }
};
