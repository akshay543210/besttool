import { Button } from "@/components/ui/button";
import { Plus, FileText, TrendingUp, PenTool } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function TradeIdeas() {
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      <Button 
        variant="ghost" 
        className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50"
        onClick={() => navigate('/ideas')}
      >
        <Plus className="w-4 h-4 mr-2" />
        New Idea
      </Button>
      
      <Button 
        variant="ghost" 
        className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50"
        onClick={() => navigate('/ideas')}
      >
        <FileText className="w-4 h-4 mr-2" />
        View Ideas
      </Button>
      
      <Button 
        variant="ghost" 
        className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50"
        onClick={() => navigate('/ideas')}
      >
        <TrendingUp className="w-4 h-4 mr-2" />
        Strategy Notes
      </Button>
      
      <Button 
        variant="ghost" 
        className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50"
        onClick={() => navigate('/ideas')}
      >
        <PenTool className="w-4 h-4 mr-2" />
        Journal
      </Button>
    </div>
  );
}