import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAccounts } from '@/hooks/useAccounts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Upload, X } from 'lucide-react';

interface NewTradeModalProps {
  onTradeAdded?: () => void;
}

export function NewTradeModal({ onTradeAdded }: NewTradeModalProps) {
  const { user } = useAuth();
  const { getActiveAccount } = useAccounts();
  const { toast } = useToast();
  const activeAccount = getActiveAccount();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    symbol: '',
    side: '',
    session: '',
    rr: '',
    result: '',
    notes: '',
    risk_percentage: '1.0', // Default to 1% risk
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
    
    try {
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
    } catch (error) {
      console.error('Error in uploadImage:', error);
      return null;
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      symbol: '',
      side: '',
      session: '',
      rr: '',
      result: '',
      notes: '',
      risk_percentage: '1.0',
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to add trades",
        variant: "destructive",
      });
      return;
    }

    if (!activeAccount) {
      toast({
        title: "Account Error", 
        description: "No active trading account found. Please create an account in Settings.",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (!formData.symbol || !formData.side || !formData.result || !formData.session) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Symbol, Side, Session, and Result)",
        variant: "destructive",
      });
      return;
    }

    // Validate risk percentage
    const riskPercentage = parseFloat(formData.risk_percentage);
    if (isNaN(riskPercentage) || riskPercentage <= 0 || riskPercentage > 100) {
      toast({
        title: "Validation Error",
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
          title: "Validation Error",
          description: "R:R ratio must be a positive number",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    
    try {
      let imageUrl = null;
      
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) {
          toast({
            title: "Upload Warning",
            description: "Failed to upload image. Trade will be saved without image.",
            variant: "default",
          });
          // Continue without image instead of failing completely
        }
      }

      const { error } = await supabase
        .from('trades')
        .insert({
          user_id: user.id,
          account_id: activeAccount.id,
          date: new Date(formData.date).toISOString(),
          session: formData.session,
          symbol: formData.symbol,
          side: formData.side,
          setup_tag: formData.session, // Keep for backward compatibility
          rr: formData.rr ? Number(formData.rr) : null,
          result: formData.result,
          notes: formData.notes || null,
          image_url: imageUrl,
          risk_percentage: riskPercentage,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw new Error(error.message);
      }

      // Only show success toast with rate limiting
      const lastToastTime = localStorage.getItem('lastTradeToastTime');
      const now = Date.now();
      if (!lastToastTime || now - parseInt(lastToastTime) > 3000) {
        toast({
          title: "Success",
          description: "Trade logged successfully",
        });
        localStorage.setItem('lastTradeToastTime', now.toString());
      }
      
      resetForm();
      setOpen(false);
      // Ensure account balance is recalculated after adding new trade
      onTradeAdded?.();
    } catch (error: any) {
      console.error('Error saving trade:', error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred while saving the trade",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  // Calculate risk amount based on account starting balance and risk percentage
  const calculateRiskAmount = () => {
    if (!activeAccount) return 0;
    const riskPercentage = parseFloat(formData.risk_percentage);
    if (isNaN(riskPercentage)) return 0;
    
    // Using starting_balance instead of current_balance for consistent risk calculation
    // This ensures risk is always calculated based on the initial account size
    const riskAmount = (activeAccount.starting_balance * riskPercentage) / 100;
    return Math.round(riskAmount * 100) / 100; // Round to 2 decimal places
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            New Trade
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log New Trade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol *</Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                placeholder="e.g., EURUSD, XAUUSD"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="side">Side *</Label>
              <Select
                value={formData.side}
                onValueChange={(value) => setFormData({ ...formData, side: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select side" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LONG">Long</SelectItem>
                  <SelectItem value="SHORT">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session">Session *</Label>
              <Select
                value={formData.session}
                onValueChange={(value) => setFormData({ ...formData, session: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia">Asia</SelectItem>
                  <SelectItem value="London">London</SelectItem>
                  <SelectItem value="New York">New York</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rr">Risk/Reward Ratio</Label>
              <Input
                id="rr"
                type="number"
                step="0.1"
                min="0.1"
                value={formData.rr}
                onChange={(e) => setFormData({ ...formData, rr: e.target.value })}
                placeholder="e.g., 1.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk_percentage">Risk Percentage (%) *</Label>
              <Input
                id="risk_percentage"
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                value={formData.risk_percentage}
                onChange={(e) => setFormData({ ...formData, risk_percentage: e.target.value })}
                placeholder="1.0"
                required
              />
              {activeAccount && formData.risk_percentage && (
                <p className="text-xs text-muted-foreground">
                  Risk Amount: ${calculateRiskAmount().toFixed(2)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="result">Result *</Label>
              <Select
                value={formData.result}
                onValueChange={(value) => setFormData({ ...formData, result: value })}
                required
              >
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

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Trade notes, observations, etc."
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

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Logging Trade...' : 'Log Trade'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}