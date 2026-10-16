import { Router, Request, Response } from 'express';
import db from '../db/db.js';
import { checkVehicleAvailability } from '../services/bookingService.js';

const router = Router();

// GET /api/vehicles - Filtered Catalogue & Availability Search
router.get('/', (req: Request, res: Response): void => {
  try {
    const {
      category,
      transmission,
      fuelType,
      minSeats,
      maxPrice,
      search,
      sortBy,
      pickupDate,
      returnDate
    } = req.query;

    let query = `
      SELECT id, make, model, year, category, transmission, fuel_type,
             seating_capacity, daily_rate_lkr, weekly_rate_lkr, deposit_lkr,
             status, registration_number, mileage_km, features, description, main_image_url
      FROM vehicles
      WHERE status != 'archived'
    `;
    const params: (string | number)[] = [];

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(String(category).toLowerCase());
    }

    if (transmission && transmission !== 'all') {
      query += ' AND transmission = ?';
      params.push(String(transmission).toLowerCase());
    }

    if (fuelType && fuelType !== 'all') {
      query += ' AND fuel_type = ?';
      params.push(String(fuelType).toLowerCase());
    }

    if (minSeats) {
      query += ' AND seating_capacity >= ?';
      params.push(Number(minSeats));
    }

    if (maxPrice) {
      query += ' AND daily_rate_lkr <= ?';
      params.push(Number(maxPrice));
    }

    if (search) {
      query += ' AND (LOWER(make) LIKE ? OR LOWER(model) LIKE ? OR LOWER(registration_number) LIKE ?)';
      const term = `%${String(search).toLowerCase().trim()}%`;
      params.push(term, term, term);
    }

    // Apply sorting
    if (sortBy === 'price_asc') {
      query += ' ORDER BY daily_rate_lkr ASC';
    } else if (sortBy === 'price_desc') {
      query += ' ORDER BY daily_rate_lkr DESC';
    } else if (sortBy === 'year_desc') {
      query += ' ORDER BY year DESC';
    } else {
      query += ' ORDER BY daily_rate_lkr ASC';
    }

    let vehicles = db.prepare(query).all(...params) as Record<string, unknown>[];

    // If pickupDate & returnDate are provided, filter by real booking availability
    if (pickupDate && returnDate && typeof pickupDate === 'string' && typeof returnDate === 'string') {
      vehicles = vehicles.map(v => {
        const avail = checkVehicleAvailability(Number(v.id), pickupDate, returnDate);
        return {
          ...v,
          isAvailableForDates: avail.available,
          availabilityNote: avail.conflictReason || 'Available for requested dates'
        };
      });
    }

    // Parse JSON features for each vehicle
    const formatted = vehicles.map(v => {
      let parsedFeatures: string[] = [];
      try {
        parsedFeatures = JSON.parse(v.features as string);
      } catch {
        parsedFeatures = (v.features as string).split(',').map(s => s.trim());
      }
      return {
        ...v,
        features: parsedFeatures
      };
    });

    res.json({
      success: true,
      count: formatted.length,
      vehicles: formatted
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve vehicle catalogue.' });
  }
});

// GET /api/vehicles/featured
router.get('/featured', (_req: Request, res: Response): void => {
  try {
    const vehicles = db.prepare(`
      SELECT id, make, model, year, category, transmission, fuel_type,
             seating_capacity, daily_rate_lkr, weekly_rate_lkr, deposit_lkr,
             status, registration_number, features, description, main_image_url
      FROM vehicles
      WHERE status = 'available'
      ORDER BY daily_rate_lkr DESC
      LIMIT 4
    `).all() as Record<string, unknown>[];

    const formatted = vehicles.map(v => {
      let parsedFeatures: string[] = [];
      try {
        parsedFeatures = JSON.parse(v.features as string);
      } catch {
        parsedFeatures = (v.features as string).split(',').map(s => s.trim());
      }
      return {
        ...v,
        features: parsedFeatures
      };
    });

    res.json({ success: true, vehicles: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load featured vehicles.' });
  }
});

// GET /api/vehicles/:id
router.get('/:id', (req: Request, res: Response): void => {
  try {
    const vehicleId = Number(req.params.id);
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicleId) as Record<string, unknown> | undefined;

    if (!vehicle) {
      res.status(404).json({ success: false, error: 'Vehicle not found.' });
      return;
    }

    // Parse features
    let features: string[] = [];
    try {
      features = JSON.parse(vehicle.features as string);
    } catch {
      features = (vehicle.features as string).split(',').map(s => s.trim());
    }

    // Fetch images gallery
    const images = db.prepare(`
      SELECT id, image_url, caption, display_order
      FROM vehicle_images
      WHERE vehicle_id = ?
      ORDER BY display_order ASC
    `).all(vehicleId);

    // Fetch vehicle reviews
    const reviews = db.prepare(`
      SELECT r.id, r.rating, r.comment, r.created_at, u.full_name as author_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.vehicle_id = ? AND r.is_approved = 1
      ORDER BY r.created_at DESC
    `).all(vehicleId);

    res.json({
      success: true,
      vehicle: {
        ...vehicle,
        features,
        images,
        reviews
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve vehicle details.' });
  }
});

// GET /api/vehicles/:id/availability
router.get('/:id/availability', (req: Request, res: Response): void => {
  try {
    const vehicleId = Number(req.params.id);
    const { pickupDate, returnDate } = req.query;

    if (!pickupDate || !returnDate) {
      res.status(400).json({ success: false, error: 'Pickup date and return date are required.' });
      return;
    }

    const result = checkVehicleAvailability(vehicleId, String(pickupDate), String(returnDate));
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to evaluate vehicle availability.' });
  }
});

export default router;
