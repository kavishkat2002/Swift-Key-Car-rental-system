import db from '../db/db.js';
import { calculateRentalPrice, PricingQuote } from './pricingService.js';
import { logAudit } from './auditService.js';

export interface VehicleRecord {
  id: number;
  make: string;
  model: string;
  year: number;
  category: string;
  transmission: string;
  fuel_type: string;
  seating_capacity: number;
  daily_rate_lkr: number;
  weekly_rate_lkr: number;
  deposit_lkr: number;
  status: string;
  registration_number: string;
  mileage_km: number;
  features: string;
  description: string;
  main_image_url: string;
}

export interface BookingRecord {
  id: number;
  booking_reference: string;
  user_id: number;
  vehicle_id: number;
  pickup_date: string;
  return_date: string;
  pickup_location: string;
  return_location: string;
  total_days: number;
  daily_rate_applied: number;
  rental_cost_lkr: number;
  deposit_amount_lkr: number;
  total_amount_lkr: number;
  booking_status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  special_requests: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export function checkVehicleAvailability(
  vehicleId: number,
  pickupDate: string,
  returnDate: string,
  excludeBookingId?: number
): { available: boolean; conflictReason?: string } {
  // Validate basic date relationship
  if (returnDate <= pickupDate) {
    return { available: false, conflictReason: 'Return date must be strictly after pickup date.' };
  }

  // Check if vehicle exists and is not archived or in maintenance
  const vehicle = db.prepare('SELECT id, status FROM vehicles WHERE id = ?').get(vehicleId) as { id: number; status: string } | undefined;
  if (!vehicle) {
    return { available: false, conflictReason: 'Requested vehicle not found.' };
  }

  if (vehicle.status === 'archived') {
    return { available: false, conflictReason: 'Vehicle is no longer part of our active rental fleet.' };
  }

  if (vehicle.status === 'maintenance') {
    return { available: false, conflictReason: 'Vehicle is currently scheduled for essential workshop maintenance.' };
  }

  // Check overlapping active bookings
  let query = `
    SELECT id, booking_reference, pickup_date, return_date, booking_status
    FROM bookings
    WHERE vehicle_id = ?
      AND booking_status IN ('pending', 'confirmed', 'active')
      AND pickup_date < ?
      AND return_date > ?
  `;
  const params: (number | string)[] = [vehicleId, returnDate, pickupDate];

  if (excludeBookingId) {
    query += ' AND id != ?';
    params.push(excludeBookingId);
  }

  const conflicting = db.prepare(query).all(...params) as { id: number; booking_reference: string; pickup_date: string; return_date: string }[];

  if (conflicting.length > 0) {
    const firstConflict = conflicting[0];
    return {
      available: false,
      conflictReason: `Vehicle is already reserved (${firstConflict.pickup_date} to ${firstConflict.return_date}). Ref: ${firstConflict.booking_reference}`
    };
  }

  return { available: true };
}

export function generateBookingReference(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `SDR-${year}-${randomSuffix}`;
}

export interface CreateBookingInput {
  userId: number;
  userEmail: string;
  vehicleId: number;
  pickupDate: string;
  returnDate: string;
  pickupLocation?: string;
  returnLocation?: string;
  specialRequests?: string;
}

export function createBooking(input: CreateBookingInput): { booking: BookingRecord; quote: PricingQuote } {
  // Validate vehicle existence and fetch rate specs
  const vehicle = db.prepare(`
    SELECT id, make, model, daily_rate_lkr, weekly_rate_lkr, deposit_lkr, status
    FROM vehicles WHERE id = ?
  `).get(input.vehicleId) as VehicleRecord | undefined;

  if (!vehicle) {
    throw new Error('Vehicle not found.');
  }

  // Calculate pricing strictly on server
  const quote = calculateRentalPrice(
    input.pickupDate,
    input.returnDate,
    vehicle.daily_rate_lkr,
    vehicle.weekly_rate_lkr,
    vehicle.deposit_lkr
  );

  // Execute database transaction to ensure atomicity and prevent race conditions
  const executeBookingTx = db.transaction(() => {
    // 1. Re-validate availability inside the transaction lock
    const availability = checkVehicleAvailability(input.vehicleId, input.pickupDate, input.returnDate);
    if (!availability.available) {
      throw new Error(availability.conflictReason || 'Vehicle is not available for the selected dates.');
    }

    const bookingRef = generateBookingReference();
    const pickupLoc = input.pickupLocation || 'Negombo Head Office (Lewis Place)';
    const returnLoc = input.returnLocation || 'Negombo Head Office (Lewis Place)';

    const insertStmt = db.prepare(`
      INSERT INTO bookings (
        booking_reference, user_id, vehicle_id, pickup_date, return_date,
        pickup_location, return_location, total_days, daily_rate_applied,
        rental_cost_lkr, deposit_amount_lkr, total_amount_lkr,
        booking_status, payment_status, special_requests
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?)
    `);

    const result = insertStmt.run(
      bookingRef,
      input.userId,
      input.vehicleId,
      input.pickupDate,
      input.returnDate,
      pickupLoc,
      returnLoc,
      quote.totalDays,
      quote.dailyRateApplied,
      quote.rentalCostLkr,
      quote.depositAmountLkr,
      quote.totalAmountLkr,
      input.specialRequests || null
    );

    const bookingId = Number(result.lastInsertRowid);
    const createdBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as BookingRecord;

    logAudit({
      userId: input.userId,
      userEmail: input.userEmail,
      action: 'BOOKING_CREATED',
      entityType: 'BOOKING',
      entityId: bookingId,
      details: {
        bookingReference: bookingRef,
        vehicle: `${vehicle.make} ${vehicle.model}`,
        dates: `${input.pickupDate} to ${input.returnDate}`,
        totalDays: quote.totalDays,
        totalAmountLkr: quote.totalAmountLkr
      }
    });

    return createdBooking;
  });

  const createdBooking = executeBookingTx();
  return { booking: createdBooking, quote };
}

export function validateBookingStatusTransition(
  currentStatus: string,
  newStatus: string
): { valid: boolean; reason?: string } {
  const allowedTransitions: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['active', 'cancelled'],
    active: ['completed'],
    completed: [], // Terminal state
    cancelled: []  // Terminal state
  };

  const allowed = allowedTransitions[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    return {
      valid: false,
      reason: `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed: [${allowed.join(', ')}]`
    };
  }

  return { valid: true };
}
