import { useExpenses } from "@/contexts/ExpenseContext";
import { useBudget } from "@/contexts/BudgetContext";
import { useGamification } from "@/contexts/GamificationContext";
import { useSettings } from "@/contexts/SettingsContext";
import { XP_REWARDS, BADGES } from "@/utils/gamify";
import { toast } from "sonner";
import dayjs from "dayjs";
import { v4 as uuid } from "uuid";

export interface TransactionData {
    type: "expense" | "income";
    amount: number;
    category: string;
    paymentMethod: string;
    merchant?: string;
    notes?: string;
    date?: string;
}

export function useTransaction() {
    const { addExpense, state: expenseState } = useExpenses();
    const { addBudget, updateBudget, getBudgetByMonth } = useBudget();
    const { rewardXP, unlockBadge } = useGamification();
    const { settings } = useSettings();

    const addTransaction = (data: TransactionData) => {
        const expense = {
            id: uuid(),
            type: data.type,
            amount: data.amount,
            currency: settings.currency,
            category: data.category,
            merchant: data.merchant || "",
            paymentMethod: data.paymentMethod,
            date: data.date || new Date().toISOString(),
            notes: data.notes || "",
        };

        addExpense(expense);

        // Update or Create Budget logic
        const currentMonth = dayjs(expense.date).format("YYYY-MM");
        const existingBudget = getBudgetByMonth(currentMonth);
        const amount = data.amount;

        if (data.type === "income") {
            if (existingBudget) {
                // Update existing budget: Add income to total
                updateBudget({
                    ...existingBudget,
                    total: existingBudget.total + amount,
                });
                toast.success("Budget increased by income amount!");
            } else {
                // Create new budget from income
                addBudget({
                    period: "monthly",
                    month: currentMonth,
                    total: amount,
                    categoryLimits: {},
                    rollover: false,
                });
                toast.success("Budget automatically created from income!");
            }
        } else if (data.type === "expense") {
            if (!existingBudget) {
                addBudget({
                    period: "monthly",
                    month: currentMonth,
                    total: amount,
                    categoryLimits: {
                        [data.category]: amount
                    },
                    rollover: false,
                });
                toast.success("Budget automatically created from expense!");
            }
        }

        // Gamification
        if (data.type === "expense") {
            rewardXP(XP_REWARDS.ADD_EXPENSE, "Added expense");
        } else {
            rewardXP(XP_REWARDS.ADD_INCOME, "Added income");
        }

        // Check for first transaction badge
        if (expenseState.items.length === 0) {
            unlockBadge(BADGES.FIRST_STEPS.id);
            rewardXP(XP_REWARDS.FIRST_TRANSACTION, "First transaction!");
        }

        toast.success(`${data.type === "expense" ? "Expense" : "Income"} added successfully!`);

        return expense.id;
    };

    return { addTransaction };
}
