import { useExpenses } from "@/contexts/ExpenseContext";
import { useBudget } from "@/contexts/BudgetContext";
import { useGamification } from "@/contexts/GamificationContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useSubscriptions } from "@/contexts/SubscriptionContext";
import { XP_REWARDS, BADGES } from "@/utils/gamify";
import { toast } from "sonner";
import dayjs from "dayjs";
import { v4 as uuid } from "uuid";
import { Expense } from "@/types";

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
    const { addExpense, deleteExpense, state: expenseState, getTotalByType } = useExpenses();
    const { addBudget, updateBudget, getBudgetByMonth } = useBudget();
    const { rewardXP, deductXP, unlockBadge, earnCoins, spendCoins, checkBadges } = useGamification();
    const { state: subscriptionState, revertPayment } = useSubscriptions();
    const { settings } = useSettings();

    const addTransaction = (data: TransactionData) => {
        const newTransaction: Expense = {
            id: uuid(),
            type: data.type,
            amount: data.amount,
            currency: settings.currency,
            category: data.category,
            merchant: data.merchant || "",
            paymentMethod: data.paymentMethod,
            date: data.date || new Date().toISOString(),
            notes: data.notes || "",
            createdAt: new Date().toISOString(),
        };

        addExpense(newTransaction);

        // Update or Create Budget logic
        const currentMonth = dayjs(newTransaction.date).format("YYYY-MM");
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
        earnCoins(1);

        // Check for badges
        // The expenseState.items will not yet contain the newTransaction, as addExpense dispatches asynchronously.
        // We need to construct the list of transactions including the new one for badge checks.
        const allTransactionsIncludingNew = [newTransaction, ...expenseState.items];

        // Pass the budget state (we can get it from context if needed, but for now passing existingBudget is close enough or we can fetch fresh)
        // Actually checkBadges needs the whole list.
        checkBadges(allTransactionsIncludingNew, existingBudget);

        // Check for first transaction reward
        if (expenseState.items.length === 0) {
            rewardXP(XP_REWARDS.FIRST_TRANSACTION, "First transaction!");
        }

        toast.success(`${data.type === "expense" ? "Expense" : "Income"} added successfully!`);

        return newTransaction.id;
    };

    const deleteTransaction = (id: string) => {
        // Check if this transaction is a subscription payment
        const subscription = subscriptionState.subscriptions.find(
            s => s.lastPaymentTransactionId === id
        );

        if (subscription) {
            revertPayment(subscription.id);
            toast.info("Subscription payment reverted", {
                description: `Subscription "${subscription.title}" is now due.`,
            });
        }

        deleteExpense(id);
        spendCoins(1);
        deductXP(5, "Transaction deleted");
        toast.success("Transaction deleted", {
            description: "1 Coin deducted, 5 XP deducted",
        });
    };

    return { addTransaction, deleteTransaction };
}
