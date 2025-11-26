import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGamification } from "@/contexts/GamificationContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Coins, Check } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const THEMES = [
  {
    id: "default",
    name: "Default Theme",
    description: "The original look and feel",
    price: 0,
    colors: { primary: "hsl(221 83% 53%)", secondary: "hsl(142 76% 36%)", accent: "hsl(262 83% 58%)" },
  },
  {
    id: "ocean",
    name: "Ocean Breeze",
    description: "Calm blue tones inspired by the sea",
    price: 500,
    colors: { primary: "hsl(199 89% 48%)", secondary: "hsl(180 74% 47%)", accent: "hsl(173 80% 40%)" },
  },
  {
    id: "sunset",
    name: "Sunset Glow",
    description: "Warm oranges and purples",
    price: 500,
    colors: { primary: "hsl(24 88% 58%)", secondary: "hsl(330 81% 60%)", accent: "hsl(280 81% 66%)" },
  },
  {
    id: "forest",
    name: "Forest Green",
    description: "Natural earthy tones",
    price: 500,
    colors: { primary: "hsl(142 51% 45%)", secondary: "hsl(88 50% 53%)", accent: "hsl(54 89% 56%)" },
  },
  {
    id: "royal",
    name: "Royal Purple",
    description: "Luxurious purple and gold",
    price: 1000,
    colors: { primary: "hsl(271 81% 56%)", secondary: "hsl(280 87% 65%)", accent: "hsl(45 93% 47%)" },
  },
  {
    id: "cyber",
    name: "Cyberpunk",
    description: "Neon pink and cyan",
    price: 1000,
    colors: { primary: "hsl(330 81% 60%)", secondary: "hsl(180 100% 50%)", accent: "hsl(280 100% 70%)" },
  },
];

export function ThemeShop() {
  const { state: gamifyState, spendCoins } = useGamification();
  const { settings, updateSettings } = useSettings();
  const [purchasedThemes, setPurchasedThemes] = useState<string[]>(() => {
    const stored = localStorage.getItem("gft_purchased_themes");
    return stored ? JSON.parse(stored) : [];
  });

  const purchaseTheme = (theme: typeof THEMES[0]) => {
    if (theme.id === "default" || purchasedThemes.includes(theme.id)) {
      applyTheme(theme);
      return;
    }

    if (spendCoins(theme.price)) {
      const updated = [...purchasedThemes, theme.id];
      setPurchasedThemes(updated);
      localStorage.setItem("gft_purchased_themes", JSON.stringify(updated));
      applyTheme(theme);
      toast.success(`${theme.name} theme purchased and applied!`);
    }
  };

  const applyTheme = (theme: typeof THEMES[0]) => {
    if (theme.id === "default") {
      updateSettings({ premiumTheme: undefined });
      const root = document.documentElement;
      root.style.removeProperty("--primary");
      root.style.removeProperty("--secondary");
      root.style.removeProperty("--accent");
      toast.success("Default theme applied!");
      return;
    }

    updateSettings({ premiumTheme: theme.id });

    // Apply theme colors to CSS variables
    const root = document.documentElement;
    root.style.setProperty("--primary", theme.colors.primary);
    root.style.setProperty("--secondary", theme.colors.secondary);
    root.style.setProperty("--accent", theme.colors.accent);

    toast.success(`${theme.name} theme applied!`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-gold" />
          Theme Shop
        </CardTitle>
        <CardDescription>
          You have {gamifyState.coins} coins to spend
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                      background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary}, ${theme.colors.accent})`,
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
                          <Coins className="w-4 h-4 mr-2" />
                          {theme.price} coins
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
