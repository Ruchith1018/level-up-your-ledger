import { useExpenses } from "@/contexts/ExpenseContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import dayjs from "dayjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DailySpendingChart() {
  const { state } = useExpenses();
  const currentMonth = dayjs().format("YYYY-MM");

  // Get daily data for current month
  const daysInMonth = dayjs().daysInMonth();
  const data = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${currentMonth}-${day.toString().padStart(2, "0")}`;
    
    const dayExpenses = state.items.filter(
      (e) => dayjs(e.date).format("YYYY-MM-DD") === dateStr && e.type === "expense"
    );
    
    const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    return {
      day,
      amount: total,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Spending Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="day" 
              stroke="hsl(var(--foreground))"
              label={{ value: 'Day of Month', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              stroke="hsl(var(--foreground))"
              label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Spent']}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
            />
            <Line 
              type="monotone" 
              dataKey="amount" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
