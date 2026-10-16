import { Router, Request, Response } from 'express';
import { z } from 'zod';
import db from '../db/db.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

const inquirySchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email address required'),
  phone: z.string().min(8, 'Phone number is required'),
  subject: z.string().min(3, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  vehicleId: z.number().int().positive().optional()
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

    const stmt = db.prepare(`
      INSERT INTO rental_inquiries (full_name, email, phone, subject, message, vehicle_id, status)
      VALUES (?, ?, ?, ?, ?, ?, 'new')
    `);

    const result = stmt.run(
      fullName.trim(),
      email.toLowerCase().trim(),
      phone.trim(),
      subject.trim(),
      message.trim(),
      vehicleId || null
    );

    const inquiryId = Number(result.lastInsertRowid);

    logAudit({
      userEmail: email,
      action: 'INQUIRY_SUBMITTED',
      entityType: 'INQUIRY',
      entityId: inquiryId,
      details: { subject, vehicleId },
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
