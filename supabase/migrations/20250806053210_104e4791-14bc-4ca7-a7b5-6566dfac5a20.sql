-- Remove session field and replace with setup_tag field, add required fields for comprehensive trading journal
-- First, update the trades table to remove session and ensure all required fields are present

-- Check if setup_tag column already exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'setup_tag') THEN
    ALTER TABLE public.trades ADD COLUMN setup_tag TEXT;
  END IF;
END $$;

-- Add missing columns for comprehensive trade tracking
DO $$
BEGIN
  -- Add symbol column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'symbol') THEN
    ALTER TABLE public.trades ADD COLUMN symbol TEXT;
  END IF;
  
  -- Add side column if not exists (LONG/SHORT)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'side') THEN
    ALTER TABLE public.trades ADD COLUMN side TEXT CHECK (side IN ('LONG', 'SHORT'));
  END IF;
  
  -- Add entry_price column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'entry_price') THEN
    ALTER TABLE public.trades ADD COLUMN entry_price DECIMAL(10,4);
  END IF;
  
  -- Add exit_price column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'exit_price') THEN
    ALTER TABLE public.trades ADD COLUMN exit_price DECIMAL(10,4);
  END IF;
  
  -- Add quantity column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'quantity') THEN
    ALTER TABLE public.trades ADD COLUMN quantity DECIMAL(10,4);
  END IF;
  
  -- Add pnl_dollar column if not exists (actual dollar P&L)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'pnl_dollar') THEN
    ALTER TABLE public.trades ADD COLUMN pnl_dollar DECIMAL(10,2);
  END IF;
  
  -- Add commission column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'commission') THEN
    ALTER TABLE public.trades ADD COLUMN commission DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

-- Update any existing trades that have session data to move it to setup_tag
UPDATE public.trades 
SET setup_tag = session 
WHERE setup_tag IS NULL AND session IS NOT NULL;

-- Create or replace function to calculate trade P&L automatically
CREATE OR REPLACE FUNCTION public.calculate_trade_pnl()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate if we have entry and exit prices
  IF NEW.entry_price IS NOT NULL AND NEW.exit_price IS NOT NULL AND NEW.quantity IS NOT NULL THEN
    IF NEW.side = 'LONG' THEN
      NEW.pnl_dollar := (NEW.exit_price - NEW.entry_price) * NEW.quantity - COALESCE(NEW.commission, 0);
    ELSIF NEW.side = 'SHORT' THEN
      NEW.pnl_dollar := (NEW.entry_price - NEW.exit_price) * NEW.quantity - COALESCE(NEW.commission, 0);
    END IF;
    
    -- Update result based on P&L
    IF NEW.pnl_dollar > 0 THEN
      NEW.result := 'Win';
    ELSIF NEW.pnl_dollar < 0 THEN
      NEW.result := 'Loss';
    ELSE
      NEW.result := 'Breakeven';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic P&L calculation
DROP TRIGGER IF EXISTS calculate_pnl_trigger ON public.trades;
CREATE TRIGGER calculate_pnl_trigger
  BEFORE INSERT OR UPDATE ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_trade_pnl();