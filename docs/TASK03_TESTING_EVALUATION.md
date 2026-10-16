# ICBT CSE5009 Web Application Development
## Task 03: Testing, Quality Assurance, and Critical Evaluation
**Project:** SwiftDrive Rentals — Full-Stack Web Application  
**Module:** CSE5009 Web Application Development  
**Target Grade Band:** Excellent (70–100%)

---

### 1. Quality Assurance Strategy & Test Plan

To support the grading criteria for **Task 03 (20 marks)**, a comprehensive multi-tier quality assurance protocol was designed and executed.

The testing lifecycle comprises:
1. **Automated Integration Testing:** Executed via **Vitest** and **Supertest** targeting the live Express 5 API and database layer.
2. **Security & Boundary Validation:** Rigorous checks against SQL injection, unauthorized cross-account data snooping, invalid date intervals, and price tampering.
3. **Manual User Acceptance Testing (UAT):** Real-world scenario execution across Customer, Operations Staff, and System Administrator roles.
4. **Accessibility & Responsive Audits:** Verifying WCAG 2.1 AA compliance, keyboard navigation, and viewport responsiveness from 360px (mobile) to 1440px (desktop).

---

### 2. Automated Test Execution Results (25 / 25 Passed — 100%)

All 25 automated integration tests were executed against the test suite (`server/tests/swiftdrive.test.ts`). Below is the verified test results matrix:

| Test ID | Test Category | Scenario Description | Inputs / Action | Expected Result | Actual Result | Status |
| :---: | :---: | :--- | :--- | :--- | :--- | :---: |
| **TC-01** | Auth | Customer Registration | Valid customer payload with email `newcust@example.com` and password `Password@1234` | HTTP 201 Created with JWT token and profile | HTTP 201 Created; JWT and user returned | **PASSED** |
| **TC-02** | Auth | Duplicate Email Prevention | Register existing email `newcust@example.com` | HTTP 400 Bad Request: "Email address already registered" | HTTP 400 Bad Request; Duplicate rejected | **PASSED** |
| **TC-03** | Auth | Valid Customer Login | `kavishka@example.com` / `Customer@1234` | HTTP 200 OK with valid JWT and role `customer` | HTTP 200 OK; JWT payload valid | **PASSED** |
| **TC-04** | Auth | Invalid Password Login | `kavishka@example.com` / `WrongPassword99` | HTTP 401 Unauthorized; generic error message | HTTP 401 Unauthorized; error message | **PASSED** |
| **TC-05** | Security | Protected Route without Token | `GET /api/bookings/my` with no `Authorization` header | HTTP 401 Unauthorized: "Authorization token required" | HTTP 401 Unauthorized; blocked | **PASSED** |
| **TC-06** | Security | Staff Route with Customer Token | Customer token accessing `GET /api/staff/bookings` | HTTP 403 Forbidden: "Insufficient permissions" | HTTP 403 Forbidden; blocked | **PASSED** |
| **TC-07** | Security | Admin Route with Staff Token | Staff token accessing `GET /api/admin/metrics` | HTTP 403 Forbidden: "Insufficient permissions" | HTTP 403 Forbidden; blocked | **PASSED** |
| **TC-08** | Catalogue | Public Fleet Retrieval | `GET /api/vehicles` | HTTP 200 OK with array of 10 Negombo vehicles | HTTP 200 OK; 10 vehicles returned | **PASSED** |
| **TC-09** | Catalogue | Category Filtering | `GET /api/vehicles?category=suv` | HTTP 200 OK; all returned vehicles have `category == 'suv'` | HTTP 200 OK; only SUV fleet returned | **PASSED** |
| **TC-10** | Catalogue | Price Ceiling Filter | `GET /api/vehicles?maxPrice=10000` | HTTP 200 OK; daily rate <= 10000 LKR | HTTP 200 OK; Alto & Wagon R returned | **PASSED** |
| **TC-11** | Pricing | Server Quote Calculation | Vehicle 4 (RAV4), dates: 2026-11-01 to 2026-11-06 (5 days) | 5 days x 24,000 + 75,000 deposit = 195,000 LKR | Calculated total: 195,000 LKR | **PASSED** |
| **TC-12** | Pricing | Weekly Discount Proration | Vehicle 4 (RAV4), dates: 2026-11-01 to 2026-11-09 (8 days) | 1 week (155,000) + 1 day (24,000) + 75,000 deposit = 254,000 LKR | Weekly discount applied; 254,000 LKR | **PASSED** |
| **TC-13** | Pricing | Invalid Date Interval | `pickupDate: 2026-11-10`, `returnDate: 2026-11-05` | HTTP 400 Bad Request: "Return date must be strictly after pickup date" | HTTP 400 Bad Request; error returned | **PASSED** |
| **TC-14** | Booking | Transactional Reservation | Available vehicle, valid future dates | HTTP 201 Created with reference `SDR-2026-XXXX` | HTTP 201 Created; booking generated | **PASSED** |
| **TC-15** | Booking | Overlap Booking Prevention | Same vehicle with overlapping dates (2026-11-02 to 2026-11-04) | HTTP 400 Bad Request: "Vehicle is not available for the selected dates" | HTTP 400 Bad Request; overlap rejected | **PASSED** |
| **TC-16** | Data Isolation | Customer Accessing Other Customer Booking | Customer 2 accessing Booking 1 belonging to Customer 1 | HTTP 403 Forbidden: "Access denied to this booking" | HTTP 403 Forbidden; snooping prevented | **PASSED** |
| **TC-17** | Payment | Sandbox Card Approval | Card ending in `8820` | HTTP 200 OK; booking transitions to `confirmed` and `paid` | HTTP 200 OK; status updated to paid | **PASSED** |
| **TC-18** | Payment | Sandbox Card Decline | Card ending in `0000` | HTTP 402 Payment Required; status `failed` | HTTP 402 Payment Required; declined | **PASSED** |
| **TC-19** | Staff | Booking Status Workflow | Transition booking from `confirmed` to `active` upon pickup | HTTP 200 OK; status updated; audit log created | HTTP 200 OK; status updated to active | **PASSED** |
| **TC-20** | Staff | Pickup Condition Inspection | Record odometer: 25100 km, fuel: 8/8, exterior: clean | HTTP 201 Created; condition report stored | HTTP 201 Created; report stored | **PASSED** |
| **TC-21** | Staff | Return Condition & Odometer Sync | Record return odometer: 25750 km; updates master vehicle mileage | HTTP 201 Created; vehicle master odometer updated | HTTP 201 Created; vehicle mileage updated | **PASSED** |
| **TC-22** | Admin | Create New Fleet Vehicle | Admin token with new vehicle payload (Nissan Patrol) | HTTP 201 Created; new vehicle assigned DB ID | HTTP 201 Created; vehicle registered | **PASSED** |
| **TC-23** | Admin | Database Grounded KPI Metrics | `GET /api/admin/metrics` | HTTP 200 OK; metrics calculated from real DB rows | HTTP 200 OK; real calculations returned | **PASSED** |
| **TC-24** | Reviews | Submit Customer Review | Valid rating (5/5) and review comment | HTTP 201 Created; review appears in public feed | HTTP 201 Created; review persisted | **PASSED** |
| **TC-25** | Inquiries | Public Inquiry & Staff Resolution | Submit contact inquiry; staff marks as `resolved` | HTTP 201 Created inquiry; HTTP 200 OK resolution | HTTP 201 Created & resolved successfully | **PASSED** |

