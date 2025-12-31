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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, Plus, PiggyBank, AlertTriangle, Check, X, Wallet, TrendingUp, History, Users } from 'lucide-react';
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

    // --- Calculated Stats ---
    const activeRequests = requests.filter(r => r.status === 'active');
    const pastRequests = requests.filter(r => r.status !== 'active');

    const totalPooled = activeRequests.reduce((acc, curr) => {
        const accepted = curr.family_savings_members?.filter(m => m.status === 'accepted').length || 0;
        return acc + (accepted * curr.amount_per_member);
    }, 0);

    const activeGoalsCount = activeRequests.length;
    const totalGoalValue = activeRequests.reduce((acc, curr) => {
        return acc + (curr.amount_per_member * (curr.family_savings_members?.length || 0));
    }, 0);


    return (
        <div className="container max-w-5xl py-8 space-y-8 pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Family Savings</h1>
                        <p className="text-muted-foreground">Pool funds together for shared goals.</p>
                    </div>
                </div>
                {isAdmin && (
                    <Button onClick={() => setShowCreateDialog(true)} className="gap-2 shadow-sm">
                        <Plus className="w-4 h-4" />
                        New Goal
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)] space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full animate-pulse" />
                        <img
                            src="/assets/token.png"
                            alt="Loading..."
                            className="w-24 h-24 animate-[spin_2s_linear_infinite] relative z-10 object-contain"
                        />
                    </div>
                    <p className="text-muted-foreground animate-pulse font-medium">Fetching savings data...</p>
                </div>
            ) : (
                <>
                    {/* Summary Stats - Clean & Minimal */}
                    <div className="grid grid-cols-3 gap-8 px-2 py-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-xs">Total Pooled</p>
                            <div className="text-3xl font-bold tracking-tight text-green-600">₹{totalPooled.toLocaleString()}</div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-xs">Active Goals</p>
                            <div className="text-3xl font-bold tracking-tight text-primary">{activeGoalsCount}</div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-xs">Target Value</p>
                            <div className="text-3xl font-bold tracking-tight text-foreground">₹{totalGoalValue.toLocaleString()}</div>
                        </div>
                    </div>

                    <Tabs defaultValue="active" className="w-full">
                        <div className="flex items-center justify-between mb-6 border-b pb-1">
                            <TabsList className="bg-transparent p-0 h-auto space-x-6">
                                <TabsTrigger
                                    value="active"
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 font-semibold text-muted-foreground data-[state=active]:text-foreground transition-all"
                                >
                                    Active Goals
                                </TabsTrigger>
                                <TabsTrigger
                                    value="history"
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 font-semibold text-muted-foreground data-[state=active]:text-foreground transition-all"
                                >
                                    History
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="active" className="space-y-4">
                            {activeRequests.length === 0 ? (
                                <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed">
                                    <PiggyBank className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                                    <h3 className="text-xl font-semibold text-foreground">No active goals</h3>
                                    <p className="text-muted-foreground mt-2 mb-6 max-w-sm mx-auto">Create a savings goal to start pooling funds with your family.</p>
                                    {isAdmin && (
                                        <Button onClick={() => setShowCreateDialog(true)}>
                                            Create Goal
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                                    {activeRequests.map(request => (
                                        <RequestsCard
                                            key={request.id}
                                            request={request}
                                            user={user}
                                            userRole={userRole}
                                            isAdmin={isAdmin}
                                            onRespond={handleResponse}
                                            onRefund={(req) => {
                                                setSelectedRequest(req);
                                                setShowRefundDialog(true);
                                            }}
                                            onShowProgress={(req) => {
                                                setSelectedProgressRequest(req);
                                                setShowProgressDialog(true);
                                            }}
                                            responding={responding}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="history" className="space-y-4">
                            {pastRequests.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>No past savings history.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70 hover:opacity-100 transition-opacity">
                                    {pastRequests.map(request => (
                                        <RequestsCard
                                            key={request.id}
                                            request={request}
                                            user={user}
                                            userRole={userRole}
                                            isAdmin={isAdmin}
                                            onRespond={handleResponse}
                                            onRefund={() => { }}
                                            onShowProgress={(req) => {
                                                setSelectedProgressRequest(req);
                                                setShowProgressDialog(true);
                                            }}
                                            responding={responding}
                                            isHistory
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </>
            )}

            {/* Dialogs */}
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
                                <div key={memberRecord.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={memberProfile?.avatar_url} />
                                            <AvatarFallback className="text-xs">{memberProfile?.name?.[0] || 'U'}</AvatarFallback>
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
                        <DialogTitle>Create Savings Goal</DialogTitle>
                        <DialogDescription>
                            Request a contribution from all family members.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Goal Title</Label>
                            <Input
                                placeholder="e.g. Summer Vacation"
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
                            Create Goal
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Close & Refund</DialogTitle>
                        <DialogDescription>
                            Distribute remaining funds back to contributors.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-4 py-4">
                            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Total Collected:</span>
                                    <span className="font-bold">₹{(selectedRequest.family_savings_members?.filter(m => m.status === 'accepted').length || 0) * selectedRequest.amount_per_member}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Amount Used (Expenses)</Label>
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
                                    Remaining balance will be refunded equally to contributors.
                                </p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRefundDialog(false)}>Cancel</Button>
                        <Button onClick={handleRefund} disabled={refunding || !refundAmountUsed}>
                            {refunding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                            Process Refund
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// --- Sub-Components ---

function RequestsCard({
    request,
    user,
    userRole,
    isAdmin,
    onRespond,
    onRefund,
    onShowProgress,
    responding,
    isHistory = false
}: any) {
    const myStatus = request.family_savings_members?.find((m: any) => m.user_id === user?.id)?.status;
    const acceptedCount = request.family_savings_members?.filter((m: any) => m.status === 'accepted').length || 0;
    const totalMembers = request.family_savings_members?.length || 0;
    const progress = totalMembers > 0 ? (acceptedCount / totalMembers) * 100 : 0;
    const totalPooled = acceptedCount * request.amount_per_member;

    return (
        <div className={`relative group rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-300 ${request.status === 'active' ? 'border-l-[6px] border-l-primary' : 'border-l-[6px] border-l-muted'}`}>
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold tracking-tight">{request.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Goal: <span className="font-medium text-foreground">₹{(request.amount_per_member * totalMembers).toLocaleString()}</span>
                        </p>
                    </div>
                    {isHistory && (
                        <Badge variant="secondary" className="uppercase text-[10px] tracking-wider font-semibold">
                            {request.status}
                        </Badge>
                    )}
                </div>

                {/* Progress Section */}
                <div className="mb-6 space-y-2" onClick={() => onShowProgress(request)}>
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-3xl font-bold text-green-600">₹{totalPooled.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1">Collected</p>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-medium">{Math.round(progress)}%</span>
                        </div>
                    </div>
                    <Progress value={progress} className="h-3 rounded-lg bg-secondary" indicatorClassName="bg-green-600 transition-all duration-1000" />
                    <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                        <span>{acceptedCount} contributors</span>
                        <span className="group-hover:text-primary transition-colors cursor-pointer">View Details &rarr;</span>
                    </div>
                </div>

                {/* Action Footer */}
                {!isHistory && (
                    <div className="mt-6 pt-4 border-t border-border/50 flex flex-col gap-3">
                        {/* Status Line */}
                        {myStatus === 'pending' ? (
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-amber-600 flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4" /> Pending Action
                                </span>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 px-3" onClick={() => onRespond(request, 'rejected')} disabled={responding}>
                                        Decline
                                    </Button>
                                    <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 px-4 rounded-full" onClick={() => onRespond(request, 'accepted')} disabled={responding}>
                                        Contribute ₹{request.amount_per_member}
                                    </Button>
                                </div>
                            </div>
                        ) : myStatus === 'accepted' ? (
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-green-600 flex items-center gap-1.5">
                                    <Check className="w-4 h-4" /> You Contributed
                                </span>
                                {isAdmin && (
                                    <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground" onClick={() => onRefund(request)}>
                                        Settings
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-red-500 flex items-center gap-1.5">
                                    <X className="w-4 h-4" /> Declined
                                </span>
                            </div>
                        )}

                        {/* Admin Controls */}
                        {isAdmin && myStatus !== 'pending' && myStatus !== 'accepted' && (
                            <div className="flex justify-end">
                                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onRefund(request)}>
                                    Manage Goal
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

