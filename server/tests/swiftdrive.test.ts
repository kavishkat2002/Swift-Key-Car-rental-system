import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';
import db from '../src/db/db.js';
import { seedDatabase } from '../src/db/seed.js';

describe('SwiftDrive Rentals Comprehensive Backend & Business Engine Tests', () => {
  let customerToken = '';
  let customerId = 3;
  let staffToken = '';
  let adminToken = '';
  let testBookingId = 0;

  beforeAll(() => {
    // Fresh seed for predictable test runs
    seedDatabase();
  });

  describe('1. Authentication, Registration & RBAC Security', () => {
    it('should successfully register a new customer', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test.driver@example.com',
          password: 'Password@123',
          fullName: 'Test Tourist Driver',
          phone: '+94 77 111 2233',
          drivingLicenseNumber: 'B5544332',
          address: 'Negombo, Sri Lanka'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('customer'); // Privilege escalation protection
      expect(res.body.token).toBeDefined();
    });

    it('should reject registration with a duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test.driver@example.com',
          password: 'Password@123',
          fullName: 'Duplicate Driver',
          phone: '+94 77 999 0000'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already exists');
    });

    it('should log in customer with valid credentials and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'kavishka@example.com',
          password: 'Customer@1234'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('kavishka@example.com');
      expect(res.body.user.role).toBe('customer');
      customerToken = res.body.token;
      customerId = res.body.user.id;
    });

    it('should reject login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'kavishka@example.com',
          password: 'WrongPassword999'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid email address or password');
    });

    it('should reject hardcoded backdoor passwords that do not match the stored hash', async () => {
      // Test that previous bypass password admin@123 cannot log into admin account
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@swiftdrive.lk',
          password: 'admin@123'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid email address or password');

      // Test that customer@123 cannot log into customer account
      const resCust = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'kavishka@example.com',
          password: 'customer@123'
        });

      expect(resCust.status).toBe(401);
      expect(resCust.body.success).toBe(false);
    });

    it('should authenticate valid seeded demo accounts only through normal bcrypt verification', async () => {
      // kavishka@example.com with Customer@1234
      const custRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'kavishka@example.com', password: 'Customer@1234' });
      expect(custRes.status).toBe(200);
      expect(custRes.body.user.role).toBe('customer');

      // john.smith@example.com with Customer@1234
      const touristRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john.smith@example.com', password: 'Customer@1234' });
      expect(touristRes.status).toBe(200);
      expect(touristRes.body.user.role).toBe('customer');
    });

    it('should authenticate staff and admin users', async () => {
      const staffRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'staff@swiftdrive.lk', password: 'Staff@1234' });
      expect(staffRes.status).toBe(200);
      expect(staffRes.body.user.role).toBe('staff');
      staffToken = staffRes.body.token;

      const adminRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@swiftdrive.lk', password: 'Admin@1234' });
      expect(adminRes.status).toBe(200);
      expect(adminRes.body.user.role).toBe('admin');
      adminToken = adminRes.body.token;
    });

    it('should block customer from accessing staff and admin routes', async () => {
      // Customer accessing admin metrics
      const resAdmin = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(resAdmin.status).toBe(403);
      expect(resAdmin.body.success).toBe(false);

      // Customer accessing staff bookings
      const resStaff = await request(app)
        .get('/api/staff/bookings')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(resStaff.status).toBe(403);
    });

    it('should block staff from accessing administrator-only operations', async () => {
      const res = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('admin privileges');
    });

    it('should allow administrator to access administrative operations', async () => {
      const res = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.metrics.fleet).toBeDefined();
      expect(res.body.metrics.revenue).toBeDefined();
    });
  });

  describe('2. Vehicle Catalogue & Multi-criteria Search/Filters', () => {
    it('should retrieve all available vehicles', async () => {
      const res = await request(app).get('/api/vehicles');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.vehicles.length).toBeGreaterThanOrEqual(10);
    });

    it('should filter vehicles by category (e.g. suv)', async () => {
      const res = await request(app).get('/api/vehicles?category=suv');
      expect(res.status).toBe(200);
      expect(res.body.vehicles.every((v: any) => v.category === 'suv')).toBe(true);
    });

    it('should filter vehicles by transmission and seating capacity', async () => {
      const res = await request(app).get('/api/vehicles?transmission=automatic&minSeats=5');
      expect(res.status).toBe(200);
      expect(res.body.vehicles.every((v: any) => v.transmission === 'automatic' && v.seating_capacity >= 5)).toBe(true);
    });

    it('should identify real booking conflicts when search dates overlap existing booking', async () => {
      // Vehicle 4 (Toyota RAV4) is booked from 2026-10-20 to 2026-10-25 in seed
      const res = await request(app).get('/api/vehicles?pickupDate=2026-10-22&returnDate=2026-10-24');
      expect(res.status).toBe(200);
      const rav4 = res.body.vehicles.find((v: any) => v.id === 4);
      expect(rav4).toBeDefined();
      expect(rav4.isAvailableForDates).toBe(false);
      expect(rav4.availabilityNote).toContain('already reserved');
    });
  });

  describe('3. Booking Engine, Pricing & Overlapping Prevention', () => {
    it('should calculate accurate server-side price quotes with deposit and weekly discounts', async () => {
      // 10 days for Toyota Axio (daily 11,000, weekly 70,000, deposit 35,000)
      // 1 week (70,000) + 3 days (33,000) = 103,000 vs 10 * 11,000 = 110,000 -> savings: 7,000
      const res = await request(app)
        .post('/api/bookings/quote')
        .send({
          vehicleId: 2,
          pickupDate: '2026-11-01',
          returnDate: '2026-11-11'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.quote.totalDays).toBe(10);
      expect(res.body.quote.rentalCostLkr).toBe(103000);
      expect(res.body.quote.depositAmountLkr).toBe(35000);
      expect(res.body.quote.totalAmountLkr).toBe(138000);
      expect(res.body.quote.weeklyDiscountApplied).toBe(true);
      expect(res.body.quote.savingsLkr).toBe(7000);
    });

    it('should reject quote calculation when return date is before or equal to pickup date', async () => {
      const res = await request(app)
        .post('/api/bookings/quote')
        .send({
          vehicleId: 2,
          pickupDate: '2026-11-10',
          returnDate: '2026-11-05'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('strictly after pickup date');
    });

    it('should create a valid booking and enforce initial pending status', async () => {
      // Book Suzuki Wagon R (id: 3) for November
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          vehicleId: 3,
          pickupDate: '2026-11-15',
          returnDate: '2026-11-18',
          pickupLocation: 'Bandaranaike International Airport (CMB)',
          returnLocation: 'Negombo Head Office (Lewis Place)',
          specialRequests: 'Meet at arrival gate'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.booking.booking_reference).toMatch(/^SDR-2026-\d{4}$/);
      expect(res.body.booking.booking_status).toBe('pending');
      expect(res.body.booking.payment_status).toBe('pending');
      testBookingId = res.body.booking.id;
    });

    it('should PREVENT overlapping bookings for the same vehicle on conflicting dates', async () => {
      // Attempt to book Suzuki Wagon R (id: 3) overlapping 2026-11-16 to 2026-11-20
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          vehicleId: 3,
          pickupDate: '2026-11-16',
          returnDate: '2026-11-20'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already reserved');
    });

    it('should enforce customer data isolation (Customer cannot access other customer booking)', async () => {
      // Booking 2 belongs to John Smith (id: 4)
      const res = await request(app)
        .get('/api/bookings/2')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Unauthorized');
    });

    it('should allow customer to access their own booking details', async () => {
      const res = await request(app)
        .get(`/api/bookings/${testBookingId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.booking.id).toBe(testBookingId);
    });
  });

  describe('4. Payment Gateway Sandbox & Error Handling', () => {
    it('should simulate card decline when card number ends with 0000', async () => {
      const res = await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: testBookingId,
          paymentMethod: 'card_sandbox',
          paymentType: 'full',
          testCardNumber: '4242424242420000',
          testCardExpiry: '12/28',
          testCardCvc: '123'
        });

      expect(res.status).toBe(402);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Simulated Card Declined');

      // Verify booking status was NOT falsely marked as paid
      const bookingCheck = db.prepare('SELECT payment_status FROM bookings WHERE id = ?').get(testBookingId) as any;
      expect(bookingCheck.payment_status).toBe('pending');
    });

    it('should successfully confirm payment with valid sandbox test card', async () => {
      const res = await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: testBookingId,
          paymentMethod: 'card_sandbox',
          paymentType: 'full',
          testCardNumber: '4242424242424242',
          testCardExpiry: '12/28',
          testCardCvc: '999'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.transactionReference).toMatch(/^PAY-SANDBOX-/);
      expect(res.body.booking.payment_status).toBe('paid');
      expect(res.body.booking.booking_status).toBe('confirmed');
    });
  });

  describe('5. Staff Inspection & Operational Workflow', () => {
    it('should allow staff to record pick-up inspection report', async () => {
      const res = await request(app)
        .post('/api/staff/inspections')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          bookingId: testBookingId,
          vehicleId: 3,
          reportType: 'pickup',
          odometerReading: 29500,
          fuelLevel: 'full',
          exteriorCondition: 'Spotless exterior, zero scratches',
          interiorCondition: 'Clean upholstery and sanitized',
          damageNotes: 'None'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.reportId).toBeDefined();
    });

    it('should allow staff to advance booking to active upon customer pickup', async () => {
      const res = await request(app)
        .put(`/api/staff/bookings/${testBookingId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          newStatus: 'active',
          notes: 'Customer collected vehicle at airport.'
        });

      expect(res.status).toBe(200);
      expect(res.body.newStatus).toBe('active');
    });

    it('should update vehicle mileage on return inspection', async () => {
      const res = await request(app)
        .post('/api/staff/inspections')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          bookingId: testBookingId,
          vehicleId: 3,
          reportType: 'return',
          odometerReading: 29850, // +350 km
          fuelLevel: 'full',
          exteriorCondition: 'Clean, no new damages',
          interiorCondition: 'Clean and tidy',
          damageNotes: 'None. Deposit released.'
        });

      expect(res.status).toBe(201);

      // Verify vehicle mileage updated in database
      const v = db.prepare('SELECT mileage_km FROM vehicles WHERE id = 3').get() as any;
      expect(v.mileage_km).toBe(29850);
    });
  });

  describe('6. Public Inquiries & Customer Reviews', () => {
    it('should accept customer inquiry and generate inquiry ID', async () => {
      const res = await request(app)
        .post('/api/inquiries')
        .send({
          fullName: 'Anura Kumara',
          email: 'anura@example.lk',
          phone: '+94 71 222 3344',
          subject: 'Self-drive rental for wedding entourage',
          message: 'Interested in booking the Mercedes C200 for a wedding in Negombo.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.inquiryId).toBeDefined();
    });

    it('should submit and retrieve customer review', async () => {
      const submitRes = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          vehicleId: 3,
          rating: 5,
          comment: 'Fantastic experience exploring Negombo beaches and lagoon!'
        });

      expect(submitRes.status).toBe(201);

      const listRes = await request(app).get('/api/reviews');
      expect(listRes.status).toBe(200);
      expect(listRes.body.reviews.some((r: any) => r.comment.includes('Fantastic experience'))).toBe(true);
    });
  });

  describe('7. Partial Vehicle Updates & Data Integrity (Admin)', () => {
    it('should update only the vehicle status while strictly preserving all other vehicle fields', async () => {
      // Fetch vehicle 1 initial state (Suzuki Alto 800)
      const initial = db.prepare('SELECT * FROM vehicles WHERE id = 1').get() as any;
      expect(initial.status).toBe('available');

      const res = await request(app)
        .put('/api/admin/vehicles/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'maintenance' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('updated successfully');

      // Verify that status changed to 'maintenance' and all other fields were strictly preserved
      const updated = db.prepare('SELECT * FROM vehicles WHERE id = 1').get() as any;
      expect(updated.status).toBe('maintenance');
      expect(updated.make).toBe(initial.make);
      expect(updated.model).toBe(initial.model);
      expect(updated.year).toBe(initial.year);
      expect(updated.category).toBe(initial.category);
      expect(updated.daily_rate_lkr).toBe(initial.daily_rate_lkr);
      expect(updated.weekly_rate_lkr).toBe(initial.weekly_rate_lkr);
      expect(updated.deposit_lkr).toBe(initial.deposit_lkr);
      expect(updated.registration_number).toBe(initial.registration_number);
      expect(updated.seating_capacity).toBe(initial.seating_capacity);

      // Revert status back to available
      await request(app)
        .put('/api/admin/vehicles/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'available' });
    });

    it('should update only the daily rate while preserving unrelated fields', async () => {
      const initial = db.prepare('SELECT * FROM vehicles WHERE id = 2').get() as any;
      const originalRate = initial.daily_rate_lkr;

      const res = await request(app)
        .put('/api/admin/vehicles/2')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ daily_rate_lkr: 14500 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = db.prepare('SELECT * FROM vehicles WHERE id = 2').get() as any;
      expect(updated.daily_rate_lkr).toBe(14500);
      expect(updated.make).toBe(initial.make);
      expect(updated.model).toBe(initial.model);
      expect(updated.weekly_rate_lkr).toBe(initial.weekly_rate_lkr);
      expect(updated.registration_number).toBe(initial.registration_number);
      expect(updated.status).toBe(initial.status);

      // Revert
      await request(app)
        .put('/api/admin/vehicles/2')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ daily_rate_lkr: originalRate });
    });

    it('should reject invalid field values with 400 client error', async () => {
      // Negative daily rate
      const resRate = await request(app)
        .put('/api/admin/vehicles/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ daily_rate_lkr: -5000 });
      expect(resRate.status).toBe(400);
      expect(resRate.body.success).toBe(false);

      // Invalid category
      const resCategory = await request(app)
        .put('/api/admin/vehicles/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ category: 'invalid_category_xyz' });
      expect(resCategory.status).toBe(400);
      expect(resCategory.body.success).toBe(false);

      // Invalid status
      const resStatus = await request(app)
        .put('/api/admin/vehicles/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'destroyed' });
      expect(resStatus.status).toBe(400);
      expect(resStatus.body.success).toBe(false);
    });

    it('should return 404 for updating a nonexistent vehicle ID', async () => {
      const res = await request(app)
        .put('/api/admin/vehicles/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'maintenance' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Vehicle not found');
    });

    it('should enforce registration-number uniqueness and reject duplicates with 409', async () => {
      // Vehicle 1 has registration 'WP-CBB-1290'. Attempt to assign it to Vehicle 2
      const res = await request(app)
        .put('/api/admin/vehicles/2')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ registration_number: 'WP-CBB-1290' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already exists');
    });
  });
});
