import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Log environment variables for debugging
console.log('Checking Supabase environment variables...');
console.log('VITE_SUPABASE_URL exists:', !!import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

// Use environment variables directly
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback values for development (you should replace these with your actual values)
if (!SUPABASE_URL) {
  console.error('VITE_SUPABASE_URL is not set');
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!SUPABASE_ANON_KEY) {
  console.error('VITE_SUPABASE_ANON_KEY is not set');
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

console.log('Supabase URL:', SUPABASE_URL);

// Validate URL format
try {
  new URL(SUPABASE_URL);
} catch (e) {
  console.error('Invalid Supabase URL format:', SUPABASE_URL);
  throw new Error('Invalid Supabase URL format');
}

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);