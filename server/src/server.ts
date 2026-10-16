import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import './db/db.js'; // Ensures schema initialization on boot
import { isSupabaseConfigured } from './db/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = process.env.PORT || 5001;

// Security and middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    application: 'SwiftDrive Rentals Backend API',
    location: 'Negombo, Sri Lanka',
    database: {
      local: 'SQLite (WAL mode)',
      supabase: isSupabaseConfigured() ? 'Connected (https://ufogqgdrzmoptvfuidxh.supabase.co)' : 'Not configured'
    },
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/blog', blogRoutes);

// In production, serve the built frontend assets from client/dist
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.use((req: Request, res: Response, next: NextFunction) => {
  // If the request is for an API route that wasn't matched, return 404 JSON
  if (req.path.startsWith('/api')) {
    res.status(404).json({ success: false, error: `API route ${req.method} ${req.path} not found.` });
    return;
  }
  // Otherwise serve client index.html for Single-Page Application routing on GET
  if (req.method === 'GET') {
    res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
      if (err) {
        next();
      }
    });
  } else {
    next();
  }
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal server error occurred.';
  res.status(status).json({
    success: false,
    error: message
  });
});

// Start listener only when not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚗 SwiftDrive Rentals Server running on port ${PORT}`);
    console.log(`📍 Negombo, Sri Lanka Fleet & Reservation Engine Ready`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    console.log(`=======================================================`);
  });
}

export default app;
