-- Create trade-screenshots bucket and update storage policies

-- Create trade-screenshots bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('trade-screenshots', 'trade-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Drop old policies for trade-screenshots if they exist
DROP POLICY IF EXISTS "Trade screenshots are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload trade screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own trade screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own trade screenshots" ON storage.objects;

-- Create new policies for trade-screenshots bucket
CREATE POLICY "Trade screenshots are viewable by everyone" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'trade-screenshots');

CREATE POLICY "Users can upload trade screenshots" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'trade-screenshots' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own trade screenshots" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'trade-screenshots' AND (
  auth.uid()::text = (storage.foldername(name))[1] OR 
  name LIKE auth.uid()::text || '-%'
));

CREATE POLICY "Users can delete own trade screenshots" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'trade-screenshots' AND (
  auth.uid()::text = (storage.foldername(name))[1] OR 
  name LIKE auth.uid()::text || '-%'
));