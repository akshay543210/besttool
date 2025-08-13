import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TimeFilter } from './TimeFilter';
import { NewTradeModal } from './NewTradeModal';
import { StatsCard } from './StatsCard';
import { TradingTable } from './TradingTable';
import { useTrades } from '@/hooks/useTrades';
import { useAccounts } from '@/hooks/useAccounts';
import { TrendingUp, TrendingDown, Target, DollarSign, BarChart3, User, Twitter, MessageCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths, subYears, isSameDay, isSameWeek, isSameMonth, isSameYear } from 'date-fns';

interface FormattedTrade {
  id: string;
  date: string;
  symbol: string;
  side: "LONG" | "SHORT";
  entry_price: number;
  exit_price: number;
  quantity: number;
  setup_tag: string;
  rr: number;
  result: "Win" | "Loss" | "Breakeven";
  pnl_dollar: number;
  notes?: string;
  image_url?: string;
  commission: number;
}

export function TradingDashboard() {
  const [activeFilter, setActiveFilter] = useState('all');
  const {
    trades,
    loading,
    refetchTrades,
    calculateStats
  } = useTrades();
  const {
    getActiveAccount
  } = useAccounts();
  
  const activeAccount = getActiveAccount();

  const filteredTrades = useMemo(() => {
    if (!trades) return [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = subDays(today, 1);
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 0 });
    const endOfThisWeek = endOfWeek(today, { weekStartsOn: 0 });
    const startOfLastWeek = subWeeks(startOfThisWeek, 1);
    const endOfLastWeek = subDays(startOfThisWeek, 1);
    const startOfThisMonth = startOfMonth(today);
    const endOfThisMonth = endOfMonth(today);
    const startOfLastMonth = subMonths(startOfThisMonth, 1);
    const endOfLastMonth = subDays(startOfThisMonth, 1);
    const threeMonthsAgo = subMonths(today, 3);
    const startOfThisYear = new Date(today.getFullYear(), 0, 1);
    const endOfThisYear = new Date(today.getFullYear(), 11, 31);
    const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1);
    const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31);

    return trades.filter(trade => {
      const tradeDate = new Date(trade.date);
      
      switch (activeFilter) {
        case 'today':
          return isSameDay(tradeDate, today);
        case 'yesterday':
          return isSameDay(tradeDate, yesterday);
        case 'this-week':
          return isSameWeek(tradeDate, today, { weekStartsOn: 0 });
        case 'last-week':
          return isSameWeek(tradeDate, subWeeks(today, 1), { weekStartsOn: 0 });
        case 'this-month':
          return isSameMonth(tradeDate, today);
        case 'last-month':
          return isSameMonth(tradeDate, subMonths(today, 1));
        case '3-months':
          return tradeDate >= threeMonthsAgo;
        case 'this-year':
          return isSameYear(tradeDate, today);
        case 'last-year':
          return isSameYear(tradeDate, subYears(today, 1));
        default:
          return true;
      }
    });
  }, [trades, activeFilter]);

  // Calculate stats based on filtered trades
  const filteredStats = useMemo(() => {
    if (filteredTrades.length === 0) {
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

    const wins = filteredTrades.filter(t => t.result.toLowerCase() === 'win');
    const losses = filteredTrades.filter(t => t.result.toLowerCase() === 'loss');
    const breakevens = filteredTrades.filter(t => t.result.toLowerCase() === 'breakeven');

    // Calculate P&L using actual pnl_dollar values when available
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
    for (let i = 0; i < filteredTrades.length; i++) {
      const result = filteredTrades[i].result.toLowerCase();
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
      totalTrades: filteredTrades.length,
      wins: wins.length,
      losses: losses.length,
      breakevens: breakevens.length,
      winRate: filteredTrades.length > 0 ? (wins.length / filteredTrades.length) * 100 : 0,
      avgWinRR,
      avgLossRR,
      profitFactor,
      currentWinStreak,
      currentLossStreak,
      topWinRR,
      topLossRR,
      totalRR,
    };
  }, [filteredTrades, activeAccount?.starting_balance]);

  const formattedTrades: FormattedTrade[] = filteredTrades.map(trade => ({
    id: trade.id,
    date: new Date(trade.date).toLocaleDateString(),
    symbol: trade.symbol || 'N/A',
    side: trade.side as "LONG" | "SHORT" || 'LONG',
    entry_price: Number(trade.entry_price) || 0,
    exit_price: Number(trade.exit_price) || 0,
    quantity: Number(trade.quantity) || 0,
    setup_tag: trade.setup_tag || trade.session || 'N/A',
    rr: Number(trade.rr) || 0,
    result: trade.result as "Win" | "Loss" | "Breakeven" || 'Breakeven',
    pnl_dollar: Number(trade.pnl_dollar) || 0,
    notes: trade.notes,
    image_url: trade.image_url,
    commission: Number(trade.commission) || 0
  }));

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>;
  }

  // Calculate portfolio value and P&L
  const portfolioValue = activeAccount ? activeAccount.current_balance : 0;
  const startingBalance = activeAccount ? activeAccount.starting_balance : 0;
  const portfolioPnL = activeAccount ? portfolioValue - startingBalance : 0;

  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.5
  }} className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              PropFirm Knowledge Journal
            </h1>
            <p className="text-muted-foreground">Professional Trading Dashboard</p>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
          {/* Portfolio Balance */}
          <div className="text-right bg-card p-4 rounded-lg border border-border">
            <div className="text-2xl font-bold text-foreground">
              ${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-muted-foreground">
              {activeAccount ? activeAccount.name : 'No Active Account'}
            </div>
            {activeAccount && <div className={`text-sm font-medium ${portfolioPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                P&L: {portfolioPnL >= 0 ? '+' : ''}${portfolioPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>}
          </div>

          {/* Social Links */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="https://x.com/free_propfirm?s=09" target="_blank" rel="noopener noreferrer">
                <Twitter className="w-4 h-4" />
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://telegram.dog/free_propfirm_accounts" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4" />
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://discord.gg/7MRsuqqT3n" target="_blank" rel="noopener noreferrer">
                <Users className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Time Filter */}
      <TimeFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.1
      }}>
          <StatsCard title="WINS" value={filteredStats.wins.toString()} change={`${filteredStats.winRate.toFixed(1)}%`} positive={true} icon={<TrendingUp className="w-5 h-5" />} />
        </motion.div>
        
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.2
      }}>
          <StatsCard title="LOSSES" value={filteredStats.losses.toString()} change={`${(100 - filteredStats.winRate).toFixed(1)}%`} positive={false} icon={<TrendingDown className="w-5 h-5" />} />
        </motion.div>
        
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.3
      }}>
          <StatsCard title="OPEN" value="0" change="0%" icon={<Target className="w-5 h-5" />} />
        </motion.div>
        
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.4
      }}>
          <StatsCard title="WASH" value={filteredStats.breakevens.toString()} change={`${filteredStats.totalTrades > 0 ? (filteredStats.breakevens / filteredStats.totalTrades * 100).toFixed(1) : 0}%`} icon={<Target className="w-5 h-5" />} />
        </motion.div>
        
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.5
      }}>
          <StatsCard title="AVG WIN" value={`${filteredStats.avgWinRR.toFixed(1)}R`} positive={true} icon={<DollarSign className="w-5 h-5" />} />
        </motion.div>
        
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.6
      }}>
          <StatsCard title="AVG LOSS" value={`${filteredStats.avgLossRR.toFixed(1)}R`} positive={false} icon={<DollarSign className="w-5 h-5" />} />
        </motion.div>
        
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.7
      }}>
          <StatsCard title="PNL $" value={`${filteredStats.totalRR > 0 ? '+' : ''}$${Math.abs(filteredStats.totalRR).toFixed(2)}`} positive={filteredStats.totalRR >= 0} icon={<BarChart3 className="w-5 h-5" />} />
        </motion.div>
        
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.8
      }}>
          <StatsCard title="PNL %" value={`${filteredStats.totalRR > 0 ? '+' : ''}${activeAccount ? (filteredStats.totalRR / activeAccount.starting_balance * 100).toFixed(2) : '0.00'}%`} positive={filteredStats.totalRR >= 0} icon={<BarChart3 className="w-5 h-5" />} />
        </motion.div>
        
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.9
      }}>
          <StatsCard title="PROFIT FACTOR" value={filteredStats.profitFactor === Infinity ? "∞" : filteredStats.profitFactor.toFixed(2)} positive={filteredStats.profitFactor > 1} icon={<BarChart3 className="w-5 h-5" />} />
        </motion.div>
        
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 1.0
      }}>
          <StatsCard title="BEST DAY" value="N/A" positive={true} icon={<TrendingUp className="w-5 h-5" />} />
        </motion.div>
        
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 1.1
      }}>
          <StatsCard title="STREAK" value={filteredStats.currentWinStreak.toString()} positive={filteredStats.currentWinStreak > 0} icon={<Target className="w-5 h-5" />} />
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <NewTradeModal onTradeAdded={refetchTrades} />
      </div>

      {/* Trade Table */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: 1.2
    }}>
        <TradingTable trades={filteredTrades} onTradeUpdated={refetchTrades} />
      </motion.div>

      {/* Demo Notice */}
      {filteredStats.totalTrades === 0 && <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      delay: 1.3
    }} className="text-center p-8 bg-muted/20 rounded-lg border border-border">
          <p className="text-muted-foreground">
            No trades found for the selected time period. Start by adding your first trade!
          </p>
        </motion.div>}
    </motion.div>;
}