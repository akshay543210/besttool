import { StatsCard } from "@/components/StatsCard"
import { PerformanceChart } from "@/components/PerformanceChart"
import { SmartSuggestions } from "@/components/SmartSuggestions"
import { TrendingUp, TrendingDown, Target, Calendar } from "lucide-react"
import { useTrades } from "@/hooks/useTrades"
import { useState, useMemo } from "react"
import { TimeFilter } from "@/components/TimeFilter"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths, subYears, isSameDay, isSameWeek, isSameMonth, isSameYear } from 'date-fns';

const Stats = () => {
  const { trades, calculateStats, loading } = useTrades()
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Filter trades based on time filter
  const filteredTrades = useMemo(() => {
    if (!trades) return [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return trades.filter(trade => {
      const tradeDate = new Date(trade.date);
      
      switch (activeFilter) {
        case 'today':
          return isSameDay(tradeDate, today);
        case 'yesterday':
          return isSameDay(tradeDate, subDays(today, 1));
        case 'this-week':
          return isSameWeek(tradeDate, today, { weekStartsOn: 0 });
        case 'last-week':
          return isSameWeek(tradeDate, subWeeks(today, 1), { weekStartsOn: 0 });
        case 'this-month':
          return isSameMonth(tradeDate, today);
        case 'last-month':
          return isSameMonth(tradeDate, subMonths(today, 1));
        case '3-months':
          return tradeDate >= subMonths(today, 3);
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
                        totalLossRR > 0 ? totalWinRR / totalLossRR : 
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
  }, [filteredTrades]);

  // Calculate performance by day of week
  const dayPerformanceData = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ].map(dayName => {
    const dayTrades = filteredTrades.filter(trade => {
      const tradeDate = new Date(trade.date)
      const tradeDayName = tradeDate.toLocaleDateString('en-US', { weekday: 'long' })
      return tradeDayName === dayName
    })
    
    const totalRR = dayTrades.reduce((sum, trade) => {
      const rr = Number(trade.rr) || 0
      return sum + (trade.result.toLowerCase() === 'win' ? rr : trade.result.toLowerCase() === 'loss' ? -rr : 0)
    }, 0)
    
    return { name: dayName, value: totalRR }
  })

  // Calculate performance by session
  const sessionPerformanceData = ['Asia', 'London', 'NY Open', 'NY Close'].map(sessionName => {
    const sessionTrades = filteredTrades.filter(trade => 
      trade.session.toLowerCase() === sessionName.toLowerCase()
    )
    
    const totalRR = sessionTrades.reduce((sum, trade) => {
      const rr = Number(trade.rr) || 0
      return sum + (trade.result.toLowerCase() === 'win' ? rr : trade.result.toLowerCase() === 'loss' ? -rr : 0)
    }, 0)
    
    return { name: sessionName, value: totalRR }
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Trading Statistics</h1>
        <div className="text-center py-8 text-muted-foreground">Loading statistics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Trading Statistics</h1>
      
      {/* Time Filter */}
      <TimeFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard
          title="WIN RATE"
          value={`${filteredStats.winRate.toFixed(1)}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          positive={filteredStats.winRate >= 50}
        />
        <StatsCard
          title="PROFIT FACTOR"
          value={filteredStats.profitFactor === Infinity ? "∞" : filteredStats.profitFactor.toFixed(2)}
          icon={<Target className="w-5 h-5" />}
          positive={filteredStats.profitFactor > 1}
        />
        <StatsCard
          title="TOTAL TRADES"
          value={filteredStats.totalTrades.toString()}
          icon={<Calendar className="w-5 h-5" />}
        />
        <StatsCard
          title="AVG WIN"
          value={`${filteredStats.avgWinRR.toFixed(1)}R`}
          icon={<TrendingUp className="w-5 h-5" />}
          positive={true}
        />
        <StatsCard
          title="AVG LOSS"
          value={`-${filteredStats.avgLossRR.toFixed(1)}R`}
          icon={<TrendingDown className="w-5 h-5" />}
          positive={false}
        />
        <StatsCard
          title="TOTAL R/R"
          value={`${filteredStats.totalRR > 0 ? '+' : ''}${filteredStats.totalRR.toFixed(1)}R`}
          icon={<TrendingUp className="w-5 h-5" />}
          positive={filteredStats.totalRR >= 0}
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatsCard
          title="WIN STREAK"
          value={filteredStats.currentWinStreak.toString()}
          positive={filteredStats.currentWinStreak > 0}
        />
        <StatsCard
          title="LOSS STREAK"
          value={filteredStats.currentLossStreak.toString()}
          positive={filteredStats.currentLossStreak === 0}
        />
        <StatsCard
          title="TOP WIN"
          value={`${filteredStats.topWinRR.toFixed(1)}R`}
          positive={true}
        />
        <StatsCard
          title="TOP LOSS"
          value={`-${filteredStats.topLossRR.toFixed(1)}R`}
          positive={false}
        />
        <StatsCard
          title="BREAKEVENS"
          value={filteredStats.breakevens.toString()}
        />
      </div>

      {/* Smart Suggestions */}
      <SmartSuggestions trades={filteredTrades} stats={filteredStats} />

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-card shadow-card border border-border rounded-lg p-6 h-96">
          <PerformanceChart 
            data={dayPerformanceData}
            title="PERFORMANCE BY DAY OF WEEK"
          />
        </div>
        <div className="bg-gradient-card shadow-card border border-border rounded-lg p-6 h-96">
          <PerformanceChart 
            data={sessionPerformanceData}
            title="PERFORMANCE BY SESSION"
          />
        </div>
      </div>
    </div>
  )
}

export default Stats