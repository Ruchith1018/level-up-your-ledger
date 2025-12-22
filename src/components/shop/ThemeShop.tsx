import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGamification } from "@/contexts/GamificationContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Coins, Check } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { THEMES } from "@/constants/themes";

import { Skeleton } from "@/components/ui/skeleton";

export function ThemeShop() {
  const { state: gamifyState, spendCoins, isLoading: isGamificationLoading, showSuccessAnimation } = useGamification();
  const { settings, updateSettings, isLoading: isSettingsLoading } = useSettings();

  const isLoading = isGamificationLoading || isSettingsLoading;

  // Use settings directly
  const purchasedThemes = settings.purchasedThemes || [];

  const purchaseTheme = async (theme: typeof THEMES[0]) => {
    if (theme.id === "default" || purchasedThemes.includes(theme.id)) {
      applyTheme(theme);
      return;
    }

    if (await spendCoins(theme.price)) {
      const updated = [...purchasedThemes, theme.id];
      // Apply and save purchase in one go
      await updateSettings({
        purchasedThemes: updated,
        premiumTheme: theme.id
      });

      showSuccessAnimation({
        type: 'redemption',
        item: `${theme.name} Theme`
      });

      toast.success(`${theme.name} theme purchased and applied!`);
    }
  };

  const applyTheme = (theme: typeof THEMES[0]) => {
    if (theme.id === "default") {
      updateSettings({ premiumTheme: null });
      toast.success("Default theme applied!");
      return;
    }

    updateSettings({ premiumTheme: theme.id });
    toast.success(`${theme.name} theme applied!`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <img src="/assets/token.png" alt="Token" className="w-5 h-5 object-contain" />
          Theme Shop
        </CardTitle>
        <CardDescription>
          You have {gamifyState.coins} tokens to spend
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {THEMES.map((theme, index) => {
              const isPurchased = theme.id === "default" || purchasedThemes.includes(theme.id);
              const isActive = (theme.id === "default" && !settings.premiumTheme) || settings.premiumTheme === theme.id;

              return (
                <motion.div
                  key={theme.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden">
                    <div
                      className="h-24 relative"
                      style={{
                        background: `linear-gradient(135deg, hsl(${theme.colors.primary}), hsl(${theme.colors.secondary}), hsl(${theme.colors.accent}))`,
                      }}
                    >
                      {isActive && (
                        <div className="absolute top-2 right-2 bg-card text-foreground px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Active
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1">{theme.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3">{theme.description}</p>
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
                            <img src="/assets/token.png" alt="Token" className="w-4 h-4 mr-2 object-contain" />
                            {theme.price} tokens
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
