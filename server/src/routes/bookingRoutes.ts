import { Router, Request, Response } from 'express';
import { z } from 'zod';
import db from '../db/db.js';
import { authenticate } from '../middleware/auth.js';
import { calculateRentalPrice } from '../services/pricingService.js';
import { createBooking, checkVehicleAvailability } from '../services/bookingService.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

// POST /api/bookings/quote - Public/Authenticated Server-side Quote Generator
const quoteSchema = z.object({
  vehicleId: z.number().int().positive(),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD')
});

router.post('/quote', (req: Request, res: Response): void => {
  try {
    const parseResult = quoteSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message });
      return;
    }

    const { vehicleId, pickupDate, returnDate } = parseResult.data;

    // Fetch vehicle
    const vehicle = db.prepare(`
      SELECT id, make, model, daily_rate_lkr, weekly_rate_lkr, deposit_lkr, status
      FROM vehicles WHERE id = ?
    `).get(vehicleId) as {
      id: number;
      make: string;
      model: string;
      daily_rate_lkr: number;
      weekly_rate_lkr: number;
      deposit_lkr: number;
      status: string;
    } | undefined;

    if (!vehicle) {
      res.status(404).json({ success: false, error: 'Vehicle not found.' });
      return;
    }

    const availability = checkVehicleAvailability(vehicleId, pickupDate, returnDate);

    const quote = calculateRentalPrice(
      pickupDate,
      returnDate,
      vehicle.daily_rate_lkr,
      vehicle.weekly_rate_lkr,
      vehicle.deposit_lkr
    );

    res.json({
      success: true,
      vehicle: {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        dailyRate: vehicle.daily_rate_lkr,
        weeklyRate: vehicle.weekly_rate_lkr
      },
      availability,
      quote
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || 'Failed to calculate quote.' });
  }
});

// POST /api/bookings - Create Booking (Protected, Transaction-safe)
const createBookingSchema = z.object({
  vehicleId: z.number().int().positive(),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pickup date must be YYYY-MM-DD'),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Return date must be YYYY-MM-DD'),
  pickupLocation: z.string().min(3).optional(),
  returnLocation: z.string().min(3).optional(),
  specialRequests: z.string().max(500).optional()
});

router.post('/', authenticate, (req: Request, res: Response): void => {
  try {
    const parseResult = createBookingSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message });
      return;
    }

    const result = createBooking({
      userId: req.user!.id,
      userEmail: req.user!.email,
      vehicleId: parseResult.data.vehicleId,
      pickupDate: parseResult.data.pickupDate,
      returnDate: parseResult.data.returnDate,
      pickupLocation: parseResult.data.pickupLocation,
      returnLocation: parseResult.data.returnLocation,
      specialRequests: parseResult.data.specialRequests
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully. Pending deposit/payment confirmation.',
      booking: result.booking,
      quote: result.quote
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create booking.'
    });
  }
});

// GET /api/bookings/my - Customer Dashboard Bookings (Customer Data Isolation)
router.get('/my', authenticate, (req: Request, res: Response): void => {
  try {
    const bookings = db.prepare(`
      SELECT b.*,
             v.make as vehicle_make, v.model as vehicle_model, v.year as vehicle_year,
             v.registration_number as vehicle_reg, v.main_image_url as vehicle_image,
             v.category as vehicle_category
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `).all(req.user!.id);

    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve your bookings.' });
  }
});

// GET /api/bookings/:id - Single Booking Details (Isolated for Customers)
router.get('/:id', authenticate, (req: Request, res: Response): void => {
  try {
    const bookingId = Number(req.params.id);
    const booking = db.prepare(`
      SELECT b.*,
             v.make as vehicle_make, v.model as vehicle_model, v.year as vehicle_year,
             v.registration_number as vehicle_reg, v.main_image_url as vehicle_image,
             v.category as vehicle_category, v.transmission, v.fuel_type,
             u.full_name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN users u ON b.user_id = u.id
      WHERE b.id = ?
    `).get(bookingId) as { user_id: number } | undefined;

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking record not found.' });
      return;
    }

    // Access control: customers cannot view another customer's booking
    if (req.user!.role === 'customer' && booking.user_id !== req.user!.id) {
      res.status(403).json({ success: false, error: 'Unauthorized. You cannot view this booking.' });
      return;
    }

    // Fetch payments associated with booking
    const payments = db.prepare('SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC').all(bookingId);

    // Fetch condition inspection reports if available
    const inspections = db.prepare(`
      SELECT r.*, u.full_name as staff_name
      FROM vehicle_condition_reports r
      JOIN users u ON r.staff_user_id = u.id
      WHERE r.booking_id = ?
      ORDER BY r.created_at ASC
    `).all(bookingId);

    res.json({
      success: true,
      booking: {
        ...booking,
        payments,
        inspections
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch booking details.' });
  }
});

// POST /api/bookings/:id/cancel - Customer or Staff Cancellation
router.post('/:id/cancel', authenticate, (req: Request, res: Response): void => {
  try {
    const bookingId = Number(req.params.id);
    const { reason } = req.body;

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as {
      id: number;
      user_id: number;
      booking_status: string;
      booking_reference: string;
    } | undefined;

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found.' });
      return;
    }

    // Customer can only cancel their own booking
    if (req.user!.role === 'customer' && booking.user_id !== req.user!.id) {
      res.status(403).json({ success: false, error: 'Unauthorized to cancel this booking.' });
      return;
    }

    if (booking.booking_status === 'completed' || booking.booking_status === 'cancelled') {
      res.status(400).json({
        success: false,
        error: `Cannot cancel a booking that is already ${booking.booking_status}.`
      });
      return;
    }

    if (booking.booking_status === 'active' && req.user!.role === 'customer') {
      res.status(400).json({
        success: false,
        error: 'Active rentals cannot be cancelled via customer portal. Please contact staff directly.'
      });
      return;
    }

    const cancelReason = reason || 'Customer requested cancellation via portal';

    db.prepare(`
      UPDATE bookings
      SET booking_status = 'cancelled', cancellation_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(cancelReason, bookingId);

    logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'BOOKING_CANCELLED',
      entityType: 'BOOKING',
      entityId: bookingId,
      details: {
        bookingReference: booking.booking_reference,
        reason: cancelReason,
        cancelledByRole: req.user!.role
      },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Booking has been cancelled successfully.',
      bookingId,
      status: 'cancelled'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to process cancellation.' });
  }
});

export default router;
