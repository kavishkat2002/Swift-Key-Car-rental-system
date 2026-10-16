import { Router, Request, Response } from 'express';
import { z } from 'zod';
import db from '../db/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateBookingStatusTransition } from '../services/bookingService.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

// Staff & Admin roles only
router.use(authenticate);
router.use(requireRole(['staff', 'admin']));

// GET /api/staff/bookings - Comprehensive Reservation Management
router.get('/bookings', (req: Request, res: Response): void => {
  try {
    const { status, search } = req.query;

    let query = `
      SELECT b.*,
             v.make as vehicle_make, v.model as vehicle_model, v.registration_number as vehicle_reg,
             v.main_image_url as vehicle_image,
             u.full_name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN users u ON b.user_id = u.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (status && status !== 'all') {
      query += ' AND b.booking_status = ?';
      params.push(String(status));
    }

    if (search) {
      query += ` AND (
        LOWER(b.booking_reference) LIKE ? OR
        LOWER(u.full_name) LIKE ? OR
        LOWER(u.email) LIKE ? OR
        LOWER(v.registration_number) LIKE ? OR
        LOWER(v.model) LIKE ?
      )`;
      const term = `%${String(search).toLowerCase().trim()}%`;
      params.push(term, term, term, term, term);
    }

    query += ' ORDER BY b.created_at DESC';

    const bookings = db.prepare(query).all(...params) as (Record<string, unknown> & { return_date: string; booking_status: string })[];

    const todayStr = new Date().toISOString().split('T')[0];

    // Identify overdue active rentals
    const formatted = bookings.map(b => {
      const isOverdue = b.booking_status === 'active' && b.return_date < todayStr;
      return {
        ...b,
        isOverdue
      };
    });

    res.json({ success: true, count: formatted.length, bookings: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve bookings for staff dashboard.' });
  }
});

// PUT /api/staff/bookings/:id/status - Status Progression (Pickup / Return / Confirmation)
const statusUpdateSchema = z.object({
  newStatus: z.enum(['confirmed', 'active', 'completed', 'cancelled']),
  notes: z.string().optional()
});

router.put('/bookings/:id/status', (req: Request, res: Response): void => {
  try {
    const bookingId = Number(req.params.id);
    const parseResult = statusUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message });
      return;
    }

    const { newStatus, notes } = parseResult.data;

    const booking = db.prepare(`
      SELECT b.*, v.make, v.model, v.id as vehicle_id
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.id = ?
    `).get(bookingId) as {
      id: number;
      booking_status: string;
      booking_reference: string;
      vehicle_id: number;
    } | undefined;

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found.' });
      return;
    }

    const transition = validateBookingStatusTransition(booking.booking_status, newStatus);
    if (!transition.valid) {
      res.status(400).json({ success: false, error: transition.reason });
      return;
    }

    const updateTx = db.transaction(() => {
      db.prepare(`
        UPDATE bookings
        SET booking_status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newStatus, bookingId);

      // If active (handed over to customer), update vehicle status to rented
      if (newStatus === 'active') {
        db.prepare("UPDATE vehicles SET status = 'rented', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(booking.vehicle_id);
      } else if (newStatus === 'completed' || newStatus === 'cancelled') {
        // Return vehicle to available
        db.prepare("UPDATE vehicles SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(booking.vehicle_id);
      }

      logAudit({
        userId: req.user!.id,
        userEmail: req.user!.email,
        action: `BOOKING_STATUS_${newStatus.toUpperCase()}`,
        entityType: 'BOOKING',
        entityId: bookingId,
        details: {
          previousStatus: booking.booking_status,
          newStatus,
          notes: notes || null
        },
        ipAddress: req.ip
      });
    });

    updateTx();

    res.json({
      success: true,
      message: `Booking status updated to ${newStatus}.`,
      bookingId,
      newStatus
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update booking status.' });
  }
});

// POST /api/staff/inspections - Record Condition Report (Pickup / Return Inspection)
const inspectionSchema = z.object({
  bookingId: z.number().int().positive(),
  vehicleId: z.number().int().positive(),
  reportType: z.enum(['pickup', 'return']),
  odometerReading: z.number().int().nonnegative(),
  fuelLevel: z.enum(['empty', 'quarter', 'half', 'three_quarters', 'full']),
  exteriorCondition: z.string().min(2),
  interiorCondition: z.string().min(2),
  damageNotes: z.string().optional()
});

router.post('/inspections', (req: Request, res: Response): void => {
  try {
    const parseResult = inspectionSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message });
      return;
    }

    const data = parseResult.data;

    const executeInspectionTx = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO vehicle_condition_reports (
          booking_id, vehicle_id, staff_user_id, report_type, odometer_reading,
          fuel_level, exterior_condition, interior_condition, damage_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        data.bookingId,
        data.vehicleId,
        req.user!.id,
        data.reportType,
        data.odometerReading,
        data.fuelLevel,
        data.exteriorCondition,
        data.interiorCondition,
        data.damageNotes || null
      );

      // If return inspection, update vehicle mileage
      if (data.reportType === 'return') {
        db.prepare(`
          UPDATE vehicles
          SET mileage_km = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(data.odometerReading, data.vehicleId);
      }

      logAudit({
        userId: req.user!.id,
        userEmail: req.user!.email,
        action: `CONDITION_INSPECTION_${data.reportType.toUpperCase()}`,
        entityType: 'VEHICLE_CONDITION',
        entityId: Number(result.lastInsertRowid),
        details: {
          bookingId: data.bookingId,
          vehicleId: data.vehicleId,
          odometer: data.odometerReading,
          fuel: data.fuelLevel,
          hasDamageNotes: Boolean(data.damageNotes)
        },
        ipAddress: req.ip
      });

      return Number(result.lastInsertRowid);
    });

    const reportId = executeInspectionTx();

    res.status(201).json({
      success: true,
      message: `${data.reportType === 'pickup' ? 'Pick-up' : 'Return'} condition report saved successfully.`,
      reportId
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to record condition report.' });
  }
});

// GET /api/staff/inquiries - Manage Customer Inquiries
router.get('/inquiries', (_req: Request, res: Response): void => {
  try {
    const inquiries = db.prepare(`
      SELECT i.*, v.make as vehicle_make, v.model as vehicle_model,
             u.full_name as assigned_staff_name
      FROM rental_inquiries i
      LEFT JOIN vehicles v ON i.vehicle_id = v.id
      LEFT JOIN users u ON i.assigned_to_user_id = u.id
      ORDER BY i.created_at DESC
    `).all();

    res.json({ success: true, inquiries });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load inquiries.' });
  }
});

// PUT /api/staff/inquiries/:id - Respond and update inquiry status
router.put('/inquiries/:id', (req: Request, res: Response): void => {
  try {
    const inquiryId = Number(req.params.id);
    const { status, responseNotes } = req.body;

    if (!['new', 'in_progress', 'resolved'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid inquiry status.' });
      return;
    }

    db.prepare(`
      UPDATE rental_inquiries
      SET status = ?, response_notes = ?, assigned_to_user_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, responseNotes || null, req.user!.id, inquiryId);

    logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'INQUIRY_UPDATED',
      entityType: 'INQUIRY',
      entityId: inquiryId,
      details: { newStatus: status, responseNotes: responseNotes || null },
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Inquiry updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update inquiry.' });
  }
});

export default router;
