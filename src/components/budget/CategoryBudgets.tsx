import { useState } from "react";
import { useBudget } from "@/contexts/BudgetContext";
import { useExpenses } from "@/contexts/ExpenseContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getCurrencySymbol } from "@/constants/currencies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "framer-motion";

export function CategoryBudgets() {
  const { getCurrentBudget } = useBudget();
  const { getExpensesByCategory } = useExpenses();
  const { settings } = useSettings();
  const currencySymbol = getCurrencySymbol(settings.currency);
  const [expanded, setExpanded] = useState(false);
  const currentMonth = dayjs().format("YYYY-MM");

  const budget = getCurrentBudget();
  const categorySpending = getExpensesByCategory(currentMonth);

  if (!budget || Object.keys(budget.categoryLimits).length === 0) {
    return null;
  }

  const entries = Object.entries(budget.categoryLimits);
  const displayedEntries = expanded ? entries : entries.slice(0, 3);
  const hasMore = entries.length > 3;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Budgets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence initial={false}>
          {displayedEntries.map(([category, limit], index) => {
            const spent = categorySpending[category] || 0;
            const percentage = (spent / limit) * 100;
            const remaining = limit - spent;
            const isOverBudget = percentage > 100;

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2 overflow-hidden"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{category}</span>
                  <span className={isOverBudget ? "text-destructive font-semibold" : "text-muted-foreground"}>
                    {currencySymbol}{spent.toFixed(2)} / {currencySymbol}{limit.toFixed(2)}
                  </span>
                </div>
                <Progress
                  value={Math.min(percentage, 100)}
                  className={`h-2 ${isOverBudget ? "bg-destructive/20" : ""}`}
                />
                <div className="flex items-center justify-between text-xs">
                  <span className={isOverBudget ? "text-destructive" : "text-muted-foreground"}>
                    {isOverBudget ? `Over by ${currencySymbol}${Math.abs(remaining).toFixed(2)}` : `${currencySymbol}${remaining.toFixed(2)} left`}
                  </span>
                  <span className={percentage > 80 ? "text-warning" : "text-muted-foreground"}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-foreground mt-2"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                Show Less <ChevronUp className="ml-1 w-3 h-3" />
              </>
            ) : (
              <>
                Show {entries.length - 3} More <ChevronDown className="ml-1 w-3 h-3" />
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
