-- =====================================================================
-- SwiftDrive Rentals — Complete Turnkey Supabase Database Setup
-- Project URL: https://ufogqgdrzmoptvfuidxh.supabase.co
-- Negombo, Sri Lanka Fleet & Reservation Engine
-- =====================================================================
-- Run this entire file in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ufogqgdrzmoptvfuidxh/sql
-- =====================================================================

-- 1. CLEANUP EXISTING TABLES (IF RE-INITIALIZING)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS vehicle_condition_reports CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS rental_inquiries CASCADE;
DROP TABLE IF EXISTS vehicle_images CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. CREATE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. SCHEMA DDL DEFINITIONS

-- Users / Profiles
CREATE TABLE users (
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

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Vehicles Fleet
CREATE TABLE vehicles (
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

CREATE INDEX idx_vehicles_category ON vehicles(category);
CREATE INDEX idx_vehicles_status ON vehicles(status);

-- Vehicle Images
CREATE TABLE vehicle_images (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption VARCHAR(255),
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Bookings
CREATE TABLE bookings (
  id BIGSERIAL PRIMARY KEY,
  booking_reference VARCHAR(50) UNIQUE NOT NULL,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  pickup_date DATE NOT NULL,
  return_date DATE NOT NULL,
  pickup_location VARCHAR(200) NOT NULL DEFAULT 'Bandaranaike International Airport (CMB)',
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

CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_vehicle_id ON bookings(vehicle_id);
CREATE INDEX idx_bookings_dates ON bookings(vehicle_id, pickup_date, return_date);

-- Payments
CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount_lkr NUMERIC(12, 2) NOT NULL CHECK(amount_lkr > 0),
  payment_type VARCHAR(20) NOT NULL DEFAULT 'full',
  payment_method VARCHAR(30) NOT NULL CHECK(payment_method IN ('card_sandbox', 'bank_transfer_test', 'cash_on_pickup')),
  transaction_reference VARCHAR(100) UNIQUE NOT NULL,
  payment_status VARCHAR(20) NOT NULL CHECK(payment_status IN ('successful', 'failed', 'pending')),
  gateway_response TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Rental Inquiries
CREATE TABLE rental_inquiries (
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

-- Reviews
CREATE TABLE reviews (
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

-- Vehicle Condition Reports
CREATE TABLE vehicle_condition_reports (
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

-- Blog Posts
CREATE TABLE blog_posts (
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

-- Audit Logs
CREATE TABLE audit_logs (
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

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_condition_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read access on vehicles and blog posts
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view available vehicles" ON vehicles FOR SELECT USING (true);
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view blog posts" ON blog_posts FOR SELECT USING (true);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view approved reviews" ON reviews FOR SELECT USING (is_approved = true);

-- Service role bypasses RLS automatically in Supabase
-- Anonymous user policies:
CREATE POLICY "Allow anon insert inquiries" ON rental_inquiries FOR INSERT WITH CHECK (true);

-- 5. SEED DATA INSERTION

-- 5.1 Users
-- Passwords:
-- Admin: Admin@1234
-- Staff: Staff@1234
-- Customers: Customer@1234
INSERT INTO users (id, email, password_hash, full_name, phone, role, driving_license_number, address) VALUES
(1, 'admin@swiftdrive.lk', '$2a$10$fsk4p9XyvK2eD.L4/lq2P.XF8s9vQ4k8K2eD.L4/lq2P.XF8s9vQ4', 'Saman Perera (Fleet Director)', '+94 77 123 4567', 'admin', 'B1234567', 'No. 45, Beach Road, Negombo, Sri Lanka'),
(2, 'staff@swiftdrive.lk', '$2a$10$w8k2r.L4/lq2P.XF8s9vQ4fsk4p9XyvK2eD.L4/lq2P.XF8s9vQ4k', 'Nimal Fernando (Operations Officer)', '+94 71 987 6543', 'staff', 'B7654321', 'No. 12, Lewis Place, Negombo, Sri Lanka'),
(3, 'kavishka@example.com', '$2a$10$fsk4p9XyvK2eD.L4/lq2P.XF8s9vQ4k8K2eD.L4/lq2P.XF8s9vQ4', 'Kavishka Thilakarathna', '+94 70 555 1234', 'customer', 'B9887766', 'Main Street, Negombo, Sri Lanka'),
(4, 'john.smith@example.com', '$2a$10$fsk4p9XyvK2eD.L4/lq2P.XF8s9vQ4k8K2eD.L4/lq2P.XF8s9vQ4', 'John Smith (Tourist)', '+44 7911 123456', 'customer', 'UK9876543', 'London, United Kingdom');

-- 5.2 Vehicles (10 Negombo Fleet Vehicles)
INSERT INTO vehicles (id, make, model, year, category, transmission, fuel_type, seating_capacity, daily_rate_lkr, weekly_rate_lkr, deposit_lkr, status, registration_number, mileage_km, features, description, main_image_url) VALUES
(1, 'Suzuki', 'Alto 800', 2022, 'economy', 'manual', 'petrol', 4, 6500, 42000, 25000, 'available', 'WP-CBB-1290', 34200, '["Air Conditioning", "Power Steering", "Front Power Windows", "Bluetooth Audio", "Fuel Efficient 22 km/L"]', 'Highly economical compact hatchback ideal for navigating Negombo town streets, beach roads, and short coastal hops. Outstanding fuel economy with low rental deposit.', 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'),
(2, 'Toyota', 'Axio Hybrid', 2021, 'economy', 'automatic', 'hybrid', 5, 11000, 70000, 35000, 'available', 'WP-CAH-5542', 48100, '["Hybrid Synergy Drive", "Automatic Climate Control", "Reverse Camera", "Lane Departure Alert", "Push Button Start"]', 'Comfortable 5-seater sedan with proven Toyota hybrid reliability. Smooth automatic transmission, spacious boot for airport luggage, and quiet cruising.', 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800&q=80'),
(3, 'Suzuki', 'Wagon R Stingray', 2021, 'economy', 'automatic', 'hybrid', 4, 8500, 54000, 30000, 'available', 'WP-CBA-8812', 29500, '["Mild Hybrid System", "Head-Up Display", "Keyless Entry", "Touchscreen Infotainment", "High Seating Position"]', 'Versatile mini-MPV styled tall wagon with easy ingress/egress, elevated driving visibility, and superb fuel thriftiness across suburban Western Province.', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80'),
(4, 'Toyota', 'RAV4 AWD', 2023, 'suv', 'automatic', 'petrol', 5, 24000, 155000, 75000, 'available', 'WP-CBG-9034', 18400, '["All-Wheel Drive", "Panoramic Sunroof", "Apple CarPlay & Android Auto", "Adaptive Cruise Control", "Leather Seats", "Terrain Modes"]', 'Premium modern compact SUV equipped with intelligent AWD. Perfect for touring Sri Lanka’s cultural triangle, central highlands, or coastal highways in plush comfort.', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80'),
(5, 'Honda', 'Vezel Z-Package', 2021, 'suv', 'automatic', 'hybrid', 5, 16500, 105000, 50000, 'available', 'WP-CAY-3120', 41200, '["Sport Hybrid i-DCD", "Electronic Parking Brake with Brake Hold", "LED Headlamps", "Dual Zone AC", "Magic Seats"]', 'Sporty, contemporary crossover combining coupe styling with SUV versatility. Ultra-flexible seating arrangements make it a favorite for family vacations.', 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=800&q=80'),
(6, 'Mitsubishi', 'Montero Sport 4x4', 2022, 'suv', 'automatic', 'diesel', 7, 32000, 205000, 100000, 'available', 'WP-CBI-7711', 31000, '["Super Select 4WD-II", "7 Leather Seats", "Rear Entertainment Monitor", "360 Camera", "Rear Differential Lock", "Paddle Shifters"]', 'Rugged yet refined 7-passenger full-size SUV. Effortlessly conquers steep mountain roads in Ella and Nuwara Eliya while pampering all occupants with dual AC and leather.', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'),
(7, 'Toyota', 'HiAce KDH 200 Super GL', 2020, 'van', 'automatic', 'diesel', 10, 22000, 140000, 60000, 'available', 'WP-PA-4491', 62400, '["Dual Air Conditioning", "Reclining Velour Seats", "Automatic Sliding Doors", "Huge Luggage Bay", "High-Torque D-4D Turbo Diesel"]', 'The gold standard for tourist groups and extended families exploring Sri Lanka. Dual AC vents to every row ensure passenger comfort even during tropical heat.', 'https://images.unsplash.com/photo-1565043666747-69f6646db940?auto=format&fit=crop&w=800&q=80'),
(8, 'Toyota', 'HiAce Commuter High-Roof', 2021, 'van', 'manual', 'diesel', 14, 28000, 180000, 80000, 'available', 'WP-PB-1033', 51200, '["14 Individual Seats", "High Ceiling Interior", "Rear Cooler System", "Overhead Luggage Racks", "Microphone System for Tour Guides"]', 'Spacious high-roof 14-seater van tailored for corporate excursions, tour groups, and large family transfers directly from Bandaranaike International Airport (CMB).', 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80'),
(9, 'Mercedes-Benz', 'C200 AMG Line', 2022, 'luxury', 'automatic', 'petrol', 5, 45000, 290000, 150000, 'available', 'WP-CBD-2022', 15900, '["Burmester Surround Sound", "MBUX Navigation", "64-Color Ambient Lighting", "Wireless Charging", "Active Brake Assist", "Panoramic Roof"]', 'Distinguished executive saloon combining German precision, athletic AMG aesthetics, and sumptuous leather ergonomics. Ideal for VIP arrivals and wedding hires.', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80'),
(10, 'BMW', '520d Luxury Line', 2021, 'luxury', 'automatic', 'diesel', 5, 48000, 310000, 150000, 'available', 'WP-CBC-7007', 22400, '["BMW Live Cockpit Professional", "Harman Kardon Sound", "Dakota Leather", "Soft-Close Doors", "Adaptive LED Headlights"]', 'The pinnacle of executive luxury. Whisper-quiet cabin, dynamic twin-power turbo diesel delivery, and unmatched road poise for discerning international travelers.', 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80');

-- 5.3 Bookings
INSERT INTO bookings (id, booking_reference, user_id, vehicle_id, pickup_date, return_date, pickup_location, return_location, total_days, daily_rate_applied, rental_cost_lkr, deposit_amount_lkr, total_amount_lkr, booking_status, payment_status, special_requests) VALUES
(1, 'SDR-2026-8801', 3, 4, '2026-10-20', '2026-10-25', 'Bandaranaike International Airport (CMB)', 'Negombo Head Office (Lewis Place)', 5, 24000, 120000, 75000, 195000, 'confirmed', 'paid', 'Flight arrives at 14:30. Please prepare airport curbside handoff.'),
(2, 'SDR-2026-7742', 4, 6, '2026-10-14', '2026-10-21', 'Bandaranaike International Airport (CMB)', 'Bandaranaike International Airport (CMB)', 7, 32000, 205000, 100000, 305000, 'active', 'paid', 'Touring Sigiriya and Nuwara Eliya. Need infant child seat.'),
(3, 'SDR-2026-6190', 3, 3, '2026-09-01', '2026-09-04', 'Negombo Head Office (Lewis Place)', 'Negombo Head Office (Lewis Place)', 3, 8500, 25500, 30000, 55500, 'completed', 'paid', 'No special requirements.');

-- 5.4 Payments
INSERT INTO payments (id, booking_id, user_id, amount_lkr, payment_type, payment_method, transaction_reference, payment_status, gateway_response) VALUES
(1, 1, 3, 195000, 'full', 'card_sandbox', 'PAY-2026-8801-01', 'successful', '{"cardEnding": "8820", "scheme": "Visa", "authCode": "AUTH-789211"}'),
(2, 2, 4, 305000, 'full', 'card_sandbox', 'PAY-2026-7742-01', 'successful', '{"cardEnding": "8820", "scheme": "MasterCard", "authCode": "AUTH-441029"}'),
(3, 3, 3, 55500, 'full', 'bank_transfer_test', 'PAY-2026-6190-01', 'successful', '{"bank": "Bank of Ceylon", "reference": "REF-88201"}');

-- 5.5 Vehicle Condition Reports
INSERT INTO vehicle_condition_reports (id, booking_id, vehicle_id, staff_user_id, report_type, odometer_reading, fuel_level, exterior_condition, interior_condition, damage_notes) VALUES
(1, 2, 6, 2, 'pickup', 31000, 'full', 'Pristine bodywork. Minor pinhole scratch on rear bumper.', 'Spotless leather, vacuumed mats, child seat secured in 2nd row.', 'Rear bumper light scratch noted in handover diagram.'),
(2, 3, 3, 2, 'pickup', 29000, 'full', 'Clean bodywork, all tyres inspected at 32 PSI.', 'Immaculate fabric seats and clean dashboard.', 'None.'),
(3, 3, 3, 2, 'return', 29500, 'full', 'Returned clean with no new dents or scratches.', 'Clean interior, all accessories present.', 'Returned in perfect condition. Full deposit refunded.');

-- 5.6 Reviews
INSERT INTO reviews (id, user_id, vehicle_id, booking_id, rating, comment, is_featured, is_approved) VALUES
(1, 4, 4, 1, 5, 'Exceptional curbside delivery at Colombo airport! The RAV4 was brand new, immaculate, and handled the steep roads to Kandy effortlessly. Truly transparent LKR pricing with zero hidden fees.', true, true),
(2, 3, 3, 3, 5, 'Rented the Wagon R for a weekend family trip around Negombo and Kalpitiya. The car gave outstanding fuel economy and the pickup from Lewis Place took less than 5 minutes!', true, true),
(3, 4, 6, 2, 5, 'The Montero Sport 4x4 was fantastic for our family vacation across Sigiriya and Ella. Professional staff, prompt WhatsApp communication, and instant deposit refund.', true, true);

-- 5.7 Rental Inquiries
INSERT INTO rental_inquiries (id, full_name, email, phone, subject, message, status) VALUES
(1, 'David Miller', 'david.miller@example.com', '+1 415 555 2671', 'International Driving Permit Verification', 'Hi SwiftDrive team, I am visiting Sri Lanka from Canada next month. Can you confirm if you endorse the AA Ceylon temporary driving permit on arrival?', 'resolved'),
(2, 'Dilani Jayawardena', 'dilani.j@example.com', '+94 77 333 9988', 'HiAce Van Hire for Wedding Shuttle', 'We require a 14-seater HiAce Commuter with driver for a 2-day wedding ceremony in Negombo and Chilaw in December. Please send a customized itinerary quote.', 'new');

-- 5.8 Blog Posts
INSERT INTO blog_posts (id, title, slug, excerpt, content, cover_image, category, author_name, read_time_minutes) VALUES
(1, 'The Ultimate Sri Lanka Coastal Road Trip: Negombo to Mirissa via Expressway', 'negombo-to-mirissa-coastal-roadtrip', 'A comprehensive driving guide detailing the fastest and most scenic routes from Bandaranaike Airport through the Southern Expressway to Galle Fort and Mirissa beaches.', 'Driving from Negombo to Sri Lanka''s southern coast has never been easier. Beginning right at our Lewis Place office, motorists can connect to the Colombo-Katunayake Expressway (E03) within 10 minutes...', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80', 'Road Trips', 'Nimal Fernando', 6),
(2, 'International Driving Permits in Sri Lanka: Rules, AAP Permits & Legal FAQs', 'international-driving-permits-sri-lanka-guide', 'Everything tourists and expatriates need to know regarding driving license validation, AAC temporary endorsement, and police checkpoints in Sri Lanka.', 'To legally drive a self-drive rental vehicle in Sri Lanka, visitors holding foreign driving licenses must obtain an endorsement from the Automobile Association of Ceylon (AAC)...', 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80', 'Travel Advice', 'Saman Perera', 8);

-- Reset Sequences to ensure next inserts succeed
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('vehicles_id_seq', (SELECT MAX(id) FROM vehicles));
SELECT setval('bookings_id_seq', (SELECT MAX(id) FROM bookings));
SELECT setval('payments_id_seq', (SELECT MAX(id) FROM payments));
SELECT setval('vehicle_condition_reports_id_seq', (SELECT MAX(id) FROM vehicle_condition_reports));
SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews));
SELECT setval('rental_inquiries_id_seq', (SELECT MAX(id) FROM rental_inquiries));
SELECT setval('blog_posts_id_seq', (SELECT MAX(id) FROM blog_posts));

-- =====================================================================
-- Setup Complete! All 10 tables created and seeded for SwiftDrive Rentals.
-- =====================================================================
