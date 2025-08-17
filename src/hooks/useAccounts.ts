import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  starting_balance: number;
  current_balance: number;
  risk_per_trade: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useAccounts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);

  const fetchAccounts = useCallback(async () => {
    if (!user) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setAccounts(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const createAccount = async (name: string, startingBalance: number, riskPerTrade: number = 2.0) => {
    if (!user) return null;

    try {
      // First set all existing accounts to inactive
      await supabase
        .from('accounts')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Then create the new account as active
      const { data, error } = await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          name,
          starting_balance: startingBalance,
          current_balance: startingBalance,
          risk_per_trade: riskPerTrade,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchAccounts();
      
      // Notify other hooks that active account changed
      window.dispatchEvent(new CustomEvent('activeAccountChanged'));
      
      // Show notification with rate limiting
      const now = Date.now();
      if (now - lastNotificationTime > 1000) { // Only show once per second
        toast({
          title: "Account Created",
          description: `${name} account created with $${startingBalance.toLocaleString()} starting balance.`,
        });
        setLastNotificationTime(now);
      }

      return data;
    } catch (err) {
      console.error('Error creating account:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to create account',
        variant: "destructive",
      });
      return null;
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchAccounts();
      
      // Show notification with rate limiting
      const now = Date.now();
      if (now - lastNotificationTime > 1000) { // Only show once per second
        toast({
          title: "Account Updated",
          description: "Account details have been updated successfully.",
        });
        setLastNotificationTime(now);
      }
    } catch (err) {
      console.error('Error updating account:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update account',
        variant: "destructive",
      });
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchAccounts();
      
      // Show notification with rate limiting
      const now = Date.now();
      if (now - lastNotificationTime > 1000) { // Only show once per second
        toast({
          title: "Account Deleted",
          description: "Account has been deleted successfully.",
        });
        setLastNotificationTime(now);
      }
    } catch (err) {
      console.error('Error deleting account:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete account',
        variant: "destructive",
      });
    }
  };

  const getActiveAccount = () => {
    return accounts.find(account => account.is_active) || accounts[0] || null;
  };

  const setActiveAccount = async (accountId: string) => {
    try {
      // Use the safe function to set active account
      const { error } = await supabase.rpc('set_account_active', {
        account_id_param: accountId
      });

      if (error) throw error;

      await fetchAccounts();
      
      // Notify other hooks that active account changed
      window.dispatchEvent(new CustomEvent('activeAccountChanged'));
      
      // Show notification with rate limiting
      const now = Date.now();
      if (now - lastNotificationTime > 1000) { // Only show once per second
        toast({
          title: "Active Account Changed",
          description: "Active account has been updated.",
        });
        setLastNotificationTime(now);
      }
    } catch (err) {
      console.error('Error setting active account:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to set active account',
        variant: "destructive",
      });
    }
  };

  // Create default account for new users
  const createDefaultAccount = async () => {
    if (!user || accounts.length > 0) return;

    await createAccount('Main Account', 10000, 2.0);
  };

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  useEffect(() => {
    if (user && accounts.length === 0 && !loading) {
      createDefaultAccount();
    }
  }, [user, accounts, loading]);

  // Real-time subscription for account updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('account-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'accounts',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Refetch accounts when any change occurs
          fetchAccounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    accounts,
    loading,
    error,
    refetchAccounts: fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    getActiveAccount,
    setActiveAccount,
  };
}