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
  const { state } = useExpenses();
  const isLoading = state.isLoading;

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
          <div className="space-y-6">
            {/* Daily Trend Skeleton */}
            <Skeleton className="w-full h-[300px] rounded-xl" />

            {/* Heatmap Skeleton */}
            <Skeleton className="w-full h-[200px] rounded-xl" />
            <Skeleton className="w-full h-[200px] rounded-xl" />

            {/* Charts Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="w-full h-[350px] rounded-xl" />
              <Skeleton className="w-full h-[350px] rounded-xl" />
              <Skeleton className="w-full h-[350px] rounded-xl" />
            </div>
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
