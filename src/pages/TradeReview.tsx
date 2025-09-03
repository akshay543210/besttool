import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Edit3, DollarSign, Target, TrendingUp, TrendingDown, Calendar, Clock, FileText, Image as ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAccounts } from '@/hooks/useAccounts';
import { motion } from "framer-motion";
import type { Trade } from "@/hooks/useTrades";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { cn } from "@/lib/utils";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TradeReview() {
  const { tradeId } = useParams<{ tradeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getActiveAccount } = useAccounts();
  const { toast } = useToast();
  const activeAccount = getActiveAccount();

  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [strategyCount, setStrategyCount] = useState(0);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  useEffect(() => {
    if (!tradeId || !user) return;
    
    fetchTrade();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradeId, user]);

  const fetchTrade = async () => {
    if (!tradeId || !user) return;
    
    try {
      setLoading(true);
      
      // Fetch the specific trade
      const { data: tradeData, error: tradeError } = await supabase
        .from('trades')
        .select('*')
        .eq('id', tradeId)
        .eq('user_id', user.id)
        .single();

      if (tradeError) throw tradeError;
      
      setTrade(tradeData);
      console.log('Fetched trade data:', tradeData); // Debug log
      console.log('Image URL from trade:', tradeData.image_url); // Debug log for image URL

      // Fetch strategy count if strategy_tag exists
      if (tradeData.strategy_tag) {
        const { count, error: countError } = await supabase
          .from('trades')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('strategy_tag', tradeData.strategy_tag);

        if (!countError && count !== null) {
          setStrategyCount(count);
        }
      }
    } catch (error) {
      console.error('Error fetching trade:', error);
      toast({
        title: "Error",
        description: "Failed to load trade details",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const calculatePnL = (trade: Trade) => {
    if (!activeAccount) return 0;
    
    // Use actual pnl_dollar if available (most accurate)
    if (trade.pnl_dollar !== null && trade.pnl_dollar !== undefined) {
      return Number(trade.pnl_dollar);
    }
    
    // Calculate based on risk percentage and R:R ratio using starting balance
    const riskPercentage = trade.risk_percentage || 1.0; // Default to 1% if not set
    const riskAmount = activeAccount.starting_balance * (riskPercentage / 100);
    const rrRatio = trade.rr || 1; // Default to 1:1 if not set
    
    switch (trade.result.toLowerCase()) {
      case 'win':
        return Number((riskAmount * rrRatio).toFixed(2)); // Win: risk * reward ratio
      case 'loss':
        return Number((-riskAmount).toFixed(2)); // Loss: -risk amount
      default:
        return 0; // Breakeven
    }
  };

  const calculateRiskMetrics = (trade: Trade) => {
    if (!activeAccount) return null;
    
    const riskPercentage = trade.risk_percentage || 1.0;
    const riskAmount = activeAccount.starting_balance * (riskPercentage / 100);
    const rrRatio = trade.rr || 1;
    const pnl = calculatePnL(trade);
    
    // Calculate potential reward amount
    const potentialReward = riskAmount * rrRatio;
    
    // Calculate actual return percentage
    const actualReturnPercentage = (pnl / activeAccount.starting_balance) * 100;
    
    // Calculate efficiency (actual vs expected)
    const expectedPnL = trade.result === 'Win' ? potentialReward : -riskAmount;
    const efficiency = expectedPnL !== 0 ? (pnl / expectedPnL) * 100 : 100;
    
    return {
      riskPercentage,
      riskAmount,
      rrRatio,
      potentialReward,
      actualReturnPercentage,
      efficiency,
      riskRewardQuality: rrRatio >= 2 ? 'Excellent' : rrRatio >= 1.5 ? 'Good' : rrRatio >= 1 ? 'Fair' : 'Poor'
    };
  };

  const getResultColor = (result: string) => {
    switch (result.toLowerCase()) {
      case 'win': return 'bg-success text-success-foreground';
      case 'loss': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getRRProgress = (rr: number | null) => {
    if (!rr) return 0;
    // Scale RR to percentage (1:1 = 50%, 1:2 = 66%, 1:3 = 75%, etc.)
    return Math.min((rr / (rr + 1)) * 100, 100);
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading trade details..." />;
  }

  if (!trade) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Trade not found</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const pnl = calculatePnL(trade);

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Trade Review</h1>
            <p className="text-muted-foreground">Detailed analysis of your trade</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <Edit3 className="h-4 w-4" />
          Edit Trade
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enhanced Trade Summary */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-card shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <TrendingUp className="h-5 w-5" />
                Trade Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Result Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Trade Result</span>
                  <div className="flex items-center gap-2">
                    <Badge className={cn(
                      "font-semibold px-3 py-1",
                      getResultColor(trade.result)
                    )}>
                      {trade.result}
                    </Badge>
                    {trade.result === 'Win' && (
                      <TrendingUp className="h-4 w-4 text-success" />
                    )}
                  </div>
                </div>
                
                {/* P&L Display */}
                <div className="p-3 bg-muted/20 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Profit & Loss</span>
                    <span className="text-xs text-muted-foreground">
                      {pnl >= 0 ? 'Profit' : 'Loss'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-2xl font-bold",
                      pnl >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toFixed(2)}
                    </span>
                    {pnl >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-success" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Trade Details Grid */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Session</span>
                    <Badge variant="outline" className="border-border font-medium">
                      {trade.session}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Symbol</span>
                    <span className="font-mono font-bold text-card-foreground">
                      {trade.symbol || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Side</span>
                    <div className="flex items-center gap-2">
                      {trade.side === "LONG" ? (
                        <TrendingUp className="h-4 w-4 text-success" />
                      ) : trade.side === "SHORT" ? (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      ) : null}
                      <span className="font-medium text-card-foreground">
                        {trade.side || 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Trade Date</span>
                    <span className="font-medium text-card-foreground">
                      {new Date(trade.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Performance Summary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Trade Performance</span>
                  <span className={cn(
                    "text-sm font-bold",
                    trade.result === 'Win' ? "text-success" :
                    trade.result === 'Loss' ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {trade.result === 'Win' ? '✓ Successful' :
                     trade.result === 'Loss' ? '✗ Unsuccessful' : '⚪ Neutral'}
                  </span>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Risk:Reward Ratio:</span>
                    <span className="font-mono text-card-foreground">
                      {trade.rr ? `1:${trade.rr}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Risk Percentage:</span>
                    <span className="font-mono text-card-foreground">
                      {trade.risk_percentage ? `${trade.risk_percentage}%` : '1.0%'}
                    </span>
                  </div>
                  {activeAccount && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Account Impact:</span>
                      <span className={cn(
                        "font-mono",
                        pnl >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {((pnl / activeAccount.starting_balance) * 100).toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Risk Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-card shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Target className="h-5 w-5" />
                Risk Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const metrics = calculateRiskMetrics(trade);
                if (!metrics) return <div className="text-muted-foreground">Risk metrics unavailable</div>;
                
                return (
                  <>
                    {/* Risk:Reward Ratio Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">Risk:Reward Ratio</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-card-foreground">
                            1:{metrics.rrRatio.toFixed(1)}
                          </span>
                          <Badge 
                            variant={metrics.rrRatio >= 2 ? "default" : metrics.rrRatio >= 1.5 ? "secondary" : "outline"}
                            className={cn(
                              "text-xs",
                              metrics.rrRatio >= 2 ? "bg-success/10 text-success border-success/30" :
                              metrics.rrRatio >= 1.5 ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" :
                              "bg-orange-500/10 text-orange-600 border-orange-500/30"
                            )}
                          >
                            {metrics.riskRewardQuality}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* R:R Progress Bar */}
                      <div className="space-y-2">
                        <Progress 
                          value={Math.min((metrics.rrRatio / 3) * 100, 100)} 
                          className={cn(
                            "h-3 transition-all duration-300",
                            "[&>div]:transition-all [&>div]:duration-300"
                          )}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Poor (1:0.5)</span>
                          <span>Fair (1:1)</span>
                          <span>Good (1:1.5)</span>
                          <span>Excellent (1:2+)</span>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Risk Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Risk Percentage</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-card-foreground">
                            {metrics.riskPercentage.toFixed(1)}%
                          </span>
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            metrics.riskPercentage <= 1 ? "bg-success" :
                            metrics.riskPercentage <= 2 ? "bg-yellow-500" : "bg-destructive"
                          )}></div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Risk Amount</span>
                        <span className="font-semibold text-card-foreground">
                          ${metrics.riskAmount.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Potential Reward</span>
                        <span className="font-semibold text-success">
                          ${metrics.potentialReward.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Actual Return %</span>
                        <span className={cn(
                          "font-semibold",
                          pnl >= 0 ? "text-success" : "text-destructive"
                        )}>
                          {pnl >= 0 ? '+' : ''}{metrics.actualReturnPercentage.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Performance Analysis */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Trade Efficiency</span>
                        <span className={cn(
                          "font-bold text-sm",
                          metrics.efficiency >= 90 ? "text-success" :
                          metrics.efficiency >= 70 ? "text-yellow-600" :
                          "text-destructive"
                        )}>
                          {metrics.efficiency.toFixed(0)}%
                        </span>
                      </div>
                      
                      <Progress 
                        value={Math.min(Math.max(metrics.efficiency, 0), 100)} 
                        className="h-2"
                      />
                      
                      <p className="text-xs text-muted-foreground">
                        {metrics.efficiency >= 90 ? "Excellent execution - trade performed as expected" :
                         metrics.efficiency >= 70 ? "Good execution - close to expectations" :
                         metrics.efficiency >= 50 ? "Fair execution - room for improvement" :
                         "Poor execution - significant deviation from plan"}
                      </p>
                    </div>

                    {/* Risk Summary */}
                    <div className="mt-4 p-3 bg-muted/20 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Account Balance:</span>
                          <span className="font-mono">${activeAccount?.starting_balance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Position Size:</span>
                          <span className="font-mono">{metrics.riskPercentage.toFixed(1)}% of account</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Risk-Adjusted Return:</span>
                          <span className={cn(
                            "font-mono",
                            pnl >= 0 ? "text-success" : "text-destructive"
                          )}>
                            {(metrics.actualReturnPercentage / metrics.riskPercentage).toFixed(1)}x risk
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Strategy Insights */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-card shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <DollarSign className="h-5 w-5" />
                Strategy Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Strategy Information */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Trading Session</span>
                  <Badge variant="outline" className="border-border font-semibold">
                    {trade.session}
                  </Badge>
                </div>

                {trade.strategy_tag && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">Strategy</span>
                      <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground font-semibold">
                        {trade.strategy_tag}
                      </Badge>
                    </div>
                    
                    {strategyCount > 0 && (
                      <div className="p-2 bg-muted/20 rounded-lg border border-border">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Strategy Usage</span>
                          <span className="font-bold text-card-foreground">
                            {strategyCount} trade{strategyCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Timing Analysis */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-card-foreground mb-2">Timing Analysis</h4>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Trade Date:</span>
                        <span className="font-medium text-card-foreground">
                          {new Date(trade.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    <Clock className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Logged:</span>
                        <span className="font-medium text-card-foreground">
                          {new Date(trade.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {' '}
                          {new Date(trade.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    <Clock className="h-4 w-4 text-orange-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Updated:</span>
                        <span className="font-medium text-card-foreground">
                          {new Date(trade.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {' '}
                          {new Date(trade.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Trade Context */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-card-foreground mb-2">Trade Context</h4>
                
                <div className="grid grid-cols-1 gap-3">
                  {trade.symbol && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Instrument:</span>
                      <span className="font-mono font-bold text-card-foreground">
                        {trade.symbol}
                      </span>
                    </div>
                  )}
                  
                  {trade.side && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Direction:</span>
                      <div className="flex items-center gap-2">
                        {trade.side === "LONG" ? (
                          <TrendingUp className="h-4 w-4 text-success" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                        <span className={cn(
                          "font-medium text-sm",
                          trade.side === "LONG" ? "text-success" : "text-destructive"
                        )}>
                          {trade.side}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Outcome:</span>
                    <Badge 
                      variant={trade.result === 'Win' ? 'default' : trade.result === 'Loss' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {trade.result}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Quick Stats Footer */}
              {activeAccount && (
                <div className="mt-4 p-3 bg-muted/20 rounded-lg border border-border">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Account Size:</span>
                      <span className="font-mono">${activeAccount.starting_balance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trade Impact:</span>
                      <span className={cn(
                        "font-mono",
                        pnl >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {((pnl / activeAccount.starting_balance) * 100).toFixed(3)}%
                      </span>
                    </div>
                    {trade.notes && (
                      <div className="flex justify-between">
                        <span>Has Notes:</span>
                        <span className="text-blue-500">✓ Yes</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Trade Notes */}
      {trade.notes && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-card shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <FileText className="h-5 w-5" />
                Trade Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/20 rounded-lg p-4 border border-border">
                <p className="text-card-foreground whitespace-pre-wrap">
                  {trade.notes}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Trade Screenshot Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-gradient-card shadow-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-card-foreground">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Chart Screenshot
              </div>
              {trade.image_url && (
                <Badge variant="outline" className="text-xs">
                  Click to enlarge
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trade.image_url ? (
              <div className="space-y-4">
                <div className="relative group">
                  <ImageWithFallback
                    src={trade.image_url}
                    alt="Trade chart screenshot"
                    className="w-full h-auto max-h-96 object-contain rounded-lg border border-border cursor-pointer hover:opacity-90 transition-all duration-200 group-hover:shadow-lg"
                    onClick={() => setImageDialogOpen(true)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-background/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                      <ImageIcon className="h-6 w-6 text-foreground" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Chart analysis for this trade</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setImageDialogOpen(true)}
                    className="h-8 px-3"
                  >
                    View Full Size
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 bg-muted/20 rounded-lg border border-dashed border-border">
                <div className="text-center space-y-2">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="text-muted-foreground font-medium">No screenshot available</p>
                  <p className="text-sm text-muted-foreground/70">Chart screenshots help with trade analysis</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced Image Modal Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] p-0 gap-0">
          <DialogHeader className="p-6 border-b border-border bg-background/95 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Trade Chart Screenshot
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {trade?.session} session • {new Date(trade?.date || '').toLocaleDateString()}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {trade?.image_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(trade.image_url, '_blank')}
                    className="h-8"
                  >
                    Open in New Tab
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setImageDialogOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="p-6 flex items-center justify-center bg-muted/5">
            {trade?.image_url ? (
              <div className="w-full max-h-[75vh] overflow-auto">
                <ImageWithFallback
                  src={trade.image_url}
                  alt="Trade chart screenshot"
                  className="w-full h-auto object-contain rounded-lg shadow-lg"
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No screenshot available for this trade</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}