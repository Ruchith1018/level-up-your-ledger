import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGamification } from "@/contexts/GamificationContext";
import { useSettings } from "@/contexts/SettingsContext";
import { CreditCard, Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CARD_THEMES } from "@/constants/cardThemes";

export function CardShop() {
    const { state: gamifyState, spendCoins } = useGamification();
    const { settings, updateSettings } = useSettings();
    const [purchasedThemes, setPurchasedThemes] = useState<string[]>(() => {
        const stored = localStorage.getItem("gft_purchased_card_themes");
        return stored ? JSON.parse(stored) : [];
    });

    const purchaseTheme = (theme: typeof CARD_THEMES[0]) => {
        if (theme.id === "default" || purchasedThemes.includes(theme.id)) {
            applyTheme(theme);
            return;
        }

        if (spendCoins(theme.price)) {
            const updated = [...purchasedThemes, theme.id];
            setPurchasedThemes(updated);
            localStorage.setItem("gft_purchased_card_themes", JSON.stringify(updated));
            applyTheme(theme);
            toast.success(`${theme.name} card theme purchased!`);
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
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {CARD_THEMES.map((theme, index) => {
                        const isPurchased = theme.id === "default" || purchasedThemes.includes(theme.id);
                        const isActive = (settings.cardTheme || "default") === theme.id;

                        return (
                            <motion.div
                                key={theme.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="overflow-hidden h-full flex flex-col">
                                    {/* Preview */}
                                    <div
                                        className="h-32 relative p-4 flex flex-col justify-between card-shine"
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
                                            onClick={() => purchaseTheme(theme)}
                                            disabled={!isPurchased && gamifyState.coins < theme.price}
                                            className="w-full"
                                            variant={isPurchased ? "outline" : "default"}
                                        >
                                            {isPurchased ? (
                                                isActive ? "Applied" : "Apply"
                                            ) : (
                                                <>
                                                    {theme.price === 0 ? (
                                                        "Free"
                                                    ) : (
                                                        <>
                                                            <Lock className="w-3 h-3 mr-2" />
                                                            {theme.price} coins
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
