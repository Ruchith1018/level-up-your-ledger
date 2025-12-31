import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Plus, PiggyBank, AlertTriangle, Check, X, Wallet } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface SavingsRequest {
    id: string;
    family_id: string;
    created_by: string;
    amount_per_member: number;
    title: string;
    status: 'active' | 'completed' | 'cancelled';
    created_at: string;
    family_savings_members?: SavingsMember[];
}

interface SavingsMember {
    id: string;
    savings_request_id: string;
    user_id: string;
    status: 'pending' | 'accepted' | 'rejected';
    amount_deducted: number;
}

export default function FamilySavingsPage() {
    const { familyId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [requests, setRequests] = useState<SavingsRequest[]>([]);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newRequestAmount, setNewRequestAmount] = useState('');
    const [newRequestTitle, setNewRequestTitle] = useState('');
    const [creating, setCreating] = useState(false);
    const [responding, setResponding] = useState(false);

    // Refund State
    const [showRefundDialog, setShowRefundDialog] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<SavingsRequest | null>(null);
    const [refundAmountUsed, setRefundAmountUsed] = useState('');
    const [refunding, setRefunding] = useState(false);

    const [userRole, setUserRole] = useState<string>('member');
    const [familyMembers, setFamilyMembers] = useState<any[]>([]);

    // Progress Dialog State
    const [showProgressDialog, setShowProgressDialog] = useState(false);
    const [selectedProgressRequest, setSelectedProgressRequest] = useState<SavingsRequest | null>(null);

    useEffect(() => {
        if (familyId && user) {
            checkRole();
            fetchRequests();
            fetchFamilyMembers();
        }
    }, [familyId, user]);

    const checkRole = async () => {
        if (!familyId || !user) return;
        const { data } = await supabase
            .from('family_members')
            .select('role')
            .eq('family_id', familyId)
            .eq('user_id', user.id)
            .single();

        if (data) {
            setUserRole(data.role);
            if (data.role === 'admin') setIsAdmin(true);
        }
    };

    const fetchFamilyMembers = async () => {
        if (!familyId) return;

        // 1. Fetch raw members
        const { data: rawMembers, error } = await supabase
            .from('family_members')
            .select('user_id, role')
            .eq('family_id', familyId);

        if (error || !rawMembers) return;

        // 2. Fetch profiles from user_settings
        const userIds = rawMembers.map(m => m.user_id);
        const { data: settingsData } = await supabase
            .from('user_settings')
            .select('user_id, user_name, profile_image')
            .in('user_id', userIds);

        // 3. Merge data
        const enrichedMembers = rawMembers.map(m => {
            const settings = settingsData?.find(s => s.user_id === m.user_id);
            return {
                ...m,
                profiles: {
                    name: settings?.user_name || 'Unknown User',
                    avatar_url: settings?.profile_image
                }
            };
        });

        setFamilyMembers(enrichedMembers);
    };

    const fetchRequests = async () => {
        if (!familyId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('family_savings_requests')
                .select(`
                    *,
                    family_savings_members (
                        id,
                        user_id,
                        status,
                        amount_deducted,
                        updated_at
                    )
                `)
                .eq('family_id', familyId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data as SavingsRequest[]);
        } catch (error: any) {
            console.error("Error fetching requests:", JSON.stringify(error, null, 2));
            toast.error(`Failed to load savings requests: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRequest = async () => {
        if (!familyId || !user || !newRequestAmount || !newRequestTitle) return;

        setCreating(true);
        try {
            // 1. Create Request
            const { data: requestData, error: requestError } = await supabase
                .from('family_savings_requests')
                .insert({
                    family_id: familyId,
                    created_by: user.id,
                    amount_per_member: parseFloat(newRequestAmount),
                    title: newRequestTitle,
                    status: 'active'
                })
                .select()
                .single();

            if (requestError) throw requestError;

            // 2. Add members to tracking table
            const { data: members, error: membersError } = await supabase
                .from('family_members')
                .select('user_id')
                .eq('family_id', familyId);

            if (membersError) throw membersError;

            if (members) {
                const memberInserts = members.map(m => ({
                    savings_request_id: requestData.id,
                    user_id: m.user_id,
                    status: 'pending'
                }));

                const { error: insertError } = await supabase
                    .from('family_savings_members')
                    .insert(memberInserts);

                if (insertError) throw insertError;
            }

            toast.success("Savings request created");
            setShowCreateDialog(false);
            setNewRequestAmount('');
            setNewRequestTitle('');
            fetchRequests();

        } catch (error) {
            console.error("Error creating request:", error);
            toast.error("Failed to create request");
        } finally {
            setCreating(false);
        }
    };

    const handleRefund = async () => {
        if (!selectedRequest || !refundAmountUsed) return;
        setRefunding(true);

        try {
            const { data, error } = await supabase.rpc('distribute_savings_refund', {
                p_request_id: selectedRequest.id,
                p_amount_used: parseFloat(refundAmountUsed)
            });

            if (error) throw error;
            if (data && data.success === false) {
                throw new Error(data.error || 'Refund failed');
            }

            toast.success("Refund processed successfully");
            setShowRefundDialog(false);
            setRefundAmountUsed('');
            setSelectedRequest(null);
            fetchRequests();

        } catch (error: any) {
            console.error("Refund error:", error);
            toast.error(error.message || "Failed to process refund");
        } finally {
            setRefunding(false);
        }
    };

    const handleResponse = async (request: SavingsRequest, status: 'accepted' | 'rejected') => {
        if (!user || !familyId) return;
        setResponding(true);

        try {
            const memberRecord = request.family_savings_members?.find(m => m.user_id === user.id);
            if (!memberRecord) throw new Error("Member record not found");

            if (status === 'accepted') {
                const { data, error } = await supabase.rpc('accept_family_savings_request', {
                    p_request_id: request.id
                });

                if (error) throw error;
                // Check if RPC returned an error object inside the JSON
                if (data && data.success === false) {
                    throw new Error(data.error || 'Failed to accept request');
                }
            } else {
                // REJECTED (Simple update is fine)
                const { error } = await supabase
                    .from('family_savings_members')
                    .update({ status: status })
                    .eq('id', memberRecord.id);

                if (error) throw error;
            }

            toast.success(status === 'accepted' ? "Contribution accepted" : "Request rejected");
            fetchRequests();

        } catch (error: any) {
            console.error("Error responding:", error);
            toast.error(error.message || "Failed to update status");
        } finally {
            setResponding(false);
        }
    };

    return (
        <div className="container max-w-4xl py-6 space-y-8 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Family Savings</h1>
                    <p className="text-muted-foreground">Manage family savings goals and member contributions.</p>
                </div>
                {isAdmin && (
                    <Button onClick={() => setShowCreateDialog(true)} className="ml-auto gap-2">
                        <Plus className="w-4 h-4" />
                        New Request
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full animate-pulse" />
                        <img
                            src="/assets/token.png"
                            alt="Loading..."
                            className="w-24 h-24 animate-[spin_2s_linear_infinite] relative z-10 object-contain"
                        />
                    </div>
                    <p className="text-muted-foreground animate-pulse font-medium">Loading savings data...</p>
                </div>
            ) : requests.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <PiggyBank className="w-12 h-12 mb-4 opacity-50" />
                        <h3 className="text-lg font-medium">No Savings Requests</h3>
                        <p className="mb-4">Admins can create requests to pool funds from family members.</p>
                        {isAdmin && (
                            <Button onClick={() => setShowCreateDialog(true)} variant="outline">
                                Create First Request
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {requests.map(request => {
                        const myStatus = request.family_savings_members?.find(m => m.user_id === user?.id)?.status;
                        const acceptedCount = request.family_savings_members?.filter(m => m.status === 'accepted').length || 0;
                        const totalMembers = request.family_savings_members?.length || 0;
                        const showDetails = userRole === 'admin' || userRole === 'leader';

                        return (
                            <Card key={request.id} className="overflow-hidden">
                                <CardHeader className="bg-muted/30 pb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xl flex items-center gap-2">
                                                {request.title}
                                                <Badge variant={request.status === 'active' ? 'default' : 'secondary'}>
                                                    {request.status.toUpperCase()}
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                Requesting <span className="font-semibold text-foreground">₹{request.amount_per_member}</span> from each member
                                            </CardDescription>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1">
                                            <div className="text-sm text-muted-foreground">Pooled so far</div>
                                            <div className="text-2xl font-bold text-green-600">
                                                ₹{acceptedCount * request.amount_per_member}
                                            </div>
                                            {isAdmin && request.status === 'active' && acceptedCount > 0 && (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-7 text-xs gap-1 mt-1"
                                                    onClick={() => {
                                                        setSelectedRequest(request);
                                                        setShowRefundDialog(true);
                                                    }}
                                                >
                                                    <PiggyBank className="w-3 h-3" />
                                                    Close & Refund
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Left: My Action */}
                                        <div className="flex-1 space-y-4">
                                            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your Status</h4>
                                            {myStatus === 'pending' ? (
                                                <div className="p-4 rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900">
                                                    <div className="flex items-start gap-3">
                                                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                                        <div>
                                                            <p className="font-medium text-amber-900 dark:text-amber-100">Action Required</p>
                                                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                                                Accepting will deduct ₹{request.amount_per_member} from your spending limit.
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3 mt-4">
                                                        <Button
                                                            size="sm"
                                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                                            onClick={() => handleResponse(request, 'accepted')}
                                                            disabled={responding}
                                                        >
                                                            <Check className="w-4 h-4 mr-2" /> Accept
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleResponse(request, 'rejected')}
                                                            disabled={responding}
                                                        >
                                                            <X className="w-4 h-4 mr-2" /> Reject
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : myStatus === 'accepted' ? (
                                                <div className="flex items-center gap-2 text-green-600 font-medium p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100">
                                                    <Check className="w-5 h-5" /> Contribution Accepted
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-red-500 font-medium p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100">
                                                    <X className="w-5 h-5" /> Request Rejected
                                                </div>
                                            )}
                                        </div>

                                        {/* Right: Progress */}
                                        <div className="flex-1 space-y-4">
                                            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Family Progress</h4>
                                            <div
                                                className={`space-y-2 p-2 -m-2 rounded-lg transition-colors ${showDetails ? "hover:bg-muted cursor-pointer" : ""}`}
                                                onClick={() => {
                                                    if (showDetails) {
                                                        setSelectedProgressRequest(request);
                                                        setShowProgressDialog(true);
                                                    }
                                                }}
                                            >
                                                <div className="flex justify-between text-sm">
                                                    <span>{acceptedCount} of {totalMembers} accepted</span>
                                                    <span>{Math.round((acceptedCount / (totalMembers || 1)) * 100)}%</span>
                                                </div>
                                                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-green-500 transition-all duration-500"
                                                        style={{ width: `${(acceptedCount / (totalMembers || 1)) * 100}%` }}
                                                    />
                                                </div>
                                                {showDetails && (
                                                    <p className="text-xs text-center text-muted-foreground mt-1">Tap to see contributors</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Contribution Details</DialogTitle>
                        <DialogDescription>Status of all family members for this request.</DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[300px] overflow-y-auto space-y-3 py-2 pr-2">
                        {selectedProgressRequest?.family_savings_members?.map(memberRecord => {
                            const memberProfile = familyMembers.find(m => m.user_id === memberRecord.user_id)?.profiles;
                            return (
                                <div key={memberRecord.id} className="flex items-center justify-between p-2 rounded-md border bg-card">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={memberProfile?.avatar_url} />
                                            <AvatarFallback>{memberProfile?.name?.[0] || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium text-sm">{memberProfile?.name || 'Unknown User'}</span>
                                    </div>
                                    <Badge variant={
                                        memberRecord.status === 'accepted' ? 'default' :
                                            memberRecord.status === 'rejected' ? 'destructive' : 'secondary'
                                    } className={
                                        memberRecord.status === 'accepted' ? 'bg-green-600 hover:bg-green-700' : ''
                                    }>
                                        {memberRecord.status.toUpperCase()}
                                    </Badge>
                                </div>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Savings Request</DialogTitle>
                        <DialogDescription>
                            Request a contribution from all family members. This will be deducted from their spending limits.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                placeholder="e.g. Emergency Fund, Vacation"
                                value={newRequestTitle}
                                onChange={e => setNewRequestTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Amount per Member</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                                <Input
                                    type="number"
                                    className="pl-7"
                                    placeholder="0.00"
                                    value={newRequestAmount}
                                    onChange={e => setNewRequestAmount(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreateRequest} disabled={creating || !newRequestAmount || !newRequestTitle}>
                            {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wallet className="w-4 h-4 mr-2" />}
                            Create Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Close & Refund Savings</DialogTitle>
                        <DialogDescription>
                            Specify how much of the pooled amount was actually used. The remaining amount will be refunded equally to all contributors.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-4 py-4">
                            <div className="p-4 bg-muted rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Total Collected:</span>
                                    <span className="font-bold">₹{(selectedRequest.family_savings_members?.filter(m => m.status === 'accepted').length || 0) * selectedRequest.amount_per_member}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Amount Used</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                                    <Input
                                        type="number"
                                        className="pl-7"
                                        placeholder="0.00"
                                        value={refundAmountUsed}
                                        onChange={e => setRefundAmountUsed(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Enter 0 to refund everything. Enter the total collected amount to refund nothing.
                                </p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRefundDialog(false)}>Cancel</Button>
                        <Button onClick={handleRefund} disabled={refunding || !refundAmountUsed}>
                            {refunding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                            Process Refund & Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
