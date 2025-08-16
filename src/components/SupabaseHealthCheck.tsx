import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { checkSupabaseConnection } from '@/lib/supabaseHealthCheck';

export function SupabaseHealthCheck() {
  const [status, setStatus] = useState<{ 
    success: boolean; 
    error?: string; 
    details?: string;
    url?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const result = await checkSupabaseConnection();
      setStatus(result);
    } catch (error) {
      setStatus({
        success: false,
        error: 'Failed to check connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  if (!status) return null;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-card-foreground">Supabase Connection Status</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={checkStatus}
          disabled={loading}
          className="border-border hover:bg-muted"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={status.success ? "default" : "destructive"}>
              {status.success ? 'Connected' : 'Error'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {status.success ? 'Supabase is properly configured' : 'Connection issues detected'}
            </span>
          </div>
          
          {status.url && (
            <div className="text-sm">
              <span className="text-muted-foreground">URL: </span>
              <span className="font-mono text-card-foreground break-all">{status.url}</span>
            </div>
          )}
          
          {status.error && (
            <div className="text-sm">
              <span className="text-muted-foreground">Error: </span>
              <span className="text-destructive">{status.error}</span>
            </div>
          )}
          
          {status.details && (
            <div className="text-sm">
              <span className="text-muted-foreground">Details: </span>
              <span className="text-card-foreground">{status.details}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}