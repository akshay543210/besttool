import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Try to get environment variables
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

console.log('Environment variables check:');
console.log('- VITE_SUPABASE_URL exists:', !!import.meta.env?.VITE_SUPABASE_URL);
console.log('- VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env?.VITE_SUPABASE_ANON_KEY);

// If we don't have the environment variables, we'll use fallback values
// NOTE: These are placeholder values - you should replace them with your actual Supabase credentials
const FALLBACK_SUPABASE_URL = 'https://dpffcwwqdstwtetubita.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwZmZjd3dxZHN0d3RldHViaXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMTIzMDQsImV4cCI6MjA2Njc4ODMwNH0.Co_4a37eK1KqFs9OnBDpaFxavs51ooymxJqERmog7tA';

// Use fallback values if environment variables are not set
const url = SUPABASE_URL || FALLBACK_SUPABASE_URL;
const key = SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

console.log('Using Supabase URL:', url);

// Validate URL format
try {
  new URL(url);
} catch (e) {
  console.error('Invalid Supabase URL format:', url);
  throw new Error('Invalid Supabase URL format');
}

export const supabase = createClient<Database>(
  url,
  key,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);