-- Ensure trade-screenshots bucket is public and accessible
-- This migration guarantees public access for trade review image display

-- Update bucket to be explicitly public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'trade-screenshots';

-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('trade-screenshots', 'trade-screenshots', true, 52428800, ARRAY['image/*'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/*'];

-- Drop existing conflicting policies to avoid duplicates
DROP POLICY IF EXISTS "Public read access for trade images" ON storage.objects;
DROP POLICY IF EXISTS "Trade screenshots are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Screenshots are viewable by everyone" ON storage.objects;

-- Create a comprehensive public read policy for trade images
CREATE POLICY "Public read access for all trade screenshots" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'trade-screenshots');

-- Ensure bucket-level public access policy exists
DROP POLICY IF EXISTS "Public bucket access for trade screenshots" ON storage.buckets;
CREATE POLICY "Public bucket access for trade screenshots" 
ON storage.buckets 
FOR SELECT 
USING (id = 'trade-screenshots');

-- Verify RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Add comment for tracking
COMMENT ON TABLE storage.buckets IS 'Updated to ensure trade-screenshots bucket is public - 2025-09-03';