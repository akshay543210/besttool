import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, Loader2, RefreshCw, Bug, Eye, Upload } from 'lucide-react';
import { BucketFixer } from './BucketFixer';

interface DebugTestResult {
  name: string;
  status: 'success' | 'error' | 'loading' | 'warning';
  message: string;
  details?: string;
}

interface Trade {
  id: string;
  symbol: string;
  date: string;
  image_url: string | null;
  created_at: string;
}

export function TradeImageDebugger() {
  const [tests, setTests] = useState<DebugTestResult[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const runDiagnostics = async () => {
    if (!user) return;
    
    setIsRunning(true);
    setTests([]);
    setRecentTrades([]);
    
    const testResults: DebugTestResult[] = [];

    // Test 1: Check recent trades
    try {
      setTests(prev => [...prev, {
        name: 'Recent Trades Check',
        status: 'loading',
        message: 'Fetching recent trades...'
      }]);

      const { data: tradesData, error: tradesError } = await supabase
        .from('trades')
        .select('id, symbol, date, image_url, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (tradesError) throw tradesError;
      
      setRecentTrades(tradesData || []);
      
      const tradesWithImages = tradesData?.filter(t => t.image_url) || [];
      const tradesWithoutImages = tradesData?.filter(t => !t.image_url) || [];
      
      testResults.push({
        name: 'Recent Trades Check',
        status: 'success',
        message: `Found ${tradesData?.length || 0} recent trades`,
        details: `With images: ${tradesWithImages.length}, Without images: ${tradesWithoutImages.length}`
      });
    } catch (error: any) {
      testResults.push({
        name: 'Recent Trades Check',
        status: 'error',
        message: 'Failed to fetch recent trades',
        details: error.message
      });
    }

    // Test 2: Check bucket existence
    try {
      setTests(prev => [...prev, {
        name: 'Storage Bucket Status',
        status: 'loading',
        message: 'Checking storage buckets...'
      }]);

      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) throw bucketsError;
      
      const screenshotsBucket = buckets.find(b => b.id === 'screenshots');
      const tradeScreenshotsBucket = buckets.find(b => b.id === 'trade-screenshots');
      
      let status: 'success' | 'warning' | 'error' = 'success';
      let message = '';
      let details = '';
      
      if (tradeScreenshotsBucket && screenshotsBucket) {
        message = 'Both buckets exist';
        details = `screenshots: ${screenshotsBucket.public ? 'Public' : 'Private'}, trade-screenshots: ${tradeScreenshotsBucket.public ? 'Public' : 'Private'}`;
      } else if (tradeScreenshotsBucket) {
        message = 'trade-screenshots bucket exists';
        details = `Public: ${tradeScreenshotsBucket.public}`;
      } else if (screenshotsBucket) {
        status = 'warning';
        message = 'Only legacy screenshots bucket exists';
        details = `Public: ${screenshotsBucket.public}. Need trade-screenshots bucket`;
      } else {
        status = 'error';
        message = 'No storage buckets found';
        details = 'Both screenshots and trade-screenshots buckets are missing';
      }
      
      testResults.push({
        name: 'Storage Bucket Status',
        status,
        message,
        details
      });
    } catch (error: any) {
      testResults.push({
        name: 'Storage Bucket Status',
        status: 'error',
        message: 'Failed to check buckets',
        details: error.message
      });
    }

    // Test 3: Test image upload functionality
    try {
      setTests(prev => [...prev, {
        name: 'Upload Test',
        status: 'loading',
        message: 'Testing image upload...'
      }]);

      // Create a tiny test image (1x1 pixel PNG)
      const testImageBlob = new Blob([
        new Uint8Array([
          0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
          0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
          0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
          0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
          0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
          0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
          0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
          0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
          0x42, 0x60, 0x82
        ])
      ], { type: 'image/png' });

      const testFile = new File([testImageBlob], 'test-upload.png', { type: 'image/png' });
      const fileName = `${user.id}-${Date.now()}-test.png`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('trade-screenshots')
        .upload(fileName, testFile);

      if (uploadError) {
        testResults.push({
          name: 'Upload Test',
          status: 'error',
          message: 'Upload failed',
          details: uploadError.message
        });
      } else {
        // Test public URL generation
        const { data: urlData } = supabase.storage
          .from('trade-screenshots')
          .getPublicUrl(fileName);

        // Clean up test file
        await supabase.storage.from('trade-screenshots').remove([fileName]);

        testResults.push({
          name: 'Upload Test',
          status: 'success',
          message: 'Upload and URL generation working',
          details: `Test file uploaded successfully. URL: ${urlData.publicUrl}`
        });
      }
    } catch (error: any) {
      testResults.push({
        name: 'Upload Test',
        status: 'error',
        message: 'Upload test failed',
        details: error.message
      });
    }

    // Test 4: Check existing image URLs
    if (recentTrades.length > 0) {
      const tradesWithImages = recentTrades.filter(t => t.image_url);
      if (tradesWithImages.length > 0) {
        try {
          setTests(prev => [...prev, {
            name: 'Image URL Accessibility',
            status: 'loading',
            message: 'Testing existing image URLs...'
          }]);

          const testUrl = tradesWithImages[0].image_url;
          const response = await fetch(testUrl!);
          
          if (response.ok) {
            testResults.push({
              name: 'Image URL Accessibility',
              status: 'success',
              message: 'Existing images are accessible',
              details: `Test URL responded with status: ${response.status}`
            });
          } else {
            testResults.push({
              name: 'Image URL Accessibility',
              status: 'warning',
              message: 'Image URLs may have issues',
              details: `Test URL responded with status: ${response.status}`
            });
          }
        } catch (error: any) {
          testResults.push({
            name: 'Image URL Accessibility',
            status: 'error',
            message: 'Could not access existing images',
            details: error.message
          });
        }
      }
    }

    // Update tests with final results
    setTests(testResults);
    setIsRunning(false);

    // Show summary toast
    const errorCount = testResults.filter(t => t.status === 'error').length;
    const warningCount = testResults.filter(t => t.status === 'warning').length;
    
    if (errorCount > 0) {
      toast({
        title: `Diagnostics Complete`,
        description: `Found ${errorCount} errors and ${warningCount} warnings`,
        variant: 'destructive'
      });
    } else if (warningCount > 0) {
      toast({
        title: `Diagnostics Complete`,
        description: `Found ${warningCount} warnings`,
        variant: 'default'
      });
    } else {
      toast({
        title: `Diagnostics Complete`,
        description: `All tests passed!`,
        variant: 'default'
      });
    }
  };

  useEffect(() => {
    if (user) {
      runDiagnostics();
    }
  }, [user]);

  if (!user) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">Please log in to run diagnostics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bucket Fixer */}
      <BucketFixer />
      
      {/* Diagnostics Card */}
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Trade Image Diagnostics
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Debugging image upload and display issues
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={runDiagnostics}
              disabled={isRunning}
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Run Diagnostics
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {tests.length === 0 && isRunning && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Running diagnostics...</span>
            </div>
          )}
          
          {tests.map((test, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {test.status === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                  {test.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {test.status === 'warning' && <Eye className="h-4 w-4 text-yellow-500" />}
                  {test.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                  <span className="font-medium">{test.name}</span>
                </div>
                <Badge 
                  variant={
                    test.status === 'success' ? 'default' : 
                    test.status === 'error' ? 'destructive' : 
                    test.status === 'warning' ? 'secondary' : 'outline'
                  }
                >
                  {test.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{test.message}</p>
              {test.details && (
                <>
                  <Separator className="my-2" />
                  <p className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded">
                    {test.details}
                  </p>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Trades Card */}
      {recentTrades.length > 0 && (
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
            <p className="text-sm text-muted-foreground">
              Last 10 trades with image status
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentTrades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <span className="font-medium">{trade.symbol}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {new Date(trade.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={trade.image_url ? 'default' : 'outline'}>
                      {trade.image_url ? 'Has Image' : 'No Image'}
                    </Badge>
                    {trade.image_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(trade.image_url!, '_blank')}
                      >
                        View
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}