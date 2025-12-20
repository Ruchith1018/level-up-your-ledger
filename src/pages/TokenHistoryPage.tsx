
import { useState } from "react";
import { useGamification } from "@/contexts/GamificationContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Calendar as CalendarIcon, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

export default function TokenHistoryPage() {
    const { state } = useGamification();
    const navigate = useNavigate();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(new Date().setDate(new Date().getDate() - 30)), // Default last 30 days
        to: new Date(),
    });

    // Filter History
    const tokenHistory = state.history.filter(item => {
        const hasTokenActivity = (item.coinsEarned && item.coinsEarned > 0) || (item.coinsSpent && item.coinsSpent > 0);
        if (!hasTokenActivity) return false;

        if (!dateRange?.from) return true;
        const itemDate = new Date(item.date);

        // Check date range
        if (dateRange.to) {
            return itemDate >= dateRange.from && itemDate <= new Date(dateRange.to.setHours(23, 59, 59));
        }
        return itemDate >= dateRange.from;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="min-h-screen bg-background pb-24">
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Token History</h1>
                            <p className="text-sm text-muted-foreground">Track your earnings and spendings</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
                {/* Date Filter */}
                <div className="flex justify-end">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[280px] justify-start text-left font-normal",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                            {format(dateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date range</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Transactions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border">
                            {tokenHistory.length > 0 ? (
                                tokenHistory.map((item, index) => (
                                    <div key={index} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2 rounded-full",
                                                item.coinsEarned ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                            )}>
                                                {item.coinsEarned ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="font-medium">{item.reason}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(item.date), "MMM d, yyyy h:mm a")}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={cn(
                                                "font-bold",
                                                item.coinsEarned ? "text-green-500" : "text-red-500"
                                            )}>
                                                {item.coinsEarned ? `+${item.coinsEarned}` : `-${item.coinsSpent}`} Tokens
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    No token transactions found in this period.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
