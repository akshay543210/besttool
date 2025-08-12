import { useState, useEffect } from "react";
import { BarChart3, Calendar, Settings, HelpCircle, Plus, FileText, TrendingUp, LogOut, Twitter, MessageCircle, Users, PenTool, Bookmark } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAccounts } from "@/hooks/useAccounts";
import { Button } from "@/components/ui/button";
import { NewTradeModal } from "./NewTradeModal";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
const mainItems = [{
  title: "Dashboard",
  url: "/",
  icon: BarChart3
}, {
  title: "Stats",
  url: "/stats",
  icon: TrendingUp
}, {
  title: "Calendar",
  url: "/calendar",
  icon: Calendar
}];
const otherItems = [{
  title: "Settings",
  url: "/settings",
  icon: Settings
}, {
  title: "Help",
  url: "/help",
  icon: HelpCircle
}];
export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const {
    signOut
  } = useAuth();
  const {
    getActiveAccount,
    refetchAccounts
  } = useAccounts();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const activeAccount = getActiveAccount();

  // Listen for active account changes
  useEffect(() => {
    const handleActiveAccountChange = () => {
      refetchAccounts();
    };
    window.addEventListener('activeAccountChanged', handleActiveAccountChange);
    return () => {
      window.removeEventListener('activeAccountChanged', handleActiveAccountChange);
    };
  }, [refetchAccounts]);
  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({
    isActive
  }: {
    isActive: boolean;
  }) => isActive ? "bg-sidebar-accent text-sidebar-primary font-medium" : "hover:bg-sidebar-accent/50";
  return <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            {!collapsed && <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">PropFirm Journal</h2>
              <p className="text-xs text-sidebar-foreground/60">Knowledge Dashboard</p>
            </div>}
          </div>
        </div>

        {/* Portfolio Value */}
        {!collapsed && activeAccount && <div className="p-4 border-b border-sidebar-border">
            <div className="text-sidebar-foreground/60 text-sm">Portfolio Value</div>
            <div className="text-2xl font-bold text-sidebar-foreground">
              ${activeAccount.current_balance.toLocaleString()}
            </div>
            <div className={`text-xs ${activeAccount.current_balance >= activeAccount.starting_balance ? 'text-success' : 'text-destructive'}`}>
              {activeAccount.current_balance >= activeAccount.starting_balance ? '+' : ''}
              ${(activeAccount.current_balance - activeAccount.starting_balance).toLocaleString()} 
              ({activeAccount.name})
            </div>
          </div>}

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Actions */}
        <SidebarGroup>
          <SidebarGroupLabel>Trade ideas

        </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <NewTradeModal onTradeAdded={() => window.location.reload()} />
              </SidebarMenuItem>
              <SidebarMenuItem>
                
              </SidebarMenuItem>
              <SidebarMenuItem>
                
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Social Links */}
        {!collapsed && <SidebarGroup>
            <SidebarGroupLabel>Community</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="https://x.com/free_propfirm?s=09" target="_blank" rel="noopener noreferrer" className="hover:bg-sidebar-accent/50">
                      <Twitter className="w-4 h-4" />
                      <span>Twitter</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="https://telegram.dog/free_propfirm_accounts" target="_blank" rel="noopener noreferrer" className="hover:bg-sidebar-accent/50">
                      <MessageCircle className="w-4 h-4" />
                      <span>Telegram</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="https://discord.gg/7MRsuqqT3n" target="_blank" rel="noopener noreferrer" className="hover:bg-sidebar-accent/50">
                      <Users className="w-4 h-4" />
                      <span>Discord</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>}

        {/* Other */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} className="text-destructive hover:bg-destructive/10">
                  <LogOut className="w-4 h-4" />
                  {!collapsed && <span>Logout</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>;
}