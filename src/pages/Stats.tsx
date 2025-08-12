import { StatsCard } from "@/components/StatsCard"
import { PerformanceChart } from "@/components/PerformanceChart"
import { SmartSuggestions } from "@/components/SmartSuggestions"
import { TrendingUp, TrendingDown, Target, Calendar } from "lucide-react"
import { useTrades } from "@/hooks/useTrades"


const Stats = () => {
  const { trades, calculateStats, loading } = useTrades()
  const stats = calculateStats // This is now a memoized value, not a function

  // Calculate performance by day of week
  const dayPerformanceData = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ].map(dayName => {
    const dayTrades = trades.filter(trade => {
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
    const sessionTrades = trades.filter(trade => 
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
      
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard
          title="WIN RATE"
          value={`${stats.winRate.toFixed(1)}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          positive={stats.winRate >= 50}
        />
        <StatsCard
          title="PROFIT FACTOR"
          value={stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)}
          icon={<Target className="w-5 h-5" />}
          positive={stats.profitFactor > 1}
        />
        <StatsCard
          title="TOTAL TRADES"
          value={stats.totalTrades.toString()}
          icon={<Calendar className="w-5 h-5" />}
        />
        <StatsCard
          title="AVG WIN"
          value={`${stats.avgWinRR.toFixed(1)}R`}
          icon={<TrendingUp className="w-5 h-5" />}
          positive={true}
        />
        <StatsCard
          title="AVG LOSS"
          value={`-${stats.avgLossRR.toFixed(1)}R`}
          icon={<TrendingDown className="w-5 h-5" />}
          positive={false}
        />
        <StatsCard
          title="TOTAL R/R"
          value={`${stats.totalRR > 0 ? '+' : ''}${stats.totalRR.toFixed(1)}R`}
          icon={<TrendingUp className="w-5 h-5" />}
          positive={stats.totalRR >= 0}
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatsCard
          title="WIN STREAK"
          value={stats.currentWinStreak.toString()}
          positive={stats.currentWinStreak > 0}
        />
        <StatsCard
          title="LOSS STREAK"
          value={stats.currentLossStreak.toString()}
          positive={stats.currentLossStreak === 0}
        />
        <StatsCard
          title="TOP WIN"
          value={`${stats.topWinRR.toFixed(1)}R`}
          positive={true}
        />
        <StatsCard
          title="TOP LOSS"
          value={`-${stats.topLossRR.toFixed(1)}R`}
          positive={false}
        />
        <StatsCard
          title="BREAKEVENS"
          value={stats.breakevens.toString()}
        />
      </div>

      {/* Smart Suggestions */}
      <SmartSuggestions trades={trades} stats={stats} />

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