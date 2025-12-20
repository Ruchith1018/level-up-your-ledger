import { useExpenses } from "@/contexts/ExpenseContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { useSettings } from "@/contexts/SettingsContext";
import { getCurrencySymbol } from "@/constants/currencies";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SpendingHeatmap() {
  const { state } = useExpenses();
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

  // Get spending for each day
  const daysInMonth = dayjs(selectedMonth).daysInMonth();
  const maxSpending = Math.max(
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${selectedMonth}-${day.toString().padStart(2, "0")}`;
      const dayExpenses = state.items.filter(
        (e) => dayjs(e.date).format("YYYY-MM-DD") === dateStr && e.type === "expense"
      );
      return dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    }),
    1
  );

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${selectedMonth}-${day.toString().padStart(2, "0")}`;
    const dayExpenses = state.items.filter(
      (e) => dayjs(e.date).format("YYYY-MM-DD") === dateStr && e.type === "expense"
    );
    const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const intensity = total / maxSpending;

    return { day, total, intensity };
  });

  const getColor = (intensity: number) => {
    if (intensity === 0) return "hsl(var(--muted))";
    if (intensity < 0.25) return "hsl(142 76% 36% / 0.3)";
    if (intensity < 0.5) return "hsl(142 76% 36% / 0.5)";
    if (intensity < 0.75) return "hsl(38 92% 50% / 0.7)";
    return "hsl(0 84% 60% / 0.9)";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Spending Heatmap</CardTitle>
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
        <div className="grid grid-cols-7 gap-2">
          {days.map(({ day, total, intensity }, index) => (
            <motion.div
              key={`${selectedMonth}-${day}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.01 }}
              className="aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-transform relative group"
              style={{ backgroundColor: getColor(intensity) }}
            >
              <div className="text-xs font-semibold">{day}</div>
              {total > 0 && (
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border rounded p-2 text-xs -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap shadow-lg z-10 w-max pointer-events-none">
                  <span className="font-semibold text-primary">{currencySymbol}{total.toFixed(2)}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(var(--muted))" }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(142 76% 36% / 0.3)" }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(142 76% 36% / 0.5)" }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(38 92% 50% / 0.7)" }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(0 84% 60% / 0.9)" }} />
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
