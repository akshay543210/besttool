import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAccounts, Account } from './useAccounts';

export interface Trade {
  id: string;
  date: string;
  session: string;
  symbol?: string;
  side?: string;
  entry_price?: number;
  exit_price?: number;
  quantity?: number;
  setup_tag?: string;
  strategy_tag?: string;
  rr?: number;
  result: string;
  notes?: string;
  image_url?: string;
  account_id?: string;
  is_public?: boolean;
  pnl_dollar?: number;
  commission?: number;
  risk_percentage?: number;
  created_at: string;
  updated_at: string;
}

export interface TradeStats {
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  avgWinRR: number;
  avgLossRR: number;
  profitFactor: number;
  currentWinStreak: number;
  currentLossStreak: number;
  topWinRR: number;
  topLossRR: number;
  totalRR: number;
}

export function useTrades() {
  const { user } = useAuth();
  const { accounts, getActiveAccount, updateAccount } = useAccounts();
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeAccount = getActiveAccount();
  
  // Memoize filtered trades for active account only
  const trades = useMemo(() => {
    return activeAccount 
      ? allTrades.filter(trade => trade.account_id === activeAccount.id)
      : [];
  }, [allTrades, activeAccount?.id]);

  const fetchTrades = useCallback(async () => {
    if (!user) {
      setAllTrades([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Add logging to help diagnose issues
      console.log('Fetching trades for user:', user.id);
      
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          hint: error.hint
        });
        throw error;
      }

      console.log('Successfully fetched trades:', data?.length || 0);
      setAllTrades(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching trades:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trades';
      setError(errorMessage);
      
      // Show user-friendly error message
      if (errorMessage.includes('Invalid API key') || errorMessage.includes('Unauthorized')) {
        console.error('Authentication error: Please check your Supabase environment variables');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Update account balance when trades change
  const updateAccountBalance = useCallback(async () => {
    if (!activeAccount || trades.length === 0) return;

    try {
      // Calculate total P&L from all trades for this account
      let totalPnL = 0;
      
      trades.forEach(trade => {
        // Use actual pnl_dollar if available
        if (trade.pnl_dollar !== null && trade.pnl_dollar !== undefined) {
          totalPnL += trade.pnl_dollar;
        } else if (trade.result && trade.risk_percentage) {
          // Calculate P&L based on risk percentage and R:R ratio using starting balance
          const riskAmount = activeAccount.starting_balance * (trade.risk_percentage / 100);
          
          if (trade.result.toLowerCase() === 'win') {
            totalPnL += (riskAmount * (trade.rr || 0));
          } else if (trade.result.toLowerCase() === 'loss') {
            totalPnL -= riskAmount;
          }
          // Breakeven contributes 0 to P&L
        }
      });

      // Update account balance
      const newBalance = activeAccount.starting_balance + totalPnL;
      
      // Only update if there's a significant change (more than $0.01)
      if (Math.abs(newBalance - activeAccount.current_balance) > 0.01) {
        await updateAccount(activeAccount.id, {
          current_balance: newBalance
        });
      }
    } catch (error) {
      console.error('Error updating account balance:', error);
    }
  }, [activeAccount, trades, updateAccount]);

  useEffect(() => {
    fetchTrades();
  }, [user?.id]);

  // Update account balance when trades change
  useEffect(() => {
    if (trades.length > 0 && activeAccount) {
      updateAccountBalance();
    }
  }, [trades, activeAccount?.id, updateAccountBalance]);

  // Real-time subscription for trades
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscription for trades');
    
    const channel = supabase
      .channel('trades-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Trades changed:', payload);
          fetchTrades();
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'CHANNEL_ERROR') {
          console.error('Real-time subscription error');
        }
      });

    return () => {
      console.log('Removing real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchTrades]);

  // Refetch trades when active account changes
  useEffect(() => {
    if (activeAccount) {
      fetchTrades();
    }
  }, [activeAccount?.id]);

  const calculatePnL = useCallback((trade: Trade, account?: Account): number => {
    if (!account) return 0;
    
    // Use the actual pnl_dollar if available
    if (trade.pnl_dollar !== null && trade.pnl_dollar !== undefined) {
      return trade.pnl_dollar;
    }
    
    // Calculate risk amount using starting balance and trade's risk percentage
    if (trade.result && trade.risk_percentage) {
      const riskAmount = account.starting_balance * (trade.risk_percentage / 100);
      
      if (trade.result.toLowerCase() === 'win') {
        return riskAmount * (trade.rr || 0);
      } else if (trade.result.toLowerCase() === 'loss') {
        return -riskAmount;
      }
    }
    
    return 0; // breakeven or missing data
  }, []);

  const calculateStats = useMemo((): TradeStats => {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        wins: 0,
        losses: 0,
        breakevens: 0,
        winRate: 0,
        avgWinRR: 0,
        avgLossRR: 0,
        profitFactor: 0,
        currentWinStreak: 0,
        currentLossStreak: 0,
        topWinRR: 0,
        topLossRR: 0,
        totalRR: 0,
      };
    }

    const wins = trades.filter(t => t.result.toLowerCase() === 'win');
    const losses = trades.filter(t => t.result.toLowerCase() === 'loss');
    const breakevens = trades.filter(t => t.result.toLowerCase() === 'breakeven');

    // Calculate total P&L using actual pnl_dollar values when available
    const totalWinPnL = wins.reduce((sum, trade) => sum + (trade.pnl_dollar || 0), 0);
    const totalLossPnL = losses.reduce((sum, trade) => sum + Math.abs(trade.pnl_dollar || 0), 0);
    
    // For R:R based calculations when pnl_dollar is not available
    const riskAmount = activeAccount ? activeAccount.starting_balance * 0.01 : 0;
    const winRRs = wins
      .filter(t => t.pnl_dollar === null || t.pnl_dollar === undefined)
      .map(t => t.rr || 0)
      .filter(rr => rr > 0);
      
    const lossRRs = losses
      .filter(t => t.pnl_dollar === null || t.pnl_dollar === undefined)
      .map(t => 1) // Loss is always 1R
      .filter(r => r > 0);

    const avgWinRR = winRRs.length > 0 ? winRRs.reduce((a, b) => a + b, 0) / winRRs.length : 0;
    const avgLossRR = lossRRs.length > 0 ? lossRRs.reduce((a, b) => a + b, 0) / lossRRs.length : 0;
    
    const totalWinRR = winRRs.reduce((a, b) => a + b, 0);
    const totalLossRR = lossRRs.reduce((a, b) => a + b, 0);
    
    // Calculate profit factor using actual P&L when available, fallback to R:R
    const profitFactor = totalLossPnL > 0 ? totalWinPnL / totalLossPnL : 
                        totalLossRR > 0 ? (totalWinRR * riskAmount) / (totalLossRR * riskAmount) : 
                        totalWinPnL > 0 ? Infinity : 0;

    // Calculate streaks
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    
    // Calculate from most recent trade backwards
    for (let i = 0; i < trades.length; i++) {
      const result = trades[i].result.toLowerCase();
      if (result === 'win') {
        currentWinStreak++;
        currentLossStreak = 0;
      } else if (result === 'loss') {
        currentLossStreak++;
        currentWinStreak = 0;
      } else {
        currentWinStreak = 0;
        currentLossStreak = 0;
      }
    }

    const topWinRR = winRRs.length > 0 ? Math.max(...winRRs) : 0;
    const topLossRR = 1; // Loss is always 1R
    
    // Calculate total RR using actual P&L when available
    const totalRR = totalWinPnL - totalLossPnL;

    return {
      totalTrades: trades.length,
      wins: wins.length,
      losses: losses.length,
      breakevens: breakevens.length,
      winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
      avgWinRR,
      avgLossRR,
      profitFactor,
      currentWinStreak,
      currentLossStreak,
      topWinRR,
      topLossRR,
      totalRR,
    };
  }, [trades, activeAccount?.starting_balance]);

  const getTradesByDate = useCallback(() => {
    const tradesByDate: Record<string, Trade[]> = {};
    
    trades.forEach(trade => {
      const date = new Date(trade.date).toDateString();
      if (!tradesByDate[date]) {
        tradesByDate[date] = [];
      }
      tradesByDate[date].push(trade);
    });

    return tradesByDate;
  }, [trades]);

  const getTradesBySession = useCallback((session: string) => {
    return trades.filter(trade => trade.session.toLowerCase() === session.toLowerCase());
  }, [trades]);

  return {
    trades,
    loading,
    error,
    refetchTrades: fetchTrades,
    calculateStats,
    getTradesByDate,
    getTradesBySession,
    calculatePnL,
  };
}