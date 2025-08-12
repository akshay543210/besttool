-- Create trades table for the trading journal
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session TEXT NOT NULL CHECK (session IN ('Asia', 'London', 'NY Open', 'NY Close')),
  strategy_tag TEXT,
  rr DECIMAL(10,2),
  result TEXT NOT NULL CHECK (result IN ('Win', 'Loss', 'Breakeven')),
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
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

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_trades_updated_at
BEFORE UPDATE ON public.trades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for trade screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('screenshots', 'screenshots', true);

-- Create storage policies for screenshots
CREATE POLICY "Screenshots are viewable by everyone" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'screenshots');

CREATE POLICY "Users can upload their own screenshots" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own screenshots" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own screenshots" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);