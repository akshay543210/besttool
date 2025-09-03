import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2, RefreshCw, Eye, Upload } from 'lucide-react';

interface BucketTestResult {
  name: string;
  status: 'success' | 'error' | 'loading';
  message: string;
  details?: string;
}

export function BucketPublicTestComponent() {
  const [tests, setTests] = useState<BucketTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const runTests = async () => {
    setIsRunning(true);
    setTests([]);
    
    const testResults: BucketTestResult[] = [];

    // Test 1: Check if bucket exists and is public
    try {
      setTests(prev => [...prev, {
        name: 'Bucket Existence & Public Status',
        status: 'loading',
        message: 'Checking bucket configuration...'
      }]);

      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) throw bucketsError;
      
      const tradeScreenshotsBucket = buckets.find(b => b.id === 'trade-screenshots');
      
      if (!tradeScreenshotsBucket) {
        testResults.push({
          name: 'Bucket Existence & Public Status',
          status: 'error',
          message: 'trade-screenshots bucket not found',
          details: 'The bucket needs to be created first'
        });
      } else {
        testResults.push({
          name: 'Bucket Existence & Public Status',
          status: 'success',
          message: `Bucket exists and is ${tradeScreenshotsBucket.public ? 'PUBLIC' : 'PRIVATE'}`,
          details: `ID: ${tradeScreenshotsBucket.id}, Public: ${tradeScreenshotsBucket.public}`
        });
      }
    } catch (error: any) {
      testResults.push({
        name: 'Bucket Existence & Public Status',
        status: 'error',
        message: 'Failed to check bucket status',
        details: error.message
      });
    }

    // Test 2: Test public URL generation
    try {
      setTests(prev => [...prev, {
        name: 'Public URL Generation',
        status: 'loading',
        message: 'Testing public URL generation...'
      }]);

      // Test with a dummy filename
      const testFileName = 'test-public-url.jpg';
      const { data: urlData } = supabase.storage
        .from('trade-screenshots')
        .getPublicUrl(testFileName);

      if (urlData?.publicUrl) {
        testResults.push({
          name: 'Public URL Generation',
          status: 'success',
          message: 'Public URL generation working',
          details: `Generated URL: ${urlData.publicUrl}`
        });
      } else {
        testResults.push({
          name: 'Public URL Generation',
          status: 'error',
          message: 'Failed to generate public URL',
          details: 'No URL returned from getPublicUrl()'
        });
      }
    } catch (error: any) {
      testResults.push({
        name: 'Public URL Generation',
        status: 'error',
        message: 'Error during URL generation',
        details: error.message
      });
    }

    // Test 3: Test bucket policies
    try {
      setTests(prev => [...prev, {
        name: 'Storage Policies Check',
        status: 'loading',
        message: 'Checking storage policies...'
      }]);

      // Try to list objects (should work with public read policy)
      const { data: objects, error: listError } = await supabase.storage
        .from('trade-screenshots')
        .list('', { limit: 1 });

      if (listError) {
        testResults.push({
          name: 'Storage Policies Check',
          status: 'error',
          message: 'Policy check failed',
          details: listError.message
        });
      } else {
        testResults.push({
          name: 'Storage Policies Check',
          status: 'success',
          message: 'Storage policies working correctly',
          details: `Can list objects. Found ${objects?.length || 0} files`
        });
      }
    } catch (error: any) {
      testResults.push({
        name: 'Storage Policies Check',
        status: 'error',
        message: 'Policy test error',
        details: error.message
      });
    }

    // Update tests with final results
    setTests(testResults);
    setIsRunning(false);

    // Show summary toast
    const successCount = testResults.filter(t => t.status === 'success').length;
    const totalCount = testResults.length;
    
    toast({
      title: `Bucket Test Complete`,
      description: `${successCount}/${totalCount} tests passed`,
      variant: successCount === totalCount ? 'default' : 'destructive'
    });
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Bucket Public Access Test
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Testing trade-screenshots bucket public accessibility
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runTests}
              disabled={isRunning}
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Retest
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {tests.length === 0 && isRunning && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Running tests...</span>
          </div>
        )}
        
        {tests.map((test, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {test.status === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                {test.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                {test.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                <span className="font-medium">{test.name}</span>
              </div>
              <Badge 
                variant={test.status === 'success' ? 'default' : test.status === 'error' ? 'destructive' : 'secondary'}
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
        
        {tests.length > 0 && !isRunning && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-2">Test Summary:</p>
            <div className="flex gap-4 text-sm">
              <span className="text-green-600">
                ✓ {tests.filter(t => t.status === 'success').length} Passed
              </span>
              <span className="text-red-600">
                ✗ {tests.filter(t => t.status === 'error').length} Failed
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}