import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from '../db/db.js';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/jwt.js';
import { authenticate } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(8, 'Valid phone number is required'),
  drivingLicenseNumber: z.string().optional(),
  address: z.string().optional()
});

// POST /api/auth/register
router.post('/register', (req: Request, res: Response): void => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: parseResult.error.issues[0]?.message || 'Validation failed'
      });
      return;
    }

    const { email, password, fullName, phone, drivingLicenseNumber, address } = parseResult.data;

    // Check duplicate email
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email);
    if (existing) {
      res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please log in.'
      });
      return;
    }

    // Role is strictly 'customer' on public registration (prevents self-assignment of staff/admin roles)
    const passwordHash = bcrypt.hashSync(password, 10);
    const insertStmt = db.prepare(`
      INSERT INTO users (email, password_hash, full_name, phone, role, driving_license_number, address)
      VALUES (?, ?, ?, ?, 'customer', ?, ?)
    `);

    const result = insertStmt.run(
      email.toLowerCase().trim(),
      passwordHash,
      fullName.trim(),
      phone.trim(),
      drivingLicenseNumber ? drivingLicenseNumber.trim() : null,
      address ? address.trim() : null
    );

    const userId = Number(result.lastInsertRowid);
    const user = {
      id: userId,
      email: email.toLowerCase().trim(),
      fullName: fullName.trim(),
      role: 'customer' as const,
      phone: phone.trim()
    };

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    logAudit({
      userId,
      userEmail: user.email,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: userId,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Welcome to SwiftDrive Rentals!',
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Registration failed due to a server error.' });
  }
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required')
});

// POST /api/auth/login
router.post('/login', (req: Request, res: Response): void => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: parseResult.error.issues[0]?.message || 'Invalid input'
      });
      return;
    }

    const { email, password } = parseResult.data;
    const userRecord = db.prepare(`
      SELECT id, email, password_hash, full_name, phone, role, driving_license_number, address
      FROM users WHERE LOWER(email) = LOWER(?)
    `).get(email) as {
      id: number;
      email: string;
      password_hash: string;
      full_name: string;
      phone: string;
      role: 'customer' | 'staff' | 'admin';
      driving_license_number: string | null;
      address: string | null;
    } | undefined;

    const isPasswordValid = Boolean(
      userRecord && bcrypt.compareSync(password, userRecord.password_hash)
    );

    if (!userRecord || !isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid email address or password. Please verify your credentials.'
      });
      return;
    }

    const user = {
      id: userRecord.id,
      email: userRecord.email,
      fullName: userRecord.full_name,
      role: userRecord.role,
      phone: userRecord.phone,
      drivingLicenseNumber: userRecord.driving_license_number,
      address: userRecord.address
    };

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    logAudit({
      userId: user.id,
      userEmail: user.email,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login process encountered an unexpected error.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req: Request, res: Response): void => {
  try {
    const userRecord = db.prepare(`
      SELECT id, email, full_name, phone, role, driving_license_number, address, created_at
      FROM users WHERE id = ?
    `).get(req.user!.id);

    if (!userRecord) {
      res.status(404).json({ success: false, error: 'User profile not found.' });
      return;
    }

    res.json({ success: true, user: userRecord });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve profile.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, (req: Request, res: Response): void => {
  try {
    const { fullName, phone, drivingLicenseNumber, address } = req.body;

    if (!fullName || !phone) {
      res.status(400).json({ success: false, error: 'Full name and phone are required.' });
      return;
    }

    db.prepare(`
      UPDATE users
      SET full_name = ?, phone = ?, driving_license_number = ?, address = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(fullName.trim(), phone.trim(), drivingLicenseNumber || null, address || null, req.user!.id);

    logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'PROFILE_UPDATED',
      entityType: 'USER',
      entityId: req.user!.id,
      ipAddress: req.ip
    });

    const updated = db.prepare(`
      SELECT id, email, full_name, phone, role, driving_license_number, address
      FROM users WHERE id = ?
    `).get(req.user!.id);

    res.json({ success: true, message: 'Profile updated successfully.', user: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update profile.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req: Request, res: Response): void => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, error: 'Email address is required.' });
    return;
  }

  // Check if user exists
  const user = db.prepare('SELECT id, email FROM users WHERE LOWER(email) = LOWER(?)').get(email) as { id: number; email: string } | undefined;
  
  // Safe response to prevent account enumeration
  res.json({
    success: true,
    message: 'If an account exists with this email address, password reset instructions have been dispatched.'
  });
});

export default router;
