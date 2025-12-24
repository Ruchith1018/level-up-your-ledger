
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Copy, Loader2, QrCode } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface InviteMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    familyId: string;
    shareCode: string;
}

export function InviteMemberDialog({ open, onOpenChange, familyId, shareCode }: InviteMemberDialogProps) {
    const [referralId, setReferralId] = useState("");
    const [loading, setLoading] = useState(false);

    const handleInvite = async () => {
        if (!referralId.trim()) return;
        setLoading(true);

        try {
            // Refresh session to ensure token is valid
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

            if (refreshError) {
                console.error("DEBUG Invite: Session refresh failed:", refreshError);
                toast.error("Session expired. Please re-login.");
                setLoading(false);
                return;
            }

            const session = refreshedSession;
            console.log("DEBUG Invite: Session refreshed:", !!session);
            console.log("DEBUG Invite: Token:", session?.access_token ? session.access_token.substring(0, 10) + "..." : "missing");

            if (!session?.access_token) {
                console.error("DEBUG: Authentication session missing", session);
                toast.error("Authentication session missing. Please re-login.");
                setLoading(false);
                return;
            }

            const { data, error } = await supabase.functions.invoke('manage-family', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                },
                body: {
                    action: 'invite',
                    family_id: familyId,
                    referral_id: referralId.trim(),
                    access_token: session.access_token // Send in body as backup
                }
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error);

            toast.success("Invite sent successfully!");
            setReferralId("");
            onOpenChange(false);
        } catch (error: any) {
            console.error("Invite error:", error);
            toast.error(error.message || "Failed to invite user");
        } finally {
            setLoading(false);
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(shareCode);
        toast.success("Family Code copied!");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Family Member</DialogTitle>
                    <DialogDescription>
                        Invite someone to manage expenses together.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="id" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="id">Invite by ID</TabsTrigger>
                        <TabsTrigger value="code">Share Code</TabsTrigger>
                    </TabsList>

                    <TabsContent value="id" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="refId">User's Referral ID</Label>
                            <Input
                                id="refId"
                                placeholder="Enter their ID (e.g. 84392)"
                                value={referralId}
                                onChange={(e) => setReferralId(e.target.value)}
                            />
                        </div>
                        <Button className="w-full" onClick={handleInvite} disabled={loading || !referralId}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Send Invite
                        </Button>
                    </TabsContent>

                    <TabsContent value="code" className="space-y-4 py-4 flex flex-col items-center">
                        <div className="p-4 bg-white rounded-xl border shadow-sm">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${shareCode}`}
                                alt="QR Code"
                                className="w-48 h-48"
                            />
                        </div>
                        <div className="text-center space-y-2 w-full">
                            <Label>Family Share Code</Label>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 p-2 bg-muted rounded border text-center text-lg font-mono tracking-wider">
                                    {shareCode}
                                </code>
                                <Button size="icon" variant="outline" onClick={copyCode}>
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Users can join by entering this code on their Family page.
                            </p>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
