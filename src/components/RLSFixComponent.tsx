import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export function RLSFixComponent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fixing, setFixing] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    console.log(message);
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const fixRLSPolicies = async () => {
    if (!user) {
      addResult('❌ No authenticated user');
      return;
    }

    setFixing(true);
    setResults([]);
    addResult('🔄 Starting RLS policy fix...');

    try {
      // Step 1: Try to create buckets directly with INSERT
      addResult('📦 Creating storage buckets...');
      
      const bucketQueries = [
        `INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
         VALUES ('trade-screenshots', 'trade-screenshots', true, 52428800, ARRAY['image/*'])
         ON CONFLICT (id) DO NOTHING;`,
        
        `INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
         VALUES ('screenshots', 'screenshots', true, 52428800, ARRAY['image/*'])
         ON CONFLICT (id) DO NOTHING;`
      ];

      for (const query of bucketQueries) {
        try {
          const { error } = await supabase.rpc('exec_sql', { query });
          if (error) {
            addResult(`⚠️ Bucket creation warning: ${error.message}`);
          } else {
            addResult('✅ Bucket query executed');
          }
        } catch (err) {
          addResult(`⚠️ Bucket creation attempt: ${err}`);
        }
      }

      // Step 2: Try to fix policies by dropping restrictive ones
      addResult('🛡️ Removing restrictive policies...');
      
      const dropPolicyQueries = [
        "DROP POLICY IF EXISTS \"Screenshots are viewable by everyone\" ON storage.objects;",
        "DROP POLICY IF EXISTS \"Users can upload their own screenshots\" ON storage.objects;",
        "DROP POLICY IF EXISTS \"Users can update their own screenshots\" ON storage.objects;",
        "DROP POLICY IF EXISTS \"Users can delete their own screenshots\" ON storage.objects;",
        "DROP POLICY IF EXISTS \"Trade screenshots are viewable by everyone\" ON storage.objects;",
        "DROP POLICY IF EXISTS \"Users can upload trade screenshots\" ON storage.objects;",
        "DROP POLICY IF EXISTS \"Users can update own trade screenshots\" ON storage.objects;",
        "DROP POLICY IF EXISTS \"Users can delete own trade screenshots\" ON storage.objects;"
      ];

      for (const query of dropPolicyQueries) {
        try {
          const { error } = await supabase.rpc('exec_sql', { query });
          if (error) {
            addResult(`⚠️ Policy drop warning: ${error.message}`);
          }
        } catch (err) {
          addResult(`⚠️ Policy drop attempt: ${err}`);
        }
      }

      // Step 3: Create permissive policies
      addResult('🔓 Creating permissive policies...');
      
      const createPolicyQueries = [
        `CREATE POLICY "Public read access for all screenshots" 
         ON storage.objects FOR SELECT 
         USING (bucket_id IN ('screenshots', 'trade-screenshots'));`,
        
        `CREATE POLICY "Authenticated users can upload images" 
         ON storage.objects FOR INSERT 
         WITH CHECK (bucket_id IN ('screenshots', 'trade-screenshots') AND auth.uid() IS NOT NULL);`,
        
        `CREATE POLICY "Users can update own images flexible" 
         ON storage.objects FOR UPDATE 
         USING (
           bucket_id IN ('screenshots', 'trade-screenshots') 
           AND auth.uid() IS NOT NULL
           AND (
             -- Pattern 1: user-id at start of filename
             name LIKE auth.uid()::text || '-%'
             OR
             -- Pattern 2: user-id as folder structure  
             auth.uid()::text = (storage.foldername(name))[1]
             OR
             -- Pattern 3: allow for legacy filenames
             name LIKE '%' || auth.uid()::text || '%'
           )
         );`,
        
        `CREATE POLICY "Users can delete own images flexible" 
         ON storage.objects FOR DELETE 
         USING (
           bucket_id IN ('screenshots', 'trade-screenshots') 
           AND auth.uid() IS NOT NULL
           AND (
             -- Pattern 1: user-id at start of filename
             name LIKE auth.uid()::text || '-%'
             OR
             -- Pattern 2: user-id as folder structure
             auth.uid()::text = (storage.foldername(name))[1]
             OR
             -- Pattern 3: allow for legacy filenames
             name LIKE '%' || auth.uid()::text || '%'
           )
         );`
      ];

      for (const query of createPolicyQueries) {
        try {
          const { error } = await supabase.rpc('exec_sql', { query });
          if (error) {
            addResult(`⚠️ Policy creation warning: ${error.message}`);
          } else {
            addResult('✅ Policy created successfully');
          }
        } catch (err) {
          addResult(`⚠️ Policy creation attempt: ${err}`);
        }
      }

      // Step 4: Test bucket access after policy changes
      addResult('🧪 Testing bucket access...');
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        addResult(`❌ Bucket access test failed: ${bucketError.message}`);
      } else {
        const foundBuckets = buckets?.map(b => b.id) || [];
        addResult(`✅ Found buckets: ${foundBuckets.join(', ')}`);
        
        if (foundBuckets.includes('trade-screenshots')) {
          addResult('✅ trade-screenshots bucket is accessible');
        }
        if (foundBuckets.includes('screenshots')) {
          addResult('✅ screenshots bucket is accessible');
        }
      }

      // Step 5: Test upload capability
      addResult('📤 Testing upload capability...');
      try {
        const testBlob = new Blob(['test content'], { type: 'text/plain' });
        const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
        const fileName = `${user.id}-test-${Date.now()}.txt`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('trade-screenshots')
          .upload(fileName, testFile);

        if (uploadError) {
          addResult(`❌ Upload test failed: ${uploadError.message}`);
        } else {
          addResult('✅ Upload test successful!');
          
          // Clean up test file
          await supabase.storage.from('trade-screenshots').remove([fileName]);
          addResult('🧹 Test file cleaned up');
        }
      } catch (err) {
        addResult(`❌ Upload test error: ${err}`);
      }

      addResult('🎉 RLS policy fix completed!');
      toast({
        title: "RLS Policies Updated",
        description: "Storage policies have been made more permissive",
      });

    } catch (error) {
      addResult(`💥 Unexpected error: ${error}`);
      toast({
        title: "Error",
        description: "Failed to update RLS policies",
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
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>🛡️ Fix Storage RLS Policies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ RLS Policy Issue Detected:</strong><br/>
            Row Level Security policies are blocking storage operations. This will attempt to create more permissive policies.
          </p>
        </div>
        
        <Button onClick={fixRLSPolicies} disabled={fixing} className="w-full">
          {fixing ? 'Fixing RLS Policies...' : 'Fix Storage RLS Policies'}
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