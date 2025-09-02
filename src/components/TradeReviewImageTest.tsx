import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { useToast } from '@/hooks/use-toast';

interface TradeWithImage {
  id: string;
  date: string;
  symbol: string;
  image_url: string | null;
  created_at: string;
  result: string;
}

export function TradeReviewImageTest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trades, setTrades] = useState<TradeWithImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  const fetchTradesWithImages = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('id, date, symbol, image_url, created_at, result')
        .eq('user_id', user.id)
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setTrades(data || []);
      
      if (data && data.length > 0) {
        toast({
          title: "Trade Images Found",
          description: `Found ${data.length} trades with images`,
        });
      } else {
        toast({
          title: "No Images Found",
          description: "No trades with images found. Try uploading an image to a trade first.",
          variant: "secondary",
        });
      }
    } catch (error) {
      console.error('Error fetching trades with images:', error);
      toast({
        title: "Error",
        description: "Failed to fetch trades with images",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const testImageAccess = async (tradeId: string, imageUrl: string) => {
    setTestResults(prev => ({ ...prev, [tradeId]: 'testing...' }));
    
    try {
      // Test direct fetch
      const response = await fetch(imageUrl, { 
        method: 'HEAD',
        headers: {
          'Accept': 'image/*',
        }
      });
      
      if (response.ok) {
        setTestResults(prev => ({ ...prev, [tradeId]: '✅ accessible' }));
      } else {
        setTestResults(prev => ({ ...prev, [tradeId]: `❌ ${response.status} ${response.statusText}` }));
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [tradeId]: '❌ network error' }));
    }
  };

  const testAllImages = async () => {
    for (const trade of trades) {
      if (trade.image_url) {
        await testImageAccess(trade.id, trade.image_url);
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchTradesWithImages();
    }
  }, [user]);

  if (!user) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-muted-foreground">Please log in to test trade review images</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          🖼️ Trade Review Image Test
          <div className="flex gap-2">
            <Button onClick={fetchTradesWithImages} disabled={loading} size="sm">
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button onClick={testAllImages} disabled={loading || trades.length === 0} size="sm" variant="outline">
              Test All Images
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {trades.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              {loading ? 'Loading trades...' : 'No trades with images found'}
            </p>
            {!loading && (
              <p className="text-sm text-muted-foreground">
                Upload an image to a trade first, then refresh this component to test image display.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {trades.map((trade) => (
              <div key={trade.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-medium">{trade.symbol}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(trade.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={trade.result === 'Win' ? 'default' : 'secondary'}>
                      {trade.result}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => testImageAccess(trade.id, trade.image_url!)}
                    >
                      Test Access
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => window.open(trade.image_url!, '_blank')}
                    >
                      Open Direct
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Image Display Test */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Image Display (as in Trade Review):</h4>
                    <div className="border rounded-lg p-2 bg-muted/10">
                      <ImageWithFallback
                        src={trade.image_url}
                        alt="Trade screenshot"
                        className="w-full h-32 object-cover rounded"
                      />
                    </div>
                  </div>
                  
                  {/* URL and Test Results */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">URL & Access Test:</h4>
                    <div className="space-y-2">
                      <div className="font-mono bg-muted p-2 rounded text-xs break-all">
                        {trade.image_url}
                      </div>
                      {testResults[trade.id] && (
                        <div className="text-sm">
                          <strong>Status:</strong> {testResults[trade.id]}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}