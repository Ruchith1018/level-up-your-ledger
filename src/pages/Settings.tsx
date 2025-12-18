import { CurrencySelector } from "@/components/settings/CurrencySelector";
import { ExportImport } from "@/components/export/ExportImport";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useState, useEffect } from "react";
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


export default function Settings() {
  const navigate = useNavigate();
  const { settings, updateSettings, isLoading } = useSettings();
  const [name, setName] = useState(settings.userName || "");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Sync local name state with settings when they load
  useEffect(() => {
    if (settings.userName) {
      setName(settings.userName);
    }
  }, [settings.userName]);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { user, signOut } = useAuth();

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const performLogout = async () => {
    await signOut();
    localStorage.clear();
    window.location.href = "/auth";
  };

  const handleNameUpdate = () => {
    if (name.trim()) {
      updateSettings({ ...settings, userName: name.trim() });
      toast.success("Profile name updated successfully!");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      toast.loading("Deleting data...");

      // Delete data from all tables
      const tables = ['expenses', 'budgets', 'savings_goals', 'subscriptions', 'gamification_profiles', 'user_settings'];

      for (const table of tables) {
        const { error } = await supabase.from(table).delete().eq('user_id', user.id);
        if (error) {
          console.error(`Error deleting from ${table}:`, error);
        }
      }

      // Delete the user authentication account
      const { error: rpcError } = await supabase.rpc('delete_user');
      if (rpcError) {
        console.error("Error deleting user account:", rpcError);
        throw new Error("Failed to delete user account. Check if delete_user function exists.");
      }

      await signOut();
      localStorage.clear();
      toast.dismiss();
      toast.success("Account data deleted successfully.");
      setTimeout(() => (window.location.href = "/intro"), 1500);
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.dismiss();
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
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="w-full h-[300px] rounded-xl" />
            <Skeleton className="w-full h-[200px] rounded-xl" />
            <Skeleton className="w-full h-[200px] rounded-xl" />
            <Skeleton className="w-full h-[150px] rounded-xl" />
          </div>
        ) : (
          <>
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
                        Permanently delete all data and reset the app.
                      </p>
                    </div>
                    <Button variant="destructive" onClick={() => setShowConfirmDelete(true)} className="w-full sm:w-auto">
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove all your data from the database.
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

            <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Ready to Log Out?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to log out?
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
          </>
        )}
      </main>
    </div>
  );
}
