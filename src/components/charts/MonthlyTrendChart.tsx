import { useExpenses } from "@/contexts/ExpenseContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import dayjs from "dayjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MonthlyTrendChart() {
  const { state } = useExpenses();

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
      expense: totalExpense,
      income: totalIncome,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>6-Month Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--foreground))" />
            <YAxis stroke="hsl(var(--foreground))" />
            <Tooltip
              formatter={(value: number) => `$${value.toFixed(2)}`}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
            />
            <Legend />
            <Bar dataKey="expense" fill="hsl(var(--destructive))" name="Expenses" />
            <Bar dataKey="income" fill="hsl(var(--secondary))" name="Income" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
