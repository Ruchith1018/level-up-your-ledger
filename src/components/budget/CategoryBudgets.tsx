import { useBudget } from "@/contexts/BudgetContext";
import { useExpenses } from "@/contexts/ExpenseContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import dayjs from "dayjs";
import { motion } from "framer-motion";

export function CategoryBudgets() {
  const { getCurrentBudget } = useBudget();
  const { getExpensesByCategory } = useExpenses();
  const currentMonth = dayjs().format("YYYY-MM");
  
  const budget = getCurrentBudget();
  const categorySpending = getExpensesByCategory(currentMonth);

  if (!budget || Object.keys(budget.categoryLimits).length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Budgets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(budget.categoryLimits).map(([category, limit], index) => {
          const spent = categorySpending[category] || 0;
          const percentage = (spent / limit) * 100;
          const remaining = limit - spent;
          const isOverBudget = percentage > 100;

          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{category}</span>
                <span className={isOverBudget ? "text-destructive font-semibold" : "text-muted-foreground"}>
                  ${spent.toFixed(2)} / ${limit.toFixed(2)}
                </span>
              </div>
              <Progress
                value={Math.min(percentage, 100)}
                className={`h-2 ${isOverBudget ? "bg-destructive/20" : ""}`}
              />
              <div className="flex items-center justify-between text-xs">
                <span className={isOverBudget ? "text-destructive" : "text-muted-foreground"}>
                  {isOverBudget ? `Over by $${Math.abs(remaining).toFixed(2)}` : `$${remaining.toFixed(2)} left`}
                </span>
                <span className={percentage > 80 ? "text-warning" : "text-muted-foreground"}>
                  {percentage.toFixed(0)}%
                </span>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
