import { useExpenses } from "@/contexts/ExpenseContext";
import { useBudget } from "@/contexts/BudgetContext";
import { useGamification } from "@/contexts/GamificationContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useSubscriptions } from "@/contexts/SubscriptionContext";
import { useSavings } from "@/contexts/SavingsContext";
import { toast } from "sonner";
import dayjs from "dayjs";
import { encryptData } from "@/utils/security";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export function useExportData() {
    const { state: expenseState } = useExpenses();
    const { state: budgetState } = useBudget();
    const { state: gamifyState } = useGamification();
    const { state: subscriptionState } = useSubscriptions();
    const { state: savingsState } = useSavings();
    const { settings } = useSettings();

    const exportJSON = async () => {
        const data = {
            version: "1.0",
            exportedAt: new Date().toISOString(),
            expenses: expenseState.items,
            budgets: budgetState.budgets,
            subscriptions: subscriptionState.subscriptions,
            savings: savingsState.goals,
            gamification: {
                level: gamifyState.level,
                xp: gamifyState.xp,
                totalXP: gamifyState.totalXP,
                coins: gamifyState.coins,
                totalCoins: gamifyState.totalCoins,
                streak: gamifyState.streak,
                lastCheckIn: gamifyState.lastCheckIn,
                badges: gamifyState.badges,
                claimedTasks: gamifyState.claimedTasks,
                history: gamifyState.history,
                redemptionHistory: gamifyState.redemptionHistory,
                createdAt: gamifyState.createdAt,
            },
            settings: {
                currency: settings.currency,
                locale: settings.locale,
                theme: settings.theme,
                cardTheme: settings.cardTheme,
                categories: settings.categories,
                paymentMethods: settings.paymentMethods,
                premiumTheme: settings.premiumTheme,
                userName: settings.userName || "",
                hasCompletedOnboarding: settings.hasCompletedOnboarding || false,
                hasCompletedTutorial: settings.hasCompletedTutorial || false,
                hasSeenIntro: settings.hasSeenIntro || false,
            },
            purchasedThemes: JSON.parse(localStorage.getItem("gft_purchased_themes") || "[]"),
            purchasedCards: JSON.parse(localStorage.getItem("gft_purchased_card_themes") || "[]"),
        };

        const encryptedData = encryptData(data);
        const fileName = `financequest-backup-${dayjs().format("YYYY-MM-DD")}.enc`;

        if (Capacitor.isNativePlatform()) {
            try {
                await Filesystem.writeFile({
                    path: fileName,
                    data: encryptedData,
                    directory: Directory.Documents,
                    encoding: Encoding.UTF8,
                });

                const fileResult = await Filesystem.getUri({
                    directory: Directory.Documents,
                    path: fileName,
                });

                // Attempt to save to Downloads folder as well for easier access
                try {
                    await Filesystem.writeFile({
                        path: `Download/${fileName}`,
                        data: encryptedData,
                        directory: Directory.ExternalStorage,
                        encoding: Encoding.UTF8,
                        recursive: true
                    });
                    toast.success("Saved to Downloads folder");
                } catch (e) {
                    console.log("Could not save directly to Downloads (scoped storage restrictions)", e);
                }

                await Share.share({
                    files: [fileResult.uri],
                    dialogTitle: 'Save or Share Backup',
                });

                toast.success("Data exported successfully!");
            } catch (error) {
                console.error("Export failed:", error);
                toast.error("Failed to export data natively.");
            }
        } else {
            const blob = new Blob([encryptedData], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Data exported successfully (Encrypted)!");
        }
    };

    const exportCSV = async () => {
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
        const fileName = `financequest-transactions-${dayjs().format("YYYY-MM-DD")}.csv`;

        if (Capacitor.isNativePlatform()) {
            try {
                await Filesystem.writeFile({
                    path: fileName,
                    data: csv,
                    directory: Directory.Documents,
                    encoding: Encoding.UTF8,
                });

                const fileResult = await Filesystem.getUri({
                    directory: Directory.Documents,
                    path: fileName,
                });

                // Attempt to save to Downloads folder as well
                try {
                    await Filesystem.writeFile({
                        path: `Download/${fileName}`,
                        data: csv,
                        directory: Directory.ExternalStorage,
                        encoding: Encoding.UTF8,
                        recursive: true
                    });
                    toast.success("Saved to Downloads folder");
                } catch (e) {
                    console.log("Could not save directly to Downloads", e);
                }

                await Share.share({
                    files: [fileResult.uri],
                    dialogTitle: 'Save or Share CSV',
                });

                toast.success("Transactions exported to CSV!");
            } catch (error) {
                console.error("Export failed:", error);
                toast.error("Failed to export CSV natively.");
            }
        } else {
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Transactions exported to CSV!");
        }
    };

    return { exportJSON, exportCSV };
}
