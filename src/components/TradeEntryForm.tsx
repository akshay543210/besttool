import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAccounts } from '@/hooks/useAccounts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';

interface TradeEntryFormProps {
  onSuccess?: () => void;
  defaultSession?: string;
  onTradeAdded?: () => void;
}

export function TradeEntryForm({ onSuccess, defaultSession, onTradeAdded }: TradeEntryFormProps) {
  const { user } = useAuth();
  const { getActiveAccount } = useAccounts();
  const { toast } = useToast();
  const activeAccount = getActiveAccount();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    session: defaultSession || '',
    strategy_tag: '',
    rr: '',
    result: '',
    notes: '',
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('screenshots')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('screenshots')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add trades",
        variant: "destructive",
      });
      return;
    }

    if (!activeAccount) {
      toast({
        title: "Error",
        description: "No active trading account found. Please create an account in Settings.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      let imageUrl = null;
      
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) {
          toast({
            title: "Error",
            description: "Failed to upload image",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase
        .from('trades')
        .insert({
          user_id: user.id,
          account_id: activeAccount.id,
          date: new Date(formData.date).toISOString(),
          session: formData.session,
          strategy_tag: formData.strategy_tag || null,
          rr: formData.rr ? parseFloat(formData.rr) : null,
          result: formData.result,
          notes: formData.notes || null,
          image_url: imageUrl,
        });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Trade logged successfully",
        });
        
        // Reset form
        setFormData({
          date: new Date().toISOString().split('T')[0],
          session: defaultSession || '',
          strategy_tag: '',
          rr: '',
          result: '',
          notes: '',
        });
        setImageFile(null);
        setImagePreview(null);
        
        onSuccess?.();
        onTradeAdded?.();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  return (
    <Card className="bg-gradient-card shadow-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Log New Trade</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="bg-input border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="session">Session</Label>
              <Select
                value={formData.session}
                onValueChange={(value) => setFormData({ ...formData, session: value })}
                required
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia">Asia</SelectItem>
                  <SelectItem value="London">London</SelectItem>
                  <SelectItem value="NY Open">NY Open</SelectItem>
                  <SelectItem value="NY Close">NY Close</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="strategy_tag">Strategy Tag</Label>
              <Input
                id="strategy_tag"
                value={formData.strategy_tag}
                onChange={(e) => setFormData({ ...formData, strategy_tag: e.target.value })}
                placeholder="e.g., ORB, Breakout"
                className="bg-input border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rr">Risk/Reward Ratio</Label>
              <Input
                id="rr"
                type="number"
                step="0.1"
                value={formData.rr}
                onChange={(e) => setFormData({ ...formData, rr: e.target.value })}
                placeholder="e.g., 1.5"
                className="bg-input border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="result">Result</Label>
            <Select
              value={formData.result}
              onValueChange={(value) => setFormData({ ...formData, result: value })}
              required
            >
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Select result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Win">Win</SelectItem>
                <SelectItem value="Loss">Loss</SelectItem>
                <SelectItem value="Breakeven">Breakeven</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Trade notes, observations, etc."
              className="bg-input border-border"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="screenshot">Screenshot</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Trade screenshot preview"
                    className="max-h-40 mx-auto rounded"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label htmlFor="screenshot" className="cursor-pointer">
                  <div className="flex flex-col items-center justify-center py-4">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload screenshot
                    </span>
                  </div>
                  <input
                    id="screenshot"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging Trade...' : 'Log Trade'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}