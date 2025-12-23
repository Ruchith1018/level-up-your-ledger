import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Star, Users, CreditCard, Sparkles, Loader2 } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useGamification } from "@/contexts/GamificationContext";

interface PremiumPackModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PremiumPackModal({ open, onOpenChange }: PremiumPackModalProps) {
    const { user } = useAuth();
    const { settings, updateSettings } = useSettings();
    const { showSuccessAnimation } = useGamification();
    const [isLoading, setIsLoading] = useState(false);

    const benefits = [
        {
            icon: Users,
            title: "Family Experience",
            description: "Unlock family budgeting and tracking features."
        },
        {
            icon: CreditCard,
            title: "Custom Card",
            description: "Design your own totally custom card with any image."
        },
        {
            icon: Star,
            title: "3 Pro Cards Included",
            description: "Get 1 Classic, 1 Marvel, and 1 Anime card of your choice."
        },
        {
            icon: Sparkles,
            title: "Premium Badge",
            description: "Stand out on the leaderboard with a shiny profile badge."
        }
    ];

    const handlePurchase = async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            const currency = "INR";
            const priceAmount = 249;

            // 1. Create Order
            const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
                body: {
                    amount: priceAmount * 100,
                    currency: currency
                }
            });

            if (orderError) throw orderError;

            // 2. Razorpay Options
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "BudGlio",
                description: "Premium Pack Upgrade",
                image: "/logo.jpg",
                order_id: orderData.id,
                handler: async function (response: any) {
                    try {
                        // 3. Verify Payment
                        const { error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
                            body: {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                userId: user.id
                                // We don't verify specific cardThemeId here, just the generic payment
                            }
                        });

                        if (verifyError) throw verifyError;

                        // 4. Update Settings
                        await updateSettings({
                            hasPremiumPack: true,
                            // If they bought "Custom Card" separately before, this is fine.
                            // If not, they now have access.
                            // We explicitly unlock the Custom Card feature by marking it 'purchased' if not already
                            purchasedCardThemes: [...(settings.purchasedCardThemes || []), "custom"].filter((v, i, a) => a.indexOf(v) === i)
                        });

                        showSuccessAnimation({
                            type: 'purchase',
                            item: "Premium Pack"
                        });

                        toast.success("Welcome to Premium! All features unlocked.");
                        onOpenChange(false);

                    } catch (err: any) {
                        console.error("Verification failed", err);
                        toast.error("Payment verification failed.");
                    } finally {
                        setIsLoading(false);
                    }
                },
                prefill: {
                    name: user.user_metadata?.name || user.email,
                    email: user.email,
                    contact: ""
                },
                theme: {
                    color: "#8b5cf6" // Violet
                },
                modal: {
                    ondismiss: function () {
                        setIsLoading(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error: any) {
            console.error("Purchase failed", error);
            toast.error(error.message || "Failed to initiate payment");
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none text-white bg-slate-900">
                {/* Header Background */}
                <div className="relative h-32 bg-gradient-to-br from-violet-600 to-indigo-600 flex flex-col items-center justify-center text-center p-6">
                    <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-20" />
                    <Sparkles className="w-10 h-10 text-yellow-300 mb-2 animate-pulse" />
                    <DialogTitle className="text-2xl font-bold tracking-tight text-white relative z-10">Premium Pack</DialogTitle>
                    <p className="text-violet-100 text-sm relative z-10">Unlock the full BudGlio experience</p>
                </div>

                <div className="p-6 space-y-6 bg-slate-900">
                    <div className="space-y-4">
                        {benefits.map((benefit, index) => (
                            <div key={index} className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-slate-800 text-violet-400 mt-1">
                                    <benefit.icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm text-slate-100">{benefit.title}</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">{benefit.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 space-y-3">
                        <Button
                            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-6 shadow-lg shadow-violet-500/20"
                            onClick={handlePurchase}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    Unlock Premium <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">₹249</span>
                                </span>
                            )}
                        </Button>
                        <p className="text-[10px] text-center text-slate-500">
                            One-time purchase • Lifetime access
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
