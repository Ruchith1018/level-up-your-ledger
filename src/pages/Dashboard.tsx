import { XPBar } from "@/components/gamification/XPBar";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { MonthlyTrendChart } from "@/components/charts/MonthlyTrendChart";
import { TransactionList } from "@/components/transactions/TransactionList";
import { BudgetOverview } from "@/components/budget/BudgetOverview";
import { CategoryBudgets } from "@/components/budget/CategoryBudgets";
import { AddExpenseModal } from "@/components/transactions/AddExpenseModal";
import { OnboardingDialog } from "@/components/onboarding/OnboardingDialog";
import { SurplusDialog } from "@/components/budget/SurplusDialog";
import { motion } from "framer-motion";
import { BarChart3, Calendar, Settings, Palette, Bell, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSettings } from "@/contexts/SettingsContext";
import { useExpenses } from "@/contexts/ExpenseContext";
import { useBudget } from "@/contexts/BudgetContext";
import { useGamification } from "@/contexts/GamificationContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { state: expenseState } = useExpenses();
  const { state: budgetState } = useBudget();
  const { isLoading: isGamificationLoading, claimableBadges, unclaimedTaskItems, dismissedIds, redeemableItems } = useGamification();

  const isLoading = expenseState.isLoading || budgetState.isLoading || isGamificationLoading;

  const notificationCount =
    (claimableBadges?.filter(id => !dismissedIds?.includes(`badge-${id}`))?.length || 0) +
    (unclaimedTaskItems?.filter(task => !dismissedIds?.includes(`task-${task.uniqueId}`))?.length || 0) +
    (redeemableItems?.filter(item => !dismissedIds?.includes(`redeem-${item.value}`))?.length || 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="md:hidden border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <img src="/logo.jpg" alt="BudGlio Logo" className="w-10 h-10 rounded-xl shadow-lg" />
              <div>
                <h1 className="text-2xl font-bold text-primary">
                  BudGlio
                </h1>
                <p className="text-sm text-muted-foreground">Gamified Finance Tracker</p>
              </div>
            </motion.div>

            {/* Mobile Notification Icon */}
            <div className="flex items-center md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/family")}
              >
                <Users className="w-6 h-6 text-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/notifications")}
              >
                <Bell className="w-6 h-6 text-foreground" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center w-3 h-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                  </span>
                )}
              </Button>
            </div>

            <div className="hidden md:flex gap-2">
              <Button id="nav-analytics-desktop" variant="ghost" size="icon" onClick={() => navigate("/analytics")}>
                <BarChart3 className="w-5 h-5" />
              </Button>
              <Button id="nav-subscriptions-desktop" variant="ghost" size="icon" onClick={() => navigate("/subscriptions")}>
                <Calendar className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/shop")}>
                <Palette className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 pb-24">
        {settings.userName && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-4"
          >
            <h2 className="text-2xl font-bold">Welcome, {settings.userName}!</h2>
            <p className="text-sm text-muted-foreground">Let's track your finances today</p>
          </motion.div>
        )}

        {isLoading ? (
          <div className="space-y-6">
            {/* XP Bar Skeleton */}
            <Skeleton className="w-full h-20 rounded-xl" />

            {/* Budget Cards Skeleton */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Skeleton className="w-full h-[280px] rounded-xl" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-[120px] rounded-lg" />
                <Skeleton className="h-[120px] rounded-lg" />
                <Skeleton className="col-span-2 h-[120px] rounded-lg" />
              </div>
            </div>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="p-4 border rounded-xl space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-1/3" />
                </div>
                <Skeleton className="h-[300px] w-full rounded-full" />
              </div>
              <div className="p-4 border rounded-xl space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-8 w-[100px]" />
                </div>
                <Skeleton className="h-[300px] w-full" />
              </div>
            </div>

            {/* Transactions Skeleton */}
            <div>
              <Skeleton className="h-8 w-40 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            </div>
          </div>
        ) : (
          <>
            <XPBar />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <BudgetOverview />
              <CategoryBudgets />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <CategoryPieChart />
              <MonthlyTrendChart />
            </div>

            <TransactionList />
          </>
        )}
      </main>

      <AddExpenseModal />
      <OnboardingDialog />
      <SurplusDialog />
    </div>
  );
}
