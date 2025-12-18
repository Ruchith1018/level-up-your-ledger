import { DailySpendingTrend } from "@/components/charts/DailySpendingTrend";
import { SpendingHeatmap } from "@/components/charts/SpendingHeatmap";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
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
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="hidden md:flex">
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

            {/* Charts Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <DailySpendingTrend />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <SpendingHeatmap />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <CategoryPieChart />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <MonthlyTrendChart />
              </motion.div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
