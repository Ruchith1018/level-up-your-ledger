import { useExpenses } from "@/contexts/ExpenseContext";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import dayjs from "dayjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const currentMonth = dayjs().format("YYYY-MM");
  const categoryData = getExpensesByCategory(currentMonth);

  const data = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value,
  }));

  const totalExpense = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No expenses this month
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] relative">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-8">
            <div className="text-2xl font-bold">${totalExpense.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
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
                formatter={(value: number) => `$${value.toFixed(2)}`}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
