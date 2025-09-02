import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Edit3, DollarSign, Target, TrendingUp, Calendar, Clock, FileText, Image as ImageIcon, X } from "lucide-react";
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
    
    // Use actual pnl_dollar if available
    if (trade.pnl_dollar !== null && trade.pnl_dollar !== undefined) {
      return Number(trade.pnl_dollar);
    }
    
    // Fallback to R:R based calculation using starting balance
    const riskPercentage = trade.risk_percentage || 1.0; // Default to 1% if not set
    const riskAmount = activeAccount.starting_balance * (riskPercentage / 100);
    
    if (trade.result === 'Win') {
      return riskAmount * Number(trade.rr || 0);
    } else if (trade.result === 'Loss') {
      return -riskAmount;
    } else {
      return 0; // Breakeven
    }
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
        {/* Trade Summary */}
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
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Result</span>
                <Badge className={getResultColor(trade.result)}>
                  {trade.result}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Session</span>
                <Badge variant="outline" className="border-border">
                  {trade.session}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium text-card-foreground">
                  {new Date(trade.date).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">P&L</span>
                <span className={cn(
                  "font-bold",
                  pnl >= 0 ? "text-success" : "text-destructive"
                )}>
                  ${pnl > 0 ? '+' : ''}{pnl.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Risk Metrics */}
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Risk:Reward</span>
                  <span className="font-medium text-card-foreground">
                    {trade.rr ? `1:${trade.rr}` : 'N/A'}
                  </span>
                </div>
                {trade.rr && (
                  <div className="space-y-1">
                    <Progress 
                      value={getRRProgress(trade.rr)} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      R:R Ratio: {trade.rr.toFixed(1)}
                    </p>
                  </div>
                )}
              </div>

              {activeAccount && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Risk %</span>
                    <span className="font-medium text-card-foreground">
                      {trade.risk_percentage ? `${trade.risk_percentage}%` : '1.0%'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Risk Amount</span>
                    <span className="font-medium text-card-foreground">
                      {activeAccount && trade.risk_percentage && (
                        <>
                          ${(
                            activeAccount.starting_balance * 
                            (parseFloat(trade.risk_percentage?.toString() || '1.0') / 100)
                          ).toFixed(2)}
                        </>
                      )}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Strategy Insights */}
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
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Session</span>
                <span className="font-medium text-card-foreground">
                  {trade.session}
                </span>
              </div>

              {trade.strategy_tag && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Strategy</span>
                  <span className="font-medium text-card-foreground">
                    {trade.strategy_tag}
                  </span>
                </div>
              )}

              {trade.strategy_tag && strategyCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Strategy Usage</span>
                  <span className="font-medium text-card-foreground">
                    {strategyCount} trades
                  </span>
                </div>
              )}

              <Separator />

              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  Logged {new Date(trade.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  Last updated {new Date(trade.updated_at).toLocaleDateString()}
                </span>
              </div>
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

      {/* Trade Image */}
      {trade.image_url && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gradient-card shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <ImageIcon className="h-5 w-5" />
                Chart Screenshot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImageWithFallback
                src={trade.image_url}
                alt="Trade chart screenshot"
                className="w-full h-auto rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setImageDialogOpen(true)}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Image Modal Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle>Trade Screenshot</DialogTitle>
            <DialogDescription>Click outside or press ESC to close</DialogDescription>
          </DialogHeader>
          <div className="p-4 flex items-center justify-center max-h-[80vh] overflow-hidden">
            {trade?.image_url && (
              <ImageWithFallback
                src={trade.image_url}
                alt="Trade chart screenshot"
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}