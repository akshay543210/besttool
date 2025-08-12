-- Fix multiple active accounts - only one should be active at a time
UPDATE accounts SET is_active = false WHERE id != (SELECT id FROM accounts WHERE is_active = true LIMIT 1);

-- Update trades without account_id to use the active account
UPDATE trades 
SET account_id = (SELECT id FROM accounts WHERE is_active = true LIMIT 1) 
WHERE account_id IS NULL;