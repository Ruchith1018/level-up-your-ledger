import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useExpenses } from "@/contexts/ExpenseContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getCurrencySymbol } from "@/constants/currencies";
import { TrendingDown, ArrowLeft, Calendar } from "lucide-react";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { Skeleton } from "@/components/ui/skeleton";

export default function ExpensesPage() {
    const navigate = useNavigate();
    const { state: expenseState } = useExpenses();
    const { settings } = useSettings();
    const currencySymbol = getCurrencySymbol(settings.currency);
    const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
    const isLoading = expenseState.isLoading;

    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        months.add(dayjs().format("YYYY-MM")); // Always include current month
        expenseState.items
            .filter(item => item.type === 'expense')
            .forEach(item => {
                months.add(dayjs(item.date).format("YYYY-MM"));
            });
        return Array.from(months).sort().reverse();
    }, [expenseState.items]);

    const expenseTransactions = expenseState.items
        .filter(item => item.type === 'expense' && dayjs(item.date).format("YYYY-MM") === selectedMonth)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalExpenses = expenseTransactions.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="bg-background p-4 sm:p-6 pb-24">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-2xl font-bold">Monthly Expenses</h1>
                    </div>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableMonths.map(month => (
                                <SelectItem key={month} value={month}>
                                    {dayjs(month).format("MMMM YYYY")}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {isLoading ? (
                    <div className="space-y-6">
                        {/* Total Income Skeleton */}
                        <Skeleton className="w-full h-[200px] rounded-xl" />

                        {/* List Skeleton */}
                        <div className="space-y-3">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="w-full h-20 rounded-xl" />
                            <Skeleton className="w-full h-20 rounded-xl" />
                            <Skeleton className="w-full h-20 rounded-xl" />
                            <Skeleton className="w-full h-20 rounded-xl" />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Total Expenses Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20 overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <TrendingDown className="w-32 h-32 text-red-500" />
                                </div>
                                <CardHeader className="pb-2 relative z-10">
                                    <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                        <TrendingDown className="w-5 h-5" />
                                        Total Expenses ({dayjs(selectedMonth).format("MMMM")})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="text-4xl sm:text-5xl font-bold text-red-700 dark:text-red-300 mb-2">
                                        {currencySymbol}{totalExpenses.toFixed(2)}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Total spent in {dayjs(selectedMonth).format("MMMM YYYY")}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* History List */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-muted-foreground" />
                                Expense History
                            </h2>

                            {expenseTransactions.length === 0 ? (
                                <Card>
                                    <CardContent className="py-8 text-center text-muted-foreground">
                                        No expenses recorded for {dayjs(selectedMonth).format("MMMM")} yet.
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-3">
                                    {expenseTransactions.map((item, index) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Card>
                                                <CardContent className="flex justify-between items-center p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                                            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{item.category}</p>
                                                            <p className="text-xs text-muted-foreground">{dayjs(item.date).format("MMM D, YYYY")}</p>
                                                        </div>
                                                    </div>
                                                    <span className="font-bold text-red-600 dark:text-red-400">
                                                        -{currencySymbol}{item.amount.toFixed(2)}
                                                    </span>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
