-- Recalculate account balances based on actual trade results
-- First, reset all accounts to their starting balances
UPDATE accounts SET current_balance = starting_balance;

-- Function to recalculate account balance from all trades
CREATE OR REPLACE FUNCTION recalculate_account_balance(account_id_param UUID)
RETURNS VOID AS $$
DECLARE
  account_record RECORD;
  trade_record RECORD;
  risk_amount DECIMAL;
  total_pnl DECIMAL := 0;
BEGIN
  -- Get account details
  SELECT * INTO account_record FROM public.accounts WHERE id = account_id_param;
  
  IF account_record IS NULL THEN
    RETURN;
  END IF;
  
  -- Calculate risk amount (percentage of starting balance)
  risk_amount := account_record.starting_balance * (account_record.risk_per_trade / 100);
  
  -- Calculate total P&L from all trades
  FOR trade_record IN 
    SELECT result, rr FROM public.trades WHERE account_id = account_id_param
  LOOP
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

-- Recalculate all account balances
DO $$
DECLARE
  account_record RECORD;
BEGIN
  FOR account_record IN SELECT id FROM accounts LOOP
    PERFORM recalculate_account_balance(account_record.id);
  END LOOP;
END;
$$;