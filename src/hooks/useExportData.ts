import { useExpenses } from "@/contexts/ExpenseContext";
import { useBudget } from "@/contexts/BudgetContext";
import { useGamification } from "@/contexts/GamificationContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useSubscriptions } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";
import dayjs from "dayjs";

export function useExportData() {
    const { state: expenseState } = useExpenses();
    const { state: budgetState } = useBudget();
    const { state: gamifyState } = useGamification();
    const { state: subscriptionState } = useSubscriptions();
    const { settings } = useSettings();

    const exportJSON = () => {
        const data = {
            version: "1.0",
            exportedAt: new Date().toISOString(),
            expenses: expenseState.items,
            budgets: budgetState.budgets,
            subscriptions: subscriptionState.subscriptions,
            gamification: gamifyState,
            settings: {
                ...settings,
                userName: settings.userName || "",
                hasCompletedOnboarding: settings.hasCompletedOnboarding || false,
                hasCompletedTutorial: settings.hasCompletedTutorial || false,
                hasSeenIntro: settings.hasSeenIntro || false,
            },
            purchasedThemes: JSON.parse(localStorage.getItem("gft_purchased_themes") || "[]"),
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `financequest-backup-${dayjs().format("YYYY-MM-DD")}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("Data exported successfully!");
    };

    const exportCSV = () => {
        const headers = ["Date", "Type", "Category", "Merchant", "Amount", "Payment Method", "Notes"];
        const rows = expenseState.items.map((e) => [
            dayjs(e.date).format("YYYY-MM-DD"),
            e.type,
            e.category,
            e.merchant || "",
            e.amount.toFixed(2),
            e.paymentMethod,
            e.notes || "",
        ]);

        const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `financequest-transactions-${dayjs().format("YYYY-MM-DD")}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("Transactions exported to CSV!");
    };

    return { exportJSON, exportCSV };
}
