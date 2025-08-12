import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, Plus, Share2, Check, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAccounts } from '@/hooks/useAccounts';

import type { Trade } from "@/hooks/useTrades";

interface RecentTradesTableProps {
  trades: Trade[];
  onTradeUpdate: () => void;
}

export function RecentTradesTable({ trades, onTradeUpdate }: RecentTradesTableProps) {
  const { user } = useAuth();
  const { getActiveAccount } = useAccounts();
  const { toast } = useToast();
  const navigate = useNavigate();
  const activeAccount = getActiveAccount();
  
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedTradeId, setCopiedTradeId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    date: '',
    session: '',
    strategy_tag: '',
    rr: '',
    result: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      session: '',
      strategy_tag: '',
      rr: '',
      result: '',
      notes: '',
    });
  };

  const openEditDialog = (trade: Trade) => {
    setEditingTrade(trade);
    setFormData({
      date: new Date(trade.date).toISOString().split('T')[0],
      session: trade.session,
      strategy_tag: trade.strategy_tag || '',
      rr: trade.rr?.toString() || '',
      result: trade.result,
      notes: trade.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingTrade(null);
    resetForm();
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !activeAccount) {
      toast({
        title: "Error",
        description: "You must be logged in with an active account",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const tradeData = {
        user_id: user.id,
        account_id: activeAccount.id,
        date: new Date(formData.date).toISOString(),
        session: formData.session,
        strategy_tag: formData.strategy_tag || null,
        rr: formData.rr ? parseFloat(formData.rr) : null,
        result: formData.result,
        notes: formData.notes || null,
      };

      if (editingTrade) {
        // Update existing trade
        const { error } = await supabase
          .from('trades')
          .update(tradeData)
          .eq('id', editingTrade.id);

        if (error) throw error;

        toast({
          title: "Trade Updated",
          description: "Trade has been updated successfully.",
        });
      } else {
        // Create new trade
        const { error } = await supabase
          .from('trades')
          .insert(tradeData);

        if (error) throw error;

        toast({
          title: "Trade Added",
          description: "New trade has been added successfully.",
        });
      }

      setIsEditDialogOpen(false);
      onTradeUpdate();
    } catch (error) {
      console.error('Error saving trade:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save trade',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tradeId: string) => {
    try {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', tradeId);

      if (error) throw error;

      toast({
        title: "Trade Deleted",
        description: "Trade has been deleted successfully.",
      });

      onTradeUpdate();
    } catch (error) {
      console.error('Error deleting trade:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete trade',
        variant: "destructive",
      });
    }
  };

  const handleShare = async (tradeId: string) => {
    try {
      // Toggle the is_public status
      const { error } = await supabase
        .from('trades')
        .update({ is_public: true })
        .eq('id', tradeId);

      if (error) throw error;

      // Generate shareable link
      const shareUrl = `${window.location.origin}/trade/${tradeId}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      setCopiedTradeId(tradeId);
      
      toast({
        title: "Share Link Copied!",
        description: "Trade link has been copied to clipboard and made public.",
      });

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedTradeId(null), 2000);
      
      // Refresh trades to reflect the updated is_public status
      onTradeUpdate();
      
    } catch (err) {
      console.error('Error sharing trade:', err);
      toast({
        title: "Error",
        description: "Failed to share trade",
        variant: "destructive",
      });
    }
  };

  const calculatePnL = (trade: Trade) => {
    if (!activeAccount) return 0;
    
    // Use actual pnl_dollar if available
    if (trade.pnl_dollar !== null && trade.pnl_dollar !== undefined) {
      return Number(trade.pnl_dollar);
    }
    
    // Fallback to R:R based calculation
    const riskAmount = activeAccount.starting_balance * (activeAccount.risk_per_trade / 100);
    
    if (trade.result === 'Win') {
      return riskAmount * Number(trade.rr || 0);
    } else if (trade.result === 'Loss') {
      return -riskAmount;
    } else {
      return 0; // Breakeven
    }
  };

  return (
    <Card className="bg-gradient-card shadow-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-card-foreground">Recent Trades</CardTitle>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Trade
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTrade ? 'Edit Trade' : 'Add New Trade'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="session">Session</Label>
                  <Select
                    value={formData.session}
                    onValueChange={(value) => setFormData({ ...formData, session: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select session" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia">Asia</SelectItem>
                      <SelectItem value="London">London</SelectItem>
                      <SelectItem value="NY Open">NY Open</SelectItem>
                      <SelectItem value="NY Close">NY Close</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="strategy_tag">Strategy Tag</Label>
                  <Input
                    id="strategy_tag"
                    value={formData.strategy_tag}
                    onChange={(e) => setFormData({ ...formData, strategy_tag: e.target.value })}
                    placeholder="e.g., ORB, Breakout"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rr">Risk/Reward</Label>
                  <Input
                    id="rr"
                    type="number"
                    step="0.1"
                    value={formData.rr}
                    onChange={(e) => setFormData({ ...formData, rr: e.target.value })}
                    placeholder="e.g., 1.5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="result">Result</Label>
                <Select
                  value={formData.result}
                  onValueChange={(value) => setFormData({ ...formData, result: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Win">Win</SelectItem>
                    <SelectItem value="Loss">Loss</SelectItem>
                    <SelectItem value="Breakeven">Breakeven</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Trade notes..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={loading} className="flex-1">
                  {loading ? 'Saving...' : (editingTrade ? 'Update Trade' : 'Add Trade')}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)} 
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/50">
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground">Session</TableHead>
              <TableHead className="text-muted-foreground">Strategy</TableHead>
              <TableHead className="text-muted-foreground">R:R</TableHead>
              <TableHead className="text-muted-foreground">Result</TableHead>
              <TableHead className="text-muted-foreground">P&L</TableHead>
              <TableHead className="text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No trades found. Add your first trade to get started.
                </TableCell>
              </TableRow>
            ) : (
              trades.map((trade) => (
                <TableRow key={trade.id} className="border-border hover:bg-muted/50">
                  <TableCell className="text-card-foreground">
                    {new Date(trade.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      {trade.session}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-card-foreground">
                    {trade.strategy_tag || '-'}
                  </TableCell>
                  <TableCell className="text-card-foreground">
                    {trade.rr ? `1:${trade.rr}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={trade.result === "Win" ? "default" : trade.result === "Loss" ? "destructive" : "secondary"}
                      className={cn(
                        trade.result === "Win" && "bg-success text-success-foreground",
                        trade.result === "Loss" && "bg-destructive text-destructive-foreground"
                      )}
                    >
                      {trade.result}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn(
                    "font-semibold",
                    calculatePnL(trade) >= 0 ? "text-success" : "text-destructive"
                  )}>
                    ${calculatePnL(trade) > 0 ? '+' : ''}{calculatePnL(trade).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/review/${trade.id}`)}
                        className="h-8 w-8 p-0"
                        title="Review trade details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(trade)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(trade.id)}
                        className="h-8 w-8 p-0"
                        title="Share trade publicly"
                      >
                        {copiedTradeId === trade.id ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Share2 className="h-4 w-4" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}