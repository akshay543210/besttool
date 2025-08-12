-- Fix account deletion by updating trigger to handle deletion properly
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
DECLARE
  account_record RECORD;
  trade_pnl DECIMAL;
  risk_amount DECIMAL;
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    -- Get account details
    SELECT * INTO account_record FROM public.accounts WHERE id = NEW.account_id;
    
    IF account_record IS NULL THEN
      RAISE EXCEPTION 'Account not found for trade';
    END IF;
    
    -- Calculate risk amount (percentage of starting balance for consistent calculation)
    risk_amount := account_record.starting_balance * (account_record.risk_per_trade / 100);
    
    IF NEW.result = 'Win' THEN
      trade_pnl := risk_amount * COALESCE(NEW.rr, 0);
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
    -- Get account details
    SELECT * INTO account_record FROM public.accounts WHERE id = NEW.account_id;
    
    IF account_record IS NULL THEN
      RAISE EXCEPTION 'Account not found for trade';
    END IF;
    
    -- Calculate risk amount
    risk_amount := account_record.starting_balance * (account_record.risk_per_trade / 100);
    
    -- Reverse old trade effect
    IF OLD.result = 'Win' THEN
      trade_pnl := -risk_amount * COALESCE(OLD.rr, 0);
    ELSIF OLD.result = 'Loss' THEN
      trade_pnl := risk_amount;
    ELSE
      trade_pnl := 0;
    END IF;
    
    -- Apply new trade effect
    IF NEW.result = 'Win' THEN
      trade_pnl := trade_pnl + risk_amount * COALESCE(NEW.rr, 0);
    ELSIF NEW.result = 'Loss' THEN
      trade_pnl := trade_pnl - risk_amount;
    END IF;
    
    UPDATE public.accounts 
    SET current_balance = current_balance + trade_pnl
    WHERE id = NEW.account_id;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE - Only update if account still exists
  IF TG_OP = 'DELETE' THEN
    -- Check if account still exists (it might be deleted as part of account deletion)
    SELECT * INTO account_record FROM public.accounts WHERE id = OLD.account_id;
    
    -- Only update balance if account still exists
    IF account_record IS NOT NULL THEN
      -- Calculate risk amount
      risk_amount := account_record.starting_balance * (account_record.risk_per_trade / 100);
      
      IF OLD.result = 'Win' THEN
        trade_pnl := -risk_amount * COALESCE(OLD.rr, 0);
      ELSIF OLD.result = 'Loss' THEN
        trade_pnl := risk_amount;
      ELSE
        trade_pnl := 0;
      END IF;
      
      UPDATE public.accounts 
      SET current_balance = current_balance + trade_pnl
      WHERE id = OLD.account_id;
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;

-- Drop and recreate the trigger to ensure it's using the updated function
DROP TRIGGER IF EXISTS update_account_balance_trigger ON public.trades;
CREATE TRIGGER update_account_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.trades
  FOR EACH ROW EXECUTE FUNCTION update_account_balance();