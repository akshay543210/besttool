-- Create accounts table for trading accounts
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  starting_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  risk_per_trade NUMERIC NOT NULL DEFAULT 2.0,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trades table for trading journal entries
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  session TEXT NOT NULL,
  symbol TEXT,
  side TEXT,
  entry_price NUMERIC,
  exit_price NUMERIC,
  quantity NUMERIC,
  setup_tag TEXT,
  strategy_tag TEXT,
  rr NUMERIC,
  result TEXT NOT NULL,
  notes TEXT,
  image_url TEXT,
  is_public BOOLEAN DEFAULT false,
  pnl_dollar NUMERIC,
  commission NUMERIC,
  risk_percentage NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for accounts
CREATE POLICY "Users can view their own accounts" 
ON public.accounts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own accounts" 
ON public.accounts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" 
ON public.accounts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts" 
ON public.accounts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for trades
CREATE POLICY "Users can view their own trades" 
ON public.trades 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trades" 
ON public.trades 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades" 
ON public.trades 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades" 
ON public.trades 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policy for public trades
CREATE POLICY "Anyone can view public trades" 
ON public.trades 
FOR SELECT 
USING (is_public = true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trades_updated_at
  BEFORE UPDATE ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to safely set active account
CREATE OR REPLACE FUNCTION public.set_account_active(account_id_param UUID)
RETURNS void AS $$
BEGIN
  -- First, set all accounts for this user to inactive
  UPDATE public.accounts 
  SET is_active = false 
  WHERE user_id = auth.uid();
  
  -- Then set the specified account to active
  UPDATE public.accounts 
  SET is_active = true 
  WHERE id = account_id_param AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;