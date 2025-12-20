import { useState } from "react";
import { useExpenses } from "@/contexts/ExpenseContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getCurrencySymbol } from "@/constants/currencies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowUpRight, ArrowDownRight, Trash2, CalendarIcon, ArrowLeft } from "lucide-react";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "framer-motion";
import relativeTime from "dayjs/plugin/relativeTime";
import { useTransaction } from "@/hooks/useTransaction";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

dayjs.extend(relativeTime);

export default function TransactionsPage() {
    const navigate = useNavigate();
    const { state } = useExpenses();
    const { deleteTransaction } = useTransaction();
    const { settings } = useSettings();
    const currencySymbol = getCurrencySymbol(settings.currency);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [date, setDate] = useState<DateRange | undefined>(undefined);

    // Filter transactions
    const filteredTransactions = state.items.filter((transaction) => {
        if (!date?.from) return true;
        const transactionDate = dayjs(transaction.date);
        const fromDate = dayjs(date.from).startOf("day");
        const toDate = date.to ? dayjs(date.to).endOf("day") : fromDate.endOf("day");

        return (
            transactionDate.isAfter(fromDate) || transactionDate.isSame(fromDate)
        ) && (
                transactionDate.isBefore(toDate) || transactionDate.isSame(toDate)
            );
    }).sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());

    return (
        <div className="bg-background min-h-screen pb-24">
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Transactions</h1>
                            <p className="text-sm text-muted-foreground">View and manage all your transactions</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 space-y-6">
                <div className="flex justify-center">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-[300px] justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "LLL dd, y")} -{" "}
                                            {format(date.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(date.from, "LLL dd, y")
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
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            {date?.from ? "Filtered Transactions" : "All Transactions"}
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                ({filteredTransactions.length})
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredTransactions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No transactions found for the selected period.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredTransactions.map((transaction, index) => {
                                    const isExpanded = expandedId === transaction.id;

                                    return (
                                        <motion.div
                                            key={transaction.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            layout
                                            onClick={() => setExpandedId(isExpanded ? null : transaction.id)}
                                            className={`flex flex-col p-3 rounded-lg border border-border transition-colors cursor-pointer ${isExpanded ? "bg-muted/50" : "hover:bg-muted/50"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${transaction.type === "income"
                                                            ? "bg-secondary/10 text-secondary"
                                                            : "bg-destructive/10 text-destructive"
                                                            }`}
                                                    >
                                                        {transaction.type === "income" ? (
                                                            <ArrowUpRight className="w-5 h-5" />
                                                        ) : (
                                                            <ArrowDownRight className="w-5 h-5" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className={`font-medium ${isExpanded ? "whitespace-normal" : "truncate"}`}>
                                                            {transaction.category}
                                                        </div>
                                                        {isExpanded ? (
                                                            <div className="flex flex-col mt-1 space-y-0.5">
                                                                <div className="text-sm text-muted-foreground whitespace-normal">
                                                                    {transaction.merchant || transaction.paymentMethod}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground/80">
                                                                    {dayjs(transaction.date).fromNow()}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm text-muted-foreground truncate">
                                                                {transaction.merchant || transaction.paymentMethod} •{" "}
                                                                {dayjs(transaction.date).fromNow()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 ml-2 shrink-0">
                                                    <div
                                                        className={`font-semibold whitespace-nowrap ${transaction.type === "income" ? "text-secondary" : "text-destructive"
                                                            }`}
                                                    >
                                                        {transaction.type === "income" ? "+" : "-"}{currencySymbol}{transaction.amount.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="pt-4 mt-2 border-t border-border/50 flex items-center justify-between">
                                                            <div className="text-sm text-muted-foreground">
                                                                {dayjs(transaction.date).format("MMMM D, YYYY h:mm A")}
                                                            </div>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                className="h-8"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteTransaction(transaction.id);
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
