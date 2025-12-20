import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Calendar, Coins, Check, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function ReferralsPage() {
    const navigate = useNavigate();
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
            // Using explicit .eq() for clarity and robustness
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
            // Revert state if we optimistically updated (we didn't here, but good practice)
            toast.error(`Failed to claim: ${error.message || "Unknown error"}`);
        } finally {
            setClaimingId(null);
        }
    };

    return (
        <div className="bg-background">
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">My Referrals</h1>
                            <p className="text-sm text-muted-foreground">Track your network and earn rewards</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 max-w-4xl">
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
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="w-10 h-10 rounded-full" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-24" />
                                                </div>
                                            </div>
                                            <Skeleton className="h-6 w-16 rounded-full" />
                                        </div>
                                    ))}
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
            </main>
        </div>
    );
}
