-- SwiftDrive Rentals Database Schema (PostgreSQL & Supabase Architecture)
-- Negombo, Sri Lanka Fleet & Reservation Management System
-- Version-controlled migration with Row Level Security (RLS) policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users / Profiles
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK(role IN ('customer', 'staff', 'admin')) DEFAULT 'customer',
  driving_license_number VARCHAR(100),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id BIGSERIAL PRIMARY KEY,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  year INT NOT NULL,
  category VARCHAR(20) NOT NULL CHECK(category IN ('economy', 'suv', 'van', 'luxury')),
  transmission VARCHAR(20) NOT NULL CHECK(transmission IN ('automatic', 'manual')),
  fuel_type VARCHAR(20) NOT NULL CHECK(fuel_type IN ('petrol', 'diesel', 'hybrid', 'electric')),
  seating_capacity INT NOT NULL CHECK(seating_capacity > 0),
  daily_rate_lkr NUMERIC(12, 2) NOT NULL CHECK(daily_rate_lkr > 0),
  weekly_rate_lkr NUMERIC(12, 2) NOT NULL CHECK(weekly_rate_lkr > 0),
  deposit_lkr NUMERIC(12, 2) NOT NULL CHECK(deposit_lkr >= 0),
  status VARCHAR(20) NOT NULL CHECK(status IN ('available', 'rented', 'maintenance', 'archived')) DEFAULT 'available',
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  mileage_km INT NOT NULL DEFAULT 0,
  features TEXT NOT NULL,
  description TEXT NOT NULL,
  main_image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(category);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

-- 3. Vehicle Images
CREATE TABLE IF NOT EXISTS vehicle_images (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption VARCHAR(255),
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle_id ON vehicle_images(vehicle_id);

-- 4. Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id BIGSERIAL PRIMARY KEY,
  booking_reference VARCHAR(50) UNIQUE NOT NULL,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  pickup_date DATE NOT NULL,
  return_date DATE NOT NULL,
  pickup_location VARCHAR(200) NOT NULL DEFAULT 'Negombo Head Office (Lewis Place)',
  return_location VARCHAR(200) NOT NULL DEFAULT 'Negombo Head Office (Lewis Place)',
  total_days INT NOT NULL CHECK(total_days >= 1),
  daily_rate_applied NUMERIC(12, 2) NOT NULL CHECK(daily_rate_applied > 0),
  rental_cost_lkr NUMERIC(12, 2) NOT NULL CHECK(rental_cost_lkr > 0),
  deposit_amount_lkr NUMERIC(12, 2) NOT NULL CHECK(deposit_amount_lkr >= 0),
  total_amount_lkr NUMERIC(12, 2) NOT NULL CHECK(total_amount_lkr > 0),
  booking_status VARCHAR(20) NOT NULL CHECK(booking_status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')) DEFAULT 'pending',
  payment_status VARCHAR(20) NOT NULL CHECK(payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
  special_requests TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_return_after_pickup CHECK (return_date > pickup_date)
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id ON bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(vehicle_id, pickup_date, return_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);

-- 5. Payments
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount_lkr NUMERIC(12, 2) NOT NULL CHECK(amount_lkr > 0),
  payment_type VARCHAR(20) NOT NULL CHECK(payment_type IN ('rental', 'deposit', 'full')),
  payment_method VARCHAR(30) NOT NULL CHECK(payment_method IN ('card_sandbox', 'bank_transfer_test', 'cash_on_pickup')),
  transaction_reference VARCHAR(100) UNIQUE NOT NULL,
  payment_status VARCHAR(20) NOT NULL CHECK(payment_status IN ('successful', 'failed', 'pending')),
  gateway_response TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Rental Inquiries
CREATE TABLE IF NOT EXISTS rental_inquiries (
  id BIGSERIAL PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  vehicle_id BIGINT REFERENCES vehicles(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL CHECK(status IN ('new', 'in_progress', 'resolved')) DEFAULT 'new',
  response_notes TEXT,
  assigned_to_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id BIGINT REFERENCES vehicles(id) ON DELETE SET NULL,
  booking_id BIGINT REFERENCES bookings(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Vehicle Condition Reports
CREATE TABLE IF NOT EXISTS vehicle_condition_reports (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  staff_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  report_type VARCHAR(20) NOT NULL CHECK(report_type IN ('pickup', 'return')),
  odometer_reading INT NOT NULL,
  fuel_level VARCHAR(20) NOT NULL CHECK(fuel_level IN ('empty', 'quarter', 'half', 'three_quarters', 'full')),
  exterior_condition TEXT NOT NULL,
  interior_condition TEXT NOT NULL,
  damage_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Blog Posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  author_name VARCHAR(100) NOT NULL DEFAULT 'SwiftDrive Editorial Team',
  read_time_minutes INT NOT NULL DEFAULT 5,
  published_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50),
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE / POSTGRESQL

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_condition_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Customers can only read and update their own user record
CREATE POLICY customer_user_policy ON users
  FOR ALL
  USING (auth.uid()::text = id::text OR current_setting('request.jwt.claim.role', true) IN ('staff', 'admin'));

-- Customers can view only their own bookings; Staff and Admin can view all
CREATE POLICY bookings_customer_read ON bookings
  FOR SELECT
  USING (user_id::text = auth.uid()::text OR current_setting('request.jwt.claim.role', true) IN ('staff', 'admin'));

-- Customers can create bookings only for themselves
CREATE POLICY bookings_customer_insert ON bookings
  FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

-- Only staff and admin can update booking status
CREATE POLICY bookings_staff_update ON bookings
  FOR UPDATE
  USING (current_setting('request.jwt.claim.role', true) IN ('staff', 'admin'));

-- Customers can only view their own payments
CREATE POLICY payments_customer_read ON payments
  FOR SELECT
  USING (user_id::text = auth.uid()::text OR current_setting('request.jwt.claim.role', true) IN ('staff', 'admin'));

-- Only staff and admin can read condition reports and audit logs
CREATE POLICY staff_condition_reports ON vehicle_condition_reports
  FOR ALL
  USING (current_setting('request.jwt.claim.role', true) IN ('staff', 'admin'));

CREATE POLICY admin_audit_logs ON audit_logs
  FOR ALL
  USING (current_setting('request.jwt.claim.role', true) = 'admin');
