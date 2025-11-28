import React, { createContext, useContext } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { AppSettings } from "@/types";
import { THEMES } from "@/constants/themes";

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;
  addPaymentMethod: (method: string) => void;
  removePaymentMethod: (method: string) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

const defaultSettings: AppSettings = {
  currency: "USD",
  locale: "en-US",
  theme: "system",
  cardTheme: "default",
  categories: [
    "Food & Dining",
    "Transportation",
    "Shopping",
    "Entertainment",
    "Bills & Utilities",
    "Health",
    "Education",
    "Travel",
    "Groceries",
    "Other",
  ],
  paymentMethods: ["Cash", "Credit Card", "Debit Card", "UPI", "Wallet", "Bank Transfer"],
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useLocalStorage<AppSettings>(
    "gft_settings_v1",
    defaultSettings
  );

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (settings.theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(settings.theme);
    }

    // Apply Premium Theme Colors
    if (settings.premiumTheme && settings.premiumTheme !== "default") {
      const theme = THEMES.find(t => t.id === settings.premiumTheme);
      if (theme) {
        root.style.setProperty("--primary", theme.colors.primary);
        root.style.setProperty("--secondary", theme.colors.secondary);
        root.style.setProperty("--accent", theme.colors.accent);
      }
    } else {
      // Revert to default
      root.style.removeProperty("--primary");
      root.style.removeProperty("--secondary");
      root.style.removeProperty("--accent");
    }

  }, [settings.theme, settings.premiumTheme]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings({ ...settings, ...newSettings });
  };

  const addCategory = (category: string) => {
    if (!settings.categories.includes(category)) {
      setSettings({
        ...settings,
        categories: [...settings.categories, category],
      });
    }
  };

  const removeCategory = (category: string) => {
    setSettings({
      ...settings,
      categories: settings.categories.filter((c) => c !== category),
    });
  };

  const addPaymentMethod = (method: string) => {
    if (!settings.paymentMethods.includes(method)) {
      setSettings({
        ...settings,
        paymentMethods: [...settings.paymentMethods, method],
      });
    }
  };

  const removePaymentMethod = (method: string) => {
    setSettings({
      ...settings,
      paymentMethods: settings.paymentMethods.filter((m) => m !== method),
    });
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        addCategory,
        removeCategory,
        addPaymentMethod,
        removePaymentMethod,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
