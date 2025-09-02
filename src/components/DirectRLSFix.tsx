import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export function DirectRLSFix() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fixing, setFixing] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    console.log(message);
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const fixRLSWithSupabaseAdmin = async () => {
    if (!user) {
      addResult('❌ No authenticated user');
      return;
    }

    setFixing(true);
    setResults([]);
    addResult('🔄 Starting direct RLS fix...');

    try {
      // Step 1: Check current bucket status
      addResult('📦 Checking existing buckets...');
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        addResult(`❌ Error checking buckets: ${bucketError.message}`);
      } else {
        const bucketNames = buckets?.map(b => b.id) || [];
        addResult(`✅ Found buckets: ${bucketNames.join(', ')}`);
        
        // Step 2: Try to create missing buckets using storage API
        if (!bucketNames.includes('trade-screenshots')) {
          addResult('📦 Creating trade-screenshots bucket...');
          const { data: createData, error: createError } = await supabase.storage.createBucket('trade-screenshots', {
            public: true,
            allowedMimeTypes: ['image/*'],
            fileSizeLimit: 52428800
          });
          
          if (createError) {
            addResult(`⚠️ Trade-screenshots bucket creation: ${createError.message}`);
          } else {
            addResult('✅ Trade-screenshots bucket created successfully');
          }
        }
        
        if (!bucketNames.includes('screenshots')) {
          addResult('📦 Creating screenshots bucket...');
          const { data: createData, error: createError } = await supabase.storage.createBucket('screenshots', {
            public: true,
            allowedMimeTypes: ['image/*'],
            fileSizeLimit: 52428800
          });
          
          if (createError) {
            addResult(`⚠️ Screenshots bucket creation: ${createError.message}`);
          } else {
            addResult('✅ Screenshots bucket created successfully');
          }
        }
      }

      // Step 3: Test upload functionality directly
      addResult('📤 Testing direct upload...');
      try {
        const testBlob = new Blob(['test content'], { type: 'text/plain' });
        const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
        const fileName = `${user.id}-test-${Date.now()}.txt`;
        
        // Try upload to trade-screenshots first
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('trade-screenshots')
          .upload(fileName, testFile);

        if (uploadError) {
          addResult(`❌ Upload to trade-screenshots failed: ${uploadError.message}`);
          
          // Try upload to screenshots bucket
          const { data: uploadData2, error: uploadError2 } = await supabase.storage
            .from('screenshots')
            .upload(fileName, testFile);
            
          if (uploadError2) {
            addResult(`❌ Upload to screenshots also failed: ${uploadError2.message}`);
          } else {
            addResult('✅ Upload to screenshots bucket successful!');
            // Clean up
            await supabase.storage.from('screenshots').remove([fileName]);
            addResult('🧹 Test file cleaned up');
          }
        } else {
          addResult('✅ Upload to trade-screenshots successful!');
          // Clean up
          await supabase.storage.from('trade-screenshots').remove([fileName]);
          addResult('🧹 Test file cleaned up');
        }
      } catch (err) {
        addResult(`❌ Upload test error: ${err}`);
      }

      // Step 4: Provide manual instructions
      addResult('📋 Manual RLS Fix Instructions:');
      addResult('1. Go to: https://supabase.com/dashboard/project/notyhakhjrmzhnnjbiqp/editor');
      addResult('2. Run this SQL query to fix RLS policies:');
      addResult('');
      
      const manualSQL = `
-- Fix RLS policies for storage
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- Or create permissive policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Bucket Access" ON storage.buckets;  
CREATE POLICY "Public Bucket Access" ON storage.buckets FOR ALL USING (true);`;

      addResult('Copy and paste the SQL above into Supabase SQL Editor');
      addResult('');

      // Step 5: Test image URL generation
      addResult('🔗 Testing public URL generation...');
      const testImageUrl = supabase.storage
        .from('trade-screenshots')
        .getPublicUrl('test-image.jpg');
        
      addResult(`✅ Generated URL: ${testImageUrl.data.publicUrl}`);
      
      // Step 6: Final recommendation
      addResult('');
      addResult('🎯 RECOMMENDATION:');
      addResult('Since RLS policies are blocking operations, temporarily disable RLS');
      addResult('on storage tables using the SQL query above, then test image uploads.');
      
      toast({
        title: "Direct RLS Fix Complete",
        description: "Check the results and follow manual instructions if needed",
      });

    } catch (error) {
      addResult(`💥 Unexpected error: ${error}`);
      toast({
        title: "Error",
        description: "Failed to complete direct RLS fix",
        variant: "destructive",
      });
    }

    setFixing(false);
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-muted-foreground">Please log in to fix RLS policies</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>🚀 Direct RLS Fix (Alternative Method)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>💡 This approach:</strong><br/>
            • Uses Supabase Storage API directly<br/>
            • Tests bucket creation and upload functionality<br/>
            • Provides manual SQL instructions if needed<br/>
            • Bypasses the missing exec_sql function issue
          </p>
        </div>
        
        <Button onClick={fixRLSWithSupabaseAdmin} disabled={fixing} className="w-full">
          {fixing ? 'Running Direct RLS Fix...' : 'Run Direct RLS Fix'}
        </Button>
        
        {results.length > 0 && (
          <div className="bg-muted p-4 rounded-lg max-h-80 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className="text-sm font-mono whitespace-pre-wrap">
                {result}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}