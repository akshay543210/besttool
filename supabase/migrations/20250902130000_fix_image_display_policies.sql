-- Fix storage policies to ensure images display properly in trade review
-- This migration ensures public read access while maintaining security

-- First, ensure the trade-screenshots bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('trade-screenshots', 'trade-screenshots', true, 52428800, ARRAY['image/*'])
ON CONFLICT (id) DO UPDATE SET 
 public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/*'];

-- Also ensure the legacy screenshots bucket exists for backward compatibility
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('screenshots', 'screenshots', true, 52428800, ARRAY['image/*'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/*'];

-- Drop any existing restrictive policies that might interfere
DROP POLICY IF EXISTS "Screenshots are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Trade screenshots are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload trade screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own trade screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own trade screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- Create permissive policies for public read access to images
-- This is the key policy that allows images to be displayed in the trade review section
CREATE POLICY "Public read access for trade images" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id IN ('screenshots', 'trade-screenshots')
);

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload trade images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id IN ('screenshots', 'trade-screenshots') 
  AND auth.uid() IS NOT NULL
);

-- Allow users to update their own images (flexible pattern matching)
CREATE POLICY "Users can update own trade images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id IN ('screenshots', 'trade-screenshots') 
  AND auth.uid() IS NOT NULL
  AND (
    -- Pattern 1: user-id at start of filename
    name LIKE auth.uid()::text || '-%'
    OR
    -- Pattern 2: user-id as folder structure  
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Pattern 3: allow if user owns the object (fallback)
    owner = auth.uid()
  )
);

-- Allow users to delete their own images (same flexible pattern)
CREATE POLICY "Users can delete own trade images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id IN ('screenshots', 'trade-screenshots') 
  AND auth.uid() IS NOT NULL
  AND (
    -- Pattern 1: user-id at start of filename
    name LIKE auth.uid()::text || '-%'
    OR
    -- Pattern 2: user-id as folder structure
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Pattern 3: allow if user owns the object (fallback)
    owner = auth.uid()
  )
);

-- Ensure RLS is enabled on storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Also ensure RLS is properly configured on storage.buckets if needed
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Allow public access to bucket information
CREATE POLICY IF NOT EXISTS "Public bucket access" 
ON storage.buckets 
FOR SELECT 
USING (true);
