import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Trade } from './useTrades';

export function useTradeActions() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const deleteTrade = async (tradeId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', tradeId);

      if (error) throw error;

      toast({
        title: "Trade Deleted",
        description: "Trade has been deleted successfully.",
      });
    } catch (err) {
      console.error('Error deleting trade:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete trade',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const shareTrade = async (trade: Trade) => {
    try {
      const shareText = `${trade.side || 'Trade'} ${trade.symbol || ''} - ${trade.result} (${trade.rr ? `1:${trade.rr}` : 'N/A'} R:R)`.trim();
      
      if (navigator.share && navigator.canShare && navigator.canShare({ text: shareText })) {
        await navigator.share({
          title: `Trade on ${trade.symbol || 'Unknown'}`,
          text: shareText,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied to Clipboard",
          description: "Trade details copied to clipboard.",
        });
      }
    } catch (err) {
      // Final fallback: try copying to clipboard
      try {
        const shareText = `${trade.side || 'Trade'} ${trade.symbol || ''} - ${trade.result} (${trade.rr ? `1:${trade.rr}` : 'N/A'} R:R)`.trim();
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied to Clipboard", 
          description: "Trade details copied to clipboard.",
        });
      } catch (clipboardErr) {
        console.error('Error sharing/copying trade:', err);
        toast({
          title: "Error",
          description: "Failed to share trade details",
          variant: "destructive",
        });
      }
    }
  };

  const viewImage = (imageUrl: string) => {
    window.open(imageUrl, '_blank');
  };

  return {
    deleteTrade,
    shareTrade,
    viewImage,
    loading,
  };
}