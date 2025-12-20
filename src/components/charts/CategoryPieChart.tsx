import { useExpenses } from "@/contexts/ExpenseContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getCurrencySymbol } from "@/constants/currencies";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import dayjs from "dayjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = [
  "#3b82f6", // Blue (Bills & Utilities)
  "#60a5fa", // Light Blue (Groceries)
  "#1d4ed8", // Dark Blue (Transportation)
  "#fbbf24", // Yellow (Education)
  "#f97316", // Orange (Food & Dining)
  "#1e293b", // Dark Navy (Travel)
  "#10b981", // Emerald (Extra)
  "#8b5cf6", // Violet (Extra)
];

export function CategoryPieChart() {
  const { getExpensesByCategory } = useExpenses();
  const { settings } = useSettings();
  const currencySymbol = getCurrencySymbol(settings.currency);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = dayjs().subtract(i, "month");
    return {
      value: d.format("YYYY-MM"),
      label: d.format("MMMM YYYY"),
    };
  });

  const categoryData = getExpensesByCategory(selectedMonth);

  const data = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value,
  }));

  const totalExpense = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0) {
    return (
      <Card className="col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Spending by Category</CardTitle>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {last6Months.map((month) => (
                <SelectItem key={month.value} value={month.value} className="text-xs">
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No expenses this month
          </div>
        </CardContent>
      </Card>
    );
  }

  const getFontSizeClass = (amount: number) => {
    const length = amount.toFixed(0).length;
    if (length > 9) return "text-sm";
    if (length > 7) return "text-base";
    if (length > 5) return "text-lg";
    return "text-2xl";
  };

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Spending by Category</CardTitle>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {last6Months.map((month) => (
              <SelectItem key={month.value} value={month.value} className="text-xs">
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] relative">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-[100px] flex flex-col items-center justify-center">
            <div className={`${getFontSizeClass(totalExpense)} font-bold transition-all duration-200`}>{currencySymbol}{totalExpense.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                cornerRadius={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `${currencySymbol}${value.toFixed(2)}`}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Custom Legend */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
          {data.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm text-muted-foreground">{entry.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
