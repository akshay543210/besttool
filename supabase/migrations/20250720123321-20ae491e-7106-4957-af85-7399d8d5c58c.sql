-- Fix all database constraints and add proper account deletion handling

-- Add a proper cascade delete for trades when account is deleted
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_account_id_fkey;
ALTER TABLE trades ADD CONSTRAINT trades_account_id_fkey 
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

-- Add a trigger to ensure at least one account remains active when deleting
CREATE OR REPLACE FUNCTION public.prevent_last_account_deletion()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  account_count integer;
  next_account_id uuid;
BEGIN
  -- Check if this is the last account for the user
  SELECT COUNT(*) INTO account_count FROM public.accounts WHERE user_id = OLD.user_id;
  
  IF account_count = 1 THEN
    RAISE EXCEPTION 'Cannot delete the last account. At least one account must remain.';
  END IF;
  
  -- If deleting an active account, make another account active
  IF OLD.is_active = true THEN
    SELECT id INTO next_account_id 
    FROM public.accounts 
    WHERE user_id = OLD.user_id 
      AND id != OLD.id 
      AND is_active = false
    ORDER BY created_at ASC;
    
    IF next_account_id IS NOT NULL THEN
      UPDATE public.accounts 
      SET is_active = true 
      WHERE id = next_account_id;
    END IF;
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