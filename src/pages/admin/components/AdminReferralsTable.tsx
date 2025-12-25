import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";

export default function AdminReferralsTable() {
    const [referrals, setReferrals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchReferrals();
    }, []);

    const fetchReferrals = async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_active_referrals');

        if (error) {
            console.error("Error fetching referrals:", error);
            // Show detailed error to user for debugging
            toast.error(`Load Failed: ${error.message} (${error.details || ''})`);
        } else {
            // Sort client-side since RPC result might not be sorted by default or to be safe
            const sortedData = (data || []).sort((a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setReferrals(sortedData);
        }
        setLoading(false);
    };

    const handleApprove = async (email: string) => {
        setActionLoading(email);
        const { data: result, error } = await supabase.functions.invoke('admin-update-referral', {
            body: { email, type: 'approve' }
        });

        if (error || !result?.success) {
            console.error("Approve Error:", error || result?.error);
            toast.error(`Failed: ${error?.message || result?.error || 'Unknown error'}`);
        } else {
            toast.success("Referral approved!");
            setReferrals(prev => prev.map(r => r.email === email ? { ...r, referral_status: 1 } : r));
        }
        setActionLoading(null);
    };

    const handleRevert = async (email: string) => {
        setActionLoading(email);
        const { data: result, error } = await supabase.functions.invoke('admin-update-referral', {
            body: { email, type: 'revert' }
        });

        if (error || !result?.success) {
            console.error("Revert Error:", error || result?.error);
            toast.error(`Failed: ${error?.message || result?.error || 'Unknown error'}`);
        } else {
            toast.success("Approval reverted!");
            setReferrals(prev => prev.map(r => r.email === email ? { ...r, referral_status: 0 } : r));
        }
        setActionLoading(null);
    };

    const handleToggleClaim = async (email: string, currentStatus: boolean) => {
        setActionLoading(email);
        const { data: result, error } = await supabase.functions.invoke('admin-update-referral', {
            body: { email, type: 'toggle_claim', status: !currentStatus }
        });

        if (error || !result?.success) {
            console.error("Claim Toggle Error:", error || result?.error);
            toast.error(`Failed: ${error?.message || result?.error || 'Unknown error'}`);
        } else {
            toast.success(`Marked as ${!currentStatus ? 'Claimed' : 'Unclaimed'}`);
            setReferrals(prev => prev.map(r => r.email === email ? { ...r, claimed: !currentStatus } : r));
        }
        setActionLoading(null);
    };

    const filteredReferrals = referrals.filter(r =>
        r.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.referral_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.referred_by?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Referrals</CardTitle>
                <CardDescription>View and approve referral requests</CardDescription>
                <div className="pt-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by email, User ID..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>User ID</TableHead>
                                    <TableHead>User Email</TableHead>
                                    <TableHead>Referred By</TableHead>
                                    <TableHead>Claimed</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredReferrals.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                            No referrals found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredReferrals.map((referral) => (
                                        <TableRow key={referral.email}>
                                            <TableCell>{format(new Date(referral.created_at), 'MMM d, yyyy')}</TableCell>
                                            <TableCell className="font-medium text-xs font-mono">{referral.referral_id || "N/A"}</TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {referral.email}
                                                    {referral.user_exists === false && (
                                                        <Badge variant="destructive" className="h-5 text-[10px] px-1.5 bg-red-100 text-red-600 hover:bg-red-200 border-none">
                                                            Deleted
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{referral.referred_by}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        checked={referral.claimed}
                                                        onCheckedChange={() => handleToggleClaim(referral.email, referral.claimed)}
                                                        disabled={actionLoading === referral.email}
                                                    />
                                                    <span className="text-xs text-muted-foreground">{referral.claimed ? "Yes" : "No"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={referral.referral_status === 1 ? "default" : "secondary"} className={referral.referral_status === 1 ? "bg-green-500" : "bg-yellow-500"}>
                                                    {referral.referral_status === 1 ? "Approved" : "Pending"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell >
                                                {referral.referral_status === 0 ? (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleApprove(referral.email)}
                                                        disabled={actionLoading === referral.email}
                                                    >
                                                        {actionLoading === referral.email ? <Loader2 className="w-3 h-3 animate-spin" /> : "Approve"}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                                                        onClick={() => handleRevert(referral.email)}
                                                        disabled={actionLoading === referral.email}
                                                    >
                                                        {actionLoading === referral.email ? <Loader2 className="w-3 h-3 animate-spin" /> : "Revert"}
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
