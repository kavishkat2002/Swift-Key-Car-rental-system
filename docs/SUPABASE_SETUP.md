# SwiftDrive Rentals — Supabase Database Integration Guide

**Supabase Project URL:** `https://ufogqgdrzmoptvfuidxh.supabase.co`  
**Project Reference ID:** `ufogqgdrzmoptvfuidxh`  
**Status:** Integrated & Configured in both Server & Client

---

## 1. What Has Been Configured in Your Codebase

1. **Installed Official SDK:** Installed `@supabase/supabase-js` in both `/server` and `/client`.
2. **Server Client Module (`server/src/db/supabase.ts`):** Pre-configured with your project URL (`https://ufogqgdrzmoptvfuidxh.supabase.co`) and environment variable bindings.
3. **Frontend Client Module (`client/src/services/supabase.ts`):** Pre-configured with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. **Environment Files:**
   - `server/.env` and `server/.env.example` pre-populated with your Supabase URL.
   - `client/.env` and `client/.env.example` pre-populated with your Supabase URL.
5. **Turnkey SQL Migration & Seed Script (`server/src/db/supabase_complete_setup.sql`):**
   - Creates all **10 normalized tables** (`users`, `vehicles`, `vehicle_images`, `bookings`, `payments`, `rental_inquiries`, `reviews`, `vehicle_condition_reports`, `blog_posts`, `audit_logs`).
   - Configures **Row Level Security (RLS)** policies.
   - Seeds all **10 Negombo fleet vehicles**, demo user accounts, verified bookings, inspection reports, inquiries, reviews, and blog posts.
6. **Sync & Verification CLI Script (`server/src/db/syncToSupabase.ts`):**
   - Executable via `npm run sync:supabase` to test connection and verify live tables.

---

## 2. Step-by-Step Instructions to Activate Your Supabase Database

### Step A: Run the Database Migration in Supabase (1 Minute)
1. Open your Supabase Dashboard SQL Editor for this project:
   👉 **[Supabase SQL Editor](https://supabase.com/dashboard/project/ufogqgdrzmoptvfuidxh/sql)**
2. Click **"New Query"**.
3. Open the file [`server/src/db/supabase_complete_setup.sql`](file:///Users/kavishkathilakarathna/Desktop/icbt%20assesment/wed%20swift%20car%20rental/server/src/db/supabase_complete_setup.sql) in this repository.
4. Copy all contents and paste into the Supabase SQL Editor.
5. Click **"Run"** (or press `Cmd + Enter`).
6. Supabase will execute the script, creating all 10 tables, indexes, RLS policies, and inserting all seed fleet data!

### Step B: Add Your API Keys to `server/.env` and `client/.env`
1. Go to your Supabase Project API Settings:
   👉 **[Supabase API Settings](https://supabase.com/dashboard/project/ufogqgdrzmoptvfuidxh/settings/api)**
2. Copy the **`anon` `public`** key and paste it into:
   - `server/.env`: `SUPABASE_ANON_KEY=your_anon_key`
   - `client/.env`: `VITE_SUPABASE_ANON_KEY=your_anon_key`
3. Copy the **`service_role` `secret`** key and paste it into:
   - `server/.env`: `SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`

### Step C: Test the Connection
Run the following terminal command from the project root:
```bash
npm run sync:supabase
```
You will see:
```
✅ Successfully connected to Supabase! Found 5 vehicles in live database.
```

---

## 3. Direct PostgreSQL Connection (Optional)

If you wish to connect directly using a PostgreSQL client (e.g. DBeaver, pgAdmin, Prisma, or `psql`), your connection URI is:
```
postgresql://postgres:[YOUR-PASSWORD]@db.ufogqgdrzmoptvfuidxh.supabase.co:5432/postgres
```
*(Replace `[YOUR-PASSWORD]` with the database password set when creating the Supabase project).*
