-- Add is_public column to trades table for social sharing
ALTER TABLE public.trades 
ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Create index for public trades lookup
CREATE INDEX idx_trades_public ON public.trades(is_public, id) WHERE is_public = true;

-- Update RLS policy to allow public access to shared trades
CREATE POLICY "Anyone can view public trades"
ON public.trades
FOR SELECT
USING (is_public = true);