import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export function StorageTestComponent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    console.log(message);
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testStorageAccess = async () => {
    if (!user) {
      addResult('❌ No authenticated user');
      return;
    }

    setTesting(true);
    setResults([]);
    addResult('🔄 Starting storage tests...');

    try {
      // Test 1: Check if bucket exists
      addResult('📦 Testing bucket access...');
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        addResult(`❌ Bucket list error: ${bucketError.message}`);
      } else {
        const screenshotsBucket = buckets?.find(b => b.id === 'trade-screenshots');
        if (screenshotsBucket) {
          addResult('✅ Trade-screenshots bucket found');
          addResult(`📊 Bucket info: public=${screenshotsBucket.public}`);
        } else {
          addResult('❌ Trade-screenshots bucket not found');
        }
      }

      // Test 2: Try to upload a test file
      addResult('📤 Testing file upload...');
      const testBlob = new Blob(['test content'], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
      const fileName = `${user.id}-test-${Date.now()}.txt`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('trade-screenshots')
        .upload(fileName, testFile);

      if (uploadError) {
        addResult(`❌ Upload error: ${uploadError.message}`);
      } else {
        addResult('✅ Test file uploaded successfully');
        addResult(`📄 Upload path: ${uploadData.path}`);

        // Test 3: Get public URL
        const { data: urlData } = supabase.storage
          .from('trade-screenshots')
          .getPublicUrl(fileName);
        
        addResult(`🔗 Public URL: ${urlData.publicUrl}`);

        // Test 4: Try to access the URL
        try {
          const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
          if (response.ok) {
            addResult('✅ Public URL is accessible');
          } else {
            addResult(`❌ Public URL not accessible: ${response.status}`);
          }
        } catch (fetchError) {
          addResult(`❌ Fetch error: ${fetchError}`);
        }

        // Clean up test file
        const { error: deleteError } = await supabase.storage
          .from('trade-screenshots')
          .remove([fileName]);
        
        if (deleteError) {
          addResult(`⚠️ Cleanup error: ${deleteError.message}`);
        } else {
          addResult('🧹 Test file cleaned up');
        }
      }
    } catch (error) {
      addResult(`💥 Unexpected error: ${error}`);
    }

    setTesting(false);
    addResult('🏁 Storage test completed');
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-muted-foreground">Please log in to test storage</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Supabase Storage Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testStorageAccess} disabled={testing}>
          {testing ? 'Testing...' : 'Test Storage Access'}
        </Button>
        
        {results.length > 0 && (
          <div className="bg-muted p-4 rounded-lg max-h-64 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className="text-sm font-mono">
                {result}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}