import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, Star, Users, CreditCard, Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useGamification } from "@/contexts/GamificationContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { PhoneRequestDialog } from "@/components/payment/PhoneRequestDialog";

declare global {
    interface Window {
        Cashfree: any;
    }
}

export default function PremiumPage() {
    const { user } = useAuth();
    const { settings, updateSettings, isLoading: settingsLoading } = useSettings();
    const { showSuccessAnimation } = useGamification();
    const [isLoading, setIsLoading] = useState(false);
    const [minLoading, setMinLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => setMinLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    const isCheckingPremium = settingsLoading || minLoading;
    const isPremium = settings.hasPremiumPack;

    const benefits = [
        {
            icon: Users,
            title: "Family Experience",
            description: "Unlock family budgeting and tracking features to grow wealth together."
        },
        {
            icon: CreditCard,
            title: "Custom Card",
            description: "Design your own totally custom card with any image you want."
        },
        {
            icon: Star,
            title: "3 Pro Cards Included",
            description: "Get 1 Classic, 1 Marvel, and 1 Anime card of your choice (worth ₹450+)."
        },
        {
            icon: Sparkles,
            title: "Premium Badge",
            description: "Stand out on the leaderboard with a exclusive shiny profile badge."
        }
    ];

    // Unified Verification Logic
    const verifyTransaction = async (orderId: string) => {
        if (!orderId || !user) return;

        try {
            toast.info("Verifying premium status...");
            // Pass productType='premium' for backend fulfillment
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-cashfree-payment', {
                body: { order_id: orderId, productType: 'premium' }
            });

            if (verifyError) throw verifyError;

            if (verifyData.success) {
                toast.success("Welcome to Premium!");

                showSuccessAnimation({
                    type: 'purchase',
                    item: "Premium Pack"
                });

                await updateSettings({
                    hasPremiumPack: true,
                    // Implicitly update frontend state for custom card if needed, 
                    // though backend does it.
                    purchasedCardThemes: [...(settings.purchasedCardThemes || []), "custom"].filter((v, i, a) => a.indexOf(v) === i)
                });

            } else {
                console.log("Payment status:", verifyData.status);
                if (verifyData.status === "PENDING") {
                    toast.warning("Payment is still pending. Please wait a moment.");
                } else {
                    toast.error(`Payment failed: ${verifyData.status}`);
                }
            }
        } catch (err) {
            console.error("Verification error:", err);
            toast.error("Failed to verify payment status.");
        }
    };

    const [showPhoneDialog, setShowPhoneDialog] = useState(false);

    const handlePurchaseClick = () => {
        setShowPhoneDialog(true);
    };

    const proceedWithPurchase = async (phoneNumber: string) => {
        if (!user) return;
        setShowPhoneDialog(false);
        setIsLoading(true);

        try {
            const currency = settings.currency || "INR";
            const customerName = settings.userName || user.user_metadata?.name || "User";

            // Helper function
            const createOrder = async (amt: number, curr: string) => {
                const { data, error } = await supabase.functions.invoke('create-cashfree-order', {
                    body: {
                        amount: amt * 100,
                        currency: curr,
                        customer_id: user.id,
                        customer_name: customerName,
                        customer_email: user.email,
                        customer_phone: phoneNumber
                    }
                });

                if (error) throw error;
                if (data && !data.success) {
                    throw new Error(data.error || "Order creation failed");
                }
                return data;
            };

            let orderData;
            try {
                // Attempt 1: User Currency
                const priceAmount = currency === "INR" ? 249 : 3.00;
                orderData = await createOrder(priceAmount, currency);
            } catch (firstError: any) {
                console.log("Attempt 1 (Preferred Currency) failed. Falling back to INR.", firstError.message);

                if (currency !== "INR") {
                    toast.info(`Retrying payment in INR...`);
                    // Fallback to INR price
                    orderData = await createOrder(249, "INR");
                } else {
                    throw firstError;
                }
            }

            // 2. Initialize Cashfree
            toast.dismiss();
            toast.loading("Opening secure payment window...");

            console.log("Initializing Cashfree...");
            const cashfree = window.Cashfree({
                mode: "sandbox"
            });

            await cashfree.checkout({
                paymentSessionId: orderData.payment_session_id,
                redirectTarget: "_modal"
            });

            toast.dismiss();
            console.log("Checkout resolved. Verifying status...");
            // 3. Verify immediately after popup closes
            await verifyTransaction(orderData.order_id);

        } catch (error: any) {
            console.error("Purchase failed", error);
            toast.error(error.message || "Failed to initiate payment");
        } finally {
            setIsLoading(false);
        }
    };

    // Show loader while checking premium status
    if (isCheckingPremium) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-6 bg-background">
                <div className="relative">
                    <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full animate-pulse" />
                    <img
                        src="/assets/token.png"
                        alt="Loading..."
                        className="w-24 h-24 animate-[spin_2s_linear_infinite] relative z-10 object-contain"
                    />
                </div>
                <p className="text-muted-foreground animate-pulse font-medium">Checking premium status...</p>
            </div>
        );
    }

    if (isPremium) {
        return (
            <div className="min-h-screen bg-background">
                <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="container mx-auto px-4 py-4">
                        <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
                            <ArrowLeft className="w-4 h-4" /> Back
                        </Button>
                    </div>
                </header>

                <main className="container mx-auto px-4 py-12 max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center justify-center text-center space-y-8"
                    >
                        {/* Premium Badge with Token */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 blur-3xl rounded-full animate-pulse" />
                            <motion.div
                                initial={{ scale: 0.8, rotate: -10 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
                                className="relative z-10 p-8 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-full shadow-2xl"
                            >
                                <Sparkles className="w-20 h-20 text-white" />
                            </motion.div>
                        </div>

                        {/* Success Message */}
                        <div className="space-y-3">
                            <motion.h1
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-yellow-600 via-orange-500 to-yellow-600 bg-clip-text text-transparent"
                            >
                                Premium Member
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-xl text-muted-foreground max-w-md"
                            >
                                Thank you for supporting BudGlio! You now have access to all premium features.
                            </motion.p>
                        </div>

                        {/* Benefits Grid */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="grid sm:grid-cols-2 gap-4 w-full max-w-2xl mt-8"
                        >
                            {benefits.map((benefit, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.6 + index * 0.1 }}
                                >
                                    <Card className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20 hover:border-green-500/40 transition-all">
                                        <CardContent className="p-5 flex items-start gap-4 text-left">
                                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 text-green-600 dark:text-green-400">
                                                <Check className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-base mb-1">{benefit.title}</h4>
                                                <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Action Buttons */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="flex gap-3 pt-4"
                        >
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => navigate("/shop")}
                                className="gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                Explore Themes
                            </Button>
                            <Button
                                size="lg"
                                onClick={() => navigate("/family")}
                                className="gap-2"
                            >
                                <Users className="w-4 h-4" />
                                Family Dashboard
                            </Button>
                        </motion.div>
                    </motion.div>
                </main>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500 relative overflow-hidden">
            <PhoneRequestDialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog} onConfirm={proceedWithPurchase} />

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-violet-600/20 blur-[120px] -z-10 rounded-full pointer-events-none" />

            <div className="flex flex-col items-center text-center space-y-4 mb-12 mt-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 text-xs font-semibold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    Premium Access
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">
                    Level Up Your Ledger
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Unlock the full potential of your financial journey with exclusive features designed for power users.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
                <div className="space-y-8 order-2 lg:order-1">
                    <div className="grid gap-6">
                        {benefits.map((benefit, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                    <benefit.icon className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-lg">{benefit.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="order-1 lg:order-2 flex flex-col items-center">
                    <Card className="w-full max-w-md border-2 border-violet-500/20 shadow-2xl overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                        <div className="p-8 text-center space-y-6 relative z-10">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">BudGlio Premium</h3>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-5xl font-black">
                                        {settings.currency === "INR" ? "₹249" : "$3.00"}
                                    </span>
                                    <span className="text-muted-foreground">/ lifetime</span>
                                </div>
                                <p className="text-sm text-green-600 font-medium bg-green-100 dark:bg-green-900/30 inline-block px-3 py-1 rounded-full">
                                    One-time payment
                                </p>
                            </div>

                            <ul className="space-y-3 text-sm text-left mx-auto max-w-[240px]">
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-violet-500" />
                                    <span>All Premium Themes</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-violet-500" />
                                    <span>Family Dashboard Access</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-violet-500" />
                                    <span>Custom Card Builder</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-violet-500" />
                                    <span>Priority Support</span>
                                </li>
                            </ul>

                            <Button
                                size="lg"
                                className="w-full h-14 text-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25"
                                onClick={handlePurchaseClick}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Unlock Everything <Sparkles className="w-4 h-4 fill-white/20" />
                                    </span>
                                )}
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                Secure payment via Cashfree. No hidden fees.
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
