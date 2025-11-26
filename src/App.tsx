import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ExpenseProvider } from "@/contexts/ExpenseContext";
import { BudgetProvider } from "@/contexts/BudgetContext";
import { GamificationProvider } from "@/contexts/GamificationContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Subscriptions from "./pages/Subscriptions";
import Settings from "./pages/Settings";
import ThemeShopPage from "./pages/ThemeShopPage";
import NotFound from "./pages/NotFound";
import { BottomNav } from "@/components/layout/BottomNav";
import { TutorialProvider } from "@/contexts/TutorialContext";
import { TutorialOverlay } from "@/components/tutorial/TutorialOverlay";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SettingsProvider>
        <ExpenseProvider>
          <BudgetProvider>
            <SubscriptionProvider>
              <GamificationProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <TutorialProvider>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/subscriptions" element={<Subscriptions />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/shop" element={<ThemeShopPage />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    <BottomNav />
                    <TutorialOverlay />
                  </TutorialProvider>
                </BrowserRouter>
              </GamificationProvider>
            </SubscriptionProvider>
          </BudgetProvider>
        </ExpenseProvider>
      </SettingsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
