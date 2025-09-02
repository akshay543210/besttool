-- Fix storage policies for screenshots to allow proper access
-- The previous policies were too restrictive and caused image loading issues

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can upload their own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own screenshots" ON storage.objects;

-- Create new, more permissive policies for screenshots
-- Allow users to upload screenshots (less restrictive pattern matching)
CREATE POLICY "Users can upload screenshots" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'screenshots' AND auth.uid() IS NOT NULL);

-- Allow users to update their own screenshots (check if filename contains user ID)
CREATE POLICY "Users can update own screenshots" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'screenshots' AND (
  auth.uid()::text = (storage.foldername(name))[1] OR 
  name LIKE auth.uid()::text || '-%'
));

-- Allow users to delete their own screenshots (check if filename contains user ID) 
CREATE POLICY "Users can delete own screenshots" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'screenshots' AND (
  auth.uid()::text = (storage.foldername(name))[1] OR 
  name LIKE auth.uid()::text || '-%'
));