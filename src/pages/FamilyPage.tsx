import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Family, FamilyMember } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, LogIn, Loader2, Share2, Lock, LogOut, RefreshCw, Shield, User, Eye, MoreVertical, Camera, UserPlus, Pencil, Check, X, Wallet, PiggyBank, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { CreateFamilyDialog } from "@/components/family/CreateFamilyDialog";
import { InviteMemberDialog } from "@/components/family/InviteMemberDialog";
import { FamilyMemberCard } from "@/components/family/FamilyMemberCard";
import { ImageCropperModal } from "@/components/family/ImageCropperModal";
import { FamilyRequestsDialog } from "@/components/family/FamilyRequestsDialog";
import { UserRequestsDialog } from "@/components/family/UserRequestsDialog";
import { useSettings } from "@/contexts/SettingsContext";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";

export default function FamilyPage() {
    const { user } = useAuth();
    const { settings, isLoading: settingsLoading } = useSettings();
    const navigate = useNavigate();

    // --- HOOKS SECTION ---

    const [loading, setLoading] = useState(true);
    const [membership, setMembership] = useState<FamilyMember | null>(null);
    const [family, setFamily] = useState<Family | null>(null);
    const [members, setMembers] = useState<FamilyMember[]>([]);

    // Dialog states
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [showLeaveDialog, setShowLeaveDialog] = useState(false);
    const [showRequestsDialog, setShowRequestsDialog] = useState(false);
    const [showUserRequestsDialog, setShowUserRequestsDialog] = useState(false);
    const [successorId, setSuccessorId] = useState<string>("");

    // Join state
    const [joinCode, setJoinCode] = useState("");
    const [joining, setJoining] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [transferring, setTransferring] = useState(false);
    const [showTransferDialog, setShowTransferDialog] = useState(false);
    const [transferTargetId, setTransferTargetId] = useState<string>("");

    // Edit Name state
    const [isEditingName, setIsEditingName] = useState(false);
    const [newFamilyName, setNewFamilyName] = useState("");

    // Family Budget State
    const [familyBudget, setFamilyBudget] = useState<any | null>(null);
    const [showCreateBudgetDialog, setShowCreateBudgetDialog] = useState(false);
    const [showContributeDialog, setShowContributeDialog] = useState(false);
    const [budgetAmount, setBudgetAmount] = useState("");
    const [contributionAmount, setContributionAmount] = useState("");
    const [personalBudgetTotal, setPersonalBudgetTotal] = useState(0);
    // const [personalBudgetTotal, setPersonalBudgetTotal] = useState(0);
    const [personalRemaining, setPersonalRemaining] = useState(0);

    // Image Cropper State
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isCropperOpen, setIsCropperOpen] = useState(false);

    const fetchFamilyData = async (isBackground = false) => {
        if (!user) return;
        if (!isBackground) setLoading(true);
        try {
            // 1. Check membership
            const { data: memberData, error: memberError } = await supabase
                .from('family_members')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (memberError) throw memberError;
            setMembership(memberData);

            if (memberData) {
                // 2. Fetch Family Details
                const { data: familyData, error: familyError } = await supabase
                    .from('families')
                    .select('*')
                    .eq('id', memberData.family_id)
                    .single();

                if (familyError) throw familyError;
                setFamily(familyData);

                // 3. Fetch All Members
                const { data: allMembers, error: listError } = await supabase
                    .from('family_members')
                    .select('*')
                    .eq('family_id', memberData.family_id);

                if (listError) throw listError;

                // 4. Enrich members with profile info
                const enrichedMembers = await Promise.all(
                    (allMembers || []).map(async (m: any) => {
                        const { data: userSettings } = await supabase
                            .from('user_settings')
                            .select('user_name, profile_image')
                            .eq('user_id', m.user_id)
                            .maybeSingle();

                        return {
                            ...m,
                            profile: {
                                name: userSettings?.user_name || "Unknown User",
                                avatar_url: userSettings?.profile_image
                            }
                        };
                    })
                );

                setMembers(enrichedMembers as FamilyMember[]);

                // 5. Fetch Family Budget
                const currentDate = new Date();
                const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

                const { data: budgetData } = await supabase
                    .from('family_budgets')
                    .select('*')
                    .eq('family_id', memberData.family_id)
                    .eq('month', currentMonth)
                    .maybeSingle();


                if (budgetData) {
                    // Fetch contributions separately
                    const { data: contributions } = await supabase
                        .from('family_budget_contributions')
                        .select('*')
                        .eq('family_budget_id', budgetData.id)
                        .order('created_at', { ascending: false });

                    // Calculate total contributed
                    const totalContributed = (contributions || []).reduce(
                        (sum: number, c: any) => sum + Number(c.amount),
                        0
                    );

                    // Fetch profiles for contributors
                    const userIds = [...new Set((contributions || []).map((c: any) => c.user_id))];
                    let userProfiles: any[] = [];

                    if (userIds.length > 0) {
                        const { data: profiles } = await supabase
                            .from('user_settings')
                            .select('user_id, user_name, profile_image')
                            .in('user_id', userIds);
                        userProfiles = profiles || [];
                    }

                    const transformedContributions = (contributions || []).map((c: any) => {
                        const profile = userProfiles.find((p: any) => p.user_id === c.user_id);
                        return {
                            ...c,
                            profile: {
                                name: profile?.user_name || 'Unknown',
                                avatar_url: profile?.profile_image
                            }
                        };
                    });

                    setFamilyBudget({
                        ...budgetData,
                        total_contributed: totalContributed,
                        contributions: transformedContributions
                    });
                } else {
                    setFamilyBudget(null);
                }

                // 6. Fetch Personal Budget Info (for creating/contributing)
                const { data: personalBudget } = await supabase
                    .from('budgets')
                    .select('total')
                    .eq('month', currentMonth)
                    .maybeSingle();

                if (personalBudget) {
                    setPersonalBudgetTotal(Number(personalBudget.total));

                    // Calculate remaining balance
                    const startOfMonth = `${currentMonth}-01`;
                    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

                    const { data: expenses } = await supabase
                        .from('expenses')
                        .select('amount, type')
                        .gte('date', startOfMonth)
                        .lte('date', endOfMonth);

                    const totalExpenses = (expenses || []).reduce((acc, curr) => {
                        if (curr.type === 'expense') return acc + Number(curr.amount);
                        // Income doesn't increase budget limit usually, but if budget is strict limit, we compare against limit
                        // If budget is "remaining funds", we might consider income. 
                        // Requirement: "cannot be greater that bughet craeted from his personal one" implies Budget Limit.
                        // "budget which is lees that the ther personal budget" -> Remaining Budget?
                        // "contribute here the remaining balce decreses" -> implies checking against (Budget - Expenses).
                        return acc;
                    }, 0);

                    setPersonalRemaining(Math.max(0, Number(personalBudget.total) - totalExpenses));
                } else {
                    setPersonalBudgetTotal(0);
                    setPersonalRemaining(0);
                }
            }

        } catch (error: any) {
            console.error("Error fetching family data:", error);
            toast.error(`Error loading family data: ${error.message || error.details || "Unknown error"}`);

        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    // UseEffect is always called
    useEffect(() => {
        // Wait for settings to load before making decisions
        if (settingsLoading) return;

        if (settings.hasPremiumPack) {
            fetchFamilyData();
        } else {
            setLoading(false);
        }
    }, [user, settings.hasPremiumPack, settingsLoading]);

    // Realtime Subscription for detecting when I get added to a family (Entry)
    useEffect(() => {
        if (!user || family?.id) return; // Only listen if NOT in a family

        const channel = supabase
            .channel(`my-membership-status-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'family_members',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('My membership status changed!', payload);
                    fetchFamilyData(true); // Background update
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, family?.id]); // Re-run if family state changes

    // Realtime Subscription for Family Updates (While in a family)
    useEffect(() => {
        if (!family?.id) return;

        console.log("Setting up realtime subscription for family:", family.id);

        const channel = supabase
            .channel(`family-updates-${family.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'family_members',
                    filter: `family_id=eq.${family.id}`
                },
                (payload) => {
                    console.log('Family member change received!', payload);
                    fetchFamilyData(true); // Background update
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'families',
                    filter: `id=eq.${family.id}`
                },
                (payload) => {
                    console.log('Family details change received!', payload);
                    fetchFamilyData(true); // Background update
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'family_budgets',
                    filter: `family_id=eq.${family.id}`
                },
                (payload) => {
                    console.log('Family budget change received!', payload);
                    fetchFamilyData(true); // Background update
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'expenses',
                    filter: `user_id=eq.${user?.id}`
                },
                (payload) => {
                    console.log('Personal expense changed, updating budget!', payload);
                    fetchFamilyData(true);
                }
            )
            .subscribe();

        return () => {
            console.log("Cleaning up realtime subscription");
            supabase.removeChannel(channel);
        };
    }, [family?.id, user?.id]);

    // Dedicated subscription for the active budget contributions
    useEffect(() => {
        if (!familyBudget?.id) return;

        console.log("Setting up contribution listener for budget:", familyBudget.id);

        const channel = supabase
            .channel(`budget-contributions-${familyBudget.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'family_budget_contributions',
                    filter: `family_budget_id=eq.${familyBudget.id}`
                },
                (payload) => {
                    console.log('Contribution received for current budget!', payload);
                    fetchFamilyData(true);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [familyBudget?.id]);

    // Handlers
    const handleCreateBudget = async () => {
        if (!budgetAmount || Number(budgetAmount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (Number(budgetAmount) > personalBudgetTotal) {
            toast.error(`Family budget cannot exceed your personal budget (${personalBudgetTotal})`);
            return;
        }

        try {
            setLoading(true);
            const currentDate = new Date();
            const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

            const { error } = await supabase
                .from('family_budgets')
                .insert({
                    family_id: family?.id,
                    month: currentMonth,
                    total_amount: Number(budgetAmount),
                    created_by: user?.id
                });

            if (error) throw error;

            toast.success("Family budget created!");
            setShowCreateBudgetDialog(false);
            fetchFamilyData(true);
        } catch (error: any) {
            toast.error(error.message || "Failed to create budget");
        } finally {
            setLoading(false);
        }
    };

    const handleContribute = async () => {
        if (!contributionAmount || Number(contributionAmount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (Number(contributionAmount) > personalRemaining) {
            toast.error(`Contribution cannot exceed your remaining personal budget (${personalRemaining})`);
            return;
        }

        try {
            setLoading(true);

            // 1. Create Personal Expense (Locked)
            const { data: expenseData, error: expenseError } = await supabase
                .from('expenses')
                .insert({
                    user_id: user?.id,
                    type: 'expense',
                    amount: Number(contributionAmount),
                    category: 'Family Contribution',
                    payment_method: 'Transfer', // Required field
                    notes: `Contribution to ${family?.name} budget`,
                    date: new Date().toISOString(),
                    is_locked: true // Irreversible
                })
                .select()
                .single();

            if (expenseError) throw expenseError;

            // 2. Create Family Contribution
            const { error: contribError } = await supabase
                .from('family_budget_contributions')
                .insert({
                    family_budget_id: familyBudget.id,
                    user_id: user?.id,
                    amount: Number(contributionAmount),
                    transaction_id: expenseData.id
                });

            if (contribError) {
                // Rollback expense if contribution fails (best effort)
                await supabase.from('expenses').delete().eq('id', expenseData.id);
                throw contribError;
            }

            toast.success("Contribution successful!");
            setShowContributeDialog(false);
            setContributionAmount("");
            fetchFamilyData(true);
        } catch (error: any) {
            toast.error(error.message || "Failed to contribute");
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!joinCode.trim()) return;
        setJoining(true);
        try {
            // Refresh session to ensure token is valid
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

            if (refreshError) {
                console.error("DEBUG Join: Session refresh failed:", refreshError);
                toast.error("Session expired. Please re-login.");
                setJoining(false);
                return;
            }

            const session = refreshedSession;
            console.log("DEBUG Join: Session refreshed:", !!session);
            console.log("DEBUG Join: Token:", session?.access_token ? session.access_token.substring(0, 10) + "..." : "missing");

            if (!session?.access_token) {
                console.error("DEBUG Join: Authentication session missing");
                toast.error("Authentication session missing. Please re-login.");
                setJoining(false);
                return;
            }

            const { data, error } = await supabase.functions.invoke('manage-family', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                },
                body: {
                    action: 'join',
                    share_code: joinCode.trim(),
                    access_token: session.access_token // Send in body as backup
                }
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error);

            // Check if it was an auto-match
            if (data.autoAccepted) {
                toast.success(data.message || "Mutual match! You have been automatically added to the family");
                // Refresh family data to show the new family dashboard
                await fetchFamilyData();
            } else {
                toast.success("Join request sent successfully! Waiting for admin approval.");
            }

            setJoinCode("");
        } catch (error: any) {
            toast.error(error.message || "Failed to join family");
        } finally {
            setJoining(false);
        }
    };

    const handleUpdateName = async () => {
        if (!family || !newFamilyName.trim()) return;

        try {
            const { error } = await supabase
                .from('families')
                .update({ name: newFamilyName.trim() })
                .eq('id', family.id);

            if (error) throw error;

            toast.success("Family name updated");
            setIsEditingName(false);
            fetchFamilyData(true);
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleUpdateRole = async (memberId: string, newRole: string) => {
        if (newRole === 'admin') {
            setTransferTargetId(memberId);
            setShowTransferDialog(true);
            return;
        }

        // Optimistic update
        setMembers(prev => prev.map(m => m.user_id === memberId ? { ...m, role: newRole as any } : m));

        try {
            if (!family) return;

            const { error } = await supabase
                .from('family_members')
                .update({ role: newRole })
                .eq('family_id', family.id)
                .eq('user_id', memberId);

            if (error) throw error;
            toast.success("Member role updated");
        } catch (error) {
            toast.error("Failed to update role");
            fetchFamilyData(); // Revert
        }
    };

    const handleTransferAdmin = async () => {
        if (!transferTargetId) return;

        // 1. Optimistic Updates
        // Capture previous state for rollback
        const prevMembers = [...members];
        const prevMembership = membership ? { ...membership } : null;

        // Update UI immediately (Instant feel)
        setMembers(prev => prev.map(m => {
            if (m.user_id === user?.id) return { ...m, role: 'member' };
            if (m.user_id === transferTargetId) return { ...m, role: 'admin' };
            return m;
        }));

        // Update my own membership state (hides admin controls immediately)
        setMembership(prev => prev ? { ...prev, role: 'member' } : null);

        // Close Dialog & Reset
        setShowTransferDialog(false);
        setTransferTargetId("");

        // We still set transferring true internally for the async op, 
        // but since dialog is closed, user sees instant success.
        setTransferring(true);

        try {
            // Refresh session to ensure token is valid
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

            if (refreshError || !refreshedSession?.access_token) {
                toast.error("Session expired. Please re-login.");
                // Revert
                setMembers(prevMembers);
                setMembership(prevMembership);
                return;
            }

            const { data, error } = await supabase.functions.invoke('manage-family', {
                headers: { Authorization: `Bearer ${refreshedSession.access_token}` },
                body: {
                    action: 'transfer_admin',
                    target_user_id: transferTargetId,
                    access_token: refreshedSession.access_token
                }
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error);

            toast.success(data.message || "Admin rights transferred successfully");

            // Background refresh to ensure consistency
            await fetchFamilyData(true);

        } catch (error: any) {
            console.error("Transfer Admin Error:", error);
            toast.error(error.message || "Failed to transfer admin rights");

            // Revert state on error
            setMembers(prevMembers);
            setMembership(prevMembership);
            // Re-open dialog? Maybe not, just let them try again.
        } finally {
            setTransferring(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return;

        try {
            if (!family) return;

            const { error } = await supabase
                .from('family_members')
                .delete()
                .eq('family_id', family.id)
                .eq('user_id', memberId);

            if (error) throw error;
            toast.success("Member removed");
            setMembers(prev => prev.filter(m => m.user_id !== memberId));
        } catch (error) {
            toast.error("Failed to remove member");
        }
    };

    const handleLeaveFamily = async () => {
        setLeaving(true);
        try {
            // Refresh session to ensure token is valid
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

            if (refreshError) {
                console.error("Leave Family: Session refresh failed:", refreshError);
                toast.error("Session expired. Please re-login.");
                setLeaving(false);
                return;
            }

            const session = refreshedSession;

            if (!session?.access_token) {
                console.error("Leave Family: Authentication session missing");
                toast.error("Authentication session missing. Please re-login.");
                setLeaving(false);
                return;
            }

            const { data, error } = await supabase.functions.invoke('manage-family', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                },
                body: {
                    action: 'leave',
                    access_token: session.access_token
                }
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error);

            // Show appropriate message based on whether family was deleted
            if (data.familyDeleted) {
                toast.success("You left the family. As the last admin, the family has been deleted.");
            } else {
                toast.success("You have left the family successfully");
            }

            // Refresh family data to show the create/join screen
            await fetchFamilyData();
        } catch (error: any) {
            console.error("Leave family error:", error);
            toast.error(error.message || "Failed to leave family");
        } finally {
            setLeaving(false);
            setShowLeaveDialog(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Verify file type/size if needed
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size must be less than 5MB");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setSelectedImage(reader.result as string);
            setIsCropperOpen(true);
        };
        reader.readAsDataURL(file);

        // Reset input value so same file can be selected again
        event.target.value = '';
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        if (!family) return;

        // convert blob to file
        const file = new File([croppedBlob], "family_profile.jpg", { type: "image/jpeg" });
        await handleUpdateFamilyImage(file);
    };

    const handleUpdateFamilyImage = async (file: File) => {
        if (!family) return;

        try {
            toast.loading("Uploading profile picture...");

            // Delete old image if exists
            if (family.profile_image) {
                const oldPath = family.profile_image.split('/').pop();
                if (oldPath) {
                    await supabase.storage
                        .from('family_profiles')
                        .remove([oldPath]);
                }
            }

            // Upload new image
            const fileExt = "jpg"; // We forced jpeg in cropper
            const fileName = `${family.id}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('family_profiles')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('family_profiles')
                .getPublicUrl(fileName);

            // Update family record
            const { error: updateError } = await supabase
                .from('families')
                .update({ profile_image: publicUrl })
                .eq('id', family.id);

            if (updateError) throw updateError;

            toast.dismiss();
            toast.success("Profile picture updated!");

            // Refresh family data
            await fetchFamilyData(true);
        } catch (error: any) {
            toast.dismiss();
            toast.error(error.message || "Failed to upload image");
        }
    };

    // --- RENDER SECTION ---

    // 1. Global Loading State (Settings or Family Data)
    if (settingsLoading || loading) {
        return (
            <div className="min-h-screen bg-background">
                <header className="h-[88px] border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex items-center transition-all duration-200">
                    <div className="container mx-auto px-4">
                        <div>
                            <h1 className="text-2xl font-bold">Family Tracking</h1>
                            <p className="text-sm text-muted-foreground">Manage your shared finances</p>
                        </div>
                    </div>
                </header>
                <main className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full animate-pulse" />
                            <img
                                src="/assets/token.png"
                                alt="Loading..."
                                className="w-24 h-24 animate-[spin_2s_linear_infinite] relative z-10 object-contain"
                            />
                        </div>
                        <p className="text-muted-foreground animate-pulse font-medium">Loading...</p>
                    </div>
                </main>
            </div>
        );
    }

    // 2. Premium Lock Screen (Only shown if settings loaded AND no premium)
    if (!settings.hasPremiumPack) {
        return (
            <div className="min-h-screen bg-background">
                <header className="h-[88px] border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex items-center transition-all duration-200">
                    <div className="container mx-auto px-4">
                        <div>
                            <h1 className="text-2xl font-bold">Family Tracking</h1>
                            <p className="text-sm text-muted-foreground">Manage your shared finances</p>
                        </div>
                    </div>
                </header>
                <main className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in zoom-in duration-500">
                    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 text-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-violet-500/20 blur-3xl rounded-full" />
                            <div className="p-8 bg-violet-100 dark:bg-violet-900/30 rounded-full relative z-10">
                                <Lock className="w-20 h-20 text-violet-600 dark:text-violet-400" />
                            </div>
                        </div>
                        <div className="space-y-4 max-w-lg">
                            <h1 className="text-4xl font-bold tracking-tighter">Family Budgeting</h1>
                            <p className="text-xl text-muted-foreground">
                                Collaborate, track, and grow your wealth together. Exclusive to Premium Pack members.
                            </p>
                        </div>
                        <Button size="lg" className="w-full max-w-sm bg-violet-600 hover:bg-violet-700 text-white" onClick={() => navigate('/premium')}>
                            Unlock Premium Pack
                        </Button>
                    </div>
                </main>
            </div>
        );
    }

    // 3. No Current Family - Show "Create/Join" Dashboard
    if (!membership || !family) {
        return (
            <div className="min-h-screen bg-background">
                <header className="h-[88px] border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex items-center transition-all duration-200">
                    <div className="container mx-auto px-4 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold">Family Tracking</h1>
                            <p className="text-sm text-muted-foreground">Manage your shared finances</p>
                        </div>
                        <Button variant="outline" onClick={() => setShowUserRequestsDialog(true)} className="gap-2">
                            <RefreshCw className="w-4 h-4" />
                            Requests
                        </Button>
                    </div>
                </header>
                <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8 animate-in fade-in duration-500">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight">Family Dashboard</h1>
                        <p className="text-xl text-muted-foreground">
                            Create or join a family to start tracking expenses together.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mt-12">
                        {/* Create Family */}
                        <Card className="hover:border-primary/50 transition-colors">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-6 h-6 text-primary" />
                                    Create a Family
                                </CardTitle>
                                <CardDescription>
                                    Become an admin and invite your family members.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Invite members via Email or Layout</li>

                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Manage roles and permissions</li>
                                </ul>
                                <Button className="w-full" onClick={() => setShowCreateDialog(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create New Family
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Join Family */}
                        <Card className="hover:border-primary/50 transition-colors">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <LogIn className="w-6 h-6 text-primary" />
                                    Join a Family
                                </CardTitle>
                                <CardDescription>
                                    Enter the unique code shared by your family admin.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Family Code</Label>
                                    <Input
                                        id="code"
                                        placeholder="e.g. FAM-XYZ123"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value)}
                                    />
                                </div>
                                <Button variant="outline" className="w-full" onClick={handleJoin} disabled={joining || !joinCode}>
                                    {joining && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Send Join Request
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    <CreateFamilyDialog
                        open={showCreateDialog}
                        onOpenChange={setShowCreateDialog}
                        onFamilyCreated={fetchFamilyData}
                    />
                    <UserRequestsDialog
                        open={showUserRequestsDialog}
                        onOpenChange={setShowUserRequestsDialog}
                        onUpdate={fetchFamilyData}
                    />
                </main>
            </div>
        );
    }

    // 4. Main Family Dashboard
    const isAdmin = membership.role === 'admin';

    return (
        <div className="min-h-screen bg-background">
            <header className="h-[88px] border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex items-center transition-all duration-200">
                <div className="container mx-auto px-4">
                    <div>
                        <h1 className="text-2xl font-bold">Family Tracking</h1>
                        <p className="text-sm text-muted-foreground">Manage your shared finances</p>
                    </div>
                </div>
            </header>
            <main className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Avatar className="w-16 h-16 border-2 border-primary/20">
                                <AvatarImage src={family.profile_image || undefined} alt={family.name} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                                    {family.name[0]?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            {isAdmin && (
                                <>
                                    <input
                                        type="file"
                                        id="family-profile-upload"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileSelect}
                                    />
                                    <label
                                        htmlFor="family-profile-upload"
                                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                                    >
                                        <Camera className="w-6 h-6 text-white" />
                                    </label>
                                </>
                            )}
                        </div>
                        <div>
                            {isEditingName ? (
                                <div className="flex items-center gap-2 mb-1">
                                    <Input
                                        value={newFamilyName}
                                        onChange={(e) => setNewFamilyName(e.target.value)}
                                        className="text-2xl font-bold h-10 w-full min-w-[200px]"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleUpdateName();
                                            if (e.key === 'Escape') setIsEditingName(false);
                                        }}
                                    />
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50" onClick={handleUpdateName}>
                                        <Check className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setIsEditingName(false)}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 mb-1 group/name">
                                    <h1 className="text-3xl font-bold tracking-tight">{family.name}</h1>
                                    {isAdmin && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-6 w-6 opacity-0 group-hover/name:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                                            onClick={() => {
                                                setNewFamilyName(family.name);
                                                setIsEditingName(true);
                                            }}
                                        >
                                            <Pencil className="w-3 h-3" />
                                        </Button>
                                    )}
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <span>{members.length} Members</span>
                                <span>•</span>
                                <span>Created {new Date(family.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {isAdmin && (
                            <>
                                <Button
                                    size="icon"
                                    onClick={() => setShowRequestsDialog(true)}
                                    className="bg-sky-500 hover:bg-sky-600 text-white border-0"
                                >
                                    <UserPlus className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    onClick={() => setShowInviteDialog(true)}
                                    className="bg-green-500 hover:bg-green-600 text-white border-0"
                                >
                                    <Share2 className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => setShowLeaveDialog(true)}
                            disabled={leaving}
                        >
                            {leaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <LogOut className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main Content Area - Left Side */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <PiggyBank className="w-5 h-5 text-primary" />
                                        Monthly Budget
                                    </div>
                                    {familyBudget && (
                                        <Badge variant="outline" className="font-mono">
                                            {new Date(familyBudget.month + '-01').toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                                        </Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!familyBudget ? (
                                    <div className="text-center py-8 space-y-4">
                                        <div className="p-4 bg-secondary/50 rounded-full w-fit mx-auto">
                                            <TrendingUp className="w-8 h-8 text-muted-foreground/50" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-lg">No budget set for this month</p>
                                            <p className="text-muted-foreground">Pool funds together for shared family goals.</p>
                                        </div>
                                        {isAdmin && (
                                            <Button onClick={() => setShowCreateBudgetDialog(true)} className="gap-2">
                                                <Plus className="w-4 h-4" />
                                                Create Budget
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-sm text-muted-foreground">Raised Amount</span>
                                                <div className="text-right">
                                                    <span className="text-2xl font-bold text-green-600">₹{familyBudget.total_contributed || 0}</span>
                                                    <span className="text-muted-foreground text-sm ml-1">/ ₹{familyBudget.total_amount}</span>
                                                </div>
                                            </div>
                                            <div className="h-3 bg-secondary rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
                                                    style={{ width: `${Math.min(100, ((familyBudget.total_contributed || 0) / familyBudget.total_amount) * 100)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>0%</span>
                                                <span>50%</span>
                                                <span>100%</span>
                                            </div>
                                        </div>

                                        <div className="bg-secondary/30 rounded-lg p-4 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-sm">Your Contribution</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Available: ₹{personalRemaining.toFixed(2)}
                                                    </p>
                                                </div>
                                                <Button onClick={() => setShowContributeDialog(true)} className="gap-2">
                                                    <Wallet className="w-4 h-4" />
                                                    Contribute
                                                </Button>
                                            </div>
                                        </div>

                                        {familyBudget.contributions && familyBudget.contributions.length > 0 && (
                                            <div className="space-y-4 pt-2">
                                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                                    <Users className="w-4 h-4" />
                                                    Recent Contributions
                                                </h4>
                                                <div className="space-y-2">
                                                    {familyBudget.contributions.map((contribution: any) => (
                                                        <div key={contribution.id} className="flex items-center justify-between p-3 bg-card border rounded-lg hover:bg-accent/5 transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="w-8 h-8 border">
                                                                    <AvatarImage src={contribution.profile?.avatar_url} />
                                                                    <AvatarFallback>{contribution.profile?.name?.[0]}</AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="text-sm font-medium leading-none">{contribution.profile?.name}</p>
                                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                                        {new Date(contribution.created_at).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <span className="font-bold text-green-600">+₹{contribution.amount}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Sidebar - Family Members */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold tracking-tight">Family Members</h2>
                        <div className="space-y-3">
                            <AnimatePresence mode="popLayout">
                                {members.map(member => (
                                    <motion.div
                                        key={member.user_id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Card className="overflow-hidden">
                                            <CardContent className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-10 h-10 border-2 border-background">
                                                        <AvatarImage src={member.profile?.avatar_url} />
                                                        <AvatarFallback>
                                                            {member.profile?.name ? member.profile.name.substring(0, 2).toUpperCase() : "U"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-sm truncate">
                                                            {member.profile?.name || "Family Member"}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <Badge
                                                                variant="secondary"
                                                                className={`gap-1 h-5 text-[10px] px-1.5 ${member.role === 'admin'
                                                                    ? 'bg-purple-500/10 text-purple-500'
                                                                    : member.role === 'viewer'
                                                                        ? 'bg-gray-500/10 text-gray-500'
                                                                        : 'bg-blue-500/10 text-blue-500'
                                                                    }`}
                                                            >
                                                                {member.role === 'admin' && <Shield className="w-3 h-3" />}
                                                                {member.role === 'member' && <User className="w-3 h-3" />}
                                                                {member.role === 'viewer' && <Eye className="w-3 h-3" />}
                                                                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    {isAdmin && member.role !== 'admin' && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => handleUpdateRole(member.user_id, 'admin')}>
                                                                    Transfer Admin Rights
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleUpdateRole(member.user_id, 'member')}>
                                                                    Make Member
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleUpdateRole(member.user_id, 'viewer')}>
                                                                    Make Viewer
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="text-red-500" onClick={() => handleRemoveMember(member.user_id)}>
                                                                    Remove from Family
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>


                </div>

                <InviteMemberDialog
                    open={showInviteDialog}
                    onOpenChange={setShowInviteDialog}
                    familyId={family.id}
                    shareCode={family.share_code}
                />

                <FamilyRequestsDialog
                    open={showRequestsDialog}
                    onOpenChange={setShowRequestsDialog}
                    familyId={family.id}
                    isAdmin={isAdmin}
                />

                <AlertDialog open={showLeaveDialog} onOpenChange={(open) => {
                    setShowLeaveDialog(open);
                    if (!open) setSuccessorId("");
                }}>
                    <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Leave Family</AlertDialogTitle>
                            <AlertDialogDescription asChild>
                                <div>
                                    {isAdmin && members.filter(m => m.role === 'admin').length <= 1 ? (
                                        members.length > 1 ? (
                                            // Case: Last admin, but other members exist (BLOCK: Must Transfer First)
                                            <div className="space-y-4 pt-2">
                                                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 rounded-lg text-sm border border-red-200 dark:border-red-900">
                                                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                                    <div className="space-y-1">
                                                        <p className="font-medium">Action Required: Transfer Ownership</p>
                                                        <p>You are the only admin. You cannot leave the family while you hold the Admin role.</p>
                                                        <p className="mt-2 font-medium">Please transfer admin rights to another member first.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            // Case: Last admin, no other members (Delete family)
                                            <div className="pt-2">
                                                You are the last admin. <strong>Leaving will permanently delete this family</strong> and remove all members. This action cannot be undone.
                                            </div>
                                        )
                                    ) : (
                                        // Case: Normal leave
                                        <div className="pt-2">
                                            Are you sure you want to leave this family? You'll need a new invitation to rejoin.
                                        </div>
                                    )}
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={leaving}>
                                {isAdmin && members.filter(m => m.role === 'admin').length <= 1 && members.length > 1
                                    ? "Close"
                                    : "Cancel"}
                            </AlertDialogCancel>

                            {/* Hide Leave Button if Blocking Condition is Met */}
                            {!(isAdmin && members.filter(m => m.role === 'admin').length <= 1 && members.length > 1) && (
                                <AlertDialogAction
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleLeaveFamily();
                                    }}
                                    disabled={leaving}
                                    className="bg-destructive hover:bg-destructive/90 transition-all"
                                >
                                    {leaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Leaving...
                                        </>
                                    ) : (
                                        "Leave Family"
                                    )}
                                </AlertDialogAction>
                            )}
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
                    <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Transfer Admin Rights?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to transfer admin rights to <strong>{members.find(m => m.user_id === transferTargetId)?.profile?.name || "this member"}</strong>?
                                <br /><br />
                                <span className="block p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 rounded-lg text-sm border border-amber-200 dark:border-amber-900">
                                    <AlertTriangle className="w-4 h-4 inline mr-2 mb-0.5" />
                                    You will be demoted to a regular <strong>Member</strong> and lose admin privileges immediately.
                                </span>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={transferring}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleTransferAdmin}
                                disabled={transferring}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                {transferring ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Transferring...
                                    </>
                                ) : (
                                    "Confirm Transfer"
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <Dialog open={showCreateBudgetDialog} onOpenChange={setShowCreateBudgetDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Monthly Budget</DialogTitle>
                            <DialogDescription>
                                Set a budget goal for your family this month.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="budget-amount">Budget Amount</Label>
                                <Input
                                    id="budget-amount"
                                    type="number"
                                    placeholder="e.g. 50000"
                                    value={budgetAmount}
                                    onChange={(e) => setBudgetAmount(e.target.value)}
                                />
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground flex items-center gap-1">
                                        <Shield className="w-3 h-3" /> Max Limit (Your Budget)
                                    </span>
                                    <span className={`font-medium ${Number(budgetAmount) > personalBudgetTotal ? 'text-red-500' : 'text-green-600'}`}>
                                        ₹{personalBudgetTotal}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowCreateBudgetDialog(false)}>Cancel</Button>
                            <Button onClick={handleCreateBudget} disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Create Budget
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={showContributeDialog} onOpenChange={setShowContributeDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Contribute to Family Budget</DialogTitle>
                            <DialogDescription>
                                Add funds from your personal wallet to the family pool.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                                <Lock className="w-4 h-4 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium">Non-refundable contribution</p>
                                    <p className="text-xs opacity-90 mt-1">
                                        Once contributed, this amount will be deducted from your personal budget and cannot be reverted or deleted.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contrib-amount">Contribution Amount</Label>
                                <Input
                                    id="contrib-amount"
                                    type="number"
                                    placeholder="e.g. 1000"
                                    value={contributionAmount}
                                    onChange={(e) => setContributionAmount(e.target.value)}
                                />
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Available to contribute:</span>
                                    <span className={`font-medium ${Number(contributionAmount) > personalRemaining ? 'text-red-500' : 'text-green-600'}`}>
                                        ₹{personalRemaining}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowContributeDialog(false)}>Cancel</Button>
                            <Button onClick={handleContribute} disabled={loading} className="bg-green-600 hover:bg-green-700">
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Confirm Contribution
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
            <ImageCropperModal
                open={isCropperOpen}
                onClose={() => setIsCropperOpen(false)}
                imageSrc={selectedImage}
                onCropComplete={handleCropComplete}
            />
        </div>
    );

}
