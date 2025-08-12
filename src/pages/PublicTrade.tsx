import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, TrendingUp, Target, Clock } from 'lucide-react';

interface PublicTrade {
  id: string;
  date: string;
  session: string;
  strategy_tag: string | null;
  result: string;
  rr: number | null;
  notes: string | null;
  image_url: string | null;
  created_at: string;
}

const PublicTrade = () => {
  const { tradeId } = useParams();
  const [trade, setTrade] = useState<PublicTrade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicTrade = async () => {
      if (!tradeId) {
        setError('Trade ID not provided');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('trades')
          .select('id, date, session, strategy_tag, result, rr, notes, image_url, created_at')
          .eq('id', tradeId)
          .eq('is_public', true)
          .single();

        if (error) throw error;

        setTrade(data);
      } catch (err) {
        console.error('Error fetching public trade:', err);
        setError('Trade not found or not publicly shared');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicTrade();
  }, [tradeId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading trade details...</p>
        </div>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Trade Not Found</h2>
            <p className="text-muted-foreground">
              {error || 'This trade is not publicly shared or does not exist.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getResultColor = (result: string) => {
    switch (result.toLowerCase()) {
      case 'win': return 'text-success bg-success/10 border-success/20';
      case 'loss': return 'text-destructive bg-destructive/10 border-destructive/20';
      default: return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Shared Trade</h1>
            <p className="text-muted-foreground">Public trading record</p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Trade Details</CardTitle>
                <Badge className={getResultColor(trade.result)}>
                  {trade.result}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Trade Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Date
                  </div>
                  <p className="font-medium">
                    {new Date(trade.date).toLocaleDateString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-2" />
                    Session
                  </div>
                  <p className="font-medium">{trade.session}</p>
                </div>

                {trade.strategy_tag && (
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Target className="w-4 h-4 mr-2" />
                      Strategy
                    </div>
                    <Badge variant="outline">{trade.strategy_tag}</Badge>
                  </div>
                )}

                {trade.rr !== null && (
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Risk/Reward
                    </div>
                    <p className="font-medium text-lg">
                      {trade.rr > 0 ? '+' : ''}{trade.rr}R
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {trade.notes && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-muted-foreground">Notes</h3>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{trade.notes}</p>
                  </div>
                </div>
              )}

              {/* Trade Screenshot */}
              {trade.image_url && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-muted-foreground">Trade Screenshot</h3>
                  <div className="rounded-lg overflow-hidden border">
                    <img 
                      src={trade.image_url} 
                      alt="Trade screenshot"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="pt-4 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">
                  Shared on {new Date(trade.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PublicTrade;