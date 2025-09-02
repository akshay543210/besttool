-- Comprehensive fix for trade review image display
-- This migration ensures images display correctly in trade review section

-- First, ensure both buckets exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('trade-screenshots', 'trade-screenshots', true, 52428800, ARRAY['image/*']),
  ('screenshots', 'screenshots', true, 52428800, ARRAY['image/*'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop all existing conflicting policies
DROP POLICY IF EXISTS "Screenshots are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Trade screenshots are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload trade screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own trade screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own trade screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for all screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images flexible" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images flexible" ON storage.objects;

-- Create comprehensive policies for trade review image display

-- 1. PUBLIC READ ACCESS - Critical for trade review image display
CREATE POLICY "Public read access for trade images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id IN ('screenshots', 'trade-screenshots'));

-- 2. AUTHENTICATED UPLOAD - Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload trade images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id IN ('screenshots', 'trade-screenshots') 
  AND auth.uid() IS NOT NULL
);

-- 3. FLEXIBLE UPDATE POLICY - Support multiple filename patterns
CREATE POLICY "Users can update own trade images" 
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
    OR
    -- Pattern 4: if owner field exists and matches
    owner = auth.uid()
  )
);

-- 4. FLEXIBLE DELETE POLICY - Support multiple filename patterns  
CREATE POLICY "Users can delete own trade images" 
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
    OR
    -- Pattern 4: if owner field exists and matches
    owner = auth.uid()
  )
);

-- Ensure RLS is enabled on storage tables
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Add policy for bucket access
DROP POLICY IF EXISTS "Public bucket access" ON storage.buckets;
CREATE POLICY "Public bucket access" 
ON storage.buckets 
FOR SELECT 
USING (true);

-- Add a comment to track this migration
COMMENT ON TABLE storage.objects IS 'Updated RLS policies for trade review image display - 2025-09-02';

-- Verify policies are active (this will show in migration logs)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;