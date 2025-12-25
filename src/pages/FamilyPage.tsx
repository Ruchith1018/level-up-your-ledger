
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Family, FamilyMember } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, LogIn, Loader2, Share2, Lock, LogOut } from "lucide-react";
import { toast } from "sonner";
import { CreateFamilyDialog } from "@/components/family/CreateFamilyDialog";
import { InviteMemberDialog } from "@/components/family/InviteMemberDialog";
import { FamilyMemberCard } from "@/components/family/FamilyMemberCard";
import { FamilyRequestsList } from "@/components/family/FamilyRequestsList";
import { useSettings } from "@/contexts/SettingsContext";
import { useNavigate } from "react-router-dom";
import { PendingInvites } from "@/components/family/PendingInvites";
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

    // Join state
    const [joinCode, setJoinCode] = useState("");
    const [joining, setJoining] = useState(false);
    const [leaving, setLeaving] = useState(false);

    const fetchFamilyData = async () => {
        if (!user) return;
        setLoading(true);
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
            }

        } catch (error) {
            console.error("Error fetching family data:", error);
        } finally {
            setLoading(false);
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

    // Handlers
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

            toast.success("Join request sent successfully! Waiting for admin approval.");
            setJoinCode("");
        } catch (error: any) {
            toast.error(error.message || "Failed to join family");
        } finally {
            setJoining(false);
        }
    };

    const handleUpdateRole = async (memberId: string, newRole: string) => {
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
                    <div className="container mx-auto px-4">
                        <div>
                            <h1 className="text-2xl font-bold">Family Tracking</h1>
                            <p className="text-sm text-muted-foreground">Manage your shared finances</p>
                        </div>
                    </div>
                </header>
                <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8 animate-in fade-in duration-500">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight">Family Dashboard</h1>
                        <p className="text-xl text-muted-foreground">
                            Create or join a family to start tracking expenses together.
                        </p>
                    </div>

                    {/* Pending Invites Section */}
                    <PendingInvites onInviteAccepted={fetchFamilyData} />

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
                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Set monthly allowances</li>
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
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-1">{family.name}</h1>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <span>{members.length} Members</span>
                            <span>•</span>
                            <span>Created {new Date(family.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {isAdmin && (
                        <Button onClick={() => setShowInviteDialog(true)} className="shrink-0 gap-2">
                            <Share2 className="w-4 h-4" />
                            Invite Member
                        </Button>
                    )}
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main Content - Members List */}
                    <div className="md:col-span-2 space-y-6">
                        <section className="space-y-3">
                            <h2 className="text-lg font-semibold tracking-tight">Family Members</h2>
                            <div className="grid gap-3">
                                {members.map(member => (
                                    <FamilyMemberCard
                                        key={member.user_id}
                                        member={member}
                                        isCurrentUserAdmin={isAdmin}
                                        onUpdateRole={handleUpdateRole}
                                        onRemove={handleRemoveMember}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* Pending Requests */}
                        <section>
                            <FamilyRequestsList familyId={family.id} isAdmin={isAdmin} />
                        </section>
                    </div>

                    {/* Sidebar - Stats / Info */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Total Allowance</span>
                                    <span className="font-medium">₹{members.reduce((acc, m) => acc + (Number(m.allowance) || 0), 0)}</span>
                                </div>
                                {/* Add more stats later */}
                                <div className="p-3 bg-primary/5 rounded-lg text-xs text-muted-foreground leading-relaxed">
                                    Pro Tip: Monthly allowances reset automatically on the 1st of every month.
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-destructive/50">
                            <CardHeader>
                                <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    variant="destructive"
                                    className="w-full gap-2"
                                    onClick={() => setShowLeaveDialog(true)}
                                    disabled={leaving}
                                >
                                    {leaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <LogOut className="w-4 h-4" />
                                    )}
                                    Leave Family
                                </Button>
                                {isAdmin && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {members.filter(m => m.role === 'admin').length <= 1
                                            ? "As the last admin, leaving will delete the family."
                                            : "You can leave anytime. Another admin will manage the family."}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <InviteMemberDialog
                    open={showInviteDialog}
                    onOpenChange={setShowInviteDialog}
                    familyId={family.id}
                    shareCode={family.share_code}
                />

                <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
                    <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Leave Family?</AlertDialogTitle>
                            <AlertDialogDescription>
                                {isAdmin && members.filter(m => m.role === 'admin').length <= 1 ? (
                                    <>
                                        You are the last admin. <strong>Leaving will permanently delete this family</strong> and remove all members. This action cannot be undone.
                                    </>
                                ) : (
                                    "Are you sure you want to leave this family? You'll need a new invitation to rejoin."
                                )}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={leaving}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleLeaveFamily}
                                disabled={leaving}
                                className="bg-destructive hover:bg-destructive/90"
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
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </main>
        </div>
    );
}
