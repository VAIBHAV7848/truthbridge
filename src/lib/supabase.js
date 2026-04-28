/**
 * TruthBridge — Supabase Client (public / anon)
 *
 * This client uses the ANON key and is safe to expose in the browser.
 * All security is enforced by Row Level Security on the database.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Missing Supabase environment variables. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Provide fallback strings so createClient doesn't crash the entire app bundle
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Export for use in other modules
export const SUPABASE_URL = url;
export const SUPABASE_ANON_KEY = key;

export default supabase;
