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
import { Edit, Trash2, Share, Image } from 'lucide-react'
import { useTradeActions } from '@/hooks/useTradeActions'
import { EditTradeModal } from './EditTradeModal'
import type { Trade } from '@/hooks/useTrades'

interface TradingTableProps {
  trades: Trade[]
  onTradeUpdated: () => void
}

export function TradingTable({ trades, onTradeUpdated }: TradingTableProps) {
  const { deleteTrade, shareTrade, viewImage, loading } = useTradeActions();
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  const handleEdit = (trade: Trade) => {
    setEditingTrade(trade);
  };

  const handleDelete = async (tradeId: string) => {
    await deleteTrade(tradeId);
    onTradeUpdated();
  };

  const handleShare = (trade: Trade) => {
    shareTrade(trade);
  };

  const handleViewImage = (imageUrl: string) => {
    viewImage(imageUrl);
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
                <TableHead className="text-muted-foreground">Setup Tag</TableHead>
                <TableHead className="text-muted-foreground">Risk %</TableHead>
                <TableHead className="text-muted-foreground">R:R</TableHead>
                <TableHead className="text-muted-foreground">Result</TableHead>
                <TableHead className="text-muted-foreground">P&L</TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade, index) => (
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
                    {trade.setup_tag ? (
                      <Badge variant="outline" className="border-border text-muted-foreground">
                        {trade.setup_tag}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {trade.risk_percentage ? `${trade.risk_percentage}%` : 'N/A'}
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
                    Number(trade.pnl_dollar || 0) >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {trade.pnl_dollar !== null && trade.pnl_dollar !== undefined ? (
                      <>
                        {Number(trade.pnl_dollar) > 0 ? '+' : ''}${Number(trade.pnl_dollar).toFixed(2)}
                      </>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
              ))}
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