import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Note: React Router v7 future flags will be available when upgrading to v7
import { ExpenseProvider } from "@/contexts/ExpenseContext";
import { BudgetProvider } from "@/contexts/BudgetContext";
import { GamificationProvider } from "@/contexts/GamificationContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { SavingsProvider } from "@/contexts/SavingsContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Notifications from "./pages/Notifications";
import Analytics from "./pages/Analytics";
import Subscriptions from "./pages/Subscriptions";
import Settings from "./pages/Settings";
import ThemeShopPage from "./pages/ThemeShopPage";
import Gamification from "./pages/Gamification";
import BadgesPage from "./pages/BadgesPage";
import TokenHistoryPage from "./pages/TokenHistoryPage";
import IntroPage from "./pages/IntroPage";
import NotFound from "./pages/NotFound";
import { AppLayout } from "@/components/layout/AppLayout";
import { TutorialProvider } from "@/contexts/TutorialContext";
import { TutorialOverlay } from "@/components/tutorial/TutorialOverlay";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthPage from "./pages/AuthPage";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import IncomePage from "./pages/IncomePage";
import ExpensesPage from "./pages/ExpensesPage";
import ReferralsPage from "./pages/ReferralsPage";
import SavingsPage from "./pages/SavingsPage";
import TransactionsPage from "./pages/TransactionsPage";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const queryClient = new QueryClient();



const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <AuthProvider>

                <SettingsProvider>
                    <ExpenseProvider>
                        <BudgetProvider>
                            <SubscriptionProvider>
                                <SavingsProvider>
                                    <GamificationProvider>
                                        <Toaster />
                                        <Sonner position="top-center" />
                                        <BrowserRouter>
                                            <TutorialProvider>
                                                <Routes>
                                                    {/* Public Routes */}
                                                    <Route path="/intro" element={<IntroPage />} />
                                                    <Route path="/auth" element={<AuthPage />} />

                                                    {/* Admin Routes */}
                                                    <Route path="/admin" element={<AdminLogin />} />
                                                    <Route path="/admin/dashboard" element={<AdminDashboard />} />

                                                    {/* Protected Routes */}
                                                    <Route element={<ProtectedRoute />}>
                                                        <Route element={<AppLayout />}>
                                                            <Route path="/" element={<Index />} />
                                                            <Route path="/dashboard" element={<Dashboard />} />
                                                            <Route path="/notifications" element={<Notifications />} />
                                                            <Route path="/analytics" element={<Analytics />} />
                                                            <Route path="/subscriptions" element={<Subscriptions />} />
                                                            <Route path="/settings" element={<Settings />} />
                                                            <Route path="/referrals" element={<ReferralsPage />} />
                                                            <Route path="/income" element={<IncomePage />} />
                                                            <Route path="/expenses" element={<ExpensesPage />} />
                                                            <Route path="/savings" element={<SavingsPage />} />
                                                            <Route path="/transactions" element={<TransactionsPage />} />
                                                            <Route path="/shop" element={<ThemeShopPage />} />
                                                            <Route path="/gamification" element={<Gamification />} />
                                                            <Route path="/gamification/badges" element={<BadgesPage />} />
                                                            <Route path="/gamification/tokens" element={<TokenHistoryPage />} />
                                                        </Route>
                                                    </Route>

                                                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                                                    <Route path="*" element={<NotFound />} />
                                                </Routes>
                                                <TutorialOverlay />
                                            </TutorialProvider>
                                        </BrowserRouter>
                                    </GamificationProvider>
                                </SavingsProvider>
                            </SubscriptionProvider>
                        </BudgetProvider>
                    </ExpenseProvider>
                </SettingsProvider>
            </AuthProvider>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
