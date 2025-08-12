/*
  # Add risk percentage field to trades table

  1. New Column
    - `risk_percentage` (decimal) - The risk percentage used for this specific trade
  
  2. Updates
    - Add the new column with default value of 1.0 (1% risk)
    - Update existing trades to use account's default risk percentage
*/

-- Add risk_percentage column to trades table
ALTER TABLE public.trades 
ADD COLUMN risk_percentage DECIMAL(5,2) DEFAULT 1.0;

-- Update existing trades to use their account's risk percentage
UPDATE public.trades 
SET risk_percentage = (
  SELECT risk_per_trade 
  FROM public.accounts 
  WHERE accounts.id = trades.account_id
)
WHERE risk_percentage IS NULL;

-- Update the account balance calculation function to use trade-specific risk percentage
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
DECLARE
  account_record RECORD;
  trade_pnl DECIMAL;
  risk_amount DECIMAL;
  risk_percentage DECIMAL;
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    -- Get account details
    SELECT * INTO account_record FROM public.accounts WHERE id = NEW.account_id;
    
    IF account_record IS NULL THEN
      RAISE EXCEPTION 'Account not found for trade';
    END IF;
    
    -- Use trade's risk percentage or account default
    risk_percentage := COALESCE(NEW.risk_percentage, account_record.risk_per_trade);
    
    -- Calculate risk amount from current balance
    risk_amount := account_record.current_balance * (risk_percentage / 100);
    
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
    
    -- Reverse old trade effect using old risk percentage
    risk_percentage := COALESCE(OLD.risk_percentage, account_record.risk_per_trade);
    risk_amount := account_record.current_balance * (risk_percentage / 100);
    
    IF OLD.result = 'Win' THEN
      trade_pnl := -risk_amount * COALESCE(OLD.rr, 0);
    ELSIF OLD.result = 'Loss' THEN
      trade_pnl := risk_amount;
    ELSE
      trade_pnl := 0;
    END IF;
    
    -- Apply new trade effect using new risk percentage
    risk_percentage := COALESCE(NEW.risk_percentage, account_record.risk_per_trade);
    risk_amount := account_record.current_balance * (risk_percentage / 100);
    
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
    -- Check if account still exists
    SELECT * INTO account_record FROM public.accounts WHERE id = OLD.account_id;
    
    -- Only update balance if account still exists
    IF account_record IS NOT NULL THEN
      -- Use old trade's risk percentage
      risk_percentage := COALESCE(OLD.risk_percentage, account_record.risk_per_trade);
      risk_amount := account_record.current_balance * (risk_percentage / 100);
      
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

-- Update the recalculate function to use trade-specific risk percentages
CREATE OR REPLACE FUNCTION recalculate_account_balance(account_id_param UUID)
RETURNS VOID AS $$
DECLARE
  account_record RECORD;
  trade_record RECORD;
  risk_amount DECIMAL;
  total_pnl DECIMAL := 0;
  risk_percentage DECIMAL;
BEGIN
  -- Get account details
  SELECT * INTO account_record FROM public.accounts WHERE id = account_id_param;
  
  IF account_record IS NULL THEN
    RETURN;
  END IF;
  
  -- Calculate total P&L from all trades using their individual risk percentages
  FOR trade_record IN 
    SELECT result, rr, risk_percentage FROM public.trades WHERE account_id = account_id_param
  LOOP
    -- Use trade's risk percentage or account default
    risk_percentage := COALESCE(trade_record.risk_percentage, account_record.risk_per_trade);
    risk_amount := account_record.current_balance * (risk_percentage / 100);
    
    IF trade_record.result = 'Win' THEN
      total_pnl := total_pnl + (risk_amount * COALESCE(trade_record.rr, 0));
    ELSIF trade_record.result = 'Loss' THEN
      total_pnl := total_pnl - risk_amount;
    END IF;
    -- Breakeven trades don't change the balance
  END LOOP;
  
  -- Update account balance
  UPDATE public.accounts 
  SET current_balance = starting_balance + total_pnl
  WHERE id = account_id_param;
END;
$$ LANGUAGE plpgsql;