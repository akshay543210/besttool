import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface TradeIdea {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  session: string;
  strategy_tag: string | null;
  created_at: string;
  updated_at: string;
}

export function useTradeIdeas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tradeIdeas, setTradeIdeas] = useState<TradeIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTradeIdeas = useCallback(async () => {
    if (!user) {
      setTradeIdeas([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trade_ideas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTradeIdeas(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching trade ideas:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch trade ideas');
      toast({
        title: "Error",
        description: "Failed to fetch trade ideas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const createTradeIdea = async (idea: Omit<TradeIdea, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create trade ideas",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('trade_ideas')
        .insert({
          ...idea,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchTradeIdeas();
      
      toast({
        title: "Success",
        description: "Trade idea saved successfully",
      });

      return data;
    } catch (err) {
      console.error('Error creating trade idea:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to save trade idea',
        variant: "destructive",
      });
      return null;
    }
  };

  const updateTradeIdea = async (id: string, updates: Partial<TradeIdea>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update trade ideas",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('trade_ideas')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchTradeIdeas();
      
      toast({
        title: "Success",
        description: "Trade idea updated successfully",
      });
    } catch (err) {
      console.error('Error updating trade idea:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update trade idea',
        variant: "destructive",
      });
    }
  };

  const deleteTradeIdea = async (id: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete trade ideas",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('trade_ideas')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchTradeIdeas();
      
      toast({
        title: "Success",
        description: "Trade idea deleted successfully",
      });
    } catch (err) {
      console.error('Error deleting trade idea:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete trade idea',
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTradeIdeas();
  }, [fetchTradeIdeas]);

  // Real-time subscription for trade ideas
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('trade-ideas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trade_ideas',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchTradeIdeas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchTradeIdeas]);

  return {
    tradeIdeas,
    loading,
    error,
    refetchTradeIdeas: fetchTradeIdeas,
    createTradeIdea,
    updateTradeIdea,
    deleteTradeIdea,
  };
}