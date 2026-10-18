import { Router, Request, Response } from 'express';
import { z } from 'zod';
import db from '../db/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

// Strictly Admin only
router.use(authenticate);
router.use(requireRole(['admin']));

// GET /api/admin/metrics - Real Database Aggregations
router.get('/metrics', (_req: Request, res: Response): void => {
  try {
    // 1. Fleet metrics
    const fleetStats = db.prepare(`
      SELECT
        COUNT(*) as total_vehicles,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_vehicles,
        SUM(CASE WHEN status = 'rented' THEN 1 ELSE 0 END) as rented_vehicles,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_vehicles
      FROM vehicles
      WHERE status != 'archived'
    `).get() as Record<string, number>;

    // 2. Booking metrics
    const bookingStats = db.prepare(`
      SELECT
        COUNT(*) as total_bookings,
        SUM(CASE WHEN booking_status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
        SUM(CASE WHEN booking_status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
        SUM(CASE WHEN booking_status = 'active' THEN 1 ELSE 0 END) as active_bookings,
        SUM(CASE WHEN booking_status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
        SUM(CASE WHEN booking_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings
      FROM bookings
    `).get() as Record<string, number>;

    // 3. Financial metrics from actual payments table
    const financialStats = db.prepare(`
      SELECT
        COALESCE(SUM(amount_lkr), 0) as total_revenue_lkr,
        COUNT(*) as total_transactions
      FROM payments
      WHERE payment_status = 'successful'
    `).get() as { total_revenue_lkr: number; total_transactions: number };

    // 4. Pending payments amount from pending bookings
    const pendingFinancials = db.prepare(`
      SELECT COALESCE(SUM(total_amount_lkr), 0) as pending_revenue_lkr
      FROM bookings
      WHERE payment_status = 'pending' AND booking_status != 'cancelled'
    `).get() as { pending_revenue_lkr: number };

    // 5. Fleet Category Breakdown
    const categoryStats = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM vehicles
      WHERE status != 'archived'
      GROUP BY category
    `).all();

    // 6. Recent Audit logs
    const recentActivity = db.prepare(`
      SELECT * FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 6
    `).all();

    res.json({
      success: true,
      metrics: {
        fleet: fleetStats,
        bookings: bookingStats,
        revenue: {
          totalLkr: financialStats.total_revenue_lkr,
          totalTransactions: financialStats.total_transactions,
          pendingLkr: pendingFinancials.pending_revenue_lkr
        },
        categoryBreakdown: categoryStats,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    res.status(500).json({ success: false, error: 'Failed to compute administrative metrics.' });
  }
});

// GET /api/admin/vehicles - All fleet including archived
router.get('/vehicles', (_req: Request, res: Response): void => {
  try {
    const vehicles = db.prepare('SELECT * FROM vehicles ORDER BY id ASC').all();
    res.json({ success: true, vehicles });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch fleet for administration.' });
  }
});

// POST /api/admin/vehicles - Add new vehicle to fleet
const createVehicleSchema = z.object({
  make: z.string().min(2),
  model: z.string().min(2),
  year: z.number().int().min(2010).max(2030),
  category: z.enum(['economy', 'suv', 'van', 'luxury']),
  transmission: z.enum(['automatic', 'manual']),
  fuel_type: z.enum(['petrol', 'diesel', 'hybrid', 'electric']),
  seating_capacity: z.number().int().positive(),
  daily_rate_lkr: z.number().positive(),
  weekly_rate_lkr: z.number().positive(),
  deposit_lkr: z.number().nonnegative(),
  registration_number: z.string().min(3),
  mileage_km: z.number().int().nonnegative().default(0),
  features: z.array(z.string()).or(z.string()),
  description: z.string().min(10),
  main_image_url: z.string().url()
});

router.post('/vehicles', (req: Request, res: Response): void => {
  try {
    const parseResult = createVehicleSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message });
      return;
    }

    const data = parseResult.data;

    // Check unique registration number
    const existing = db.prepare('SELECT id FROM vehicles WHERE registration_number = ?').get(data.registration_number);
    if (existing) {
      res.status(409).json({ success: false, error: 'A vehicle with this registration number already exists.' });
      return;
    }

    const featuresStr = Array.isArray(data.features) ? JSON.stringify(data.features) : data.features;

    const stmt = db.prepare(`
      INSERT INTO vehicles (
        make, model, year, category, transmission, fuel_type, seating_capacity,
        daily_rate_lkr, weekly_rate_lkr, deposit_lkr, status, registration_number,
        mileage_km, features, description, main_image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.make.trim(),
      data.model.trim(),
      data.year,
      data.category,
      data.transmission,
      data.fuel_type,
      data.seating_capacity,
      data.daily_rate_lkr,
      data.weekly_rate_lkr,
      data.deposit_lkr,
      data.registration_number.toUpperCase().trim(),
      data.mileage_km,
      featuresStr,
      data.description.trim(),
      data.main_image_url.trim()
    );

    const vehicleId = Number(result.lastInsertRowid);

    logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'VEHICLE_CREATED',
      entityType: 'VEHICLE',
      entityId: vehicleId,
      details: {
        makeModel: `${data.make} ${data.model}`,
        registration: data.registration_number,
        category: data.category,
        dailyRate: data.daily_rate_lkr
      },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle added to fleet successfully.',
      vehicleId
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add vehicle.' });
  }
});

