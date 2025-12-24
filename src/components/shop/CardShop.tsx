import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/SettingsContext";
import { useGamification } from "@/contexts/GamificationContext";
import { useBudget } from "@/contexts/BudgetContext"; // Added
import { useExpenses } from "@/contexts/ExpenseContext"; // Added
import { getCurrencySymbol } from "@/constants/currencies"; // Added
import dayjs from "dayjs"; // Added
import { CreditCard, Check, Loader2, UploadCloud } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CARD_THEMES, MARVEL_THEMES, ANIME_THEMES } from "@/constants/cardThemes";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Add Cashfree type to window
declare global {
    interface Window {
        Cashfree: any;
    }
}

export function CardShop() {
    const { settings, updateSettings, isLoading: isSettingsLoading } = useSettings();
    const { showSuccessAnimation } = useGamification();
    const { user } = useAuth();
    const [purchasingId, setPurchasingId] = useState<string | null>(null);
    const [pendingClaim, setPendingClaim] = useState<{ theme: any, category: 'classic' | 'marvel' | 'anime' } | null>(null);
    const navigate = useNavigate();

    // Unified Verification Logic
    const verifyTransaction = async (orderId: string, themeId: string | null) => {
        if (!orderId || !user) return;

        try {
            toast.info("Verifying payment status...");
            // Pass themeId (for backend fulfillment)
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-cashfree-payment', {
                body: { order_id: orderId, themeId: themeId }
            });

            if (verifyError) throw verifyError;

            if (verifyData.success) {
                toast.success("Payment verified successfully!");

                // Refresh settings to reflect backend changes
                // The backend implementation of verify-cashfree-payment now handles the DB update.
                // We can trigger a reload or optimistically update if we want invalidation.
                // For now, let's just trigger a window reload or settings refetch if available.
                // Since this component uses `useSettings`, and we don't have a direct 'refetch', 
                // we can rely on `updateSettings` (which writes) or just reload the page for safety to fetch fresh data?
                // Or best: Call updateSettings with the new data locally? UseSettings usually *updates* the context state too.
                // Let's keep the frontend update as "Optimistic UI" for now, or "Ensurance".

                const targetThemeId = themeId || localStorage.getItem("pending_purchase_item");

                if (targetThemeId) {
                    // We still call this to update the UI Context immediately.
                    // It might write to DB again, but that's safe (idempotent).
                    const updatedPurchased = [...(settings.purchasedCardThemes || []), targetThemeId];
                    const uniquePurchased = [...new Set(updatedPurchased)];

                    await updateSettings({
                        purchasedCardThemes: uniquePurchased,
                        cardTheme: targetThemeId
                    });

                    showSuccessAnimation({
                        type: 'purchase',
                        item: "New Card"
                    });
                    localStorage.removeItem("pending_purchase_item");
                }
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

    // Verify Payment on Load (Redirect handling)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get("order_id");

        if (orderId) {
            // Clear URL
            window.history.replaceState(null, "", window.location.pathname);
            const pendingItem = localStorage.getItem("pending_purchase_item");
            verifyTransaction(orderId, pendingItem);
        }
    }, [user, settings.purchasedCardThemes, verifyTransaction]); // Reduced deps to avoid loops


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

        // Save intent
        localStorage.setItem("pending_purchase_item", theme.id);

        try {
            const currency = settings.currency || "INR";
            const priceDetails = getPrice(theme.id, currency);

            // 1. Create Order via Edge Function
            const { data: orderData, error: orderError } = await supabase.functions.invoke('create-cashfree-order', {
                body: {
                    amount: priceDetails.amount * 100, // Send cents/paise
                    currency: currency,
                    customer_id: user.id,
                    customer_name: user.user_metadata?.name || "User",
                    customer_email: user.email,
                    customer_phone: "9999999999"
                }
            });

            if (orderError) throw orderError;

            // 2. Open Cashfree Checkout
            console.log("Initializing Cashfree...");
            const cashfree = window.Cashfree({
                mode: "sandbox"
            });
            console.log("Cashfree Object:", cashfree);

            await cashfree.checkout({
                paymentSessionId: orderData.payment_session_id,
                redirectTarget: "_modal"
            });

            console.log("Checkout resolved. Verifying status...");
            // 3. Immediately verify after popup closes
            await verifyTransaction(orderData.order_id, theme.id);

        } catch (error: any) {
            console.error("Purchase failed", error);
            toast.error(error.message || "Failed to initiate payment");
        } finally {
            setPurchasingId(null);
        }
    };

    const applyTheme = (theme: typeof CARD_THEMES[0]) => {
        updateSettings({ cardTheme: theme.id });
        toast.success(`${theme.name} card theme applied!`);
    };

    const handleClaimRequest = (theme: any, category: 'classic' | 'marvel' | 'anime') => {
        setPendingClaim({ theme, category });
    };

    const executeClaim = async () => {
        if (!pendingClaim) return;
        const { theme, category } = pendingClaim;

        const updatedPurchased = [...(settings.purchasedCardThemes || []), theme.id];

        const claims = { ...settings.premiumPackClaims };
        if (category === 'classic') claims.classic = true;
        if (category === 'marvel') claims.marvel = true;
        if (category === 'anime') claims.anime = true;

        await updateSettings({
            purchasedCardThemes: updatedPurchased,
            cardTheme: theme.id,
            premiumPackClaims: claims as any // Casting to avoid strict type issues if undefined
        });

        toast.success("Card claimed successfully!");
        showSuccessAnimation({ type: 'purchase', item: theme.name });
        setPendingClaim(null);
    };

    return (
        <Card>
            <AlertDialog open={!!pendingClaim} onOpenChange={(open) => !open && setPendingClaim(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Claim "{pendingClaim?.theme.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You can only claim ONE free <strong>{pendingClaim?.category === 'classic' ? 'Classic' : pendingClaim?.category === 'marvel' ? 'Marvel' : 'Anime'}</strong> theme.
                            <br /><br />
                            Are you sure you want to choose this one? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeClaim} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700">Confirm Claim</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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

                                    // Premium Claim Logic
                                    const canClaimFree = settings.hasPremiumPack &&
                                        !settings.premiumPackClaims?.classic &&
                                        !isPurchased;



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

                                                    {canClaimFree ? (
                                                        <Button
                                                            onClick={() => handleClaimRequest(theme, 'classic')}
                                                            className="w-full bg-gradient-to-r from-violet-500 to-indigo-500 text-white"
                                                        >
                                                            Claim Free (Premium)
                                                        </Button>
                                                    ) : (
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
                                                    )}
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

                                    // Premium Claim Logic
                                    const canClaimFree = settings.hasPremiumPack &&
                                        !settings.premiumPackClaims?.marvel &&
                                        !isPurchased;

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
                                                    {canClaimFree ? (
                                                        <Button
                                                            onClick={() => handleClaimRequest(theme, 'marvel')}
                                                            className="w-full bg-gradient-to-r from-violet-500 to-indigo-500 text-white"
                                                        >
                                                            Claim Free (Premium)
                                                        </Button>
                                                    ) : (
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
                                                    )}
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

                                    // Premium Claim Logic
                                    const canClaimFree = settings.hasPremiumPack &&
                                        !settings.premiumPackClaims?.anime &&
                                        !isPurchased;

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
                                                    {canClaimFree ? (
                                                        <Button
                                                            onClick={() => handleClaimRequest(theme, 'anime')}
                                                            className="w-full bg-gradient-to-r from-violet-500 to-indigo-500 text-white"
                                                        >
                                                            Claim Free (Premium)
                                                        </Button>
                                                    ) : (
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
                                                    )}
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
                            <CustomCardBuilder />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function CustomCardBuilder() {
    const { settings, updateSettings } = useSettings();
    const { showSuccessAnimation } = useGamification();
    const { user } = useAuth();

    // Real Data Hooks
    const { getCurrentBudget, getBudgetByMonth, state: budgetState } = useBudget();
    const { getTotalByType } = useExpenses();

    // Calculate Real Balance (Copied from BudgetOverview)
    const currencySymbol = getCurrencySymbol(settings.currency);
    const currentMonth = dayjs().format("YYYY-MM");
    const currentBudget = getCurrentBudget();
    const totalExpense = getTotalByType("expense", currentMonth);

    // Calculate Rollover
    const previousMonth = dayjs().subtract(1, 'month').format("YYYY-MM");
    const previousBudget = getBudgetByMonth(previousMonth);
    let rolloverAmount = 0;
    if (previousBudget && previousBudget.surplusAction === 'rollover') {
        const previousExpenses = getTotalByType("expense", previousMonth);
        rolloverAmount = Math.max(0, previousBudget.total - previousExpenses);
    }

    const effectiveTotal = (currentBudget?.total || 0) + rolloverAmount;
    const remaining = effectiveTotal - totalExpense;
    const budgetUsed = effectiveTotal > 0 ? (totalExpense / effectiveTotal) * 100 : 0;

    const referralId = user?.user_metadata?.referral_id || "0000000000000000";
    const formattedReferralId = referralId.replace(/(.{4})/g, '$1 ').trim();
    const navigate = useNavigate();

    const [isUploading, setIsUploading] = useState(false);
    const [purchasing, setPurchasing] = useState(false);

    // Local state for builder
    const [customImage, setCustomImage] = useState<string | null>(settings.customCardImage || null);
    const [overlay, setOverlay] = useState(settings.customCardOverlay || {
        showBalance: true,
        showCardNumber: true,
        showExpiry: true,
        showChip: true,
        showCardHolder: true
    });

    const isPurchased = (settings.purchasedCardThemes || []).includes("custom");
    const isActive = settings.cardTheme === "custom";

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('card-themes')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('card-themes')
                .getPublicUrl(fileName);

            setCustomImage(publicUrl);

            // If already purchased, update settings immediately
            if (isPurchased) {
                updateSettings({ customCardImage: publicUrl });
            }

        } catch (error: any) {
            console.error("Upload failed:", error);
            toast.error("Failed to upload image. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handlePurchase = async () => {
        if (!user || !customImage) {
            toast.error("Please upload an image first");
            return;
        }

        setPurchasing(true);
        try {
            // Price for custom card
            const priceAmount = settings.currency === "INR" ? 249 : 3.00;
            const currency = settings.currency || "INR";

            const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
                body: {
                    amount: priceAmount * 100,
                    currency: currency
                }
            });

            if (orderError) throw orderError;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "BudGlio",
                description: "Custom Card Theme",
                image: "/logo.jpg",
                order_id: orderData.id,
                handler: async function (response: any) {
                    try {
                        const { error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
                            body: {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                cardThemeId: "custom",
                                userId: user.id
                            }
                        });

                        if (verifyError) throw verifyError;

                        // Success
                        const updatedPurchased = [...(settings.purchasedCardThemes || []), "custom"];
                        updateSettings({
                            purchasedCardThemes: updatedPurchased,
                            cardTheme: "custom",
                            customCardImage: customImage,
                            customCardOverlay: overlay
                        });

                        showSuccessAnimation({
                            type: 'purchase',
                            item: "Custom Card"
                        });

                        toast.success("Custom card unlocked!");

                    } catch (err) {
                        toast.error("Verification failed.");
                    } finally {
                        setPurchasing(false);
                    }
                },
                theme: { color: "#3399cc" }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error: any) {
            console.error("Purchase error:", error);
            toast.error(error.message);
            setPurchasing(false);
        }
    };

    const handleApply = () => {
        updateSettings({
            cardTheme: "custom",
            customCardImage: customImage!, // Bang is safe because button disabled if null
            customCardOverlay: overlay
        });
        toast.success("Custom card applied!");
    };

    return (
        <div className="grid xl:grid-cols-2 gap-8 items-start">
            {/* Preview Section */}
            <div className="space-y-4 flex flex-col items-center w-full">
                <div className="w-full max-w-[420px] aspect-[1.586/1] rounded-xl overflow-hidden shadow-xl transition-all duration-300 hover:scale-[1.02] relative group card-shine border border-zinc-200 dark:border-zinc-800">
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                        style={{
                            background: customImage
                                ? `url(${customImage}) center/cover no-repeat`
                                : 'linear-gradient(45deg, #1a1a1a, #4a4a4a)'
                        }}
                    >
                        {!customImage && (
                            <div className="absolute inset-0 flex items-center justify-center text-white/50">
                                <span className="text-sm">Preview</span>
                            </div>
                        )}
                        {/* Decorative Lines */}
                        <div className="absolute inset-0 opacity-10"
                            style={{
                                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff 10px, #ffffff 11px)'
                            }}
                        />

                        {/* Card Content Overlay */}
                        <div className="absolute inset-0 p-3 sm:p-5 pb-5 sm:pb-7 flex flex-col justify-between text-white drop-shadow-md">
                            {/* Header: Label/Chip vs Contactless */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-medium text-[10px] sm:text-sm tracking-wider opacity-80 mb-2">BudGlio Card</h3>
                                    <div className={`w-8 h-6 sm:w-12 sm:h-9 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-md border border-black/10 relative overflow-hidden shadow-sm ${overlay.showChip ? '' : 'invisible'}`}>
                                        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/20" />
                                        <div className="absolute top-0 left-1/2 h-full w-[1px] bg-black/20" />
                                        <div className="absolute top-1/2 left-1/2 w-2 h-2 sm:w-4 sm:h-4 border border-black/20 rounded-sm transform -translate-x-1/2 -translate-y-1/2" />
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 sm:gap-2">
                                    {/* Contactless Icon */}
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 sm:w-8 sm:h-8 opacity-80 text-white" strokeWidth={2}>
                                        <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10 10 10 0 0 1-10-10 10 10 0 0 1 10-10z" stroke="none" />
                                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1.5-3.5" />
                                        <path d="M15.5 14.5A2.5 2.5 0 0 1 13 12c0-1.38.5-2 1.5-3.5" />
                                        <path d="M5 12h14" stroke="none" />
                                        <path d="M8.4 8.4a6 6 0 0 1 7.2 0" />
                                        <path d="M5.6 5.6a10 10 0 0 1 12.8 0" />
                                    </svg>
                                </div>
                            </div>

                            {/* Middle: Balance & Number */}
                            <div className="space-y-1 sm:space-y-2 flex-1 flex flex-col justify-center">
                                <div className={`space-y-0.5 ${overlay.showBalance ? '' : 'invisible'}`}>
                                    <div className="text-[8px] sm:text-xs opacity-60 uppercase tracking-wider">Remaining Balance</div>
                                    <div className="text-xl sm:text-2xl font-mono font-bold tracking-widest drop-shadow-md truncate leading-none pb-1">
                                        {remaining < 0 ? "-" : ""}{currencySymbol}{Math.abs(remaining).toFixed(2)}
                                    </div>
                                </div>

                                <div className={`font-mono text-xs sm:text-lg tracking-[0.15em] sm:tracking-[0.2em] drop-shadow-md opacity-80 truncate ${overlay.showCardNumber ? '' : 'invisible'}`}>
                                    {formattedReferralId}
                                </div>
                            </div>

                            {/* Bottom: Holder, Expiry, Progress */}
                            <div className="space-y-1 sm:space-y-2">
                                <div className="flex justify-between items-end">
                                    <div className={`max-w-[60%] ${overlay.showCardHolder ? '' : 'invisible'}`}>
                                        <div className="text-[7px] sm:text-[10px] opacity-60 uppercase tracking-widest mb-0.5">Card Holder</div>
                                        <div className="font-medium tracking-wider uppercase truncate text-[9px] sm:text-sm">
                                            {settings.userName || user?.user_metadata?.name || "JOHN DOE"}
                                        </div>
                                    </div>
                                    <div className={`text-right ${overlay.showExpiry ? '' : 'invisible'}`}>
                                        <div className="text-[7px] sm:text-[10px] opacity-60 uppercase tracking-widest mb-0.5">Issued</div>
                                        <div className="font-medium tracking-wider text-[9px] sm:text-sm">
                                            {user?.created_at ? dayjs(user.created_at).format('MM/YY') : dayjs().format('MM/YY')}
                                        </div>
                                    </div>
                                </div>

                                {/* Mock Progress Bar */}
                                <div className="relative w-full h-1 sm:h-1.5 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm">
                                    <div
                                        className={`absolute top-0 left-0 h-full transition-all duration-500 ${remaining < 0 ? "bg-red-500" : "bg-emerald-400"}`}
                                        style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center w-full">
                    <div className="relative w-full">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            disabled={isUploading}
                        />
                        <Button variant="outline" disabled={isUploading} className="w-full">
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="w-4 h-4 mr-2" />
                                    {customImage ? "Change Image" : "Upload Image"}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Controls Section */}
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold mb-2">Unleash Your Creativity</h3>
                    <p className="text-sm text-muted-foreground">
                        Upload any image and customize what info appears on your card.
                        Make it truly yours.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 bg-muted/30 p-4 rounded-lg border">
                    <div className="pb-2 border-b mb-2">
                        <h4 className="text-sm font-medium">Card Overlay Options</h4>
                    </div>
                    {Object.entries(overlay).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between gap-2">
                            <label className="text-sm text-muted-foreground capitalize truncate">
                                {key.replace('show', '').replace(/([A-Z])/g, ' $1').trim()}
                            </label>
                            <Switch
                                checked={value}
                                onCheckedChange={(checked) => setOverlay(prev => ({ ...prev, [key]: checked }))}
                            />
                        </div>
                    ))}
                </div>

                <div className="pt-4">
                    <Button
                        className="w-full"
                        size="lg"
                        onClick={isPurchased ? handleApply : () => navigate('/premium')}
                        disabled={purchasing || isUploading || (isPurchased && !customImage)}
                    >
                        {purchasing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isPurchased ? (
                            isActive ? "Applied" : "Apply Custom Theme"
                        ) : (
                            "Unlock with Premium"
                        )}
                    </Button>
                    {!isPurchased && (
                        <p className="text-xs text-center text-muted-foreground mt-2">
                            Unlock Custom Builder + Pro Cards + Family Plan
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
