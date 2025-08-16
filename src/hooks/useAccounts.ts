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

  const fetchAccounts = useCallback(async () => {
    if (!user) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching accounts for user:', user.id);
      
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase error fetching accounts:', error);
        throw error;
      }

      console.log('Successfully fetched accounts:', data?.length || 0);
      setAccounts(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch accounts';
      setError(errorMessage);
      
      // Show user-friendly error message
      if (errorMessage.includes('Invalid API key') || errorMessage.includes('Unauthorized')) {
        console.error('Authentication error: Please check your Supabase environment variables');
      }
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

      if (error) {
        console.error('Error creating account:', error);
        throw error;
      }

      await fetchAccounts();
      
      // Notify other hooks that active account changed
      window.dispatchEvent(new CustomEvent('activeAccountChanged'));
      
      toast({
        title: "Account Created",
        description: `${name} account created with $${startingBalance.toLocaleString()} starting balance.`,
      });

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

      if (error) {
        console.error('Error updating account:', error);
        throw error;
      }

      await fetchAccounts();
      toast({
        title: "Account Updated",
        description: "Account details have been updated successfully.",
      });
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

      if (error) {
        console.error('Error deleting account:', error);
        throw error;
      }

      await fetchAccounts();
      toast({
        title: "Account Deleted",
        description: "Account has been deleted successfully.",
      });
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

      if (error) {
        console.error('Error setting active account:', error);
        throw error;
      }

      await fetchAccounts();
      
      // Notify other hooks that active account changed
      window.dispatchEvent(new CustomEvent('activeAccountChanged'));
      
      toast({
        title: "Active Account Changed",
        description: "Active account has been updated.",
      });
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

    console.log('Setting up real-time subscription for accounts');
    
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
        (payload) => {
          console.log('Accounts changed:', payload);
          // Refetch accounts when any change occurs
          fetchAccounts();
        }
      )
      .subscribe((status) => {
        console.log('Accounts subscription status:', status);
        if (status === 'CHANNEL_ERROR') {
          console.error('Accounts real-time subscription error');
        }
      });

    return () => {
      console.log('Removing accounts real-time subscription');
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