const updateVehicleSchema = z.object({
  make: z.string().min(2, 'Make must be at least 2 characters').optional(),
  model: z.string().min(2, 'Model must be at least 2 characters').optional(),
  year: z.number().int().min(2010, 'Year must be between 2010 and 2030').max(2030, 'Year must be between 2010 and 2030').optional(),
  category: z.enum(['economy', 'suv', 'van', 'luxury']).optional(),
  transmission: z.enum(['automatic', 'manual']).optional(),
  fuel_type: z.enum(['petrol', 'diesel', 'hybrid', 'electric']).optional(),
  seating_capacity: z.number().int().positive('Seating capacity must be a positive integer').optional(),
  daily_rate_lkr: z.number().positive('Daily rate must be greater than 0').optional(),
  weekly_rate_lkr: z.number().positive('Weekly rate must be greater than 0').optional(),
  deposit_lkr: z.number().nonnegative('Deposit must be 0 or greater').optional(),
  registration_number: z.string().min(3, 'Registration number must be at least 3 characters').optional(),
  status: z.enum(['available', 'rented', 'maintenance', 'archived']).optional(),
  mileage_km: z.number().int().nonnegative('Mileage must be 0 or greater').optional(),
  features: z.array(z.string()).or(z.string()).optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  main_image_url: z.string().url('Main image URL must be a valid URL').optional()
});

