import { Router, Request, Response } from 'express';
import { z } from 'zod';
import db from '../db/db.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

const inquirySchema = z.object({
  fullName: z.string().trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z.string().trim()
    .email('Valid email address required')
    .max(255, 'Email cannot exceed 255 characters'),
  phone: z.string().trim()
    .min(8, 'Phone number must be at least 8 characters')
    .max(30, 'Phone number cannot exceed 30 characters')
    .regex(/^[+0-9\s().-]+$/, 'Invalid phone number format'),
  subject: z.string().trim()
    .min(3, 'Subject must be at least 3 characters')
    .max(150, 'Subject cannot exceed 150 characters'),
  message: z.string().trim()
    .min(10, 'Message must be at least 10 characters')
    .max(3000, 'Message cannot exceed 3000 characters'),
  vehicleId: z.number().int('Vehicle ID must be an integer').positive('Vehicle ID must be positive').optional()
});

// POST /api/inquiries - Submit Public Inquiry or Rental Question
router.post('/', (req: Request, res: Response): void => {
  try {
    const parseResult = inquirySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message });
      return;
    }

    const { fullName, email, phone, subject, message, vehicleId } = parseResult.data;

    if (vehicleId) {
      const vehicle = db.prepare('SELECT id FROM vehicles WHERE id = ?').get(vehicleId);
      if (!vehicle) {
        res.status(400).json({ success: false, error: 'Referenced vehicle does not exist.' });
        return;
      }
    }

    const stmt = db.prepare(`
      INSERT INTO rental_inquiries (full_name, email, phone, subject, message, vehicle_id, status)
      VALUES (?, ?, ?, ?, ?, ?, 'new')
    `);

    const result = stmt.run(
      fullName,
      email.toLowerCase(),
      phone,
      subject,
      message,
      vehicleId || null
    );

    const inquiryId = Number(result.lastInsertRowid);

    // Audit log records structured operational metadata; sensitive message bodies are excluded
    logAudit({
      userEmail: email.toLowerCase(),
      action: 'INQUIRY_SUBMITTED',
      entityType: 'INQUIRY',
      entityId: inquiryId,
      details: { subject, vehicleId: vehicleId || null },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your inquiry has been received. Our Negombo desk will respond shortly.',
      inquiryId
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to submit inquiry.' });
  }
});

export default router;
