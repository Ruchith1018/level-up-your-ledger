import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { FamilyRequest } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PendingInvitesProps {
    onInviteAccepted?: () => void;
}

export function PendingInvites({ onInviteAccepted }: PendingInvitesProps) {
    const { user } = useAuth();
    const [invites, setInvites] = useState<FamilyRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchInvites = async () => {
        if (!user) return;

        try {
            // Fetch all pending invites for this user
            const { data, error } = await supabase
                .from('family_requests')
                .select('*')
                .eq('user_id', user.id)
                .eq('request_type', 'invite')
                .eq('status', 'pending');

            if (error) throw error;

            // Enrich with family information
            const enrichedInvites = await Promise.all(
                (data || []).map(async (invite: any) => {
                    const { data: familyData, error: familyError } = await supabase
                        .from('families')
                        .select('name, created_by')
                        .eq('id', invite.family_id)
                        .maybeSingle();

                    if (familyError) {
                        console.error('Error fetching family data for invite:', familyError);
                        console.error('Family ID:', invite.family_id);
                    }

                    if (!familyData) {
                        console.warn('No family data found for family_id:', invite.family_id);
                        console.warn('This is likely due to RLS - user cannot read family details until they join');
                        // Fallback: show invite info even if we can't load family details
                        return {
                            ...invite,
                            family: {
                                name: "Family Invitation",
                                invitedBy: `Invited on ${new Date(invite.created_at).toLocaleDateString()}`
                            }
                        };
                    }

                    // Get admin who invited
                    let inviterName = "Admin";
                    if (familyData.created_by) {
                        const { data: adminSettings, error: adminError } = await supabase
                            .from('user_settings')
                            .select('user_name')
                            .eq('user_id', familyData.created_by)
                            .maybeSingle();

                        if (adminError) {
                            console.error('Error fetching admin settings:', adminError);
                        }

                        inviterName = adminSettings?.user_name || "Admin";
                    }

                    return {
                        ...invite,
                        family: {
                            name: familyData.name || "Unnamed Family",
                            invitedBy: inviterName
                        }
                    };
                })
            );

            setInvites(enrichedInvites as FamilyRequest[]);
        } catch (error) {
            console.error("Error fetching invites:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvites();
    }, [user]);

    const handleRespond = async (requestId: string, action: 'accept' | 'reject') => {
        setProcessingId(requestId);
        try {
            // Refresh session to ensure token is valid
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

            if (refreshError) {
                console.error("Invite Response: Session refresh failed:", refreshError);
                toast.error("Session expired. Please re-login.");
                setProcessingId(null);
                return;
            }

            const session = refreshedSession;

            if (!session?.access_token) {
                console.error("Invite Response: Authentication session missing");
                toast.error("Authentication session missing. Please re-login.");
                setProcessingId(null);
                return;
            }

            const { data, error } = await supabase.functions.invoke('manage-family', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                },
                body: {
                    action: 'respond',
                    request_id: requestId,
                    response: action,
                    access_token: session.access_token
                }
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error);

            toast.success(`Invite ${action === 'accept' ? 'accepted' : 'rejected'}!`);

            // Remove from list
            setInvites(prev => prev.filter(i => i.id !== requestId));

            // If accepted, notify parent to refresh
            if (action === 'accept' && onInviteAccepted) {
                onInviteAccepted();
            }
        } catch (error: any) {
            console.error("Error responding to invite:", error);
            toast.error(error.message || "Failed to respond to invite");
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Checking for invites...
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (invites.length === 0) return null;

    return (
        <Card className="border-primary/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    Pending Invites
                </CardTitle>
                <CardDescription>
                    You have been invited to join {invites.length} {invites.length === 1 ? 'family' : 'families'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {invites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {invite.family?.name?.charAt(0) || 'F'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-medium">
                                    {invite.family?.name || "Unknown Family"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Invited by {invite.family?.invitedBy || "Admin"}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                onClick={() => handleRespond(invite.id, 'reject')}
                                disabled={!!processingId}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                                onClick={() => handleRespond(invite.id, 'accept')}
                                disabled={!!processingId}
                            >
                                {processingId === invite.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
