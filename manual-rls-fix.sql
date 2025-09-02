-- MANUAL RLS FIX FOR SUPABASE STORAGE
-- Copy and paste this into your Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/notyhakhjrmzhnnjbiqp/editor

-- Option 1: Completely disable RLS on storage (simplest fix)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- Option 2: Create very permissive policies (if Option 1 doesn't work)
-- Uncomment these lines if you prefer to keep RLS enabled with permissive policies:

/*
-- Drop all existing policies first
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Bucket Access" ON storage.buckets;
DROP POLICY IF EXISTS "Screenshots are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Trade screenshots are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload trade screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own trade screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own trade screenshots" ON storage.objects;

-- Create new permissive policies
CREATE POLICY "Public Access" ON storage.objects FOR ALL USING (true);
CREATE POLICY "Public Bucket Access" ON storage.buckets FOR ALL USING (true);
*/

-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('trade-screenshots', 'trade-screenshots', true, 52428800, ARRAY['image/*']),
  ('screenshots', 'screenshots', true, 52428800, ARRAY['image/*'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Verify the changes
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename IN ('objects', 'buckets');

SELECT id, name, public FROM storage.buckets;