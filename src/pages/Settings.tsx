import { CurrencySelector } from "@/components/settings/CurrencySelector";
import { ExportImport } from "@/components/export/ExportImport";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Moon, Sun, Laptop, User, LogOut, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useState } from "react";
import { GamificationStats } from "@/components/gamification/GamificationStats";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useExportData } from "@/hooks/useExportData";

export default function Settings() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const [name, setName] = useState(settings.userName || "");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showLogoutExportDialog, setShowLogoutExportDialog] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { exportJSON } = useExportData();
  const { user, signOut } = useAuth();

  const handleLogoutClick = () => {
    setShowLogoutExportDialog(true);
  };

  const handleLogoutExportAndProceed = () => {
    exportJSON();
    setShowLogoutExportDialog(false);
    setTimeout(() => setShowLogoutConfirm(true), 1000);
  };

  const performLogout = async () => {
    await signOut();
    localStorage.clear();
    window.location.href = "/intro";
  };

  const handleNameUpdate = () => {
    if (name.trim()) {
      updateSettings({ ...settings, userName: name.trim() });
      toast.success("Profile name updated successfully!");
    }
  };

  const handleExportAndProceed = () => {
    exportJSON();
    setShowDeleteDialog(false);
    setTimeout(() => setShowConfirmDelete(true), 1000); // Small delay for UX
  };

  const handleDeleteAccount = async () => {
    try {
      // Attempt to delete from Supabase
      const { error } = await supabase.rpc('delete_user');

      if (error) {
        console.error("Error deleting account:", error);
        toast.error("Failed to delete server account. Please run the SQL setup.");
        return;
      }

      // If successful, clear local data
      localStorage.clear();
      toast.success("Account deleted. Resetting app...");
      setTimeout(() => (window.location.href = "/"), 1500);
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="hidden md:flex">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your preferences and data</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-9"
                        placeholder="Enter your name"
                      />
                    </div>
                    <Button onClick={handleNameUpdate}>Save</Button>
                  </div>
                </div>

                {user && (
                  <>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border">
                        <span className="text-sm text-muted-foreground">{user.email}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        variant="outline"
                        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleLogoutClick}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Log Out
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Referral Program</CardTitle>
                <CardDescription>Share and earn rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Your Referral ID</Label>
                    <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border justify-between">
                      <span className="text-sm font-mono">{user.user_metadata?.referral_id || "N/A"}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => {
                          navigator.clipboard.writeText(user.user_metadata?.referral_id || "");
                          toast.success("Referral ID copied!");
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Share this code with friends to earn rewards!
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={() => navigate("/referrals")}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    View Referred Users
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Appearance & Preferences</CardTitle>
              <CardDescription>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <CurrencySelector />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                  <div className="space-y-0.5">
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      Select your preferred theme
                    </p>
                  </div>
                  <Select
                    value={settings.theme}
                    onValueChange={(value: "light" | "dark" | "system") =>
                      updateSettings({ theme: value })
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="w-4 h-4" />
                          <span>Light</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="w-4 h-4" />
                          <span>Dark</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Laptop className="w-4 h-4" />
                          <span>System</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GamificationStats />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ExportImport />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions for your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label className="text-destructive">Delete Account</Label>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete all data and reset the app
                  </p>
                </div>
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="w-full sm:w-auto">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>


        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Export Required</AlertDialogTitle>
              <AlertDialogDescription>
                Before you delete your account, you must export your data. This ensures you have a backup if you ever want to restore it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleExportAndProceed}>
                Export Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Forever
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showLogoutExportDialog} onOpenChange={setShowLogoutExportDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Export Required</AlertDialogTitle>
              <AlertDialogDescription>
                Before logging out, you must export your data to ensure you have a backup.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogoutExportAndProceed}>
                Export Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ready to Log Out?</AlertDialogTitle>
              <AlertDialogDescription>
                Your data has been exported. Are you sure you want to log out?
                <br /><br />
                <span className="font-semibold text-destructive">
                  Warning: Logging out will delete all local data from this device.
                </span>
                <br />
                <span className="text-sm text-muted-foreground">
                  Your account will NOT be deleted from the server.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={performLogout}>
                Log Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
