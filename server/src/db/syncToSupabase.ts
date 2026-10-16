import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ufogqgdrzmoptvfuidxh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

async function sync() {
  console.log('=======================================================');
  console.log('🚗 SwiftDrive Rentals — Supabase Synchronization Engine');
  console.log(`📍 Target Project: ${SUPABASE_URL}`);
  console.log('=======================================================');

  if (!SUPABASE_KEY) {
    console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is not defined in server/.env');
    console.log('\n👉 Instructions to complete configuration:');
    console.log('1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/ufogqgdrzmoptvfuidxh/settings/api');
    console.log('2. Copy your "service_role" secret key (or "anon" public key).');
    console.log('3. Paste it into server/.env:');
    console.log('   SUPABASE_SERVICE_ROLE_KEY=eyJh...');
    console.log('4. Re-run: npm --prefix server run sync:supabase');
    console.log('\n💡 Alternatively, run the complete turnkey SQL script in Supabase SQL Editor:');
    console.log('   server/src/db/supabase_complete_setup.sql');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('🔄 Checking connection to Supabase...');
  const { data, error } = await supabase.from('vehicles').select('id, make, model').limit(5);

  if (error) {
    console.error('⚠️ Supabase returned an error:', error.message);
    if (error.message.includes('relation "vehicles" does not exist') || error.code === '42P01') {
      console.log('\n👉 Tables have not been created yet in Supabase.');
      console.log('Please execute server/src/db/supabase_complete_setup.sql in the Supabase SQL Editor:');
      console.log('https://supabase.com/dashboard/project/ufogqgdrzmoptvfuidxh/sql');
    }
  } else {
    console.log(`✅ Successfully connected to Supabase! Found ${data.length} vehicles in live database.`);
    console.log(data);
  }
}

sync().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
