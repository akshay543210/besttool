import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAccounts } from '@/hooks/useAccounts';
import type { Trade } from '@/hooks/useTrades';

interface EditTradeModalProps {
  trade: Trade | null;
  isOpen: boolean;
  onClose: () => void;
  onTradeUpdated: () => void;
}

export function EditTradeModal({ trade, isOpen, onClose, onTradeUpdated }: EditTradeModalProps) {
  const { toast } = useToast();
  const { getActiveAccount } = useAccounts();
  const [loading, setLoading] = useState(false);
  
  const activeAccount = getActiveAccount();
  
  const [formData, setFormData] = useState({
    date: '',
    symbol: '',
    side: '',
    session: '',
    strategy_tag: '',
    rr: '',
    result: '',
    notes: '',
    risk_percentage: '',
  });

  useEffect(() => {
    if (trade) {
      setFormData({
        date: new Date(trade.date).toISOString().split('T')[0],
        symbol: trade.symbol || '',
        side: trade.side || '',
        session: trade.session || '',
        strategy_tag: trade.strategy_tag || '',
        rr: trade.rr?.toString() || '',
        result: trade.result,
        notes: trade.notes || '',
        risk_percentage: trade.risk_percentage?.toString() || '1.0',
      });
    }
  }, [trade]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trade) return;

    if (!activeAccount) {
      toast({
        title: "Error",
        description: "No active account found. Please create an account first.",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (!formData.symbol || !formData.side || !formData.result || !formData.session) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate risk percentage
    const riskPercentage = parseFloat(formData.risk_percentage);
    if (isNaN(riskPercentage) || riskPercentage <= 0 || riskPercentage > 100) {
      toast({
        title: "Error",
        description: "Risk percentage must be between 0.1 and 100",
        variant: "destructive",
      });
      return;
    }

    // Validate R:R ratio if provided
    if (formData.rr) {
      const rr = parseFloat(formData.rr);
      if (isNaN(rr) || rr <= 0) {
        toast({
          title: "Error",
          description: "R:R ratio must be a positive number",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setLoading(true);

      const updateData = {
        date: new Date(formData.date).toISOString(),
        symbol: formData.symbol || null,
        side: formData.side || null,
        session: formData.session,
        setup_tag: formData.session, // Keep for backward compatibility
        strategy_tag: formData.strategy_tag || null,
        rr: formData.rr ? Number(formData.rr)<dyad-write path="src/components/TradingTable.tsx" description="Reverting to previous version of TradingTable">
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { Edit, Trash2, Share, Image, Eye } from 'lucide-react'
import { useTradeActions } from '@/hooks/useTradeActions'
import { EditTradeModal } from './EditTradeModal'
import type { Trade } from '@/hooks/useTrades'
import { useNavigate } from 'react-router-dom'
import { useAccounts } from '@/hooks/useAccounts'

interface TradingTableProps {
  trades: Trade[]
  onTradeUpdated: () => void
}

export function TradingTable({ trades, onTradeUpdated }: TradingTableProps) {
  const { deleteTrade, shareTrade, viewImage, loading } = useTradeActions();
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const navigate = useNavigate();
  const { getActiveAccount } = useAccounts();
  const activeAccount = getActiveAccount();

  // Calculate P&L for a single trade based on risk percentage and R:R ratio
  const calculateTradePnL = (trade: Trade) => {
    if (!activeAccount) return 0;
    
    // If trade has actual pnl_dollar value, use that
    if (trade.pnl_dollar !== null && trade.pnl_dollar !== undefined) {
      return Number(trade.pnl_dollar);
    }
    
    // Calculate based on risk percentage and R:R ratio using starting balance
    const riskPercentage = trade.risk_percentage || 1.0; // Default to 1% if not set
    const riskAmount = activeAccount.starting_balance * (riskPercentage / 100);
    
    switch (trade.result.toLowerCase()) {
      case 'win':
        return riskAmount * (trade.rr || 1); // Win: risk * reward
      case 'loss':
        return -riskAmount; // Loss: -risk
      default:
        return 0; // Breakeven
    }
  };

  const handleEdit = (trade: Trade) => {
    setEditingTrade(trade);
  };

  const handleDelete = async (tradeId: string) => {
    await deleteTrade(tradeId);
    // Ensure account balance is recalculated after deletion
    onTradeUpdated();
  };

  const handleShare = (trade: Trade) => {
    shareTrade(trade);
  };

  const handleViewImage = (imageUrl: string) => {
    viewImage(imageUrl);
  };

  const handleViewDetails = (tradeId: string) => {
    navigate(`/review/${tradeId}`);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Trading History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-muted/50">
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Symbol</TableHead>
                <TableHead className="text-muted-foreground">Side</TableHead>
                <TableHead className="text-muted-foreground">Session</TableHead>
                <TableHead className="text-muted-foreground">Risk %</TableHead>
                <TableHead className="text-muted-foreground">R:R</TableHead>
                <TableHead className="text-muted-foreground">Result</TableHead>
                <TableHead className="text-muted-foreground">P&L</TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade, index) => {
                const tradePnL = calculateTradePnL(trade);
                return (
                  <motion.tr
                    key={trade.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="border-border hover:bg-muted/50 group"
                  >
                    <TableCell className="text-foreground">{new Date(trade.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono text-foreground font-medium">{trade.symbol || 'N/A'}</TableCell>
                    <TableCell>
                      {trade.side ? (
                        <Badge 
                          variant={trade.side === "LONG" ? "default" : "secondary"}
                          className={`${
                            trade.side === "LONG" 
                              ? "bg-success text-success-foreground" 
                              : "bg-destructive text-destructive-foreground"
                          } transition-colors`}
                        >
                          {trade.side}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {trade.session ? (
                        <Badge variant="outline" className="border-border text-muted-foreground">
                          {trade.session}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {trade.risk_percentage ? `${trade.risk_percentage}%` : '1.0%'}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {trade.rr ? `1:${trade.rr}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          trade.result === "Win" ? "default" : 
                          trade.result === "Loss" ? "destructive" : "secondary"
                        }
                        className={`${
                          trade.result === "Win" 
                            ? "bg-success text-success-foreground" 
                            : trade.result === "Loss"
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-muted text-muted-foreground"
                        } transition-colors`}
                      >
                        {trade.result}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn(
                      "font-semibold font-mono",
                      tradePnL >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {tradePnL !== 0 ? (
                        <>
                          {tradePnL > 0 ? '+' : ''}${Math.abs(tradePnL).toFixed(2)}
                        </>
                      ) : (
                        '$0.00'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 hover:bg-primary/10"
                            onClick={() => handleViewDetails(trade.id)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </motion.div>
                        
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 hover:bg-primary/10"
                            onClick={() => handleEdit(trade)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </motion.div>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 hover:bg-destructive/10"
                                disabled={loading}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </motion.div>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Trade</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this trade? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(trade.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 hover:bg-blue-500/10"
                            onClick={() => handleShare(trade)}
                          >
                            <Share className="h-3 w-3" />
                          </Button>
                        </motion.div>
                        
                        {trade.image_url && (
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 hover:bg-orange-500/10"
                              onClick={() => handleViewImage(trade.image_url!)}
                            >
                              <Image className="h-3 w-3" />
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {trades.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No trades found for the selected time period.</p>
          </div>
        )}
      </CardContent>
      
      <EditTradeModal
        trade={editingTrade}
        isOpen={!!editingTrade}
        onClose={() => setEditingTrade(null)}
        onTradeUpdated={onTradeUpdated}
      />
    </Card>
  )
}