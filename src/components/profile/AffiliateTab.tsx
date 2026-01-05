
import { useEffect, useState } from "react";
import { Users, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useGamification } from "@/contexts/GamificationContext";
import { toast } from "sonner";

interface Referral {
    id: string; // email
    email: string;
    created_at: string;
    referral_status: number; // 0 = Pending, 1 = Success
    referral_id?: string;
    claimed?: boolean;
    row_id?: number; // Primary key if available
}

export function AffiliateTab() {
    const { user } = useAuth();
    const { earnCoins } = useGamification();
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);
    const [claimingId, setClaimingId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchReferrals() {
            if (!user?.user_metadata?.referral_id) {
                setLoading(false);
                return;
            }

            try {
                // Fetching all columns to ensure we don't crash if specific new columns (like 'claimed') aren't added yet
                const { data, error } = await supabase
                    .from('referral_tracking')
                    .select('*')
                    .eq('referred_by', user.user_metadata.referral_id);

                if (error) throw error;

                const formattedData = (data || []).map((item: any) => ({
                    id: item.email,
                    row_id: item.id,
                    email: item.email,
                    created_at: item.created_at,
                    referral_status: item.referral_status || 0,
                    referral_id: item.referral_id,
                    claimed: item.claimed || false,
                }));

                setReferrals(formattedData);
            } catch (error) {
                console.error("Error fetching referrals:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchReferrals();
    }, [user]);

    const handleClaim = async (referral: Referral) => {
        if (referral.claimed || referral.referral_status !== 1) return;

        setClaimingId(referral.id);
        const rewardAmount = 5000;

        try {
            // 1. Update DB
            let query = supabase
                .from('referral_tracking')
                .update({ claimed: true });

            if (referral.row_id) {
                query = query.eq('id', referral.row_id);
            } else {
                query = query
                    .eq('email', referral.email)
                    .eq('referred_by', user?.user_metadata?.referral_id);
            }

            const { data, error } = await query.select();

            if (error) throw error;
            if (!data || data.length === 0) {
                throw new Error("Could not verify claim update. Please try again.");
            }

            // 2. Add Coins (Only if DB update succeeded)
            await earnCoins(rewardAmount);

            // 3. Update Local State
            setReferrals(prev => prev.map(r =>
                r.id === referral.id ? { ...r, claimed: true } : r
            ));

            toast.success(`Claimed ${rewardAmount} Tokens!`);

        } catch (error: any) {
            console.error("Error claiming reward:", error);
            toast.error(`Failed to claim: ${error.message || "Unknown error"}`);
        } finally {
            setClaimingId(null);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Referred Users List */}
            <div className="lg:col-span-8 order-2 lg:order-1">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Referred Users ({referrals.length})
                            </CardTitle>
                            <CardDescription>
                                Earn 5,000 tokens for every approved referral!
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <img
                                        src="/assets/token.png"
                                        alt="Loading..."
                                        className="w-12 h-12 animate-spin object-contain"
                                    />
                                    <p className="text-muted-foreground animate-pulse font-medium">Loading referrals...</p>
                                </div>
                            ) : referrals.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p>No referrals yet.</p>
                                    <p className="text-sm">Share your code to start earning rewards!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {referrals.map((referral) => (
                                        <div
                                            key={referral.id}
                                            className="flex items-center justify-between p-4 rounded-lg border bg-card/50 gap-4"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                    <span className="text-lg font-bold text-primary">
                                                        {referral.referral_id ? referral.referral_id[0] : 'U'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium">
                                                        {referral.referral_id ? `User_${referral.referral_id}` : (() => {
                                                            const [name, domain] = referral.email.split('@');
                                                            return `${name.substring(0, 3)}***@${domain}`;
                                                        })()}
                                                    </p>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Calendar className="w-3 h-3" />
                                                        Joined {format(new Date(referral.created_at), 'MMM d, yyyy')}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                <div className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${referral.referral_status === 1
                                                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                                                    : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                                                    }`}>
                                                    {referral.referral_status === 1 ? "Approved" : "Pending"}
                                                </div>

                                                {referral.referral_status === 1 && (
                                                    referral.claimed ? (
                                                        <div className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-green-500/10 text-green-500 border border-green-500/20">
                                                            Claimed
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleClaim(referral)}
                                                            disabled={claimingId === referral.id}
                                                            className="gap-1 h-7 text-xs px-2 bg-yellow-500 hover:bg-yellow-600 text-black"
                                                        >
                                                            {claimingId === referral.id ? (
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <img src="/assets/token.png" alt="Token" className="w-3 h-3 object-contain" />
                                                                    Claim 5000 Tokens
                                                                </>
                                                            )}
                                                        </Button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-center text-muted-foreground pt-4 mt-4 border-t">
                                <i><b>Note:</b> Referral approvals may take 1-2 working days.</i>
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Right Column: Referral Code & Stats */}
            <div className="lg:col-span-4 order-1 lg:order-2 space-y-6">
                <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 sticky top-6">
                    <CardHeader>
                        <CardTitle className="text-xl">Your Referral Code</CardTitle>
                        <CardDescription>Share this code with friends to earn rewards.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4 bg-background/50 p-4 rounded-lg border border-border/50">
                            <code className="text-2xl font-mono font-bold text-primary tracking-wider flex-1 truncate">
                                {user?.user_metadata?.referral_id || "LOADING..."}
                            </code>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    navigator.clipboard.writeText(user?.user_metadata?.referral_id || "");
                                    toast.success("Referral code copied!");
                                }}
                            >
                                Copy
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Referral Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Referral Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-muted/50 rounded-lg text-center space-y-1">
                            <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                                Referred
                            </div>
                            <div className="text-xl font-bold">{referrals.length}</div>
                        </div>

                        <div className="p-3 bg-yellow-500/10 rounded-lg text-center space-y-1">
                            <div className="text-yellow-600 text-[10px] font-bold uppercase tracking-wider">
                                Pending
                            </div>
                            <div className="text-xl font-bold text-yellow-600">
                                {referrals.filter(r => r.referral_status === 0).length}
                            </div>
                        </div>

                        <div className="p-3 bg-green-500/10 rounded-lg text-center space-y-1">
                            <div className="text-green-600 text-[10px] font-bold uppercase tracking-wider">
                                Earned
                            </div>
                            <div className="text-xl font-bold text-green-600 truncate" title={(referrals.filter(r => r.claimed).length * 5000).toLocaleString()}>
                                {(referrals.filter(r => r.claimed).length * 5000).toLocaleString()}
                            </div>
                        </div>

                        <div className="p-3 bg-blue-500/10 rounded-lg text-center space-y-1">
                            <div className="text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                                Left
                            </div>
                            <div className="text-xl font-bold text-blue-600">
                                {Math.max(0, 5 - referrals.length)}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
