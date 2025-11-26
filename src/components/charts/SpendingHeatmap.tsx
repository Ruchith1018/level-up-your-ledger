import { useExpenses } from "@/contexts/ExpenseContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dayjs from "dayjs";
import { motion } from "framer-motion";

export function SpendingHeatmap() {
  const { state } = useExpenses();
  const currentMonth = dayjs().format("YYYY-MM");

  // Get spending for each day
  const daysInMonth = dayjs().daysInMonth();
  const maxSpending = Math.max(
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${currentMonth}-${day.toString().padStart(2, "0")}`;
      const dayExpenses = state.items.filter(
        (e) => dayjs(e.date).format("YYYY-MM-DD") === dateStr && e.type === "expense"
      );
      return dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    }),
    1
  );

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${currentMonth}-${day.toString().padStart(2, "0")}`;
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
      <CardHeader>
        <CardTitle>Spending Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {days.map(({ day, total, intensity }, index) => (
            <motion.div
              key={day}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.01 }}
              className="aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-transform relative group"
              style={{ backgroundColor: getColor(intensity) }}
            >
              <div className="text-xs font-semibold">{day}</div>
              {total > 0 && (
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border rounded p-2 text-xs -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap shadow-lg z-10">
                  ${total.toFixed(2)}
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
