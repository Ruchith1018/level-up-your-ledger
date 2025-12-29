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
    familyBudgetID?: string;
}

export function useTransaction() {
    const { addExpense, deleteExpense, state: expenseState, getTotalByType } = useExpenses();
    const { addBudget, updateBudget, getBudgetByMonth } = useBudget();
    const { rewardXP, deductXP, earnCoins, spendCoins, revertTransactionReward } = useGamification();
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
            familyBudgetID: data.familyBudgetID,
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

        // Check for badges is now reactive in GamificationContext

        // Check for first transaction reward
        if (expenseState.items.length === 0) {
            rewardXP(XP_REWARDS.FIRST_TRANSACTION, "First transaction!");
        }

        toast.success(`${data.type === "expense" ? "Expense" : "Income"} added successfully!`);

        return newTransaction.id;
    };

    const deleteTransaction = (id: string) => {
        // Find transaction to check type and subscription status
        const transaction = expenseState.items.find(t => t.id === id);

        // Subscription check
        const subscription = subscriptionState.subscriptions.find(
            s => s.lastPaymentTransactionId === id
        );

        if (subscription) {
            revertPayment(subscription.id);
            toast.info("Subscription payment reverted", {
                description: `Subscription "${subscription.title}" is now due.`,
            });
        }

        // Revert Gamification Rewards (Base XP + Coin)
        if (transaction) {
            revertTransactionReward(transaction.type);
        } else {
            // Fallback if transaction not found (shouldn't happen often)
            deductXP(5, "Transaction deleted");
            spendCoins(1);
        }

        deleteExpense(id);
    };

    return { addTransaction, deleteTransaction };
}
