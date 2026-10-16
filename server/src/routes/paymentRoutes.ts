import { Router, Request, Response } from 'express';
import { z } from 'zod';
import db from '../db/db.js';
import { authenticate } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

const processPaymentSchema = z.object({
  bookingId: z.number().int().positive(),
  paymentMethod: z.enum(['card_sandbox', 'bank_transfer_test', 'cash_on_pickup']),
  paymentType: z.enum(['rental', 'deposit', 'full']).default('full'),
  testCardNumber: z.string().optional(),
  testCardExpiry: z.string().optional(),
  testCardCvc: z.string().optional()
});

// POST /api/payments/process - Test Sandbox Payment Gateway
router.post('/process', authenticate, (req: Request, res: Response): void => {
  try {
    const parseResult = processPaymentSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message });
      return;
    }

    const { bookingId, paymentMethod, paymentType, testCardNumber } = parseResult.data;

    const booking = db.prepare(`
      SELECT b.*, v.make, v.model
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.id = ?
    `).get(bookingId) as {
      id: number;
      user_id: number;
      booking_reference: string;
      total_amount_lkr: number;
      deposit_amount_lkr: number;
      rental_cost_lkr: number;
      booking_status: string;
      payment_status: string;
      make: string;
      model: string;
    } | undefined;

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking record not found.' });
      return;
    }

    // Customer can only pay for their own booking
    if (req.user!.role === 'customer' && booking.user_id !== req.user!.id) {
      res.status(403).json({ success: false, error: 'Unauthorized to process payment for this booking.' });
      return;
    }

    if (booking.booking_status === 'cancelled') {
      res.status(400).json({ success: false, error: 'Cannot process payment for a cancelled booking.' });
      return;
    }

    if (booking.payment_status === 'paid') {
      res.status(400).json({ success: false, error: 'This booking has already been paid.' });
      return;
    }

    // Determine amount to charge
    let amountToCharge = booking.total_amount_lkr;
    if (paymentType === 'deposit') {
      amountToCharge = booking.deposit_amount_lkr;
    } else if (paymentType === 'rental') {
      amountToCharge = booking.rental_cost_lkr;
    }

    // Test Sandbox Card Simulation Logic:
    // Any card ending with 0000 simulates payment failure / card decline (for testing and evaluation)
    const isSimulatedDecline = testCardNumber && testCardNumber.replace(/\s+/g, '').endsWith('0000');

    if (isSimulatedDecline) {
      const failTxnRef = `FAIL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      db.prepare(`
        INSERT INTO payments (
          booking_id, user_id, amount_lkr, payment_type, payment_method,
          transaction_reference, payment_status, gateway_response
        ) VALUES (?, ?, ?, ?, ?, ?, 'failed', ?)
      `).run(
        booking.id,
        req.user!.id,
        amountToCharge,
        paymentType,
        paymentMethod,
        failTxnRef,
        JSON.stringify({
          gateway: 'SwiftDrive Test Sandbox',
          error: 'CARD_DECLINED_INSUFFICIENT_FUNDS',
          simulated: true
        })
      );

      res.status(402).json({
        success: false,
        error: 'Simulated Card Declined: The test payment was rejected (insufficient funds / test decline triggered).',
        transactionReference: failTxnRef
      });
      return;
    }

    // Generate verified sandbox transaction reference
    const txnRef = `PAY-SANDBOX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const executePaymentTx = db.transaction(() => {
      // 1. Record payment transaction
      db.prepare(`
        INSERT INTO payments (
          booking_id, user_id, amount_lkr, payment_type, payment_method,
          transaction_reference, payment_status, gateway_response
        ) VALUES (?, ?, ?, ?, ?, ?, 'successful', ?)
      `).run(
        booking.id,
        req.user!.id,
        amountToCharge,
        paymentType,
        paymentMethod,
        txnRef,
        JSON.stringify({
          gateway: 'SwiftDrive Academic Sandbox Gateway',
          authCode: `AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
          paymentMethod,
          cardLast4: testCardNumber ? testCardNumber.slice(-4) : 'TEST',
          status: 'SETTLED',
          currency: 'LKR',
          testMode: true
        })
      );

      // 2. Update booking status to confirmed & payment_status to paid
      db.prepare(`
        UPDATE bookings
        SET payment_status = 'paid',
            booking_status = CASE WHEN booking_status = 'pending' THEN 'confirmed' ELSE booking_status END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(booking.id);

      logAudit({
        userId: req.user!.id,
        userEmail: req.user!.email,
        action: 'PAYMENT_PROCESSED',
        entityType: 'PAYMENT',
        entityId: txnRef,
        details: {
          bookingReference: booking.booking_reference,
          amountLkr: amountToCharge,
          method: paymentMethod,
          paymentType
        },
        ipAddress: req.ip
      });
    });

    executePaymentTx();

    const updatedBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking.id);

    res.json({
      success: true,
      message: 'Test payment processed and confirmed successfully.',
      transactionReference: txnRef,
      amountChargedLkr: amountToCharge,
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ success: false, error: 'Failed to process payment transaction.' });
  }
});

export default router;
