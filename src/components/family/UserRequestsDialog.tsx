
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { FamilyRequest } from "@/types";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatePresence, motion } from "framer-motion";

interface UserRequestsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate?: () => void; // Callback to refresh parent if needed (e.g., if invite accepted)
}

export function UserRequestsDialog({ open, onOpenChange, onUpdate }: UserRequestsDialogProps) {
    const { user } = useAuth();
    const [requests, setRequests] = useState<FamilyRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const ignoredRequestsRef = useRef(new Set<string>());

    const fetchRequests = async (isBackground = false) => {
        if (!user) return;
        if (!isBackground) setLoading(true);

        try {
            // Fetch all requests for this user (both sent join_requests and received invites)
            const { data, error } = await supabase
                .from('family_requests')
                .select('*')
                .eq('user_id', user.id)
                .in('status', ['pending']);

            if (error) throw error;

            // Enrich with family information
            const enhancedRequests = await Promise.all(
                (data || []).map(async (req: any) => {
                    const { data: family } = await supabase
                        .from('families')
                        .select('name, created_by')
                        .eq('id', req.family_id)
                        .maybeSingle();

                    let inviterName = "Admin";
                    if (family?.created_by) {
                        const { data: adminSettings } = await supabase
                            .from('user_settings')
                            .select('user_name')
                            .eq('user_id', family.created_by)
                            .maybeSingle();
                        inviterName = adminSettings?.user_name || "Admin";
                    }

                    return {
                        ...req,
                        family: {
                            name: family?.name || "Unknown Family",
                            invitedBy: inviterName
                        }
                    };
                })
            );

            const filtered = (enhancedRequests as FamilyRequest[]).filter(r => !ignoredRequestsRef.current.has(r.id));
            setRequests(filtered);

        } catch (error) {
            console.error("Error fetching user requests:", error);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    // Initial Fetch & Polling
    useEffect(() => {
        if (open) {
            fetchRequests();
            const intervalId = setInterval(() => fetchRequests(true), 3000);
            return () => clearInterval(intervalId);
        }
    }, [open, user]);

    // Realtime Subscription
    useEffect(() => {
        if (!open || !user) return;

        const channel = supabase
            .channel(`user-requests-dialog-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'family_requests',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        fetchRequests(true);
                    } else if (payload.eventType === 'DELETE') {
                        const deletedId = payload.old?.id;
                        if (deletedId) {
                            setRequests(prev => prev.filter(req => req.id !== deletedId));
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [open, user]);


    const handleRespond = async (requestId: string, action: 'accept' | 'reject') => {
        setProcessingId(requestId);
        ignoredRequestsRef.current.add(requestId);

        try {
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError || !refreshedSession) throw new Error("Session invalid");

            const { data, error } = await supabase.functions.invoke('manage-family', {
                headers: { Authorization: `Bearer ${refreshedSession.access_token}` },
                body: {
                    action: 'respond',
                    request_id: requestId,
                    response: action,
                    access_token: refreshedSession.access_token
                }
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error);

            toast.success(`Invite ${action === 'accept' ? 'accepted' : 'rejected'}`);
            setRequests(prev => prev.filter(r => r.id !== requestId));

            if (action === 'accept' && onUpdate) {
                onUpdate(); // Trigger parent refresh to switch to family view
                onOpenChange(false); // Close dialog
            }

        } catch (error: any) {
            console.error("Error responding:", error);
            toast.error(error.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancel = async (requestId: string) => {
        setProcessingId(requestId);
        ignoredRequestsRef.current.add(requestId);

        try {
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError || !refreshedSession) throw new Error("Session invalid");

            const { data, error } = await supabase.functions.invoke('manage-family', {
                headers: { Authorization: `Bearer ${refreshedSession.access_token}` },
                body: {
                    action: 'cancel_request',
                    request_id: requestId,
                    access_token: refreshedSession.access_token
                }
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error);

            toast.success("Request cancelled");
            setRequests(prev => prev.filter(r => r.id !== requestId));

        } catch (error: any) {
            console.error("Error cancelling:", error);
            toast.error(error.message);
        } finally {
            setProcessingId(null);
        }
    };

    const receivedInvites = requests.filter(r => r.request_type === 'invite');
    const sentJoinRequests = requests.filter(r => r.request_type === 'join_request');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>My Requests</DialogTitle>
                    <DialogDescription>
                        Manage your family invitations and join requests.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="received" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="received">
                            Invites
                            {receivedInvites.length > 0 && (
                                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                                    {receivedInvites.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="sent">
                            Sent Requests
                            {sentJoinRequests.length > 0 && (
                                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                                    {sentJoinRequests.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-4 min-h-[200px] max-h-[400px] overflow-y-auto">
                        <TabsContent value="received" className="space-y-4 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:zoom-in-95">
                            {loading && requests.length === 0 ? (
                                <div className="flex justify-center p-4"><Loader2 className="animate-spin text-muted-foreground" /></div>
                            ) : receivedInvites.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-8">No pending invites.</p>
                            ) : (
                                <div className="space-y-3">
                                    <AnimatePresence mode="popLayout">
                                        {receivedInvites.map((req) => (
                                            <RequestItem
                                                key={req.id}
                                                request={req}
                                                type="invite"
                                                onAction={handleRespond}
                                                processingId={processingId}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="sent" className="space-y-4 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:zoom-in-95">
                            {loading && requests.length === 0 ? (
                                <div className="flex justify-center p-4"><Loader2 className="animate-spin text-muted-foreground" /></div>
                            ) : sentJoinRequests.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-8">No sent requests.</p>
                            ) : (
                                <div className="space-y-3">
                                    <AnimatePresence mode="popLayout">
                                        {sentJoinRequests.map((req) => (
                                            <RequestItem
                                                key={req.id}
                                                request={req}
                                                type="join_request"
                                                onAction={(id) => handleCancel(id)}
                                                processingId={processingId}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

function RequestItem({
    request,
    type,
    onAction,
    processingId
}: {
    request: FamilyRequest;
    type: 'invite' | 'join_request';
    onAction: (id: string, action?: any) => void;
    processingId: string | null;
}) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
        >
            <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                    <AvatarFallback>{request.family?.name?.charAt(0) || 'F'}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm font-medium">
                        {request.family?.name || "Unknown Family"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {type === 'invite'
                            ? `Invited by ${request.family?.invitedBy || "Admin"}`
                            : `Sent on ${new Date(request.created_at).toLocaleDateString()}`
                        }
                    </p>
                </div>
            </div>

            <div className="flex gap-2">
                {type === 'invite' ? (
                    <>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                            onClick={() => onAction(request.id, 'reject')}
                            disabled={!!processingId}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                            onClick={() => onAction(request.id, 'accept')}
                            disabled={!!processingId}
                        >
                            {processingId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </Button>
                    </>
                ) : (
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 p-0 px-3 text-muted-foreground hover:text-destructive text-xs gap-1"
                        onClick={() => onAction(request.id)}
                        disabled={!!processingId}
                    >
                        {processingId === request.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        Cancel
                    </Button>
                )}
            </div>
        </motion.div>
    );
}
