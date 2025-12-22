import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export default function AdminRedemptionTable() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchRedemptions();
    }, []);

    const fetchRedemptions = async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_all_redemption_requests');

        if (error) {
            console.error("Error fetching redemptions:", error);
            toast.error("Failed to load redemption requests");
        } else {
            setRequests(data || []);
        }
        setLoading(false);
    };

    const handleStatusToggle = async (userId: string, requestId: string, currentStatus: string) => {
        setProcessingId(requestId);
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

        const { error } = await supabase.rpc('update_redemption_status', {
            target_user_id: userId,
            target_request_id: requestId,
            new_status: newStatus
        });

        if (error) {
            console.error("Update Error:", error);
            toast.error(`Failed to update status: ${error.message}`);
        } else {
            toast.success(`Request marked as ${newStatus}`);
            // Update local state to reflect change immediately
            setRequests(prev => prev.map(r =>
                r.request_id === requestId ? { ...r, status: newStatus } : r
            ));
        }
        setProcessingId(null);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500 hover:bg-green-600';
            case 'failed': return 'bg-red-500 hover:bg-red-600';
            default: return 'bg-yellow-500 hover:bg-yellow-600';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gift Card Redemptions</CardTitle>
                <CardDescription>Manage user requests to redeem coins for money</CardDescription>
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
                                    <TableHead>User Email</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Coins</TableHead>
                                    <TableHead>UPI ID</TableHead>
                                    <TableHead>Approved</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            No pending requests found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    requests.map((req) => (
                                        <TableRow key={req.request_id}>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {formatDate(req.request_date)}
                                            </TableCell>
                                            <TableCell className="font-medium">{req.email}</TableCell>
                                            <TableCell>₹{req.amount}</TableCell>
                                            <TableCell className="text-yellow-600 font-semibold">{req.coins.toLocaleString()}</TableCell>
                                            <TableCell className="font-mono text-xs">{req.upi_id}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        checked={req.status === 'completed'}
                                                        onCheckedChange={() => handleStatusToggle(req.user_id, req.request_id, req.status)}
                                                        disabled={processingId === req.request_id}
                                                    />
                                                    <span className={`text-xs ${req.status === 'completed' ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                                                        {req.status === 'completed' ? 'Yes' : 'No'}
                                                    </span>
                                                </div>
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
