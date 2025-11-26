import { XPBar } from "@/components/gamification/XPBar";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { MonthlyTrendChart } from "@/components/charts/MonthlyTrendChart";
import { TransactionList } from "@/components/transactions/TransactionList";
import { BudgetOverview } from "@/components/budget/BudgetOverview";
import { CategoryBudgets } from "@/components/budget/CategoryBudgets";
import { AddExpenseModal } from "@/components/transactions/AddExpenseModal";
import { motion } from "framer-motion";
import { Wallet, BarChart3, Calendar, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  FinanceQuest
                </h1>
                <p className="text-sm text-muted-foreground">Gamified Finance Tracker</p>
              </div>
            </motion.div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/analytics")}>
                <BarChart3 className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/subscriptions")}>
                <Calendar className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 pb-24">
        <XPBar />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BudgetOverview />
          <CategoryBudgets />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryPieChart />
          <MonthlyTrendChart />
        </div>

        <TransactionList />
      </main>

      <AddExpenseModal />
    </div>
  );
}
