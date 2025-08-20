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

      // Only show success toast with rate limiting
      const lastToastTime = localStorage.getItem('lastTradeToastTime');
      const now = Date.now();
      if (!lastToastTime || now - parseInt(lastToastTime) > 3000) {
        toast({
          title: "Trade Deleted",
          description: "Trade has been deleted successfully.",
        });
        localStorage.setItem('lastTradeToastTime', now.toString());
      }
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
        
        // Only show success toast with rate limiting
        const lastToastTime = localStorage.getItem('lastTradeToastTime');
        const now = Date.now();
        if (!lastToastTime || now - parseInt(lastToastTime) > 3000) {
          toast({
            title: "Copied to Clipboard",
            description: "Trade details copied to clipboard.",
          });
          localStorage.setItem('lastTradeToastTime', now.toString());
        }
      }
    } catch (err) {
      // Final fallback: try copying to clipboard
      try {
        const shareText = `${trade.side || 'Trade'} ${trade.symbol || ''} - ${trade.result} (${trade.rr ? `1:${trade.rr}` : 'N/A'} R:R)`.trim();
        await navigator.clipboard.writeText(shareText);
        
        // Only show success toast with rate limiting
        const lastToastTime = localStorage.getItem('lastTradeToastTime');
        const now = Date.now();
        if (!lastToastTime || now - parseInt(lastToastTime) > 3000) {
          toast({
            title: "Copied to Clipboard", 
            description: "Trade details copied to clipboard.",
          });
          localStorage.setItem('lastTradeToastTime', now.toString());
        }
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
    // Try to open in a new tab/window
    window.open(imageUrl, '_blank');
  };

  return {
    deleteTrade,
    shareTrade,
    viewImage,
    loading,
  };
}