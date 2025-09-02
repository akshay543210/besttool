-- Fix RLS policies for storage buckets and objects
-- This script will disable restrictive RLS policies that are blocking storage operations

-- First, let's check if the buckets exist and create them if needed
-- We'll use a more permissive approach for bucket creation

-- Create trade-screenshots bucket (ignore if already exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('trade-screenshots', 'trade-screenshots', true, 52428800, ARRAY['image/*'])
ON CONFLICT (id) DO NOTHING;

-- Create screenshots bucket for backward compatibility (ignore if already exists)  
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('screenshots', 'screenshots', true, 52428800, ARRAY['image/*'])
ON CONFLICT (id) DO NOTHING;

-- Drop all existing restrictive policies that might be blocking operations
DROP POLICY IF EXISTS "Screenshots are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Trade screenshots are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload trade screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own trade screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own trade screenshots" ON storage.objects;

-- Create new, more permissive policies for both buckets

-- Allow everyone to view images (public read access)
CREATE POLICY "Public read access for screenshots" 
ON storage.objects 
FOR SELECT 
USING (bucket_id IN ('screenshots', 'trade-screenshots'));

-- Allow authenticated users to upload to either bucket
CREATE POLICY "Authenticated users can upload images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id IN ('screenshots', 'trade-screenshots') 
  AND auth.uid() IS NOT NULL
);

-- Allow users to update their own images (flexible pattern matching)
CREATE POLICY "Users can update own images" 
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
CREATE POLICY "Users can delete own images" 
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