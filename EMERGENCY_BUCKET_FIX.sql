-- EMERGENCY FIX: Create missing storage buckets and policies
-- Run this script in Supabase SQL Editor to fix missing buckets issue

-- Step 1: Create both required storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('trade-screenshots', 'trade-screenshots', true, 52428800, ARRAY['image/*']),
  ('screenshots', 'screenshots', true, 52428800, ARRAY['image/*'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Step 2: Enable Row Level Security on storage tables
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop any existing conflicting policies
DROP POLICY IF EXISTS "Screenshots are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Trade screenshots are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload trade screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own trade screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own trade screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for trade images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for all trade screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for all screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload trade images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own trade images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own trade images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Public bucket access" ON storage.buckets;
DROP POLICY IF EXISTS "Public bucket access for trade screenshots" ON storage.buckets;

-- Step 4: Create comprehensive storage policies

-- PUBLIC READ ACCESS - Critical for displaying images
CREATE POLICY "Public read access for all screenshots" 
ON storage.objects 
FOR SELECT 
USING (bucket_id IN ('screenshots', 'trade-screenshots'));

-- AUTHENTICATED UPLOAD - Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload screenshots" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id IN ('screenshots', 'trade-screenshots') 
  AND auth.uid() IS NOT NULL
);

-- FLEXIBLE UPDATE POLICY - Support multiple filename patterns
CREATE POLICY "Users can update own screenshots" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id IN ('screenshots', 'trade-screenshots') 
  AND auth.uid() IS NOT NULL
  AND (
    -- Pattern 1: filename starts with user ID (current format)
    name LIKE auth.uid()::text || '-%'
    OR
    -- Pattern 2: user ID in folder structure
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Pattern 3: user ID anywhere in filename (legacy support)
    name LIKE '%' || auth.uid()::text || '%'
  )
);

-- FLEXIBLE DELETE POLICY - Support multiple filename patterns  
CREATE POLICY "Users can delete own screenshots" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id IN ('screenshots', 'trade-screenshots') 
  AND auth.uid() IS NOT NULL
  AND (
    -- Pattern 1: filename starts with user ID (current format)
    name LIKE auth.uid()::text || '-%'
    OR
    -- Pattern 2: user ID in folder structure
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Pattern 3: user ID anywhere in filename (legacy support)
    name LIKE '%' || auth.uid()::text || '%'
  )
);

-- BUCKET ACCESS POLICY
CREATE POLICY "Public bucket access" 
ON storage.buckets 
FOR SELECT 
USING (id IN ('screenshots', 'trade-screenshots'));

-- Step 5: Verify the setup
SELECT 
  'Buckets Created' as status,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id IN ('screenshots', 'trade-screenshots')
ORDER BY id;

-- Step 6: Verify policies
SELECT 
  'Policies Created' as status,
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE schemaname = 'storage'
  AND tablename IN ('objects', 'buckets')
ORDER BY tablename, policyname;