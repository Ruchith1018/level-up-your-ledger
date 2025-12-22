import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/SettingsContext";
import { useGamification } from "@/contexts/GamificationContext"; // Added import
import { CreditCard, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CARD_THEMES, MARVEL_THEMES, ANIME_THEMES } from "@/constants/cardThemes";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

// Add Razorpay type to window
declare global {
    interface Window {
        Razorpay: any;
    }
}

export function CardShop() {
    const { settings, updateSettings, isLoading: isSettingsLoading } = useSettings();
    const { showSuccessAnimation } = useGamification();
    const { user } = useAuth();
    const [purchasingId, setPurchasingId] = useState<string | null>(null);

    const isLoading = isSettingsLoading;
    const purchasedThemes = settings.purchasedCardThemes || [];

    const getPrice = (themeId: string, currency: string) => {
        if (currency === "INR") {
            if (themeId.startsWith("marvel_") || themeId.startsWith("anime_")) return { amount: 149, symbol: "₹" };
            if (themeId === "gold" || themeId === "platinum") return { amount: 100, symbol: "₹" };
            return { amount: 50, symbol: "₹" };
        } else {
            // Default to USD for other currencies
            if (themeId.startsWith("marvel_") || themeId.startsWith("anime_")) return { amount: 2.00, symbol: "$" };
            if (themeId === "gold" || themeId === "platinum") return { amount: 1.50, symbol: "$" };
            return { amount: 0.75, symbol: "$" };
        }
    };

    const handlePurchase = async (theme: typeof CARD_THEMES[0]) => {
        if (!user) return;
        setPurchasingId(theme.id);

        try {
            const currency = settings.currency || "INR";
            const priceDetails = getPrice(theme.id, currency);

            // 1. Create Order via Edge Function
            const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
                body: {
                    amount: priceDetails.amount * 100, // Amount in smallest unit (paise or cents)
                    currency: currency
                }
            });

            if (orderError) throw orderError;

            // 2. Open Razorpay Checkout
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "BudGlio",
                description: `Purchase ${theme.name} Card`,
                image: "/logo.jpg",
                order_id: orderData.id,
                handler: async function (response: any) {
                    try {
                        // 3. Verify Payment via Edge Function
                        const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
                            body: {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                cardThemeId: theme.id,
                                userId: user.id
                            }
                        });

                        if (verifyError) throw verifyError;

                        // Success! Update local state to reflect change immediately
                        const updatedPurchased = [...(settings.purchasedCardThemes || []), theme.id];
                        updateSettings({
                            purchasedCardThemes: updatedPurchased,
                            cardTheme: theme.id
                        });

                        showSuccessAnimation({
                            type: 'purchase',
                            item: `${theme.name} Card`
                        });

                        toast.success(`Purchase successful! ${theme.name} is now active.`);

                    } catch (err: any) {
                        console.error("Verification failed", err);
                        toast.error("Payment verification failed. Please contact support if money was deducted.");
                    } finally {
                        setPurchasingId(null);
                    }
                },
                prefill: {
                    name: user.user_metadata?.name || user.email,
                    email: user.email,
                    contact: ""
                },
                theme: {
                    color: "#3399cc"
                },
                modal: {
                    ondismiss: function () {
                        setPurchasingId(null);
                    }
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.open();

        } catch (error: any) {
            console.error("Purchase failed", error);
            toast.error(error.message || "Failed to initiate payment");
            setPurchasingId(null);
        }
    };

    const applyTheme = (theme: typeof CARD_THEMES[0]) => {
        updateSettings({ cardTheme: theme.id });
        toast.success(`${theme.name} card theme applied!`);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Card Store
                </CardTitle>
                <CardDescription>
                    Customize your budget card with premium designs
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-64 rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Classic Themes */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold tracking-tight">Classic Card Themes</h2>
                                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">Original</span>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {CARD_THEMES.map((theme, index) => {
                                    const isPurchased = theme.id === "default" || purchasedThemes.includes(theme.id);
                                    const isActive = (settings.cardTheme || "default") === theme.id;
                                    const priceDetails = getPrice(theme.id, settings.currency || "INR");

                                    return (
                                        <motion.div
                                            key={theme.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <Card className="overflow-hidden h-full flex flex-col hover:shadow-md transition-all duration-200 border-dashed hover:border-solid">
                                                {/* Preview */}
                                                <div
                                                    className="h-32 relative p-4 flex flex-col justify-between card-shine transition-transform hover:scale-[1.02] duration-300"
                                                    style={{ background: theme.gradient }}
                                                >
                                                    <div className={`flex justify-between items-start ${theme.textColor}`}>
                                                        <div className="w-8 h-6 rounded bg-gradient-to-br opacity-80" />
                                                        {isActive && (
                                                            <div className="bg-white/20 backdrop-blur-md px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                                                                <Check className="w-3 h-3" />
                                                                Active
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={`text-sm font-mono tracking-widest opacity-80 ${theme.textColor}`}>
                                                        •••• •••• •••• 1234
                                                    </div>
                                                </div>

                                                <CardContent className="p-4 flex-1 flex flex-col">
                                                    <div className="mb-4 flex-1">
                                                        <h3 className="font-semibold mb-1">{theme.name}</h3>
                                                        <p className="text-xs text-muted-foreground">{theme.description}</p>
                                                    </div>
                                                    <Button
                                                        onClick={() => isPurchased ? applyTheme(theme) : handlePurchase(theme)}
                                                        disabled={purchasingId !== null}
                                                        className="w-full relative"
                                                        variant={isPurchased ? "outline" : "default"}
                                                    >
                                                        {purchasingId === theme.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : isPurchased ? (
                                                            isActive ? "Applied" : "Apply"
                                                        ) : (
                                                            <>
                                                                Buy for {priceDetails.symbol}{priceDetails.amount}
                                                            </>
                                                        )}
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Marvel Themes */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold tracking-tight text-red-600 dark:text-red-500">Marvel Universe</h2>
                                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs font-medium">Heroic</span>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {MARVEL_THEMES.map((theme, index) => {
                                    const isPurchased = theme.id === "default" || purchasedThemes.includes(theme.id);
                                    const isActive = (settings.cardTheme || "default") === theme.id;
                                    const priceDetails = getPrice(theme.id, settings.currency || "INR");

                                    return (
                                        <motion.div
                                            key={theme.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <Card className="overflow-hidden h-full flex flex-col hover:shadow-md transition-all duration-200 border-dashed hover:border-solid border-red-200 dark:border-red-900/50">
                                                {/* Preview */}
                                                <div
                                                    className="h-32 relative p-4 flex flex-col justify-between card-shine transition-transform hover:scale-[1.02] duration-300 bg-cover bg-center"
                                                    style={{
                                                        background: theme.image ? `url(${theme.image}) top center/cover no-repeat` : theme.gradient
                                                    }}
                                                >
                                                    {/* Overlay for readability if needed, but let's assume image is good */}
                                                    <div className={`absolute inset-0 ${theme.image ? 'bg-black/30' : ''}`} />

                                                    <div className={`relative z-10 flex justify-between items-start ${theme.textColor}`}>
                                                        <div className={`w-8 h-6 rounded bg-gradient-to-br opacity-80 ${theme.chipColor}`} />
                                                        {isActive && (
                                                            <div className="bg-white/20 backdrop-blur-md px-2 py-1 rounded text-xs font-medium flex items-center gap-1 shadow-lg">
                                                                <Check className="w-3 h-3" />
                                                                Active
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={`relative z-10 text-sm font-mono tracking-widest opacity-90 shadow-sm ${theme.textColor}`}>
                                                        •••• •••• •••• 1234
                                                    </div>
                                                </div>

                                                <CardContent className="p-4 flex-1 flex flex-col">
                                                    <div className="mb-4 flex-1">
                                                        <h3 className="font-semibold mb-1">{theme.name}</h3>
                                                        <p className="text-xs text-muted-foreground">{theme.description}</p>
                                                    </div>
                                                    <Button
                                                        onClick={() => isPurchased ? applyTheme(theme) : handlePurchase(theme)}
                                                        disabled={purchasingId !== null}
                                                        className="w-full relative"
                                                        variant={isPurchased ? "outline" : "default"}
                                                    >
                                                        {purchasingId === theme.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : isPurchased ? (
                                                            isActive ? "Applied" : "Apply"
                                                        ) : (
                                                            <>
                                                                Buy for {priceDetails.symbol}{priceDetails.amount}
                                                            </>
                                                        )}
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Anime Themes */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">Anime Collection</h2>
                                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 text-xs font-medium">Otaku</span>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {ANIME_THEMES.map((theme, index) => {
                                    const isPurchased = theme.id === "default" || purchasedThemes.includes(theme.id);
                                    const isActive = (settings.cardTheme || "default") === theme.id;
                                    const priceDetails = getPrice(theme.id, settings.currency || "INR");

                                    return (
                                        <motion.div
                                            key={theme.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <Card className="overflow-hidden h-full flex flex-col hover:shadow-md transition-all duration-200 border-dashed hover:border-solid border-indigo-200 dark:border-indigo-900/50">
                                                {/* Preview */}
                                                <div
                                                    className="h-32 relative p-4 flex flex-col justify-between card-shine transition-transform hover:scale-[1.02] duration-300 bg-cover bg-center"
                                                    style={{
                                                        background: theme.image ? `url(${theme.image}) top center/cover no-repeat` : theme.gradient
                                                    }}
                                                >
                                                    {/* Overlay */}
                                                    <div className={`absolute inset-0 ${theme.image ? 'bg-black/30' : ''}`} />

                                                    <div className={`relative z-10 flex justify-between items-start ${theme.textColor}`}>
                                                        <div className={`w-8 h-6 rounded bg-gradient-to-br opacity-80 ${theme.chipColor}`} />
                                                        {isActive && (
                                                            <div className="bg-white/20 backdrop-blur-md px-2 py-1 rounded text-xs font-medium flex items-center gap-1 shadow-lg">
                                                                <Check className="w-3 h-3" />
                                                                Active
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={`relative z-10 text-sm font-mono tracking-widest opacity-90 shadow-sm ${theme.textColor}`}>
                                                        •••• •••• •••• 1234
                                                    </div>
                                                </div>

                                                <CardContent className="p-4 flex-1 flex flex-col">
                                                    <div className="mb-4 flex-1">
                                                        <h3 className="font-semibold mb-1">{theme.name}</h3>
                                                        <p className="text-xs text-muted-foreground">{theme.description}</p>
                                                    </div>
                                                    <Button
                                                        onClick={() => isPurchased ? applyTheme(theme) : handlePurchase(theme)}
                                                        disabled={purchasingId !== null}
                                                        className="w-full relative"
                                                        variant={isPurchased ? "outline" : "default"}
                                                    >
                                                        {purchasingId === theme.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : isPurchased ? (
                                                            isActive ? "Applied" : "Apply"
                                                        ) : (
                                                            <>
                                                                Buy for {priceDetails.symbol}{priceDetails.amount}
                                                            </>
                                                        )}
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Custom Image Card */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold tracking-tight">Custom Card</h2>
                                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 text-white text-xs font-medium">Premium</span>
                            </div>
                            <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-900 dark:to-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center gap-4 border border-dashed border-zinc-300 dark:border-zinc-700">
                                <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center shadow-sm">
                                    <CreditCard className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <div className="text-center">
                                    <h3 className="font-semibold text-lg">Design Your Own</h3>
                                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                                        Upload your favorite image or artwork to create a truly unique budget card.
                                    </p>
                                </div>
                                <Button disabled variant="secondary" className="mt-2">
                                    Coming Soon
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
