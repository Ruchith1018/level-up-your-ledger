import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, FileJson, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { useExportData } from "@/hooks/useExportData";

export function ExportImport() {
  const { exportJSON, exportCSV } = useExportData();
  const [importing, setImporting] = useState(false);

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (!data.version || !data.expenses) {
          throw new Error("Invalid backup file format");
        }

        // Check for currency mismatch and convert if needed
        const currentSettingsStr = localStorage.getItem("gft_settings_v1");
        const currentSettings = currentSettingsStr ? JSON.parse(currentSettingsStr) : null;
        const currentCurrency = currentSettings?.currency || "USD";
        const importedCurrency = data.settings?.currency || "USD";

        if (currentCurrency !== importedCurrency) {
          toast.info(`Converting data from ${importedCurrency} to ${currentCurrency}...`);
          try {
            const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${importedCurrency}`);
            if (response.ok) {
              const rateData = await response.json();
              const rate = rateData.rates[currentCurrency];

              if (rate) {
                // Convert Expenses
                data.expenses = data.expenses.map((item: any) => ({
                  ...item,
                  amount: Number((item.amount * rate).toFixed(2))
                }));

                // Convert Budgets (handling both old and new formats temporarily before migration)
                if (data.budgets) {
                  data.budgets = data.budgets.map((b: any) => {
                    const newB = { ...b };
                    if (newB.total) newB.total = Number((newB.total * rate).toFixed(2));
                    if (newB.totalBudget) newB.totalBudget = Number((newB.totalBudget * rate).toFixed(2));

                    if (newB.categoryLimits && !Array.isArray(newB.categoryLimits)) {
                      // New format (Record)
                      const newLimits: Record<string, number> = {};
                      Object.entries(newB.categoryLimits).forEach(([k, v]) => {
                        newLimits[k] = Number(((v as number) * rate).toFixed(2));
                      });
                      newB.categoryLimits = newLimits;
                    } else if (Array.isArray(newB.categoryLimits)) {
                      // Old format (Array) - will be migrated later but convert values now
                      newB.categoryLimits = newB.categoryLimits.map((cl: any) => ({
                        ...cl,
                        limit: Number((cl.limit * rate).toFixed(2))
                      }));
                    }
                    return newB;
                  });
                }

                // Convert Subscriptions
                if (data.subscriptions) {
                  data.subscriptions = data.subscriptions.map((sub: any) => ({
                    ...sub,
                    amount: Number((sub.amount * rate).toFixed(2))
                  }));
                }

                // Update imported settings to match current currency
                if (data.settings) {
                  data.settings.currency = currentCurrency;
                }

                toast.success(`Converted successfully (Rate: ${rate})`);
              }
            }
          } catch (err) {
            console.error("Currency conversion failed during import", err);
            toast.warning("Could not convert currency. Importing with original amounts.");
          }
        }

        // Store data
        localStorage.setItem("gft_expenses_v1", JSON.stringify({ items: data.expenses }));

        // Migrate and store budgets
        const migratedBudgets = (data.budgets || []).map((b: any) => {
          const newBudget = { ...b };

          // Migrate totalBudget -> total
          if (newBudget.totalBudget !== undefined && newBudget.total === undefined) {
            newBudget.total = newBudget.totalBudget;
            delete newBudget.totalBudget;
          }

          // Migrate categoryLimits array -> Record
          if (Array.isArray(newBudget.categoryLimits)) {
            const limitsRecord: Record<string, number> = {};
            newBudget.categoryLimits.forEach((item: any) => {
              if (item.category && item.limit !== undefined) {
                limitsRecord[item.category] = item.limit;
              }
            });
            newBudget.categoryLimits = limitsRecord;
          }

          return newBudget;
        });
        localStorage.setItem("gft_budgets_v1", JSON.stringify({ budgets: migratedBudgets }));

        localStorage.setItem("gft_subscriptions_v1", JSON.stringify({ subscriptions: data.subscriptions || [] }));

        if (data.gamification) {
          localStorage.setItem("gft_gamify_v1", JSON.stringify(data.gamification));
        }

        if (data.settings) {
          const migratedSettings = {
            userName: "",
            hasCompletedOnboarding: false,
            hasCompletedTutorial: false,
            hasSeenIntro: false,
            ...data.settings,
          };
          // Ensure we keep the current currency if we intended to (though we updated data.settings.currency above)
          migratedSettings.currency = currentCurrency;

          localStorage.setItem("gft_settings_v1", JSON.stringify(migratedSettings));
        }

        if (data.purchasedThemes) {
          localStorage.setItem("gft_purchased_themes", JSON.stringify(data.purchasedThemes));
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
