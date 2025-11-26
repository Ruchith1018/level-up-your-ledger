import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, FileJson, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { useExpenses } from "@/contexts/ExpenseContext";
import { useBudget } from "@/contexts/BudgetContext";
import { useGamification } from "@/contexts/GamificationContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useSubscriptions } from "@/contexts/SubscriptionContext";
import dayjs from "dayjs";

export function ExportImport() {
  const { state: expenseState } = useExpenses();
  const { state: budgetState } = useBudget();
  const { state: gamifyState } = useGamification();
  const { state: subscriptionState } = useSubscriptions();
  const { settings } = useSettings();
  const [importing, setImporting] = useState(false);

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
      },
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

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (!data.version || !data.expenses) {
          throw new Error("Invalid backup file format");
        }

        // Store data
        localStorage.setItem("gft_expenses_v1", JSON.stringify({ items: data.expenses }));
        localStorage.setItem("gft_budgets_v1", JSON.stringify({ budgets: data.budgets || [] }));
        localStorage.setItem("gft_subscriptions_v1", JSON.stringify({ subscriptions: data.subscriptions || [] }));

        if (data.gamification) {
          localStorage.setItem("gft_gamify_v1", JSON.stringify(data.gamification));
        }
        if (data.settings) {
          localStorage.setItem("gft_settings_v1", JSON.stringify(data.settings));
        }

        toast.success("Data imported successfully! Refreshing...");
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        toast.error("Failed to import data. Please check the file format.");
        console.error(error);
      } finally {
        setImporting(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export & Import</CardTitle>
        <CardDescription>Backup your data or restore from a backup file</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium">Export Data</h4>
          <div className="flex gap-2">
            <Button onClick={exportJSON} className="flex-1">
              <FileJson className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
            <Button onClick={exportCSV} variant="outline" className="flex-1">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Import Data</h4>
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-file"
              disabled={importing}
            />
            <label htmlFor="import-file">
              <Button asChild variant="outline" className="w-full cursor-pointer">
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {importing ? "Importing..." : "Import from JSON"}
                </span>
              </Button>
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            Warning: Importing will replace all existing data
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
