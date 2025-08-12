-- Ensure strict account isolation and data integrity
-- Add constraint to ensure account_id is never null for new trades
ALTER TABLE trades ALTER COLUMN account_id SET NOT NULL;

-- Add constraint to ensure only one active account per user
CREATE UNIQUE INDEX idx_one_active_account_per_user 
ON accounts (user_id) 
WHERE is_active = true;

-- Update the trigger function to be more robust
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  account_record RECORD;
  trade_pnl DECIMAL;
  risk_amount DECIMAL;
BEGIN
  -- Get account details
  SELECT * INTO account_record FROM public.accounts WHERE id = COALESCE(NEW.account_id, OLD.account_id);
  
  IF account_record IS NULL THEN
    RAISE EXCEPTION 'Account not found for trade';
  END IF;
  
  -- Calculate risk amount (percentage of starting balance for consistent calculation)
  risk_amount := account_record.starting_balance * (account_record.risk_per_trade / 100);
  
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    IF NEW.result = 'Win' THEN
      trade_pnl := risk_amount * (NEW.rr OR 0);
    ELSIF NEW.result = 'Loss' THEN
      trade_pnl := -risk_amount;
    ELSE
      trade_pnl := 0; -- breakeven
    END IF;
    
    UPDATE public.accounts 
    SET current_balance = current_balance + trade_pnl
    WHERE id = NEW.account_id;
    
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Reverse old trade effect
    IF OLD.result = 'Win' THEN
      trade_pnl := -risk_amount * (OLD.rr OR 0);
    ELSIF OLD.result = 'Loss' THEN
      trade_pnl := risk_amount;
    ELSE
      trade_pnl := 0;
    END IF;
    
    -- Apply new trade effect
    IF NEW.result = 'Win' THEN
      trade_pnl := trade_pnl + risk_amount * (NEW.rr OR 0);
    ELSIF NEW.result = 'Loss' THEN
      trade_pnl := trade_pnl - risk_amount;
    END IF;
    
    UPDATE public.accounts 
    SET current_balance = current_balance + trade_pnl
    WHERE id = NEW.account_id;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.result = 'Win' THEN
      trade_pnl := -risk_amount * (OLD.rr OR 0);
    ELSIF OLD.result = 'Loss' THEN
      trade_pnl := risk_amount;
    ELSE
      trade_pnl := 0;
    END IF;
    
    UPDATE public.accounts 
    SET current_balance = current_balance + trade_pnl
    WHERE id = OLD.account_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;