import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAccounts } from '@/hooks/useAccounts';
import type { Trade } from '@/hooks/useTrades';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface EditTradeModalProps {
  trade: Trade | null;
  isOpen: boolean;
  onClose: () => void;
  onTradeUpdated: () => void;
}

export function EditTradeModal({ trade, isOpen, onClose, onTradeUpdated }: EditTradeModalProps) {
  const { toast } = useToast();
  const { getActiveAccount } = useAccounts();
  const [loading, setLoading] = useState(false);
  
  const activeAccount = getActiveAccount();
  
  const [formData, setFormData] = useState({
    date: '',
    symbol: '',
    side: '',
    session: '',
    strategy_tag: '',
    rr: '',
    result: '',
    notes: '',
    risk_percentage: '',
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (trade) {
      setFormData({
        date: new Date(trade.date).toISOString().split('T')[0],
        symbol: trade.symbol || '',
        side: trade.side || '',
        session: trade.session || '',
        strategy_tag: trade.strategy_tag || '',
        rr: trade.rr?.toString() || '',
        result: trade.result,
        notes: trade.notes || '',
        risk_percentage: trade.risk_percentage?.toString() || '1.0',
      });
      setExistingImageUrl(trade.image_url || null);
      setImageFile(null);
      setImagePreview(null);
    }
  }, [trade]);

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
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to upload images",
          variant: "destructive",
        });
        return null;
      }

      // Create unique file name
      const fileName = `${user.id}-${Date.now()}-${file.name}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("screenshots")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast({
          title: "Upload Error",
          description: `Failed to upload image: ${uploadError.message}`,
          variant: "destructive",
        });
        return null;
      }

      // Get public URL
      const { data } = supabase.storage
        .from("screenshots")
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error("Error in uploadImage:", error);
      toast({
        title: "Upload Error",
        description: "An unexpected error occurred while uploading the image",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trade) return;

    if (!activeAccount) {
      toast({
        title: "Error",
        description: "No active account found. Please create an account first.",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (!formData.symbol || !formData.side || !formData.result || !formData.session) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate risk percentage
    const riskPercentage = parseFloat(formData.risk_percentage);
    if (isNaN(riskPercentage) || riskPercentage <= 0 || riskPercentage > 100) {
      toast({
        title: "Error",
        description: "Risk percentage must be between 0.1 and 100",
        variant: "destructive",
      });
      return;
    }

    // Validate R:R ratio if provided
    if (formData.rr) {
      const rr = parseFloat(formData.rr);
      if (isNaN(rr) || rr <= 0) {
        toast({
          title: "Error",
          description: "R:R ratio must be a positive number",
          variant: "destructive",
      });
        return;
      }
    }

    try {
      setLoading(true);
      
      let imageUrl = existingImageUrl;
      
      // Upload new image if provided
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

      const updateData = {
        date: new Date(formData.date).toISOString(),
        symbol: formData.symbol || null,
        side: formData.side || null,
        session: formData.session,
        setup_tag: formData.session, // Keep for backward compatibility
        strategy_tag: formData.strategy_tag || null,
        rr: formData.rr ? Number(formData.rr) : null,
        result: formData.result,
        notes: formData.notes || null,
        image_url: imageUrl, // Include image URL in update
        risk_percentage: riskPercentage,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('trades')
        .update(updateData)
        .eq('id', trade.id);

      if (error) throw error;

      // Only show success toast with rate limiting
      const lastToastTime = localStorage.getItem('lastTradeToastTime');
      const now = Date.now();
      if (!lastToastTime || now - parseInt(lastToastTime) > 3000) {
        toast({
          title: "Trade Updated",
          description: "Trade has been updated successfully.",
        });
        localStorage.setItem('lastTradeToastTime', now.toString());
      }

      // Trigger a full refresh to recalculate account balance
      onTradeUpdated();
      onClose();
    } catch (err) {
      console.error('Error updating trade:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update trade',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Trade</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="symbol">Symbol *</Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                placeholder="e.g., EURUSD, GOLD"
                required
              />
            </div>

            <div>
              <Label htmlFor="side">Side *</Label>
              <Select value={formData.side} onValueChange={(value) => handleInputChange('side', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select side" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LONG">LONG</SelectItem>
                  <SelectItem value="SHORT">SHORT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="session">Session *</Label>
              <Select value={formData.session} onValueChange={(value) => handleInputChange('session', value)} required>
                <SelectTrigger>
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

            <div>
              <Label htmlFor="strategy_tag">Strategy Tag</Label>
              <Input
                id="strategy_tag"
                value={formData.strategy_tag}
                onChange={(e) => handleInputChange('strategy_tag', e.target.value)}
                placeholder="e.g., breakout, reversal"
              />
            </div>

            <div>
              <Label htmlFor="rr">Risk:Reward Ratio</Label>
              <Input
                id="rr"
                type="number"
                step="0.1"
                value={formData.rr}
                onChange={(e) => handleInputChange('rr', e.target.value)}
                placeholder="2.0"
              />
            </div>

            <div>
              <Label htmlFor="risk_percentage">Risk Percentage (%) *</Label>
              <Input
                id="risk_percentage"
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                value={formData.risk_percentage}
                onChange={(e) => handleInputChange('risk_percentage', e.target.value)}
                placeholder="1.0"
                required
              />
              {activeAccount && formData.risk_percentage && (
                <p className="text-xs text-muted-foreground mt-1">
                  Risk Amount: ${(activeAccount.current_balance * (Number(formData.risk_percentage) / 100)).toFixed(2)}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="result">Result *</Label>
              <Select value={formData.result} onValueChange={(value) => handleInputChange('result', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Win">Win</SelectItem>
                  <SelectItem value="Loss">Loss</SelectItem>
                  <SelectItem value="Breakeven">Breakeven</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Trade notes and observations..."
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
              ) : existingImageUrl ? (
                <div className="relative">
                  <img
                    src={existingImageUrl}
                    alt="Existing trade screenshot"
                    className="max-h-40 mx-auto rounded"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setExistingImageUrl(null);
                      setImageFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label htmlFor="screenshot" className="cursor-pointer">
                  <div className="flex flex-col items-center justify-center py-4">
                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
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

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Updating...' : 'Update Trade'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}