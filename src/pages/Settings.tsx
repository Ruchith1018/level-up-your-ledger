import { CurrencySelector } from "@/components/settings/CurrencySelector";
import { ExportImport } from "@/components/export/ExportImport";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Moon, Sun, Laptop, User, LogOut, Users, Pencil, Camera, Loader2, UploadCloud, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
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
  const { settings, updateSettings, isLoading, resetTheme } = useSettings();
  const [name, setName] = useState(settings.userName || "");
  // const [showConfirmDelete, setShowConfirmDelete] = useState(false); // Removed
  const [showPasswordStep, setShowPasswordStep] = useState(false);
  const [showFinalDelete, setShowFinalDelete] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Dialog State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(settings.profileImage || "");
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  // Sync local name state with settings when they load or dialog opens
  useEffect(() => {
    if (isEditProfileOpen) {
      setName(settings.userName || "");
      setPreviewImage(settings.profileImage || "");
      setFileToUpload(null);
    }
  }, [settings.userName, settings.profileImage, isEditProfileOpen]);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  const { user, signOut } = useAuth();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create a preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);
    setFileToUpload(file);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const performLogout = async () => {
    resetTheme();
    await signOut();
    localStorage.clear();
    window.location.href = "/intro";
  };

  const handleRemoveAvatar = () => {
    setPreviewImage("");
    setFileToUpload(null);
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    setIsUploading(true);

    try {
      let finalProfileImage = settings.profileImage;

      // 1. Handle File Upload if there is a new file
      if (fileToUpload) {
        // First delete old avatar if it exists in storage
        if (settings.profileImage && settings.profileImage.includes('avatars')) {
          try {
            const oldPath = settings.profileImage.split('/').pop();
            if (oldPath) {
              await supabase.storage.from('avatars').remove([`${user.id}/${oldPath}`]);
            }
          } catch (e) { console.error("Error cleaning up old avatar:", e); }
        }

        const fileExt = fileToUpload.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, fileToUpload);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        finalProfileImage = publicUrl;
      }
      // 2. Handle Removal (no new file, but preview is empty)
      else if (previewImage === "" && settings.profileImage) {
        if (settings.profileImage.includes('avatars')) {
          try {
            const oldPath = settings.profileImage.split('/').pop();
            if (oldPath) {
              await supabase.storage.from('avatars').remove([`${user.id}/${oldPath}`]);
            }
          } catch (e) { console.error("Error removing avatar:", e); }
        }
        finalProfileImage = "";
      }

      // 3. Update User Settings
      await updateSettings({
        ...settings,
        userName: name.trim(),
        profileImage: finalProfileImage
      });

      toast.success("Profile updated successfully!");
      setIsEditProfileOpen(false);

    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(`Error updating profile: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const initDeleteProcess = () => {
    setDeletePassword("");
    setShowPasswordStep(true);
  };

  const handleVerifyPassword = async () => {
    if (!user) return;
    if (!deletePassword) {
      toast.error("Please enter your password");
      return;
    }

    setIsUploading(true); // Reuse loading state for UI feedback
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: deletePassword,
      });

      if (authError) {
        toast.error("Incorrect password");
        return;
      }

      // Password correct
      setShowPasswordStep(false);
      setShowFinalDelete(true);
    } catch (e) {
      toast.error("Verification failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinalDelete = async () => {
    if (!user) return;
    try {
      toast.loading("Deleting data...");

      // Delete avatar from storage if it exists
      if (settings.profileImage && settings.profileImage.includes('avatars')) {
        try {
          const oldPath = settings.profileImage.split('/').pop();
          if (oldPath) {
            const { error: storageError } = await supabase.storage.from('avatars').remove([`${user.id}/${oldPath}`]);
            if (storageError) {
              console.error("Error deleting avatar from storage:", storageError);
            }
          }
        } catch (err) {
          console.error("Error attempting to delete avatar:", err);
        }
      }

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

      resetTheme(); // Reset theme before logout
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
      <header className="h-[88px] border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex items-center transition-all duration-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="flex md:hidden">
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
                  <CardTitle>BudGlio Profile</CardTitle>
                  <CardDescription>Manage your personal information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center space-y-4 py-4">
                    <div className="relative group">
                      <Avatar className="h-24 w-24 border-2 border-border">
                        <AvatarImage src={settings.profileImage} alt={name} className="object-cover" />
                        <AvatarFallback className="text-2xl bg-muted">
                          {name ? name.substring(0, 2).toUpperCase() : <User className="h-10 w-10 text-muted-foreground" />}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold">{settings.userName || "User"}</h2>
                      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md rounded-xl">
                          <DialogHeader>
                            <DialogTitle>Edit Profile</DialogTitle>
                            <DialogDescription>
                              Update your profile information.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-4">
                              <Label>Profile Image</Label>
                              <div className="flex justify-center">
                                <div className="relative group cursor-pointer w-32 h-32 rounded-full overflow-hidden border-2 border-border hover:border-primary transition-colors">
                                  <Avatar className="w-full h-full">
                                    <AvatarImage src={previewImage} alt={name} className="object-cover" />
                                    <AvatarFallback className="text-4xl bg-muted">
                                      {name ? name.substring(0, 2).toUpperCase() : <User className="h-12 w-12 text-muted-foreground" />}
                                    </AvatarFallback>
                                  </Avatar>

                                  {/* Overlay */}
                                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white">
                                    {isUploading ? (
                                      <Loader2 className="h-8 w-8 animate-spin mb-1" />
                                    ) : (
                                      <Camera className="h-8 w-8 mb-1" />
                                    )}
                                    <span className="text-xs font-medium text-center px-2">
                                      {isUploading ? "Uploading..." : "Click to update"}
                                    </span>
                                  </div>

                                  {/* Hidden File Input */}
                                  <input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                  />
                                </div>
                              </div>
                              {previewImage && (
                                <div className="flex justify-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs"
                                    onClick={handleRemoveAvatar}
                                    disabled={isUploading}
                                  >
                                    <Trash2 className="w-3 h-3 mr-1.5" />
                                    Remove Photo
                                  </Button>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Display Name</Label>
                              <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your name"
                              />
                            </div>
                          </div>
                          <DialogFooter className="gap-2 sm:gap-0">
                            <DialogClose asChild>
                              <Button variant="secondary" disabled={isUploading}>Cancel</Button>
                            </DialogClose>

                            <Button onClick={handleSaveChanges} disabled={isUploading}>
                              {isUploading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                "Save Changes"
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="text-sm text-muted-foreground">{user?.email}</div>
                  </div>

                  {user && (
                    <div className="mt-6 pt-6 border-t flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 px-8"
                        onClick={handleLogoutClick}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Log Out
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <GamificationStats />
            </motion.div>

            {user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>BudGlio Referral Program</CardTitle>
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
                        {user.user_metadata?.referred_by && (
                          <div className="pt-2 mt-2 border-t text-xs text-muted-foreground flex items-center gap-1">
                            <span>Referred by:</span>
                            <span className="font-mono font-medium text-foreground">
                              User_{user.user_metadata.referred_by}
                            </span>
                          </div>
                        )}
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
              transition={{ delay: 0.2 }}
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
                    <Button variant="destructive" onClick={initDeleteProcess} className="w-full sm:w-auto">
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Step 1: Password Verification */}
            <Dialog open={showPasswordStep} onOpenChange={setShowPasswordStep}>
              <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Verify Identity</DialogTitle>
                  <DialogDescription>
                    Please enter your password to continue with account deletion.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="pass-verify">Password</Label>
                    <Input
                      id="pass-verify"
                      type="password"
                      placeholder="Enter password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleVerifyPassword()}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setShowPasswordStep(false)}>Cancel</Button>
                  <Button onClick={handleVerifyPassword} disabled={isUploading || !deletePassword}>
                    {isUploading ? "Verifying..." : "Verify & Continue"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Step 2: Final Confirmation */}
            <AlertDialog open={showFinalDelete} onOpenChange={setShowFinalDelete}>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove all your data from the database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleFinalDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg"
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
    </div >
  );
}
