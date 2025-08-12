-- Create accounts table for portfolio management
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  starting_balance DECIMAL NOT NULL DEFAULT 10000,
  current_balance DECIMAL NOT NULL DEFAULT 10000,
  risk_per_trade DECIMAL NOT NULL DEFAULT 2.0, -- Risk percentage per trade
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for accounts
CREATE POLICY "Users can view their own accounts" 
ON public.accounts 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own accounts" 
ON public.accounts 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own accounts" 
ON public.accounts 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own accounts" 
ON public.accounts 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- Add account_id to trades table
ALTER TABLE public.trades ADD COLUMN account_id UUID REFERENCES public.accounts(id);

-- Update existing trades to use a default account (we'll handle this in the app)
-- Note: We'll create a default account for existing users in the React app

-- Create trigger for automatic timestamp updates on accounts
CREATE TRIGGER update_accounts_updated_at
BEFORE UPDATE ON public.accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update account balance based on trades
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
DECLARE
  account_record RECORD;
  trade_pnl DECIMAL;
  risk_amount DECIMAL;
BEGIN
  -- Get account details
  SELECT * INTO account_record FROM public.accounts WHERE id = COALESCE(NEW.account_id, OLD.account_id);
  
  IF account_record IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Calculate risk amount (percentage of current balance)
  risk_amount := account_record.current_balance * (account_record.risk_per_trade / 100);
  
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    IF NEW.result = 'win' THEN
      trade_pnl := risk_amount * (NEW.rr OR 0);
    ELSIF NEW.result = 'loss' THEN
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
    IF OLD.result = 'win' THEN
      trade_pnl := -risk_amount * (OLD.rr OR 0);
    ELSIF OLD.result = 'loss' THEN
      trade_pnl := risk_amount;
    ELSE
      trade_pnl := 0;
    END IF;
    
    -- Apply new trade effect
    IF NEW.result = 'win' THEN
      trade_pnl := trade_pnl + risk_amount * (NEW.rr OR 0);
    ELSIF NEW.result = 'loss' THEN
      trade_pnl := trade_pnl - risk_amount;
    END IF;
    
    UPDATE public.accounts 
    SET current_balance = current_balance + trade_pnl
    WHERE id = NEW.account_id;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.result = 'win' THEN
      trade_pnl := -risk_amount * (OLD.rr OR 0);
    ELSIF OLD.result = 'loss' THEN
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
$$ LANGUAGE plpgsql;

-- Create trigger for account balance updates
CREATE TRIGGER update_account_balance_on_trade_change
AFTER INSERT OR UPDATE OR DELETE ON public.trades
FOR EACH ROW
EXECUTE FUNCTION public.update_account_balance();