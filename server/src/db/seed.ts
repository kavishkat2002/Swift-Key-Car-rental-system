import bcrypt from 'bcryptjs';
import db from './db.js';

export function seedDatabase() {
  console.log('--- Seeding SwiftDrive Rentals Database (Negombo, Sri Lanka) ---');

  // Clear existing records to ensure idempotent and clean state
  db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM vehicle_condition_reports;
    DELETE FROM payments;
    DELETE FROM bookings;
    DELETE FROM reviews;
    DELETE FROM rental_inquiries;
    DELETE FROM vehicle_images;
    DELETE FROM vehicles;
    DELETE FROM blog_posts;
    DELETE FROM users;
  `);

  const passwordHash = bcrypt.hashSync('Password@123', 10);
  const adminHash = bcrypt.hashSync('Admin@1234', 10);
  const staffHash = bcrypt.hashSync('Staff@1234', 10);
  const customerHash = bcrypt.hashSync('Customer@1234', 10);

  // 1. Insert Users
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, phone, role, driving_license_number, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    1,
    'admin@swiftdrive.lk',
    adminHash,
    'Saman Perera (Fleet Director)',
    '+94 77 123 4567',
    'admin',
    'B1234567',
    'No. 45, Beach Road, Negombo, Sri Lanka'
  );

  insertUser.run(
    2,
    'staff@swiftdrive.lk',
    staffHash,
    'Nimal Fernando (Operations Officer)',
    '+94 71 987 6543',
    'staff',
    'B7654321',
    'No. 12, Lewis Place, Negombo, Sri Lanka'
  );

  insertUser.run(
    3,
    'kavishka@example.com',
    customerHash,
    'Kavishka Thilakarathna',
    '+94 70 555 1234',
    'customer',
    'B9887766',
    'Main Street, Negombo, Sri Lanka'
  );

  insertUser.run(
    4,
    'john.smith@example.com',
    customerHash,
    'John Smith (Tourist)',
    '+44 7911 123456',
    'customer',
    'UK9876543',
    'London, United Kingdom'
  );

  // 2. Insert Vehicles
  const insertVehicle = db.prepare(`
    INSERT INTO vehicles (
      id, make, model, year, category, transmission, fuel_type, seating_capacity,
      daily_rate_lkr, weekly_rate_lkr, deposit_lkr, status, registration_number,
      mileage_km, features, description, main_image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const vehicles = [
    {
      id: 1,
      make: 'Suzuki',
      model: 'Alto 800',
      year: 2022,
      category: 'economy',
      transmission: 'manual',
      fuel_type: 'petrol',
      seating: 4,
      daily: 6500,
      weekly: 42000,
      deposit: 25000,
      status: 'available',
      reg: 'WP-CBB-1290',
      mileage: 34200,
      features: JSON.stringify(['Air Conditioning', 'Power Steering', 'Front Power Windows', 'Bluetooth Audio', 'Fuel Efficient 22 km/L']),
      desc: 'Highly economical compact hatchback ideal for navigating Negombo town streets, beach roads, and short coastal hops. Outstanding fuel economy with low rental deposit.',
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 2,
      make: 'Toyota',
      model: 'Axio Hybrid',
      year: 2021,
      category: 'economy',
      transmission: 'automatic',
      fuel_type: 'hybrid',
      seating: 5,
      daily: 11000,
      weekly: 70000,
      deposit: 35000,
      status: 'available',
      reg: 'WP-CAH-5542',
      mileage: 48100,
      features: JSON.stringify(['Hybrid Synergy Drive', 'Automatic Climate Control', 'Reverse Camera', 'Lane Departure Alert', 'Push Button Start']),
      desc: 'Comfortable 5-seater sedan with proven Toyota hybrid reliability. Smooth automatic transmission, spacious boot for airport luggage, and quiet cruising.',
      image: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 3,
      make: 'Suzuki',
      model: 'Wagon R Stingray',
      year: 2021,
      category: 'economy',
      transmission: 'automatic',
      fuel_type: 'hybrid',
      seating: 4,
      daily: 8500,
      weekly: 54000,
      deposit: 30000,
      status: 'available',
      reg: 'WP-CBA-8812',
      mileage: 29500,
      features: JSON.stringify(['Mild Hybrid System', 'Head-Up Display', 'Keyless Entry', 'Touchscreen Infotainment', 'High Seating Position']),
      desc: 'Versatile mini-MPV styled tall wagon with easy ingress/egress, elevated driving visibility, and superb fuel thriftiness across suburban Western Province.',
      image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 4,
      make: 'Toyota',
      model: 'RAV4 AWD',
      year: 2023,
      category: 'suv',
      transmission: 'automatic',
      fuel_type: 'petrol',
      seating: 5,
      daily: 24000,
      weekly: 155000,
      deposit: 75000,
      status: 'available',
      reg: 'WP-CBG-9034',
      mileage: 18400,
      features: JSON.stringify(['All-Wheel Drive', 'Panoramic Sunroof', 'Apple CarPlay & Android Auto', 'Adaptive Cruise Control', 'Leather Seats', 'Terrain Modes']),
      desc: 'Premium modern compact SUV equipped with intelligent AWD. Perfect for touring Sri Lanka’s cultural triangle, central highlands, or coastal highways in plush comfort.',
      image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 5,
      make: 'Honda',
      model: 'Vezel Z-Package',
      year: 2021,
      category: 'suv',
      transmission: 'automatic',
      fuel_type: 'hybrid',
      seating: 5,
      daily: 16500,
      weekly: 105000,
      deposit: 50000,
      status: 'available',
      reg: 'WP-CAY-3120',
      mileage: 41200,
      features: JSON.stringify(['Sport Hybrid i-DCD', 'Electronic Parking Brake with Brake Hold', 'LED Headlamps', 'Dual Zone AC', 'Magic Seats']),
      desc: 'Sporty, contemporary crossover combining coupe styling with SUV versatility. Ultra-flexible seating arrangements make it a favorite for family vacations.',
      image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 6,
      make: 'Mitsubishi',
      model: 'Montero Sport 4x4',
      year: 2022,
      category: 'suv',
      transmission: 'automatic',
      fuel_type: 'diesel',
      seating: 7,
      daily: 32000,
      weekly: 205000,
      deposit: 100000,
      status: 'available',
      reg: 'WP-CBI-7711',
      mileage: 31000,
      features: JSON.stringify(['Super Select 4WD-II', '7 Leather Seats', 'Rear Entertainment Monitor', '360 Camera', 'Rear Differential Lock', 'Paddle Shifters']),
      desc: 'Rugged yet refined 7-passenger full-size SUV. Effortlessly conquers steep mountain roads in Ella and Nuwara Eliya while pampering all occupants with dual AC and leather.',
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 7,
      make: 'Toyota',
      model: 'HiAce KDH 200 Super GL',
      year: 2020,
      category: 'van',
      transmission: 'automatic',
      fuel_type: 'diesel',
      seating: 10,
      daily: 22000,
      weekly: 140000,
      deposit: 60000,
      status: 'available',
      reg: 'WP-PA-4491',
      mileage: 62400,
      features: JSON.stringify(['Dual Air Conditioning', 'Reclining Velour Seats', 'Automatic Sliding Doors', 'Huge Luggage Bay', 'High-Torque D-4D Turbo Diesel']),
      desc: 'The gold standard for tourist groups and extended families exploring Sri Lanka. Dual AC vents to every row ensure passenger comfort even during tropical heat.',
      image: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 8,
      make: 'Toyota',
      model: 'HiAce Commuter High-Roof',
      year: 2021,
      category: 'van',
      transmission: 'manual',
      fuel_type: 'diesel',
      seating: 14,
      daily: 28000,
      weekly: 180000,
      deposit: 80000,
      status: 'available',
      reg: 'WP-PB-1033',
      mileage: 51200,
      features: JSON.stringify(['14 Individual Seats', 'High Ceiling Interior', 'Rear Cooler System', 'Overhead Luggage Racks', 'Microphone System for Tour Guides']),
      desc: 'Spacious high-roof 14-seater van tailored for corporate excursions, tour groups, and large family transfers directly from Bandaranaike International Airport (CMB).',
      image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 9,
      make: 'Mercedes-Benz',
      model: 'C200 AMG Line',
      year: 2022,
      category: 'luxury',
      transmission: 'automatic',
      fuel_type: 'petrol',
      seating: 5,
      daily: 45000,
      weekly: 290000,
      deposit: 150000,
      status: 'available',
      reg: 'WP-CBD-2022',
      mileage: 15900,
      features: JSON.stringify(['Burmester Surround Sound', 'MBUX Navigation', '64-Color Ambient Lighting', 'Wireless Charging', 'Active Brake Assist', 'Panoramic Roof']),
      desc: 'Distinguished executive saloon combining German precision, athletic AMG aesthetics, and sumptuous leather ergonomics. Ideal for VIP arrivals and wedding hires.',
      image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 10,
      make: 'BMW',
      model: '520d Luxury Line',
      year: 2021,
      category: 'luxury',
      transmission: 'automatic',
      fuel_type: 'diesel',
      seating: 5,
      daily: 48000,
      weekly: 310000,
      deposit: 150000,
      status: 'available',
      reg: 'WP-CBC-7007',
      mileage: 22400,
      features: JSON.stringify(['BMW Live Cockpit Professional', 'Harman Kardon Sound', 'Dakota Leather', 'Soft-Close Doors', 'Adaptive LED Headlights']),
      desc: 'The pinnacle of executive luxury. Whisper-quiet cabin, dynamic twin-power turbo diesel delivery, and unmatched road poise for discerning international travelers.',
      image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80'
    }
  ];

  for (const v of vehicles) {
    insertVehicle.run(
      v.id, v.make, v.model, v.year, v.category, v.transmission, v.fuel_type,
      v.seating, v.daily, v.weekly, v.deposit, v.status, v.reg,
      v.mileage, v.features, v.desc, v.image
    );
  }

  // 3. Insert Vehicle Images for Gallery
  const insertImage = db.prepare(`
    INSERT INTO vehicle_images (vehicle_id, image_url, caption, display_order)
    VALUES (?, ?, ?, ?)
  `);

  insertImage.run(4, 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80', 'Front 3/4 Exterior View', 1);
  insertImage.run(4, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80', 'Cabin & Cockpit Dashboard', 2);
  insertImage.run(4, 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80', 'Luggage & Cargo Capacity', 3);

  insertImage.run(9, 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80', 'Front Profile AMG Grille', 1);
  insertImage.run(9, 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80', 'Dashboard MBUX Display', 2);

  // 4. Insert Seed Bookings (Active, Upcoming, Completed)
  const insertBooking = db.prepare(`
    INSERT INTO bookings (
      id, booking_reference, user_id, vehicle_id, pickup_date, return_date,
      pickup_location, return_location, total_days, daily_rate_applied,
      rental_cost_lkr, deposit_amount_lkr, total_amount_lkr, booking_status,
      payment_status, special_requests, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Booking 1: Upcoming confirmed booking for Kavishka (RAV4)
  insertBooking.run(
    1,
    'SDR-2026-8801',
    3,
    4,
    '2026-10-20',
    '2026-10-25',
    'Bandaranaike International Airport (CMB)',
    'Negombo Head Office (Lewis Place)',
    5,
    24000,
    120000,
    75000,
    195000,
    'confirmed',
    'paid',
    'Flight arrives at 14:30. Please prepare airport curbside handoff.',
    '2026-10-10 10:15:00'
  );

  // Booking 2: Active rental for John Smith (Toyota Axio)
  insertBooking.run(
    2,
    'SDR-2026-7742',
    4,
    2,
    '2026-10-14',
    '2026-10-18',
    'Negombo Head Office (Lewis Place)',
    'Negombo Head Office (Lewis Place)',
    4,
    11000,
    44000,
    35000,
    79000,
    'active',
    'paid',
    'Baby car seat requested and fitted.',
    '2026-10-12 14:00:00'
  );

  // Booking 3: Completed historical booking for Kavishka (Suzuki Wagon R)
  insertBooking.run(
    3,
    'SDR-2026-6190',
    3,
    3,
    '2026-09-01',
    '2026-09-04',
    'Negombo Head Office (Lewis Place)',
    'Negombo Head Office (Lewis Place)',
    3,
    8500,
    25500,
    30000,
    55500,
    'completed',
    'paid',
    'No special requirements.',
    '2026-08-25 09:30:00'
  );

  // 5. Insert Payments (Demonstrating verified test sandbox and bank records)
  const insertPayment = db.prepare(`
    INSERT INTO payments (
      booking_id, user_id, amount_lkr, payment_type, payment_method,
      transaction_reference, payment_status, gateway_response, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPayment.run(
    1,
    3,
    195000,
    'full',
    'card_sandbox',
    'PAY-TEST-8801-A91',
    'successful',
    JSON.stringify({ status: 'AUTHORIZED', gateway: 'Demo Sandbox Gateway', authCode: 'AUTH99201', cardLast4: '4242' }),
    '2026-10-10 10:20:00'
  );

  insertPayment.run(
    2,
    4,
    79000,
    'full',
    'card_sandbox',
    'PAY-TEST-7742-B83',
    'successful',
    JSON.stringify({ status: 'AUTHORIZED', gateway: 'Demo Sandbox Gateway', authCode: 'AUTH88319', cardLast4: '1111' }),
    '2026-10-12 14:05:00'
  );

  insertPayment.run(
    3,
    3,
    55500,
    'full',
    'bank_transfer_test',
    'TXN-BOC-551928',
    'successful',
    JSON.stringify({ bank: 'Bank of Ceylon', reference: 'REF-88201', verifiedByStaff: 'staff@swiftdrive.lk' }),
    '2026-08-25 10:00:00'
  );

  // 6. Insert Condition Report for Active and Completed Bookings
  const insertConditionReport = db.prepare(`
    INSERT INTO vehicle_condition_reports (
      booking_id, vehicle_id, staff_user_id, report_type, odometer_reading,
      fuel_level, exterior_condition, interior_condition, damage_notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Active rental pickup inspection
  insertConditionReport.run(
    2,
    2,
    2,
    'pickup',
    48100,
    'full',
    'Clean exterior, minor 2cm stone chip on passenger side door sill.',
    'Spotless fabric interior, clean mats, toolkit and spare tyre checked.',
    'Pre-existing minor stone chip noted on inspection sheet.',
    '2026-10-14 09:00:00'
  );

  // Completed rental pickup and return inspections
  insertConditionReport.run(
    3,
    3,
    2,
    'pickup',
    28950,
    'full',
    'Excellent condition, no scratches.',
    'Vacuumed clean, fragrance fresh.',
    'None.',
    '2026-09-01 09:00:00'
  );

  insertConditionReport.run(
    3,
    3,
    2,
    'return',
    29500,
    'full',
    'Returned in pristine clean state.',
    'Clean interior, all tools intact.',
    'Full deposit refunded to customer upon clean vehicle return.',
    '2026-09-04 16:30:00'
  );

  // 7. Insert Genuine Reviews
  const insertReview = db.prepare(`
    INSERT INTO reviews (user_id, vehicle_id, booking_id, rating, comment, is_featured, is_approved, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertReview.run(
    3,
    3,
    3,
    5,
    'Exceptional service from SwiftDrive Rentals! The Wagon R was handed over spotless at the Negombo Lewis Place office. Very transparent deposit handling and zero hidden fees.',
    1,
    1,
    '2026-09-05 11:00:00'
  );

  insertReview.run(
    4,
    4,
    null,
    5,
    'Rented from SwiftDrive on our Sri Lanka holiday. Airport pickup at Bandaranaike CMB was seamless and our RAV4 handled the hill country bends effortlessly. Highly recommended!',
    1,
    1,
    '2026-09-18 15:45:00'
  );

  insertReview.run(
    3,
    2,
    null,
    4,
    'Very smooth Toyota Axio hybrid. Saved a huge amount on fuel travelling around Colombo and Kalutara. Booking on this portal was fast and dependable.',
    1,
    1,
    '2026-09-28 08:30:00'
  );

  // 8. Insert Inquiries
  const insertInquiry = db.prepare(`
    INSERT INTO rental_inquiries (
      full_name, email, phone, subject, message, vehicle_id, status, response_notes, assigned_to_user_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertInquiry.run(
    'David Miller',
    'david.miller@example.com',
    '+61 400 123 456',
    'Airport Handover at 3:00 AM',
    'Hello SwiftDrive team, my flight arrives at Bandaranaike Airport in the early hours of the morning. Do you accommodate 3:00 AM curbside handovers?',
    7,
    'in_progress',
    'Confirmed 24/7 airport delivery is available with prior flight number registration.',
    2,
    '2026-10-13 18:20:00'
  );

  insertInquiry.run(
    'Dilani Jayasuriya',
    'dilani.j@example.com',
    '+94 77 999 8877',
    'Long-Term Monthly Hire for SUV',
    'Looking for a 3-month rental on the Toyota RAV4 for a corporate project in Katunayake Free Trade Zone. Could you provide a customized corporate tariff?',
    4,
    'new',
    null,
    null,
    '2026-10-14 11:15:00'
  );

  // 9. Insert Blog Posts (Sri Lanka Road Trips & Driving Guides)
  const insertBlog = db.prepare(`
    INSERT INTO blog_posts (
      title, slug, excerpt, content, cover_image, category, author_name, read_time_minutes, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertBlog.run(
    'Driving from Negombo to Sigiriya: The Ultimate Cultural Triangle Road Trip',
    'driving-negombo-to-sigiriya-guide',
    'Essential navigation advice, scenic tea stops, and vehicle recommendations for the scenic journey from Negombo to ancient Sigiriya Rock Fortress.',
    `# Driving from Negombo to Sigiriya: Complete Route Guide\n\nStarting your Sri Lankan adventure directly from Negombo provides a stress-free launchpad, avoiding the heavy urban congestion of central Colombo. At just under 150 km, the route towards Sigiriya takes approximately 3.5 to 4 hours across the A6 highway.\n\n### Recommended Route\nTake the Kurunegala road through Giriulla. The road surface is well-paved, passing lush coconut plantations and roadside king coconut stalls.\n\n### Vehicle Choice\nFor couples or solo drivers, the **Toyota Axio Hybrid** provides unmatched fuel economy. For families carrying luggage or planning excursions onto gravel tracks around Dambulla caves, an SUV such as the **Toyota RAV4 AWD** provides comfortable ride height and reassurance.\n\n### Essential Driving Tips\n1. Overtake with caution and always yield to state buses.\n2. Carry cash for expressway tolls and local fruit stands.\n3. Make an early morning start (around 6:00 AM) to arrive in Sigiriya before midday heat.`,
    'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=800&q=80',
    'Road Trips',
    'SwiftDrive Travel Desk',
    6,
    '2026-10-01'
  );

  insertBlog.run(
    'Top 5 Scenic Coastal Drives Starting from Negombo Beach Road',
    'top-5-scenic-coastal-drives-negombo',
    'Explore sun-drenched coastal routes, historic Dutch canals, and seafood harbors along Sri Lanka’s golden western coast.',
    `# Top 5 Coastal Drives from Negombo\n\nNegombo’s unique geography—flanked by the Indian Ocean on the west and the biodiverse Negombo Lagoon on the east—makes it an extraordinary base for automotive day trips.\n\n### 1. Hamilton Canal & Pamunugama Coastline\nA leisurely 25-kilometer drive running parallel to the Dutch canal and tranquil beach villages.\n\n### 2. Kalpitiya Peninsula Explorer\nHead north through Chilaw towards the kite-surfing capital of Kalpitiya. Spacious vans like our **Toyota KDH Commuter** are ideal for transporting sports gear and beach camping supplies.\n\n### 3. Colombo Port City via Central Expressway\nExperience modern Sri Lankan engineering on the elevated highway network, delivering you to Colombo Fort and Galle Face Green in under 35 minutes from Negombo.\n\nAlways check tyre pressures before extended highway journeys and keep emergency contact numbers saved in your phone.`,
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    'Travel Guides',
    'SwiftDrive Travel Desk',
    4,
    '2026-10-05'
  );

  // 10. Insert Audit Logs
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, details, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run(
    1,
    'admin@swiftdrive.lk',
    'FLEET_SEED_INITIALIZED',
    'SYSTEM',
    '0',
    'Initialised 10 fleet vehicles and verified default tariff configuration for Negombo branch.',
    '127.0.0.1',
    '2026-10-14 12:00:00'
  );

  insertAudit.run(
    2,
    'staff@swiftdrive.lk',
    'BOOKING_INSPECTION_RECORDED',
    'VEHICLE_CONDITION',
    '1',
    'Recorded pick-up inspection report for booking SDR-2026-7742 (Toyota Axio).',
    '127.0.0.1',
    '2026-10-14 09:05:00'
  );

  console.log('✓ Seed completed successfully:');
  console.log('  - 4 Users (Admin, Staff, 2 Customers)');
  console.log('  - 10 Vehicles across Economy, SUV, Van, Luxury');
  console.log('  - 3 Bookings with genuine date ranges and statuses');
  console.log('  - 3 Audited Payments');
  console.log('  - 3 Condition Reports (Pick-up & Return inspections)');
  console.log('  - 3 Customer Reviews');
  console.log('  - 2 Rental Inquiries');
  console.log('  - 2 Road-trip Blog Posts');
  console.log('  - 2 Audit Log entries');
}

// Execute seed if run directly
if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase();
}
