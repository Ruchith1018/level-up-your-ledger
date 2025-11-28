import { useExpenses } from "@/contexts/ExpenseContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import dayjs from "dayjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { getCurrencySymbol } from "@/constants/currencies";

type TimeRange = "week" | "month" | "year";

export function DailySpendingTrend() {
    const { state } = useExpenses();
    const { settings } = useSettings();
    const currencySymbol = getCurrencySymbol(settings.currency);
    const [timeRange, setTimeRange] = useState<TimeRange>("month");

    const data = useMemo(() => {
        const now = dayjs();
        let startDate = now;
        let dateFormat = "MMM DD";

        if (timeRange === "week") {
            startDate = now.subtract(7, "day");
        } else if (timeRange === "month") {
            startDate = now.subtract(30, "day");
        } else if (timeRange === "year") {
            startDate = now.subtract(1, "year");
            dateFormat = "MMM";
        }

        const expenses = state.items.filter(
            (e) => e.type === "expense" && dayjs(e.date).isAfter(startDate)
        );

        const groupedData: Record<string, number> = {};

        // Initialize all days/months in range with 0
        if (timeRange === "year") {
            for (let i = 0; i <= 12; i++) {
                const dateKey = startDate.add(i, "month").format("YYYY-MM");
                groupedData[dateKey] = 0;
            }
        } else {
            const days = timeRange === "week" ? 7 : 30;
            for (let i = 0; i <= days; i++) {
                const dateKey = startDate.add(i, "day").format("YYYY-MM-DD");
                groupedData[dateKey] = 0;
            }
        }

        expenses.forEach((e) => {
            const dateKey = timeRange === "year"
                ? dayjs(e.date).format("YYYY-MM")
                : dayjs(e.date).format("YYYY-MM-DD");

            if (groupedData[dateKey] !== undefined) {
                groupedData[dateKey] += e.amount;
            }
        });

        return Object.entries(groupedData)
            .map(([date, amount]) => ({
                date,
                displayDate: dayjs(date).format(dateFormat),
                amount,
            }))
            .sort((a, b) => (dayjs(a.date).isAfter(dayjs(b.date)) ? 1 : -1));
    }, [state.items, timeRange]);

    const totalSpent = data.reduce((sum, item) => sum + item.amount, 0);

    return (
        <Card className="col-span-1 lg:col-span-2 bg-card border-border">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-lg font-medium text-muted-foreground whitespace-nowrap">Daily Spending Trend</CardTitle>
                    <div className="text-3xl font-bold mt-1">{currencySymbol}{totalSpent.toFixed(2)}</div>
                </div>
                <div className="hidden md:flex gap-2 bg-secondary/30 p-1 rounded-lg">
                    {(["week", "month", "year"] as TimeRange[]).map((range) => (
                        <Button
                            key={range}
                            variant={timeRange === range ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setTimeRange(range)}
                            className="text-xs capitalize h-7 px-3"
                        >
                            {range}
                        </Button>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis
                                dataKey="displayDate"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
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
                                contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "0.5rem",
                                }}
                                itemStyle={{ color: "#3b82f6" }}
                                formatter={(value: number) => [`${currencySymbol}${value.toFixed(2)}`, "Spent"]}
                                labelStyle={{ color: "hsl(var(--foreground))" }}
                            />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorAmount)"
                                activeDot={{ r: 4, strokeWidth: 0 }}
                                dot={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex md:hidden justify-center mt-4">
                    <div className="flex gap-2 bg-secondary/30 p-1 rounded-lg">
                        {(["week", "month", "year"] as TimeRange[]).map((range) => (
                            <Button
                                key={range}
                                variant={timeRange === range ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setTimeRange(range)}
                                className="text-xs capitalize h-7 px-3"
                            >
                                {range}
                            </Button>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
