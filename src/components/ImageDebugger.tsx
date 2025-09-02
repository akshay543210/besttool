import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ImageDebugger({ imageUrl }: { imageUrl: string | null }) {
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [testResult, setTestResult] = useState<'loading' | 'success' | 'error' | null>(null);

  const testImageAccess = async () => {
    if (!imageUrl) return;
    
    setTestResult('loading');
    setDebugInfo('Testing image access...');
    
    try {
      // Test if image exists and is accessible
      const response = await fetch(imageUrl, { method: 'HEAD' });
      
      if (response.ok) {
        setTestResult('success');
        setDebugInfo(`✓ Image accessible (${response.status})`);
      } else {
        setTestResult('error');
        setDebugInfo(`✗ HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      setTestResult('error');
      setDebugInfo(`✗ Network error: ${error}`);
    }
  };

  if (!imageUrl) return null;

  return (
    <Card className="mt-4 border-orange-200">
      <CardHeader>
        <CardTitle className="text-sm">Image Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs break-all">URL: {imageUrl}</p>
        <Button size="sm" onClick={testImageAccess}>
          Test Access
        </Button>
        {testResult && (
          <p className={`text-xs ${testResult === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {debugInfo}
          </p>
        )}
      </CardContent>
    </Card>
  );
}