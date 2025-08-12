-- Fix the trades table constraint for RR field
ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_result_check;

-- Add the correct constraint
ALTER TABLE public.trades ADD CONSTRAINT trades_result_check 
CHECK (result IN ('Win', 'Loss', 'Breakeven'));

-- Ensure RR field allows numeric values
ALTER TABLE public.trades ALTER COLUMN rr TYPE NUMERIC;