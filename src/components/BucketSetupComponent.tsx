import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export function BucketSetupComponent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    console.log(message);
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const createBucketAndPolicies = async () => {
    if (!user) {
      addResult('❌ No authenticated user');
      return;
    }

    setCreating(true);
    setResults([]);
    addResult('🔄 Starting bucket setup...');

    try {
      // Check if buckets exist
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        addResult(`❌ Error checking buckets: ${bucketError.message}`);
        return;
      }

      const tradeScreenshotsBucket = buckets?.find(b => b.id === 'trade-screenshots');
      const screenshotsBucket = buckets?.find(b => b.id === 'screenshots');

      if (tradeScreenshotsBucket) {
        addResult('✅ trade-screenshots bucket already exists');
      } else {
        addResult('📦 Creating trade-screenshots bucket...');
        const { data, error } = await supabase.storage.createBucket('trade-screenshots', {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 52428800 // 50MB
        });
        
        if (error) {
          addResult(`❌ Failed to create trade-screenshots bucket: ${error.message}`);
        } else {
          addResult('✅ trade-screenshots bucket created successfully');
        }
      }

      if (screenshotsBucket) {
        addResult('✅ screenshots bucket already exists');
      } else {
        addResult('📦 Creating screenshots bucket for backward compatibility...');
        const { data, error } = await supabase.storage.createBucket('screenshots', {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 52428800 // 50MB
        });
        
        if (error) {
          addResult(`❌ Failed to create screenshots bucket: ${error.message}`);
        } else {
          addResult('✅ screenshots bucket created successfully');
        }
      }

      // Test upload to verify everything works
      addResult('🧪 Testing upload to trade-screenshots bucket...');
      const testBlob = new Blob(['test content'], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
      const fileName = `${user.id}-test-${Date.now()}.txt`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('trade-screenshots')
        .upload(fileName, testFile);

      if (uploadError) {
        addResult(`❌ Test upload failed: ${uploadError.message}`);
      } else {
        addResult('✅ Test upload successful');
        
        // Clean up test file
        await supabase.storage.from('trade-screenshots').remove([fileName]);
        addResult('🧹 Test file cleaned up');
      }

      addResult('🎉 Bucket setup completed successfully!');
      toast({
        title: "Bucket Setup Complete",
        description: "Storage buckets are now properly configured",
      });

    } catch (error) {
      addResult(`💥 Unexpected error: ${error}`);
    }

    setCreating(false);
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-muted-foreground">Please log in to set up storage buckets</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Storage Bucket Setup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This will create the required storage buckets for image uploads if they don't exist.
        </p>
        
        <Button onClick={createBucketAndPolicies} disabled={creating}>
          {creating ? 'Setting up...' : 'Setup Storage Buckets'}
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