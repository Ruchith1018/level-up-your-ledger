import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBudget } from "@/contexts/BudgetContext";
import { useExpenses } from "@/contexts/ExpenseContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getCurrencySymbol } from "@/constants/currencies";
import dayjs from "dayjs";
import { PiggyBank, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export function SurplusDialog() {
    const { getBudgetByMonth, updateBudget } = useBudget();
    const { getTotalByType } = useExpenses();
    const { settings } = useSettings();
    const [isOpen, setIsOpen] = useState(false);
    const [surplusAmount, setSurplusAmount] = useState(0);
    const [previousBudgetMonth, setPreviousBudgetMonth] = useState<string | null>(null);

    const currencySymbol = getCurrencySymbol(settings.currency);

    useEffect(() => {
        const checkSurplus = () => {
            const previousMonth = dayjs().subtract(1, 'month').format("YYYY-MM");
            const previousBudget = getBudgetByMonth(previousMonth);

            if (previousBudget) {
                // Check if decision already made
                if (previousBudget.surplusAction) return;

                const expenses = getTotalByType("expense", previousMonth);
                const remaining = previousBudget.total - expenses;

                if (remaining > 0) {
                    setSurplusAmount(remaining);
                    setPreviousBudgetMonth(previousMonth);
                    setIsOpen(true);
                } else {
                    // If no surplus, mark as ignored so we don't check again
                    updateBudget({ ...previousBudget, surplusAction: 'ignored' });
                }
            }
        };

        checkSurplus();
    }, [getBudgetByMonth, getTotalByType, updateBudget]);

    const handleAction = (action: 'rollover' | 'saved') => {
        if (previousBudgetMonth) {
            const budget = getBudgetByMonth(previousBudgetMonth);
            if (budget) {
                updateBudget({ ...budget, surplusAction: action });
                setIsOpen(false);

                if (action === 'rollover') {
                    toast.success("Surplus added to this month's budget!");
                } else {
                    toast.success("Surplus moved to savings!");
                }
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent
                className="sm:max-w-[425px]"
                hideCloseButton
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <PiggyBank className="w-5 h-5 text-emerald-500" />
                        Budget Surplus Found!
                    </DialogTitle>
                    <DialogDescription>
                        You have <span className="font-bold text-foreground">{currencySymbol}{surplusAmount.toFixed(2)}</span> remaining from last month ({dayjs(previousBudgetMonth).format("MMMM")}).
                        <br />
                        What would you like to do with it?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={() => handleAction('saved')}
                        className="w-full sm:w-auto"
                    >
                        <PiggyBank className="w-4 h-4 mr-2" />
                        Keep as Savings
                    </Button>
                    <Button
                        onClick={() => handleAction('rollover')}
                        className="w-full sm:w-auto"
                    >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Add to Budget
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
