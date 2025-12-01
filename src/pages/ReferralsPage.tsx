import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface Referral {
    id: string;
    email: string;
    created_at: string;
    referral_status: number; // 0 = Pending, 1 = Success
}

export default function ReferralsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchReferrals() {
            if (!user?.user_metadata?.referral_id) {
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('referral_tracking')
                    .select('email, created_at, referral_status')
                    .eq('referred_by', user.user_metadata.referral_id);

                if (error) throw error;

                // Map data to match interface (using email as ID since tracking table might not have UUIDs for all)
                const formattedData = (data || []).map((item: any) => ({
                    id: item.email, // Use email as unique key for list
                    email: item.email,
                    created_at: item.created_at,
                    referral_status: item.referral_status || 0
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
                            <p className="text-sm text-muted-foreground">Track your network growth</p>
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
                                People who joined using your referral code
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8 text-muted-foreground">Loading...</div>
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
                                            className="flex items-center justify-between p-4 rounded-lg border bg-card/50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="text-lg font-bold text-primary">
                                                        U
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium">
                                                        User_{btoa(referral.email).slice(0, 8).toUpperCase()}
                                                    </p>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Calendar className="w-3 h-3" />
                                                        Joined {format(new Date(referral.created_at), 'MMM d, yyyy')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${referral.referral_status === 1
                                                ? "bg-green-500/10 text-green-500 border border-green-500/20"
                                                : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                                                }`}>
                                                {referral.referral_status === 1 ? "Approved" : "Pending"}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </main>
        </div>
    );
}
