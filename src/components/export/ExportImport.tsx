import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useExportData } from "@/hooks/useExportData";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ExportImport() {
  const { exportSecurePDF } = useExportData();
  const [password, setPassword] = useState<string | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const pass = await exportSecurePDF();
      setPassword(pass);
      setShowPasswordDialog(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = () => {
    if (password) {
      navigator.clipboard.writeText(password);
      setCopied(true);
      toast.success("Password copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Secure Data Export</CardTitle>
          <CardDescription>
            Download a password-protected PDF report of all your financial data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button
              onClick={handleExport}
              className="w-full"
              disabled={isExporting}
            >
              <FileText className="w-4 h-4 mr-2" />
              {isExporting ? "Generating PDF..." : "Export Secure PDF Report"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              The generated PDF will be encrypted with a unique password shown to you after download.
            </p>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-center">Export Successful!</AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-4">
              <p>Your data has been securely exported. To open the PDF, you will need this unique password:</p>

              <div className="bg-muted p-4 rounded-lg flex items-center justify-between border border-border mt-4">
                <code className="text-lg font-mono font-bold tracking-wide select-all">
                  {password}
                </code>
                <Button variant="ghost" size="icon" onClick={copyToClipboard} className="ml-2">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-3 rounded text-sm text-left">
                <strong>Important:</strong> This password is shown <u>ONLY ONCE</u>. Please copy it immediately. We do not store this password.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowPasswordDialog(false)}>
              I have copied the password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
