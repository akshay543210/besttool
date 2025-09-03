import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2, Wrench } from 'lucide-react';

export function BucketFixer() {
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  const fixBucket = async () => {
    setIsFixing(true);
    setResult(null);

    try {
      // Step 1: Check if any buckets exist
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        throw new Error(`Failed to list buckets: ${listError.message}`);
      }

      console.log('Existing buckets:', buckets);
      
      const tradeScreenshotsBucket = buckets.find(b => b.id === 'trade-screenshots');
      const screenshotsBucket = buckets.find(b => b.id === 'screenshots');
      
      let actionsPerformed = [];
      
      // Step 2: Create trade-screenshots bucket if it doesn't exist
      if (!tradeScreenshotsBucket) {
        console.log('Creating trade-screenshots bucket...');
        const { error: createError } = await supabase.storage.createBucket('trade-screenshots', {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 52428800 // 50MB
        });

        if (createError) {
          throw new Error(`Failed to create trade-screenshots bucket: ${createError.message}`);
        }
        
        actionsPerformed.push('Created trade-screenshots bucket');
      } else {
        console.log('trade-screenshots bucket exists:', tradeScreenshotsBucket);
        
        // Update bucket to be public if it exists but isn't public
        if (!tradeScreenshotsBucket.public) {
          console.log('Updating trade-screenshots bucket to public...');
          const { error: updateError } = await supabase.storage.updateBucket('trade-screenshots', {
            public: true,
            allowedMimeTypes: ['image/*'],
            fileSizeLimit: 52428800
          });

          if (updateError) {
            throw new Error(`Failed to update trade-screenshots bucket: ${updateError.message}`);
          }
          
          actionsPerformed.push('Updated trade-screenshots bucket to public');
        }
      }
      
      // Step 3: Create screenshots bucket for legacy compatibility if it doesn't exist
      if (!screenshotsBucket) {
        console.log('Creating screenshots bucket for legacy compatibility...');
        const { error: createLegacyError } = await supabase.storage.createBucket('screenshots', {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 52428800 // 50MB
        });

        if (createLegacyError) {
          // Don't fail completely if legacy bucket creation fails
          console.warn('Failed to create legacy screenshots bucket:', createLegacyError.message);
          actionsPerformed.push('Warning: Could not create legacy screenshots bucket');
        } else {
          actionsPerformed.push('Created legacy screenshots bucket');
        }
      }
      
      if (actionsPerformed.length === 0) {
        actionsPerformed.push('Buckets already configured correctly');
      }

      setResult({
        success: true,
        message: actionsPerformed.join(', ')
      });

      toast({
        title: "Success",
        description: `Bucket fix completed: ${actionsPerformed.join(', ')}`,
        variant: "default"
      });
      
    } catch (error: any) {
      console.error('Bucket fix error:', error);
      setResult({
        success: false,
        message: error.message
      });

      toast({
        title: "Error",
        description: `Failed to fix bucket: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Bucket Fixer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Fix trade-screenshots bucket if images aren't uploading
        </p>
        
        <Button 
          onClick={fixBucket} 
          disabled={isFixing}
          className="w-full"
        >
          {isFixing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Wrench className="h-4 w-4 mr-2" />
          )}
          {isFixing ? 'Fixing...' : 'Fix Bucket'}
        </Button>

        {result && (
          <div className={`flex items-center gap-2 p-3 rounded border ${
            result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">{result.message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}