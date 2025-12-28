
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { FamilyRequest } from "@/types";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, RefreshCw } from "lucide-react";
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
import { AnimatePresence, motion } from "framer-motion";

interface FamilyRequestsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    familyId: string;
    isAdmin: boolean;
}

export function FamilyRequestsDialog({ open, onOpenChange, familyId, isAdmin }: FamilyRequestsDialogProps) {
    const [requests, setRequests] = useState<FamilyRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    // Robust ignore list to prevent deleted items from reappearing due to replication lag
    const ignoredRequestsRef = useRef(new Set<string>());

    const fetchRequests = async (isBackground = false) => {
        if (!familyId) return;
        if (!isBackground) setLoading(true);

        try {
            const { data, error } = await supabase
                .from('family_requests')
                .select('*')
                .eq('family_id', familyId)
                .eq('status', 'pending');

            if (error) throw error;

            // Fetch user details manually
            const enhancedRequests = await Promise.all(
                (data || []).map(async (req: any) => {
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

            // Filter out ignored requests
            const filtered = (enhancedRequests as FamilyRequest[]).filter(r => !ignoredRequestsRef.current.has(r.id));
            setRequests(filtered);

        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    // Initial Fetch when opened
    useEffect(() => {
        if (open) {
            fetchRequests();
        }
    }, [open, familyId]);

    // Polling every 3 seconds (User Request)
    useEffect(() => {
        if (!open) return;

        const intervalId = setInterval(() => {
            fetchRequests(true);
        }, 3000);

        return () => clearInterval(intervalId);
    }, [open, familyId]);

    // Realtime Subscription (Backup to polling)
    useEffect(() => {
        if (!open || !familyId) return;

        const channel = supabase
            .channel(`family-requests-dialog-${familyId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'family_requests',
                    filter: `family_id=eq.${familyId}`
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
    }, [open, familyId]);


    const handleRespond = async (requestId: string, action: 'accept' | 'reject') => {
        setProcessingId(requestId);
        // Optimistic Ignore
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

            toast.success(`Request ${action === 'accept' ? 'accepted' : 'rejected'}`);
            setRequests(prev => prev.filter(r => r.id !== requestId));

        } catch (error: any) {
            console.error("Error responding:", error);
            toast.error(error.message);
            // If failed, maybe remove from ignore list? keeping it for now to avoid flicker
        } finally {
            setProcessingId(null);
        }
    };

    // Derived state for tabs
    const receivedRequests = requests.filter(r => r.request_type === 'join_request');
    const sentRequests = requests.filter(r => r.request_type === 'invite');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Family Requests</DialogTitle>
                    <DialogDescription>
                        Manage join requests and sent invites.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="received" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="received" className="relative">
                            Received
                            {receivedRequests.length > 0 && (
                                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                                    {receivedRequests.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="sent">
                            Sent
                            {sentRequests.length > 0 && (
                                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                                    {sentRequests.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-4 min-h-[200px] max-h-[400px] overflow-y-auto">
                        <TabsContent value="received" className="space-y-4 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:zoom-in-95">
                            {loading && requests.length === 0 ? (
                                <div className="flex justify-center p-4"><Loader2 className="animate-spin text-muted-foreground" /></div>
                            ) : receivedRequests.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-8">No pending join requests.</p>
                            ) : (
                                <div className="space-y-3">
                                    <AnimatePresence mode="popLayout">
                                        {receivedRequests.map((req) => (
                                            <RequestItem
                                                key={req.id}
                                                request={req}
                                                isAdmin={isAdmin}
                                                onRespond={handleRespond}
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
                            ) : sentRequests.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-8">No pending invites sent.</p>
                            ) : (
                                <div className="space-y-3">
                                    <AnimatePresence mode="popLayout">
                                        {sentRequests.map((req) => (
                                            <RequestItem
                                                key={req.id}
                                                request={req}
                                                isAdmin={isAdmin}
                                                onRespond={handleRespond}
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
    isAdmin,
    onRespond,
    processingId
}: {
    request: FamilyRequest;
    isAdmin: boolean;
    onRespond: (id: string, action: 'accept' | 'reject') => void;
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
                    <AvatarImage src={request.profile?.avatar_url} />
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm font-medium">
                        {request.profile?.name || "Unknown User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <div className="flex gap-2">
                {/* For Sent Invites (can only remove/cancel - modeled as reject for now or just visual) */}
                {request.request_type === 'invite' && (
                    <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full">
                        Pending
                    </span>
                )}

                {/* For Received Requests (Admin can accept/reject) */}
                {request.request_type === 'join_request' && isAdmin && (
                    <>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                            onClick={() => onRespond(request.id, 'reject')}
                            disabled={!!processingId}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                            onClick={() => onRespond(request.id, 'accept')}
                            disabled={!!processingId}
                        >
                            {processingId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </Button>
                    </>
                )}
            </div>
        </motion.div>
    );
}
