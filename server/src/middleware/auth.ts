import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt.js';
import db from '../db/db.js';

export interface AuthUser {
  id: number;
  email: string;
  role: 'customer' | 'staff' | 'admin';
  full_name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: 'customer' | 'staff' | 'admin' };
    
    // Check if user still exists in DB
    const user = db.prepare('SELECT id, email, role, full_name FROM users WHERE id = ?').get(decoded.id) as AuthUser | undefined;
    if (!user) {
      res.status(401).json({ success: false, error: 'User session invalid or user no longer exists.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Session expired or invalid token. Please log in again.' });
  }
}

export function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: 'customer' | 'staff' | 'admin' };
    const user = db.prepare('SELECT id, email, role, full_name FROM users WHERE id = ?').get(decoded.id) as AuthUser | undefined;
    if (user) {
      req.user = user;
    }
  } catch {
    // Ignore invalid optional tokens
  }
  next();
}

export function requireRole(allowedRoles: ('customer' | 'staff' | 'admin')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Requires one of: ${allowedRoles.join(', ')} privileges.`
      });
      return;
    }

    next();
  };
}
