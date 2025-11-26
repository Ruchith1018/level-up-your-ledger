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
