import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Stats from "./pages/Stats";
import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import PublicTrade from "./pages/PublicTrade";
import TradeReview from "./pages/TradeReview";
import TradeIdeasPage from "./pages/TradeIdeasPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/trade/:tradeId" element={<PublicTrade />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <SidebarProvider>
                  <div className="min-h-screen flex w-full bg-background">
                    <AppSidebar />
                    <div className="flex-1 flex flex-col">
                      <header className="h-12 flex items-center border-b border-border bg-card">
                        <SidebarTrigger className="ml-4" />
                        <div className="ml-4">
                          <h1 className="text-lg font-semibold text-card-foreground">PropFirm Knowledge Journal</h1>
                        </div>
                      </header>
                      <main className="flex-1 p-6">
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/stats" element={<Stats />} />
                          <Route path="/calendar" element={<Calendar />} />
                          <Route path="/review/:tradeId" element={<TradeReview />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/help" element={<Help />} />
                          <Route path="/ideas" element={<TradeIdeasPage />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </main>
                    </div>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;