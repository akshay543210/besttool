-- Fix all database constraints and add proper account deletion handling

-- First, remove the problematic unique constraint and recreate it properly
DROP INDEX IF EXISTS idx_one_active_account_per_user;

-- Add a proper cascade delete for trades when account is deleted
-- First drop the existing foreign key and recreate with CASCADE
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_account_id_fkey;
ALTER TABLE trades ADD CONSTRAINT trades_account_id_fkey 
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

-- Add a trigger to ensure at least one account remains active when deleting
CREATE OR REPLACE FUNCTION public.prevent_last_account_deletion()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Check if this is the last account for the user
  IF (SELECT COUNT(*) FROM public.accounts WHERE user_id = OLD.user_id) = 1 THEN
    RAISE EXCEPTION 'Cannot delete the last account. At least one account must remain.';
  END IF;
  
  -- If deleting an active account, make another account active
  IF OLD.is_active = true THEN
    UPDATE public.accounts 
    SET is_active = true 
    WHERE user_id = OLD.user_id 
      AND id != OLD.id 
      AND is_active = false
    LIMIT 1;
  END IF;
  
  RETURN OLD;
END;
$function$;

-- Create trigger for account deletion
DROP TRIGGER IF EXISTS prevent_last_account_deletion_trigger ON accounts;
CREATE TRIGGER prevent_last_account_deletion_trigger
  BEFORE DELETE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_account_deletion();

-- Function to handle setting active accounts (prevents duplicate active accounts)
CREATE OR REPLACE FUNCTION public.set_account_active(account_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
  user_id_param uuid;
BEGIN
  -- Get the user_id for this account
  SELECT user_id INTO user_id_param FROM public.accounts WHERE id = account_id_param;
  
  IF user_id_param IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;
  
  -- Set all accounts for this user to inactive
  UPDATE public.accounts 
  SET is_active = false 
  WHERE user_id = user_id_param;
  
  -- Set the specified account to active
  UPDATE public.accounts 
  SET is_active = true 
  WHERE id = account_id_param;
END;
$function$;

-- Function to create account ensuring only one is active
CREATE OR REPLACE FUNCTION public.create_account_safe(
  user_id_param uuid,
  name_param text,
  starting_balance_param numeric,
  risk_per_trade_param numeric DEFAULT 2.0
)
RETURNS uuid
LANGUAGE plpgsql
AS $function$
DECLARE
  new_account_id uuid;
  has_accounts boolean;
BEGIN
  -- Check if user already has accounts
  SELECT EXISTS(SELECT 1 FROM public.accounts WHERE user_id = user_id_param) INTO has_accounts;
  
  -- If user has accounts, make sure we set this one as inactive by default
  -- If user has no accounts, make this one active
  INSERT INTO public.accounts (user_id, name, starting_balance, current_balance, risk_per_trade, is_active)
  VALUES (user_id_param, name_param, starting_balance_param, starting_balance_param, risk_per_trade_param, NOT has_accounts)
  RETURNING id INTO new_account_id;
  
  RETURN new_account_id;
END;
$function$;