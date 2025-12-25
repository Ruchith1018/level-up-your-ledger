import { useEffect } from "react";
import { DailySpendingTrend } from "@/components/charts/DailySpendingTrend";
import { SpendingHeatmap } from "@/components/charts/SpendingHeatmap";
import { EarningHeatmap } from "@/components/charts/EarningHeatmap";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { EarningPieChart } from "@/components/charts/EarningPieChart";
import { MonthlyTrendChart } from "@/components/charts/MonthlyTrendChart";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useExpenses } from "@/contexts/ExpenseContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function Analytics() {
  const navigate = useNavigate();
  const { state, refreshExpenses } = useExpenses();
  const isLoading = state.isLoading;

  useEffect(() => {
    refreshExpenses();
  }, []);

  return (
    <div className="bg-background">
      <header className="h-[88px] border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex items-center transition-all duration-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="flex md:hidden">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 id="analytics-title" className="text-2xl font-bold">Analytics</h1>
              <p className="text-sm text-muted-foreground">Detailed insights into your spending</p>
            </div>
          </div>
        </div>
      </header>

      <main id="analytics-content" className="container mx-auto px-4 py-6 space-y-6 pb-24">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full animate-pulse" />
              <img
                src="/assets/token.png"
                alt="Loading..."
                className="w-24 h-24 animate-[spin_2s_linear_infinite] relative z-10 object-contain"
              />
            </div>
            <p className="text-muted-foreground animate-pulse font-medium">Loading analytics...</p>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <MonthlyTrendChart />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <DailySpendingTrend />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Spending Column */}
                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-xl font-semibold">Spendings</h2>
                  <SpendingHeatmap />
                  <CategoryPieChart />
                </motion.div>

                {/* Earning Column */}
                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-xl font-semibold">Earnings</h2>
                  <EarningHeatmap />
                  <EarningPieChart />
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
