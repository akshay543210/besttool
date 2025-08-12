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
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const thisYearStart = new Date(now.getFullYear(), 0, 1);
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);

    return trades.filter(trade => {
      const tradeDate = new Date(trade.date);
      switch (activeFilter) {
        case 'today':
          return tradeDate >= today;
        case 'yesterday':
          return tradeDate >= yesterday && tradeDate < today;
        case 'this-week':
          return tradeDate >= thisWeekStart;
        case 'last-week':
          return tradeDate >= lastWeekStart && tradeDate < thisWeekStart;
        case 'this-month':
          return tradeDate >= thisMonthStart;
        case 'last-month':
          return tradeDate >= lastMonthStart && tradeDate <= lastMonthEnd;
        case '3-months':
          return tradeDate >= threeMonthsAgo;
        case 'this-year':
          return tradeDate >= thisYearStart;
        case 'last-year':
          return tradeDate >= lastYearStart && tradeDate <= lastYearEnd;
        default:
          return true;
      }
    });
  }, [trades, activeFilter]);

  // Use the calculateStats function from useTrades hook for accurate stats
  const stats = useMemo(() => {
    return calculateStats;
  }, [calculateStats]);

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
          <StatsCard title="WINS" value={stats.wins.toString()} change={`${stats.winRate.toFixed(1)}%`} positive={true} icon={<TrendingUp className="w-5 h-5" />} />
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
          <StatsCard title="LOSSES" value={stats.losses.toString()} change={`${(100 - stats.winRate).toFixed(1)}%`} positive={false} icon={<TrendingDown className="w-5 h-5" />} />
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
          <StatsCard title="WASH" value={stats.breakevens.toString()} change={`${stats.totalTrades > 0 ? (stats.breakevens / stats.totalTrades * 100).toFixed(1) : 0}%`} icon={<Target className="w-5 h-5" />} />
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
          <StatsCard title="AVG WIN" value={`${stats.avgWinRR.toFixed(1)}R`} positive={true} icon={<DollarSign className="w-5 h-5" />} />
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
          <StatsCard title="AVG LOSS" value={`${stats.avgLossRR.toFixed(1)}R`} positive={false} icon={<DollarSign className="w-5 h-5" />} />
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
          <StatsCard title="PNL $" value={`${stats.totalRR > 0 ? '+' : ''}$${Math.abs(stats.totalRR).toFixed(2)}`} positive={stats.totalRR >= 0} icon={<BarChart3 className="w-5 h-5" />} />
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
          <StatsCard title="PNL %" value={`${stats.totalRR > 0 ? '+' : ''}${activeAccount ? (stats.totalRR / activeAccount.starting_balance * 100).toFixed(2) : '0.00'}%`} positive={stats.totalRR >= 0} icon={<BarChart3 className="w-5 h-5" />} />
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
          <StatsCard title="PROFIT FACTOR" value={stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)} positive={stats.profitFactor > 1} icon={<BarChart3 className="w-5 h-5" />} />
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
          <StatsCard title="STREAK" value={stats.currentWinStreak.toString()} positive={stats.currentWinStreak > 0} icon={<Target className="w-5 h-5" />} />
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
      {stats.totalTrades === 0 && <motion.div initial={{
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