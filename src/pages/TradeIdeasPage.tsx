import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, CalendarIcon, Tag, TrendingUp } from "lucide-react";
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTradeIdeas } from '@/hooks/useTradeIdeas';
import { useToast } from '@/hooks/use-toast';

export default function TradeIdeasPage() {
  const { tradeIdeas, loading, refetchTradeIdeas, createTradeIdea, updateTradeIdea, deleteTradeIdea } = useTradeIdeas();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
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
    setEditingIdeaId(null);
  };

  const handleOpenDialog = (idea?: any) => {
    if (idea) {
      setEditingIdeaId(idea.id);
      setFormData({
        title: idea.title,
        description: idea.description || '',
        session: idea.session,
        strategy_tag: idea.strategy_tag || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (editingIdeaId) {
        await updateTradeIdea(editingIdeaId, {
          title: formData.title,
          description: formData.description || null,
          session: formData.session,
          strategy_tag: formData.strategy_tag || null,
        });
        toast({
          title: "Success",
          description: "Trade idea updated successfully",
        });
      } else {
        await createTradeIdea({
          title: formData.title,
          description: formData.description || null,
          session: formData.session,
          strategy_tag: formData.strategy_tag || null,
        });
        toast({
          title: "Success",
          description: "Trade idea created successfully",
        });
      }
      
      handleCloseDialog();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save trade idea",
        variant: "destructive",
      });
    }
  };

  const handleDeleteIdea = async (id: string) => {
    try {
      await deleteTradeIdea(id);
      toast({
        title: "Success",
        description: "Trade idea deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete trade idea",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trade Ideas</h1>
          <p className="text-muted-foreground">Save and organize your trading ideas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              New Idea
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingIdeaId ? 'Edit Trade Idea' : 'New Trade Idea'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
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
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session">Session</Label>
                  <Select
                    value={formData.session}
                    onValueChange={(value) => setFormData({ ...formData, session: value })}
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
                <Button type="submit" className="flex-1">
                  {editingIdeaId ? 'Update Idea' : 'Save Idea'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCloseDialog}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading trade ideas...</div>
        </div>
      ) : tradeIdeas.length === 0 ? (
        <Card className="bg-gradient-card shadow-card border-border">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Tag className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-card-foreground mb-2">No trade ideas yet</h3>
            <p className="text-muted-foreground mb-4">Start by saving your first trade idea</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Idea
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gradient-card shadow-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Your Trade Ideas ({tradeIdeas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/50">
                  <TableHead className="text-muted-foreground">Title</TableHead>
                  <TableHead className="text-muted-foreground">Session</TableHead>
                  <TableHead className="text-muted-foreground">Strategy</TableHead>
                  <TableHead className="text-muted-foreground">Created</TableHead>
                  <TableHead className="text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tradeIdeas.map((idea) => (
                  <TableRow key={idea.id} className="border-border hover:bg-muted/50">
                    <TableCell className="font-medium text-card-foreground">
                      {idea.title}
                    </TableCell>
                    <TableCell>
                      {idea.session ? (
                        <Badge variant="outline" className="border-border text-muted-foreground">
                          {idea.session}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {idea.strategy_tag ? (
                        <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                          {idea.strategy_tag}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(idea.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(idea)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Trade Idea</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this trade idea? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteIdea(idea.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}