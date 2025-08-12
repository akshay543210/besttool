import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FileText, TrendingUp, PenTool } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function TradeIdeas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    session: '',
    strategy_tag: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      session: '',
      strategy_tag: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add trade ideas",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('trade_ideas')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          session: formData.session,
          strategy_tag: formData.strategy_tag || null,
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
          description: "Trade idea saved successfully",
        });
        
        resetForm();
        setIsDialogOpen(false);
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
    <div className="space-y-2">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50">
            <Plus className="w-4 h-4 mr-2" />
            New Idea
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save Trade Idea</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., EURUSD Breakout Setup"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your trade idea..."
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session">Session</Label>
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
                    <SelectItem value="NY Open">NY Open</SelectItem>
                    <SelectItem value="NY Close">NY Close</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="strategy_tag">Strategy Tag</Label>
                <Input
                  id="strategy_tag"
                  value={formData.strategy_tag}
                  onChange={(e) => setFormData({ ...formData, strategy_tag: e.target.value })}
                  placeholder="e.g., ORB, Breakout"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Saving...' : 'Save Idea'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50">
        <FileText className="w-4 h-4 mr-2" />
        View Ideas
      </Button>
      
      <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50">
        <TrendingUp className="w-4 h-4 mr-2" />
        Strategy Notes
      </Button>
      
      <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50">
        <PenTool className="w-4 h-4 mr-2" />
        Journal
      </Button>
    </div>
  );
}