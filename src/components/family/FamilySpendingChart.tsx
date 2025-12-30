import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FamilyMember } from "@/types";
import dayjs from "dayjs";
import { useSettings } from "@/contexts/SettingsContext"; // For currency preference
import { FamilyBudgetData } from "@/hooks/useFamilyBudget";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, BarChart3, List } from "lucide-react";

interface FamilySpendingChartProps {
    expenses: any[];
    members: FamilyMember[];
    currentMonth: string; // YYYY-MM
    familyBudget?: FamilyBudgetData | null;
}

const CHART_COLORS = [
    "#8b5cf6", // Purple (Admin-like)
    "#f59e0b", // Amber (Leader-like)
    "#3b82f6", // Blue (Member-like)
    "#10b981", // Emerald
    "#ec4899", // Pink
    "#6366f1", // Indigo
    "#f43f5e", // Rose
];

export function FamilySpendingChart({ expenses, members, currentMonth, familyBudget }: FamilySpendingChartProps) {
    const { settings } = useSettings();
    const [viewMode, setViewMode] = useState<'week' | 'month'>('month');
    const [showDetails, setShowDetails] = useState(false);

    // Process data
    const chartData = useMemo(() => {
        if (!currentMonth) return { data: [], users: new Map() };

        const startOfMonth = dayjs(currentMonth + "-01");
        const daysInMonth = startOfMonth.daysInMonth();
        const today = dayjs();

        // Determine end date for the chart (don't show future empty days if current month)
        const isCurrentMonth = today.format("YYYY-MM") === currentMonth;
        const lastDayToShow = isCurrentMonth ? today.date() : daysInMonth;

        const dataPoints = [];
        const userMap = new Map(members.map(m => [m.user_id, { name: m.profile?.name || 'Unknown', color: '' }]));

        // Assign colors dynamically
        let colorIndex = 0;
        userMap.forEach((val, key) => {
            val.color = CHART_COLORS[colorIndex % CHART_COLORS.length];
            colorIndex++;
        });

        // Initialize daily buckets
        const dailyTotals: Record<string, Record<string, number>> = {};

        // Fill buckets
        (expenses || []).forEach(ex => {
            const day = dayjs(ex.created_at).date();
            if (!dailyTotals[day]) dailyTotals[day] = {};

            dailyTotals[day][ex.user_id] = (dailyTotals[day][ex.user_id] || 0) + Number(ex.amount);
        });

        // Generate final array
        let startDay = 1;
        if (viewMode === 'week') {
            const oneWeekAgo = today.subtract(6, 'day');
            if (isCurrentMonth && oneWeekAgo.isSame(startOfMonth, 'month')) {
                startDay = Math.max(1, oneWeekAgo.date());
            } else if (!isCurrentMonth) {
                // If viewing past month in week mode, maybe show last week? 
                // Let's just stick to showing the whole month for 'week' mode if not current month,
                // or simplistic logic: viewMode toggle probably only makes sense for active month.
                // The user asked for "across the month", so Month view is primary.
            }
        }

        for (let i = startDay; i <= lastDayToShow; i++) {
            const dayStr = startOfMonth.date(i).format("MMM DD");
            const entry: any = { name: dayStr, day: i };

            userMap.forEach((_, userId) => {
                entry[userId] = dailyTotals[i]?.[userId] || 0;
            });

            dataPoints.push(entry);
        }

        return { data: dataPoints, users: userMap };
    }, [expenses, members, currentMonth, viewMode]);

    const totalSpent = useMemo(() => {
        return (expenses || []).reduce((sum, ex) => sum + Number(ex.amount), 0);
    }, [expenses]);

    if (!expenses || expenses.length === 0) return null;

    const currencySymbol = settings.currency ? getCurrencySymbol(settings.currency) : "₹";

    return (
        <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-1">
                    <CardTitle className="text-base font-medium">Daily Spending Trend</CardTitle>
                    <div className="text-2xl font-bold">
                        {currencySymbol}{totalSpent.toLocaleString()}
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {/* Toggle Stats Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-muted-foreground"
                        onClick={() => setShowDetails(!showDetails)}
                    >
                        {showDetails ? <BarChart3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
                        {showDetails ? "Hide Stats" : "Show Stats"}
                    </Button>

                    <div className="flex items-center space-x-1 bg-secondary/50 rounded-lg p-1">
                        {/* Placeholder for tabs if we want to enable Week/Month/Year later */}
                        <button
                            onClick={() => setViewMode('week')}
                            className={`text-xs px-3 py-1 rounded-md transition-colors ${viewMode === 'week' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={`text-xs px-3 py-1 rounded-md transition-colors ${viewMode === 'month' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Month
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col lg:flex-row gap-6 transition-all duration-500 ease-in-out">
                    {/* CHART SECTION */}
                    <div className={`flex-1 min-w-0 transition-all duration-500 ${showDetails ? 'lg:w-[60%]' : 'w-full'}`}>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        {Array.from(chartData.users.entries()).map(([userId, info], index) => (
                                            <linearGradient key={userId} id={`color-${userId}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={info.color} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={info.color} stopOpacity={0} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis
                                        dataKey="name"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                        minTickGap={30}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                        tickFormatter={(value) => `${currencySymbol}${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                                        itemStyle={{ color: "hsl(var(--foreground))" }}
                                        formatter={(value: number, name: string, props: any) => {
                                            // Find user name from dataKey (userId) is tricky unless we map it back or use name
                                            // Recharts passes the dataKey as 'name' here usually.
                                            const userId = props.dataKey;
                                            const userName = chartData.users.get(userId)?.name || "Unknown";
                                            return [`${currencySymbol}${value}`, userName];
                                        }}
                                        labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "0.5rem" }}
                                    />
                                    {Array.from(chartData.users.entries()).map(([userId, info]) => (
                                        <Area
                                            key={userId}
                                            type="monotone"
                                            dataKey={userId}
                                            stroke={info.color}
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill={`url(#color-${userId})`}
                                        />
                                    ))}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t">
                            {Array.from(chartData.users.entries()).map(([userId, info]) => (
                                <div key={userId} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: info.color }}
                                    />
                                    <span>{info.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* STATS PANEL */}
                    {showDetails && familyBudget && (
                        <div className="w-full lg:w-[40%] border-t lg:border-t-0 lg:border-l pl-0 lg:pl-6 pt-6 lg:pt-0 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className="font-semibold mb-4 text-sm flex items-center gap-2">
                                <List className="w-4 h-4 text-primary" />
                                Budget Breakdown
                            </h3>
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="w-[100px]">Member</TableHead>
                                            <TableHead className="text-right">Limit</TableHead>
                                            <TableHead className="text-right">Spent</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {members.map((member) => {
                                            const limit = familyBudget.spending_limits?.[member.user_id] || 0;
                                            // Calculate spent for this user from expenses list directly or use props
                                            const spent = (expenses || [])
                                                .filter(e => e.user_id === member.user_id)
                                                .reduce((sum, e) => sum + Number(e.amount), 0);

                                            // Get color
                                            const userColor = chartData.users.get(member.user_id)?.color;

                                            return (
                                                <TableRow key={member.user_id}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ background: userColor || '#ccc' }} />
                                                            <div className="flex flex-col">
                                                                <span className="text-xs truncate max-w-[80px]" title={member.profile?.name}>{member.profile?.name?.split(' ')[0]}</span>
                                                                <span className="text-[10px] text-muted-foreground uppercase">{member.role}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right text-xs">
                                                        {limit > 0 ? `${currencySymbol}${limit}` : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right text-xs">
                                                        <span className={spent > limit && limit > 0 ? "text-destructive font-bold" : ""}>
                                                            {currencySymbol}{spent}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="mt-4 p-3 bg-secondary/30 rounded-lg text-xs space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Contributed:</span>
                                    <span className="font-mono">{currencySymbol}{familyBudget.total_contributed || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Spent:</span>
                                    <span className="font-mono text-destructive">{currencySymbol}{familyBudget.total_spent || 0}</span>
                                </div>
                                <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                                    <span>Remaining:</span>
                                    <span className={(familyBudget.remaining_budget || 0) < 0 ? "text-destructive" : "text-green-600"}>
                                        {currencySymbol}{familyBudget.remaining_budget || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function getCurrencySymbol(currency: string): string {
    // Basic helper if the utility is not available or we just need a quick fallback
    const symbols: Record<string, string> = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'INR': '₹',
        'JPY': '¥',
    };
    return symbols[currency] || currency || '₹';
}