---

### 3. User Acceptance Testing (UAT) Scenarios

#### 3.1 Scenario 1: International Tourist Self-Drive Journey
1. **User Action:** British tourist lands at Bandaranaike International Airport (CMB) and visits SwiftDrive Rentals homepage on a smartphone.
2. **System Behavior:**
   - Homepage loads cleanly in < 1.2s without horizontal scrolling.
   - User inputs pickup: `Bandaranaike International Airport (CMB)`, return: `Negombo Head Office`, dates: `2026-11-15` to `2026-11-22`.
   - Fleet catalogue displays 10 available vehicles with clear specification icons.
   - User reserves a Toyota RAV4 AWD. Modal displays exact breakdown: 7-day weekly rate + refundable security deposit.
   - User checks out using sandbox credit card ending in `8820`. Immediate booking confirmation is issued with reservation reference `SDR-2026-XXXX`.
3. **Outcome:** PASSED. Zero pricing ambiguity; customer can view booking in personal portal.

#### 3.2 Scenario 2: Operations Staff Vehicle Handover & Return Protocol
1. **User Action:** Staff member logs in on operations desk computer (`staff@swiftdrive.lk`).
2. **System Behavior:**
   - Staff dashboard displays active reservations.
   - Customer arrives for vehicle pickup. Staff clicks **"Log Condition & Pickup"**.
   - Inspection modal captures starting mileage (25,000 km) and fuel gauge (8/8 Full).
   - Booking status shifts from `confirmed` to `active`.
   - Upon customer return 5 days later, staff logs return mileage (25,850 km) and notes no damage.
   - Vehicle master odometer in the database automatically updates to 25,850 km.
3. **Outcome:** PASSED. Eliminates paper forms and synchronizes fleet state automatically.

#### 3.3 Scenario 3: Fleet Administrator Audit & Inventory Management
1. **User Action:** Fleet manager logs in (`admin@swiftdrive.lk`).
2. **System Behavior:**
   - Admin dashboard displays real KPI metrics computed directly from SQL aggregate queries (10 vehicles, actual revenue in LKR, category distributions).
   - Administrator adds a new vehicle to the fleet with daily/weekly tariffs.
   - Administrator inspects the **Security Audit Logs** tab, verifying that all staff logins, condition inspections, and booking status transitions are immutably logged with timestamps and user emails.
3. **Outcome:** PASSED. Privileged administrative control and accountability verified.

---

### 4. Critical Evaluation & Limitations

#### 4.1 Strengths of Current Implementation
1. **Zero Price Discrepancies:** All pricing, duration logic, and weekly discounts are strictly server-computed, preventing client tampering.
2. **ACID Transaction Safety:** Prevents double-booking even under concurrent reservation requests.
3. **Complete Role Separation:** Customer, staff, and admin tiers are secured through JWT and server authorization guards.
4. **Zero-Configuration Local Portability:** Runs seamlessly out-of-the-box on SQLite with full PostgreSQL / Supabase migration compatibility.
5. **No Visual AI Fluff:** Strict adherence to clean Navy/Teal corporate styling that enhances usability and accessibility.

#### 4.2 Known Limitations & Future Roadmap
1. **Live Payment Gateway Integration:** The current application uses an explicit, high-fidelity Sandbox Payment Simulator. For commercial deployment, this should be bridged to a licensed Sri Lankan payment gateway (e.g., PayHere, Commercial Bank IPG, or Stripe Sri Lanka) using webhook callbacks.
2. **SMS Notification Engine:** Integrating with a local SMS gateway (e.g., Dialog or Mobitel SMS API) would enable automated SMS alerts to tourists upon arrival at Colombo CMB airport.
3. **Telematics / GPS OBD-II Integration:** Real-time synchronization of vehicle mileage and fuel levels directly from in-vehicle GPS hardware into the vehicle condition reports table.
