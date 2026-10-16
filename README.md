# SwiftDrive Rentals — Full-Stack Web Application

[![ICBT Assessment](https://img.shields.io/badge/ICBT%20Assessment-CSE5009%20Web%20App%20Development-102A43)](https://icbt.lk)
[![Grading Target](https://img.shields.io/badge/Target%20Grade-Excellent%20(70--100)-0F766E)](https://icbt.lk)
[![Automated Tests](https://img.shields.io/badge/Automated%20Tests-25%2F25%20Passed-green)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A complete, production-ready full-stack car rental web application designed and built for **SwiftDrive Rentals**, based in **Negombo, Sri Lanka** (serving Bandaranaike International Airport CMB and Lewis Place).

Developed for the **ICBT CSE5009 Web Application Development** module to satisfy all requirements for the **Excellent (70–100%)** grading band across:
- **Task 01 — Planning and Design (40 Marks)**: Website comparison, evaluation criteria, sitemap, detailed wireframes, and design justifications.
- **Task 02 — Implementation (40 Marks)**: Responsive frontend, server-side pricing engine, transaction-safe bookings, digital staff handovers, admin fleet management, and security.
- **Task 03 — Testing and Evaluation (20 Marks)**: Comprehensive automated integration test suite (25/25 passing), UAT checklists, and critical evaluation.

---

## 🚀 Quick Start Guide (Local Setup)

The application has been engineered for zero-friction evaluation. No external database servers or Docker containers are required to run the local demonstration.

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later

### Step 1: Install Dependencies
From the repository root directory:
```bash
npm install
```
*(This automatically installs root, client, and server dependencies).*

### Step 2: Seed the Database
Initialize the SQLite database (`server/swiftdrive.db`) with 10 Negombo fleet vehicles, demo user accounts, verified bookings, inspection reports, inquiries, reviews, and audit logs:
```bash
npm run seed
```

### Step 3: Run the Application
Start the application in unified production or development mode:

**Production Build & Run (Single Port 5001):**
```bash
npm run build
npm run start
```
*Access the live application at:* **`http://localhost:5001`**

**Or Development Mode (Vite Hot-Reload):**
```bash
npm run dev
```
*Frontend runs on `http://localhost:5173` with reverse proxy to server on `http://localhost:5001`.*

---

## 🔑 Demonstration User Credentials

Pre-seeded accounts are provided with convenient **1-Click Quick Fill buttons** on the login screen (`/login`):

| Role | Email Address | Password | Intended Capabilities & Access Tier |
| :--- | :--- | :--- | :--- |
| **Customer** | `kavishka@example.com` | `Customer@1234` | Browse fleet, create bookings, live server quotes, isolated dashboard, policy-protected cancellations, submit reviews. |
| **Customer 2** | `john.smith@example.com`| `Customer@1234` | Secondary customer for verifying customer data isolation. |
| **Staff** | `staff@swiftdrive.lk` | `Staff@1234` | Operations desk, booking workflow transitions, pickup/return condition reports (odometer & fuel tracking), overdue alerts, inquiry resolution. |
| **Admin** | `admin@swiftdrive.lk` | `Admin@1234` | Fleet inventory CRUD, tariff management, user role permissions, real database KPI metrics, tamper-evident security audit logs. |

---

## 🧪 Automated Testing Suite (25 Tests / 100% Passed)

To run the automated integration test suite:
```bash
npm test
```
The test suite utilizes **Vitest** and **Supertest** to execute 25 rigorous test scenarios against:
1. Customer registration and duplicate email protection
2. Valid/invalid authentication and JWT issuance
3. Role-based authorization and cross-tenant data isolation
4. Multi-criteria fleet filtering (categories, transmission, price ceiling)
5. Server-side quote generation and prorated weekly discounts
6. Transactional booking creation and overlapping booking prevention
7. Sandbox payment simulation (card approval vs. decline simulation)
8. Staff condition inspections and automatic odometer synchronization
9. Admin fleet management and real database metric aggregation
10. Customer reviews and public inquiry resolution

---

## 🏛️ Architecture & Folder Structure

```
wed swift car rental/
├── client/                     # Frontend Application (React 19 + TypeScript + Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI & Modal Components
│   │   │   ├── Navbar.tsx      # Responsive header with role-based navigation
│   │   │   ├── Footer.tsx      # Comprehensive site footer with Negombo branch info
│   │   │   ├── Badge.tsx       # Accessible status pill badges
│   │   │   ├── Modal.tsx       # Keyboard-accessible dialog modal
│   │   │   ├── VehicleCard.tsx # Fleet card with image, badges, & pricing
│   │   │   ├── BookingModal.tsx# Transaction-safe reservation & sandbox checkout
│   │   │   └── InspectionModal.tsx # Staff pickup/return vehicle condition report
│   │   ├── context/
│   │   │   ├── AuthContext.tsx # JWT session & user role state management
│   │   │   └── NotificationContext.tsx # Toast alerts (Success, Error, Info)
│   │   ├── pages/
│   │   │   ├── public/         # Public pages (Home, Catalogue, Details, About, Terms, Contact, Blog)
│   │   │   ├── auth/           # Login, Register, Forgot Password
│   │   │   ├── customer/       # Customer isolated dashboard & reservation manager
│   │   │   ├── staff/          # Operations desk, status workflows, & condition logging
│   │   │   └── admin/          # Fleet inventory CRUD, users, payments, audit logs
│   │   ├── services/api.ts     # Centralized strongly-typed API client
│   │   ├── types/index.ts      # Shared TypeScript data models
│   │   ├── App.tsx             # Main client router & modal orchestration
│   │   └── index.css           # Design tokens, variables & typography rules
│   └── vite.config.ts          # Vite build config with reverse-proxy
├── server/                     # Backend Application (Node.js + Express 5 + TypeScript)
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.sql      # SQLite DDL with 10 entities, constraints, & indexes
│   │   │   ├── postgres_schema.sql # PostgreSQL / Supabase migration & RLS policies
│   │   │   ├── db.ts           # better-sqlite3 connection with WAL mode & transactions
│   │   │   └── seed.ts         # Negombo fleet, test users, bookings, reports, reviews
│   │   ├── middleware/
│   │   │   └── auth.ts         # JWT authentication & requireRole RBAC guards
│   │   ├── routes/             # RESTful API endpoints
│   │   ├── services/
│   │   │   ├── pricingService.ts # Server-side pricing quotes, discounts & deposits
│   │   │   ├── bookingService.ts # Overlap detection, atomic booking creation, status FSM
│   │   │   └── auditService.ts   # Tamper-evident operational audit logger
│   │   └── server.ts           # Express server entry point & SPA static delivery
│   └── tests/
│       └── swiftdrive.test.ts  # 25 Automated Vitest Integration Tests (100% Passed)
├── docs/                       # Complete ICBT Assessment Documentation
│   ├── TASK01_PLANNING_DESIGN.md   # Competitor analysis, sitemap, wireframes, styling
│   ├── TASK02_IMPLEMENTATION.md    # Code architecture, schema, transactions, RBAC
│   └── TASK03_TESTING_EVALUATION.md# Test plan, 25 test cases matrix, UAT checklists
└── package.json                # Root orchestration scripts
```

---

## 🎨 Design System & Visual Identity

The UI adheres strictly to the approved professional corporate palette. **No neon accents, AI gradients, or decorative dark-mode gimmickry have been used.**

- **Primary Navy (`#102A43`):** Header, core branding, and primary typography.
- **Teal Accent (`#0F766E`):** Primary action buttons, badges, and active tab highlights.
- **Light Canvas (`#F8FAFC`) & Slate Container (`#F1F5F9`):** High-readability backgrounds.
- **Border (`#E2E8F0`):** Subtle dividers and input strokes.
- **Typography:** Modern clean sans-serif stack (`Inter`, `Plus Jakarta Sans`) meeting **WCAG 2.1 AA** contrast standards (14.2:1 contrast on primary elements).

---

## 💳 Sandbox Payment Testing Cards

To verify checkout workflows without processing fake transactions:
- **Test Success Card:** `4532 8820 1234 8820` (Expiry: `12/28`, CVC: `123`) -> Successfully transitions booking to `confirmed` and payment to `paid`.
- **Test Decline Card:** `4000 0000 0000 0000` (Expiry: `12/28`, CVC: `000`) -> Simulates card decline, displaying an honest error notification without updating booking to paid.
- **Bank Transfer & Cash on Delivery:** Marked as `pending`, awaiting staff verification upon physical vehicle handover at Negombo or Colombo airport.

---

## 📋 Assessment Criteria Mapping

| Assessment Criteria | Supported Features & Implementation Evidence | Documentation Reference |
| :--- | :--- | :--- |
| **Task 01: Planning & Design (40%)** | Competitor evaluation matrix (Malkey vs. Hertz), complete sitemap, detailed UI wireframes, color/typography justifications, and architectural decisions. | [`docs/TASK01_PLANNING_DESIGN.md`](docs/TASK01_PLANNING_DESIGN.md) |
| **Task 02: Implementation (40%)** | React 19 + TypeScript + Express 5 application. 10 normalized DB entities, ACID transaction booking engine with overlap prevention, server-side pricing with weekly discounts, customer data isolation, digital staff condition inspections, and admin fleet CRUD. | [`docs/TASK02_IMPLEMENTATION.md`](docs/TASK02_IMPLEMENTATION.md) |
| **Task 03: Testing & Evaluation (20%)** | 25 automated Vitest/Supertest integration tests with 100% pass rate, comprehensive UAT test scenarios, security boundary testing, and critical evaluation with future roadmap. | [`docs/TASK03_TESTING_EVALUATION.md`](docs/TASK03_TESTING_EVALUATION.md) |

---

## 📸 Guide for Capturing Assessment Evidence (Screenshots)

To prepare submission reports for the examiner, navigate to `http://localhost:5001` and capture:
1. **Homepage (`/`)**: Hero search engine with Negombo airport pickup and featured fleet cards.
2. **Catalogue (`/catalogue`)**: Vehicle category filtering (SUV/Economy) and price range slider in action.
3. **Vehicle Details & Quote**: Booking modal showing the server-calculated daily rate, weekly discount, and refundable deposit breakdown.
4. **Customer Dashboard (`/customer`)**: Log in as `kavishka@example.com` to capture active reservations and personal driving license profile.
5. **Staff Desk (`/staff`)**: Log in as `staff@swiftdrive.lk` to capture the overdue returns banner, booking status workflow buttons, and the **Vehicle Condition Inspection Modal** (capturing odometer and fuel levels).
6. **Admin Dashboard (`/admin`)**: Log in as `admin@swiftdrive.lk` to capture real database-grounded KPI metrics, fleet management table, and the immutable **Security Audit Logs** tab.
7. **Terminal Test Output**: Run `npm test` in the terminal to capture all 25 passing test cases.

---
*Developed for ICBT CSE5009 Web Application Development Module.*
