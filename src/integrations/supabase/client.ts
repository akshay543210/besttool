import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use environment variables - Vite uses import.meta.env
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase environment variables:', {
  url: SUPABASE_URL ? 'URL present' : 'URL missing',
  key: SUPABASE_PUBLISHABLE_KEY ? 'Key present' : 'Key missing'
});

// Validate that we have the required environment variables
if (!SUPABASE_URL) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
  throw new Error('Missing Supabase URL. Please check your environment variables.');
}

if (!SUPABASE_PUBLISHABLE_KEY) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
  throw new Error('Missing Supabase Anon Key. Please check your environment variables.');
}

// Validate URL format
try {
  new URL(SUPABASE_URL);
} catch (e) {
  console.error('Invalid Supabase URL format:', SUPABASE_URL);
  throw new Error('Invalid Supabase URL format. Please check your VITE_SUPABASE_URL environment variable.');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});