// PUT /api/admin/vehicles/:id - Edit vehicle specifications and tariffs (Supports Partial Updates)
router.put('/vehicles/:id', (req: Request, res: Response): void => {
  try {
    const vehicleId = Number(req.params.id);
    if (!vehicleId || isNaN(vehicleId) || vehicleId <= 0) {
      res.status(400).json({ success: false, error: 'Invalid vehicle ID.' });
      return;
    }

    const parseResult = updateVehicleSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || 'Validation failed.' });
      return;
    }

    const data = parseResult.data;

    const vehicle = db.prepare('SELECT id, registration_number FROM vehicles WHERE id = ?').get(vehicleId) as { id: number; registration_number: string } | undefined;
    if (!vehicle) {
      res.status(404).json({ success: false, error: 'Vehicle not found.' });
      return;
    }

    // If registration number is supplied, check uniqueness against other vehicles
    if (data.registration_number !== undefined) {
      const normalizedReg = data.registration_number.toUpperCase().trim();
      const regConflict = db.prepare('SELECT id FROM vehicles WHERE registration_number = ? AND id != ?').get(normalizedReg, vehicleId);
      if (regConflict) {
        res.status(409).json({ success: false, error: 'A vehicle with this registration number already exists.' });
        return;
      }
    }

    // Build dynamic UPDATE query containing ONLY supplied fields to prevent undefined values or overwriting existing data
    const updates: string[] = [];
    const params: (string | number)[] = [];

    if (data.make !== undefined) {
      updates.push('make = ?');
      params.push(data.make.trim());
    }
    if (data.model !== undefined) {
      updates.push('model = ?');
      params.push(data.model.trim());
    }
    if (data.year !== undefined) {
      updates.push('year = ?');
      params.push(data.year);
    }
    if (data.category !== undefined) {
      updates.push('category = ?');
      params.push(data.category);
    }
    if (data.transmission !== undefined) {
      updates.push('transmission = ?');
      params.push(data.transmission);
    }
    if (data.fuel_type !== undefined) {
      updates.push('fuel_type = ?');
      params.push(data.fuel_type);
    }
    if (data.seating_capacity !== undefined) {
      updates.push('seating_capacity = ?');
      params.push(data.seating_capacity);
    }
    if (data.daily_rate_lkr !== undefined) {
      updates.push('daily_rate_lkr = ?');
      params.push(data.daily_rate_lkr);
    }
    if (data.weekly_rate_lkr !== undefined) {
      updates.push('weekly_rate_lkr = ?');
      params.push(data.weekly_rate_lkr);
    }
    if (data.deposit_lkr !== undefined) {
      updates.push('deposit_lkr = ?');
      params.push(data.deposit_lkr);
    }
    if (data.registration_number !== undefined) {
      updates.push('registration_number = ?');
      params.push(data.registration_number.toUpperCase().trim());
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }
    if (data.mileage_km !== undefined) {
      updates.push('mileage_km = ?');
      params.push(data.mileage_km);
    }
    if (data.features !== undefined) {
      const featuresStr = Array.isArray(data.features) ? JSON.stringify(data.features) : data.features;
      updates.push('features = ?');
      params.push(featuresStr);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description.trim());
    }
    if (data.main_image_url !== undefined) {
      updates.push('main_image_url = ?');
      params.push(data.main_image_url.trim());
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(vehicleId);

      db.prepare(`
        UPDATE vehicles
        SET ${updates.join(', ')}
        WHERE id = ?
      `).run(...params);
    }

    logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'VEHICLE_UPDATED',
      entityType: 'VEHICLE',
      entityId: vehicleId,
      details: { updatedFields: Object.keys(data) },
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Vehicle specifications updated successfully.' });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ success: false, error: 'Failed to update vehicle.' });
  }
});

// DELETE /api/admin/vehicles/:id - Archive vehicle
router.delete('/vehicles/:id', (req: Request, res: Response): void => {
  try {
    const vehicleId = Number(req.params.id);
    db.prepare("UPDATE vehicles SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(vehicleId);

    logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'VEHICLE_ARCHIVED',
      entityType: 'VEHICLE',
      entityId: vehicleId,
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Vehicle archived from active fleet.' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to archive vehicle.' });
  }
});

// GET /api/admin/users - User and Staff Management
router.get('/users', (_req: Request, res: Response): void => {
  try {
    const users = db.prepare(`
      SELECT id, email, full_name, phone, role, driving_license_number, address, created_at
      FROM users
      ORDER BY id ASC
    `).all();

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load user accounts.' });
  }
});

// PUT /api/admin/users/:id/role - Role Update (Cannot remove own admin privilege)
router.put('/users/:id/role', (req: Request, res: Response): void => {
  try {
    const targetUserId = Number(req.params.id);
    const { role } = req.body;

    if (!['customer', 'staff', 'admin'].includes(role)) {
      res.status(400).json({ success: false, error: 'Invalid role specified.' });
      return;
    }

    if (targetUserId === req.user!.id && role !== 'admin') {
      res.status(400).json({ success: false, error: 'Safety Check: You cannot demote your own administrator account.' });
      return;
    }

    db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(role, targetUserId);

    logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'USER_ROLE_CHANGED',
      entityType: 'USER',
      entityId: targetUserId,
      details: { newRole: role },
      ipAddress: req.ip
    });

    res.json({ success: true, message: `User role changed to ${role}.` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update user role.' });
  }
});

// GET /api/admin/audit-logs - Security and Audit Trail
router.get('/audit-logs', (_req: Request, res: Response): void => {
  try {
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100').all();
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve audit trail.' });
  }
});

// GET /api/admin/payments - All financial transactions
router.get('/payments', (_req: Request, res: Response): void => {
  try {
    const payments = db.prepare(`
      SELECT p.*, b.booking_reference, u.full_name as customer_name, u.email as customer_email
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `).all();

    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve payments.' });
  }
});

export default router;
