-- Fix trade image upload issues by ensuring proper bucket setup
-- This migration addresses common image upload problems

-- Ensure trade-screenshots bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('trade-screenshots', 'trade-screenshots', true, 52428800, ARRAY['image/*'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/*'];

-- Ensure legacy screenshots bucket exists for backward compatibility
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('screenshots', 'screenshots', true, 52428800, ARRAY['image/*'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/*'];

-- Drop all existing conflicting policies to start fresh
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
DROP POLICY IF EXISTS "Authenticated users can upload trade images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own trade images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own trade images" ON storage.objects;

-- Create comprehensive policies for both buckets

-- 1. PUBLIC READ ACCESS - Critical for displaying images
CREATE POLICY "Public read access for all screenshots" 
ON storage.objects 
FOR SELECT 
USING (bucket_id IN ('screenshots', 'trade-screenshots'));

-- 2. AUTHENTICATED UPLOAD - Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload screenshots" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id IN ('screenshots', 'trade-screenshots') 
  AND auth.uid() IS NOT NULL
);

-- 3. FLEXIBLE UPDATE POLICY - Support multiple filename patterns
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

-- 4. FLEXIBLE DELETE POLICY - Support multiple filename patterns  
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

-- Ensure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Create bucket access policy
DROP POLICY IF EXISTS "Public bucket access" ON storage.buckets;
CREATE POLICY "Public bucket access" 
ON storage.buckets 
FOR SELECT 
USING (id IN ('screenshots', 'trade-screenshots'));

-- Add comment for tracking
COMMENT ON TABLE storage.buckets IS 'Fixed trade image upload issues - comprehensive bucket and policy setup - 2025-09-03';