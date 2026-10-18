import { Router, Request, Response } from 'express';
import { z } from 'zod';
import db from '../db/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/reviews - Approved and Featured Reviews
router.get('/', (_req: Request, res: Response): void => {
  try {
    const reviews = db.prepare(`
      SELECT r.id, r.rating, r.comment, r.created_at, r.is_featured,
             u.full_name as author_name,
             v.make as vehicle_make, v.model as vehicle_model
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      WHERE r.is_approved = 1
      ORDER BY r.is_featured DESC, r.created_at DESC
    `).all();

    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve reviews.' });
  }
});

// POST /api/reviews - Customer Review Submission
const reviewSchema = z.object({
  vehicleId: z.number().int('Vehicle ID must be an integer').positive('Vehicle ID must be positive').optional(),
  bookingId: z.number().int('Booking ID must be an integer').positive('Booking ID must be positive').optional(),
  rating: z.number().int('Rating must be an integer between 1 and 5')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  comment: z.string().trim()
    .min(5, 'Review comment must be at least 5 characters')
    .max(1000, 'Review comment cannot exceed 1000 characters')
});

router.post('/', authenticate, (req: Request, res: Response): void => {
  try {
    const parseResult = reviewSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message });
      return;
    }

    const { vehicleId, bookingId, rating, comment } = parseResult.data;

    if (vehicleId) {
      const vehicle = db.prepare('SELECT id FROM vehicles WHERE id = ?').get(vehicleId);
      if (!vehicle) {
        res.status(400).json({ success: false, error: 'Referenced vehicle does not exist.' });
        return;
      }
    }

    if (bookingId) {
      const booking = db.prepare('SELECT id, user_id FROM bookings WHERE id = ?').get(bookingId) as { id: number; user_id: number } | undefined;
      if (!booking) {
        res.status(400).json({ success: false, error: 'Referenced booking does not exist.' });
        return;
      }
      if (booking.user_id !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({ success: false, error: 'You can only review your own bookings.' });
        return;
      }
    }

    const stmt = db.prepare(`
      INSERT INTO reviews (user_id, vehicle_id, booking_id, rating, comment, is_featured, is_approved)
      VALUES (?, ?, ?, ?, ?, 0, 1)
    `);

    stmt.run(req.user!.id, vehicleId || null, bookingId || null, rating, comment);

    res.status(201).json({ success: true, message: 'Thank you! Your verified review has been published.' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to submit review.' });
  }
});

export default router;
