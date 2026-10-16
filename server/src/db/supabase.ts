import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ufogqgdrzmoptvfuidxh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

if (SUPABASE_KEY) {
  supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  console.log(`📡 Supabase client initialized for project: ${SUPABASE_URL}`);
} else {
  console.log(`ℹ️ Supabase URL configured (${SUPABASE_URL}), awaiting SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY in server/.env`);
}

export const supabase = supabaseInstance;
export const isSupabaseConfigured = (): boolean => !!supabaseInstance;
export default supabase;
