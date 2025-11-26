import React, { createContext, useContext } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { AppSettings } from "@/types";

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
      return;
    }

    root.classList.add(settings.theme);
  }, [settings.theme]);

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
