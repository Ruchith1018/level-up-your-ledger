
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FamilyRequest } from "@/types";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface FamilyRequestsListProps {
    familyId: string;
    isAdmin: boolean;
}

export function FamilyRequestsList({ familyId, isAdmin }: FamilyRequestsListProps) {
    const [requests, setRequests] = useState<FamilyRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchRequests = async () => {
        try {
            const { data, error } = await supabase
                .from('family_requests')
                .select('*')
                .eq('family_id', familyId)
                .eq('status', 'pending');

            if (error) throw error;

            // Fetch user details manually since we can't join easily without FK setup on public profiles
            const enhancedRequests = await Promise.all(
                (data || []).map(async (req: any) => {
                    // Try to fetch user name from user_settings if available
                    // Assuming user_settings table has user_id and user_name columns
                    const { data: settings } = await supabase
                        .from('user_settings')
                        .select('user_name, profile_image')
                        .eq('user_id', req.user_id)
                        .maybeSingle();

                    return {
                        ...req,
                        profile: {
                            name: settings?.user_name || "Unknown User",
                            avatar_url: settings?.profile_image
                        }
                    };
                })
            );

            setRequests(enhancedRequests as FamilyRequest[]);
        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (familyId) fetchRequests();
    }, [familyId]);

    const handleRespond = async (requestId: string, action: 'accept' | 'reject') => {
        setProcessingId(requestId);
        try {
            // Refresh session to ensure token is valid
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

            if (refreshError) {
                console.error("DEBUG Respond: Session refresh failed:", refreshError);
                toast.error("Session expired. Please re-login.");
                setProcessingId(null);
                return;
            }

            const session = refreshedSession;
            console.log("DEBUG Respond: Session refreshed:", !!session);
            console.log("DEBUG Respond: Token:", session?.access_token ? session.access_token.substring(0, 10) + "..." : "missing");

            if (!session?.access_token) {
                console.error("DEBUG Respond: Authentication session missing");
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
                    access_token: session.access_token // Send in body as backup
                }
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error);

            toast.success(`Request ${action === 'accept' ? 'accepted' : 'rejected'}`);
            // Remove from list
            setRequests(prev => prev.filter(r => r.id !== requestId));
        } catch (error: any) {
            console.error("Error responding:", error);
            toast.error(error.message);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="text-sm text-muted-foreground">Loading requests...</div>;
    if (requests.length === 0) return null;

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pending Requests</h3>
            <div className="space-y-2">
                {requests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                                <AvatarImage src={request.profile?.avatar_url} />
                                <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-medium">
                                    {request.request_type === 'join_request'
                                        ? `${request.profile?.name} wants to join`
                                        : `Invite sent to ${request.profile?.name}`
                                    }
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(request.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {isAdmin && request.request_type === 'join_request' && (
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                    onClick={() => handleRespond(request.id, 'reject')}
                                    disabled={!!processingId}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                                    onClick={() => handleRespond(request.id, 'accept')}
                                    disabled={!!processingId}
                                >
                                    {processingId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                </Button>
                            </div>
                        )}

                        {request.request_type === 'invite' && (
                            <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full">
                                Pending Acceptance
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
