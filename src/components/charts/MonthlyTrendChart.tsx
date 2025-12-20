import { useExpenses } from "@/contexts/ExpenseContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getCurrencySymbol } from "@/constants/currencies";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import dayjs from "dayjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

export function MonthlyTrendChart() {
  const { state } = useExpenses();
  const { settings } = useSettings();
  const currencySymbol = getCurrencySymbol(settings.currency);
  const [selectedMonth, setSelectedMonth] = useState<string>(dayjs().format("YYYY-MM"));
  const [isExpanded, setIsExpanded] = useState(false);

  // Get last 6 months data
  const months = Array.from({ length: 6 }, (_, i) => {
    return dayjs().subtract(5 - i, "month").format("YYYY-MM");
  });

  const data = months.map((month) => {
    const monthExpenses = state.items.filter(
      (e) => dayjs(e.date).format("YYYY-MM") === month && e.type === "expense"
    );
    const monthIncome = state.items.filter(
      (e) => dayjs(e.date).format("YYYY-MM") === month && e.type === "income"
    );

    const totalExpense = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = monthIncome.reduce((sum, e) => sum + e.amount, 0);

    return {
      month: dayjs(month).format("MMM"),
      fullDate: month,
      expense: totalExpense,
      income: totalIncome,
    };
  });

  // Calculate category breakdown for selected month
  const selectedMonthExpenses = state.items.filter(
    (e) => dayjs(e.date).format("YYYY-MM") === selectedMonth && e.type === "expense"
  );

  const totalSelectedMonthExpense = selectedMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryBreakdown = selectedMonthExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalSelectedMonthExpense > 0 ? (amount / totalSelectedMonthExpense) * 100 : 0,
    }));

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">6-Month Trend</CardTitle>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month} value={month}>
                {dayjs(month).format("MMMM YYYY")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-[250px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${currencySymbol}${value}`}
                width={40}
              />
              <Tooltip
                formatter={(value: number) => [`${currencySymbol}${value.toFixed(2)}`, ""]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
                cursor={{ fill: "hsl(var(--muted)/0.2)" }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                fontSize={12}
                wrapperStyle={{ paddingBottom: "20px" }}
              />
              <Bar
                dataKey="income"
                fill="#22c55e"
                name="Income"
                radius={[8, 8, 0, 0]}
                maxBarSize={50}
              />
              <Bar
                dataKey="expense"
                fill="#ef4444"
                name="Expenses"
                radius={[8, 8, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <h4 className="text-sm font-medium text-muted-foreground">
              Spending Breakdown - {dayjs(selectedMonth).format("MMMM YYYY")}
            </h4>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>

          {isExpanded && (
            <>
              {sortedCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No expenses for this month
                </p>
              ) : (
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {sortedCategories.map((item) => (
                    <div key={item.category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.category}</span>
                        <span className="text-muted-foreground">
                          {currencySymbol}{item.amount.toFixed(2)} ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
