-- SwiftDrive Rentals Database Schema (SQLite Engine)
-- Negombo, Sri Lanka Fleet & Reservation Management System

PRAGMA foreign_keys = ON;

-- 1. Users / Profiles
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('customer', 'staff', 'admin')) DEFAULT 'customer',
  driving_license_number TEXT,
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('economy', 'suv', 'van', 'luxury')),
  transmission TEXT NOT NULL CHECK(transmission IN ('automatic', 'manual')),
  fuel_type TEXT NOT NULL CHECK(fuel_type IN ('petrol', 'diesel', 'hybrid', 'electric')),
  seating_capacity INTEGER NOT NULL CHECK(seating_capacity > 0),
  daily_rate_lkr REAL NOT NULL CHECK(daily_rate_lkr > 0),
  weekly_rate_lkr REAL NOT NULL CHECK(weekly_rate_lkr > 0),
  deposit_lkr REAL NOT NULL CHECK(deposit_lkr >= 0),
  status TEXT NOT NULL CHECK(status IN ('available', 'rented', 'maintenance', 'archived')) DEFAULT 'available',
  registration_number TEXT UNIQUE NOT NULL,
  mileage_km INTEGER NOT NULL DEFAULT 0,
  features TEXT NOT NULL, -- JSON string or comma-separated list
  description TEXT NOT NULL,
  main_image_url TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(category);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

-- 3. Vehicle Images Gallery
CREATE TABLE IF NOT EXISTS vehicle_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle_id ON vehicle_images(vehicle_id);

-- 4. Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_reference TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  pickup_date DATE NOT NULL,
  return_date DATE NOT NULL,
  pickup_location TEXT NOT NULL DEFAULT 'Negombo Head Office (Lewis Place)',
  return_location TEXT NOT NULL DEFAULT 'Negombo Head Office (Lewis Place)',
  total_days INTEGER NOT NULL CHECK(total_days >= 1),
  daily_rate_applied REAL NOT NULL CHECK(daily_rate_applied > 0),
  rental_cost_lkr REAL NOT NULL CHECK(rental_cost_lkr > 0),
  deposit_amount_lkr REAL NOT NULL CHECK(deposit_amount_lkr >= 0),
  total_amount_lkr REAL NOT NULL CHECK(total_amount_lkr > 0),
  booking_status TEXT NOT NULL CHECK(booking_status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')) DEFAULT 'pending',
  payment_status TEXT NOT NULL CHECK(payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
  special_requests TEXT,
  cancellation_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CHECK (return_date > pickup_date)
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id ON bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(vehicle_id, pickup_date, return_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);

-- 5. Payments (Audited Test/Sandbox Gateway & Cash/Transfer workflows)
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount_lkr REAL NOT NULL CHECK(amount_lkr > 0),
  payment_type TEXT NOT NULL CHECK(payment_type IN ('rental', 'deposit', 'full')),
  payment_method TEXT NOT NULL CHECK(payment_method IN ('card_sandbox', 'bank_transfer_test', 'cash_on_pickup')),
  transaction_reference TEXT UNIQUE NOT NULL,
  payment_status TEXT NOT NULL CHECK(payment_status IN ('successful', 'failed', 'pending')),
  gateway_response TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);

-- 6. Rental Inquiries
CREATE TABLE IF NOT EXISTS rental_inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK(status IN ('new', 'in_progress', 'resolved')) DEFAULT 'new',
  response_notes TEXT,
  assigned_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inquiries_status ON rental_inquiries(status);

-- 7. Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  is_featured INTEGER DEFAULT 0,
  is_approved INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Vehicle Condition Reports (Staff Pick-up and Return Inspection)
CREATE TABLE IF NOT EXISTS vehicle_condition_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  staff_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  report_type TEXT NOT NULL CHECK(report_type IN ('pickup', 'return')),
  odometer_reading INTEGER NOT NULL,
  fuel_level TEXT NOT NULL CHECK(fuel_level IN ('empty', 'quarter', 'half', 'three_quarters', 'full')),
  exterior_condition TEXT NOT NULL,
  interior_condition TEXT NOT NULL,
  damage_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_condition_reports_booking ON vehicle_condition_reports(booking_id);

-- 9. Road-Trip & Driving Blog Posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image TEXT NOT NULL,
  category TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT 'SwiftDrive Editorial Team',
  read_time_minutes INTEGER NOT NULL DEFAULT 5,
  published_at DATE DEFAULT CURRENT_DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
