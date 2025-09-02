import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TradeWithImage {
  id: string;
  date: string;
  symbol: string;
  image_url: string | null;
  created_at: string;
}

export function ExistingTradesImageDebug() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<TradeWithImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  const fetchTrades = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('id, date, symbol, image_url, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTrades(data || []);
    } catch (error) {
      console.error('Error fetching trades:', error);
    }
    setLoading(false);
  };

  const testImageUrl = async (tradeId: string, imageUrl: string) => {
    setTestResults(prev => ({ ...prev, [tradeId]: 'testing...' }));
    
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      if (response.ok) {
        setTestResults(prev => ({ ...prev, [tradeId]: '✅ accessible' }));
      } else {
        setTestResults(prev => ({ ...prev, [tradeId]: `❌ ${response.status}` }));
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [tradeId]: '❌ fetch error' }));
    }
  };

  useEffect(() => {
    fetchTrades();
  }, [user]);

  if (!user) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-muted-foreground">Please log in to check existing trades</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Existing Trades Image Debug
          <Button onClick={fetchTrades} disabled={loading} size="sm">
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {trades.length === 0 ? (
          <p className="text-muted-foreground">No trades found</p>
        ) : (
          <div className="space-y-3">
            {trades.map((trade) => (
              <div key={trade.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{trade.symbol}</span>
                    <span className="text-muted-foreground ml-2">
                      {new Date(trade.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {trade.image_url ? (
                      <>
                        <Badge variant="outline">Has Image</Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => testImageUrl(trade.id, trade.image_url!)}
                        >
                          Test Access
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => window.open(trade.image_url!, '_blank')}
                        >
                          Open
                        </Button>
                      </>
                    ) : (
                      <Badge variant="secondary">No Image</Badge>
                    )}
                  </div>
                </div>
                
                {trade.image_url && (
                  <div className="text-xs space-y-1">
                    <div className="font-mono bg-muted p-2 rounded text-xs break-all">
                      {trade.image_url}
                    </div>
                    {testResults[trade.id] && (
                      <div className="text-sm">
                        Status: {testResults[trade.id]}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}