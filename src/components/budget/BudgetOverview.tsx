import { useExpenses } from "@/contexts/ExpenseContext";
import { useBudget } from "@/contexts/BudgetContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PiggyBank, TrendingUp, TrendingDown } from "lucide-react";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { BudgetForm } from "./BudgetForm";

export function BudgetOverview() {
  const { getTotalByType } = useExpenses();
  const { getCurrentBudget } = useBudget();
  const currentMonth = dayjs().format("YYYY-MM");

  const currentBudget = getCurrentBudget();
  const totalExpense = getTotalByType("expense", currentMonth);
  const totalIncome = getTotalByType("income", currentMonth);

  if (!currentBudget) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <PiggyBank className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No budget set for this month</p>
          <BudgetForm trigger={<Button>Create Budget</Button>} />
        </CardContent>
      </Card>
    );
  }

  const budgetUsed = (totalExpense / currentBudget.total) * 100;
  const remaining = currentBudget.total - totalExpense;
  const isOverBudget = budgetUsed > 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-5xl font-bold mb-2">
            ${totalExpense.toFixed(2)}
          </div>
          <div className="text-muted-foreground">
            of ${currentBudget.total.toFixed(2)} budget
          </div>
          <div className="mt-4">
            <Progress
              value={Math.min(budgetUsed, 100)}
              className={`h-3 ${isOverBudget ? "bg-destructive/20" : ""}`}
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/10 rounded-lg p-4">
            <div className="flex items-center gap-2 text-secondary mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Income</span>
            </div>
            <div className="text-2xl font-bold">${totalIncome.toFixed(2)}</div>
          </div>
          <div
            className={`rounded-lg p-4 ${remaining >= 0 ? "bg-success/10" : "bg-destructive/10"
              }`}
          >
            <div
              className={`flex items-center gap-2 mb-1 ${remaining >= 0 ? "text-success" : "text-destructive"
                }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm font-medium">Remaining</span>
            </div>
            <div className="text-2xl font-bold">${Math.abs(remaining).toFixed(2)}</div>
          </div>
        </div>

        {isOverBudget && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm">
            ⚠️ You've exceeded your budget by ${(totalExpense - currentBudget.total).toFixed(2)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
