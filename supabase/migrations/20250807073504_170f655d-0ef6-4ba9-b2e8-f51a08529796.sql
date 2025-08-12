-- Fix account deletion by updating the trigger to check if user has multiple accounts
CREATE OR REPLACE FUNCTION public.prevent_last_account_deletion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
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

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS prevent_last_account_deletion ON public.accounts;
CREATE TRIGGER prevent_last_account_deletion
  BEFORE DELETE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION prevent_last_account_deletion();