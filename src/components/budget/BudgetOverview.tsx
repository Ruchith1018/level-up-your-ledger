import { useExpenses } from "@/contexts/ExpenseContext";
import { useBudget } from "@/contexts/BudgetContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PiggyBank, TrendingUp, TrendingDown, Pencil, AlertTriangle } from "lucide-react";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { BudgetForm } from "./BudgetForm";

export function BudgetOverview() {
  const { getTotalByType } = useExpenses();
  const { getCurrentBudget, getBudgetByMonth } = useBudget();
  const currentMonth = dayjs().format("YYYY-MM");

  const currentBudget = getCurrentBudget();
  const totalExpense = getTotalByType("expense", currentMonth);
  const totalIncome = getTotalByType("income", currentMonth);

  // Calculate Rollover
  const previousMonth = dayjs().subtract(1, 'month').format("YYYY-MM");
  const previousBudget = getBudgetByMonth(previousMonth);
  let rolloverAmount = 0;

  if (previousBudget && previousBudget.rollover) {
    const previousExpenses = getTotalByType("expense", previousMonth);
    rolloverAmount = Math.max(0, previousBudget.total - previousExpenses);
  }

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

  const effectiveTotal = currentBudget.total + rolloverAmount;
  const budgetUsed = (totalExpense / effectiveTotal) * 100;
  const remaining = effectiveTotal - totalExpense;
  const isOverBudget = remaining < 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center relative"
        >
          <div className="absolute right-0 top-0">
            <BudgetForm
              initialData={currentBudget}
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
              }
            />
          </div>
          <div className={`text-5xl font-bold mb-2 ${isOverBudget ? "text-destructive" : ""}`}>
            {remaining < 0 ? "-" : ""}${Math.abs(remaining).toFixed(2)}
          </div>
          <div className="text-muted-foreground">
            remaining of ${effectiveTotal.toFixed(2)} budget
            {rolloverAmount > 0 && (
              <span className="block text-xs text-emerald-500 mt-1 font-medium">
                (Includes ${rolloverAmount.toFixed(2)} rollover from last month)
              </span>
            )}
          </div>

          {isOverBudget && (
            <div className="flex items-center justify-center gap-2 text-destructive font-bold mt-2 animate-pulse">
              <AlertTriangle className="w-5 h-5" />
              <span>You are in debt!</span>
            </div>
          )}

          <div className="mt-4">
            <Progress
              value={Math.min(budgetUsed, 100)}
              className={`h-3 bg-muted ${isOverBudget ? "bg-destructive/20" : ""}`}
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/10 rounded-lg p-4">
            <div className="flex items-center gap-2 text-secondary mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Income in this month</span>
            </div>
            <div className="text-2xl font-bold">${totalIncome.toFixed(2)}</div>
          </div>
          <div className="rounded-lg p-4 bg-destructive/10">
            <div className="flex items-center gap-2 mb-1 text-destructive">
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm font-medium">Expenses in this month</span>
            </div>
            <div className="text-2xl font-bold">${totalExpense.toFixed(2)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
