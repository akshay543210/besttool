import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Trade } from "@/hooks/useTrades"

interface SmartSuggestionsProps {
  trades: Trade[]
  stats: {
    winRate: number
    avgWinRR: number
    avgLossRR: number
    totalRR: number
    currentWinStreak: number
    currentLossStreak: number
  }
}

interface Suggestion {
  id: string
  type: 'success' | 'warning' | 'danger'
  icon: React.ReactNode
  title: string
  message: string
}

export function SmartSuggestions({ trades, stats }: SmartSuggestionsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const suggestions = useMemo(() => {
    if (trades.length === 0) {
      return [{
        id: 'no-data',
        type: 'warning' as const,
        icon: <AlertTriangle className="w-4 h-4" />,
        title: 'Get Started',
        message: 'Add some trades to receive personalized suggestions based on your performance.'
      }]
    }

    // Get last 10-15 trades for analysis
    const recentTrades = trades.slice(0, 15)
    const last10Trades = trades.slice(0, 10)
    
    const suggestions: Suggestion[] = []

    // Calculate recent win rate
    const recentWinRate = last10Trades.length > 0 
      ? (last10Trades.filter(t => t.result.toLowerCase() === 'win').length / last10Trades.length) * 100
      : 0

    // Calculate average R:R for recent trades
    const recentAvgRR = last10Trades.length > 0
      ? last10Trades.reduce((sum, trade) => sum + (trade.rr || 0), 0) / last10Trades.length
      : 0

    // Win streak analysis
    if (stats.currentWinStreak >= 3) {
      suggestions.push({
        id: 'win-streak',
        type: 'success',
        icon: <CheckCircle className="w-4 h-4" />,
        title: 'Excellent Momentum! 🔥',
        message: 'You\'re on a winning streak! Stay disciplined and keep following your proven strategy. Document what\'s working.'
      })
    }

    // Drawdown analysis
    if (recentWinRate < 40 && last10Trades.length >= 5) {
      suggestions.push({
        id: 'drawdown',
        type: 'danger',
        icon: <TrendingDown className="w-4 h-4" />,
        title: 'Review Required',
        message: 'Recent win rate is below 40%. Consider reducing risk per trade and focusing on your highest probability setups.'
      })
    }

    // Loss streak warning
    if (stats.currentLossStreak >= 3) {
      suggestions.push({
        id: 'loss-streak',
        type: 'danger',
        icon: <AlertTriangle className="w-4 h-4" />,
        title: 'Take a Break',
        message: 'Multiple consecutive losses detected. Step back, review your strategy, and consider paper trading until confidence returns.'
      })
    }

    // R:R ratio analysis
    if (recentAvgRR < 1.5 && last10Trades.length >= 5) {
      suggestions.push({
        id: 'low-rr',
        type: 'warning',
        icon: <Target className="w-4 h-4" />,
        title: 'Low Risk/Reward',
        message: 'Your recent trades show low R:R ratio. Focus on setups with at least 2:1 reward potential.'
      })
    }

    // Good performance analysis
    if (recentWinRate >= 60 && stats.currentWinStreak <= 2) {
      suggestions.push({
        id: 'good-performance',
        type: 'success',
        icon: <TrendingUp className="w-4 h-4" />,
        title: 'Strong Performance',
        message: 'Your recent win rate is excellent! Continue with your current strategy and consider slightly increasing position size.'
      })
    }

    // Session analysis
    const sessionPerformance = ['Asia', 'London', 'NY Open', 'NY Close'].map(session => {
      const sessionTrades = recentTrades.filter(t => t.session.toLowerCase() === session.toLowerCase())
      const sessionWinRate = sessionTrades.length > 0 
        ? (sessionTrades.filter(t => t.result.toLowerCase() === 'win').length / sessionTrades.length) * 100
        : 0
      return { session, winRate: sessionWinRate, tradeCount: sessionTrades.length }
    }).filter(s => s.tradeCount >= 3)

    const bestSession = sessionPerformance.reduce((best, current) => 
      current.winRate > best.winRate ? current : best, { session: '', winRate: 0, tradeCount: 0 })

    if (bestSession.session && bestSession.winRate >= 70) {
      suggestions.push({
        id: 'best-session',
        type: 'success',
        icon: <Target className="w-4 h-4" />,
        title: 'Session Strength',
        message: `You perform best during ${bestSession.session} session (${bestSession.winRate.toFixed(0)}% win rate). Focus more trades here.`
      })
    }

    // Overall consistency check
    if (stats.winRate >= 55 && stats.totalRR > 0) {
      suggestions.push({
        id: 'consistency',
        type: 'success',
        icon: <CheckCircle className="w-4 h-4" />,
        title: 'Consistent Trader',
        message: 'Great consistency! Your positive expectancy shows you have a working system. Keep refining it.'
      })
    }

    // If no specific suggestions, provide general guidance
    if (suggestions.length === 0) {
      suggestions.push({
        id: 'general',
        type: 'warning',
        icon: <Lightbulb className="w-4 h-4" />,
        title: 'Keep Building',
        message: 'Your trading data is growing. Focus on consistency, proper risk management, and documenting your strategy.'
      })
    }

    return suggestions
  }, [trades, stats])

  const handleRefresh = () => {
    setLastUpdate(new Date())
  }

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'success': return 'default'
      case 'warning': return 'secondary'
      case 'danger': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-gradient-card shadow-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Smart Suggestions</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-8 px-2 text-xs"
              >
                {isCollapsed ? 'Show' : 'Hide'}
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Based on your last {Math.min(trades.length, 10)} trades • Updated {lastUpdate.toLocaleTimeString()}
          </p>
        </CardHeader>
        
        {!isCollapsed && (
          <CardContent className="pt-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-lg border transition-colors",
                    suggestion.type === 'success' && "bg-success/5 border-success/20",
                    suggestion.type === 'warning' && "bg-warning/5 border-warning/20",
                    suggestion.type === 'danger' && "bg-destructive/5 border-destructive/20"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 p-1 rounded-full",
                    suggestion.type === 'success' && "text-success",
                    suggestion.type === 'warning' && "text-warning",
                    suggestion.type === 'danger' && "text-destructive"
                  )}>
                    {suggestion.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-card-foreground">
                        {suggestion.title}
                      </h4>
                      <Badge variant={getBadgeVariant(suggestion.type)} className="text-xs">
                        {suggestion.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {suggestion.message}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  )
}