import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBudget } from "@/contexts/BudgetContext";
import { useExpenses } from "@/contexts/ExpenseContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getCurrencySymbol } from "@/constants/currencies";
import { PiggyBank } from "lucide-react";
import dayjs from "dayjs";
import { motion } from "framer-motion";

export function SavingsCard() {
    const { state: budgetState } = useBudget();
    const { getTotalByType } = useExpenses();
    const { settings } = useSettings();
    const currencySymbol = getCurrencySymbol(settings.currency);

    const savingsHistory = budgetState.budgets
        .filter(b => b.surplusAction === 'saved')
        .map(b => {
            const expenses = getTotalByType("expense", b.month);
            const savedAmount = Math.max(0, b.total - expenses);
            return {
                month: b.month,
                amount: savedAmount
            };
        })
        .sort((a, b) => b.month.localeCompare(a.month)); // Newest first

    const totalSavings = savingsHistory.reduce((sum, item) => sum + item.amount, 0);

    if (savingsHistory.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <PiggyBank className="w-5 h-5" />
                        Total Savings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mb-4">
                        {currencySymbol}{totalSavings.toFixed(2)}
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">History</h4>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                            {savingsHistory.map((item) => (
                                <div key={item.month} className="flex justify-between items-center text-sm p-2 rounded-md bg-background/50 border border-border/50">
                                    <span className="font-medium">{dayjs(item.month).format("MMMM YYYY")}</span>
                                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                        +{currencySymbol}{item.amount.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
