import React, { createContext, useContext, useEffect, useState } from "react";
import { AppSettings } from "@/types";
import { THEMES } from "@/constants/themes";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  addCategory: (category: string) => Promise<void>;
  removeCategory: (category: string) => Promise<void>;
  addPaymentMethod: (method: string) => Promise<void>;
  removePaymentMethod: (method: string) => Promise<void>;
  resetTheme: () => void;
  isLoading: boolean;
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
  hasSeenIntro: false,
  purchasedThemes: [],
  purchasedCardThemes: [],
  hasAcceptedTerms: false,
  profileImage: undefined,
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch or Create Settings
  useEffect(() => {
    if (!user) {
      setSettings(defaultSettings);
      return;
    }

    const fetchSettings = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      console.log("Fetched Settings:", data, error);

      if (error && error.code === 'PGRST116') {
        // Not found, insert defaults
        // ... (rest of logic)
        const newSettings = {
          user_id: user.id,
          currency: defaultSettings.currency,
          locale: defaultSettings.locale,
          theme: defaultSettings.theme,
          card_theme: defaultSettings.cardTheme,
          categories: defaultSettings.categories,
          payment_methods: defaultSettings.paymentMethods,
          premium_theme: defaultSettings.premiumTheme,
          profile_image: defaultSettings.profileImage,
          user_name: defaultSettings.userName,
          hasCompletedOnboarding: defaultSettings.hasCompletedOnboarding,
          hasCompletedTutorial: defaultSettings.hasCompletedTutorial,
          has_seen_intro: true,
          purchased_themes: [],
          purchased_card_themes: []
        };

        const { data: createdData } = await supabase
          .from("user_settings")
          .insert(newSettings)
          .select()
          .single();

        if (createdData) {
          setSettings({
            currency: createdData.currency,
            locale: createdData.locale,
            theme: createdData.theme,
            cardTheme: createdData.card_theme,
            categories: createdData.categories,
            paymentMethods: createdData.payment_methods,
            premiumTheme: createdData.premium_theme,
            userName: createdData.user_name,
            profileImage: createdData.profile_image,
            hasCompletedOnboarding: createdData.has_completed_onboarding,
            hasCompletedTutorial: createdData.has_completed_tutorial,
            hasSeenIntro: createdData.has_seen_intro,
            hasAcceptedTerms: createdData.has_accepted_terms,
            purchasedThemes: createdData.purchased_themes || [],
            purchasedCardThemes: createdData.purchased_card_themes || []
          });
        }
      } else if (data) {
        setSettings({
          currency: data.currency,
          locale: data.locale,
          theme: data.theme,
          cardTheme: data.card_theme,
          categories: data.categories,
          paymentMethods: data.payment_methods,
          premiumTheme: data.premium_theme,
          userName: data.user_name,
          profileImage: data.profile_image,
          hasCompletedOnboarding: data.has_completed_onboarding,
          hasCompletedTutorial: data.has_completed_tutorial,
          hasSeenIntro: data.has_seen_intro,
          hasAcceptedTerms: data.has_accepted_terms,
          purchasedThemes: data.purchased_themes || [],
          purchasedCardThemes: data.purchased_card_themes || []
        });
      }
      setIsLoading(false);
    };

    fetchSettings();
    // fetchSettings(); // Removed duplicate call
  }, [user?.id]);

  // Realtime Updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('settings_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_settings',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Realtime settings update:', payload);
          const newData = payload.new;
          if (newData) {
            setSettings((prev) => ({
              ...prev,
              currency: newData.currency,
              locale: newData.locale,
              theme: newData.theme,
              cardTheme: newData.card_theme,
              categories: newData.categories,
              paymentMethods: newData.payment_methods,
              premiumTheme: newData.premium_theme,
              userName: newData.user_name,
              profileImage: newData.profile_image,
              hasCompletedOnboarding: newData.has_completed_onboarding,
              hasCompletedTutorial: newData.has_completed_tutorial,
              hasSeenIntro: newData.has_seen_intro,
              hasAcceptedTerms: newData.has_accepted_terms,
              purchasedThemes: newData.purchased_themes || [],
              purchasedCardThemes: newData.purchased_card_themes || []
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Apply Theme
  useEffect(() => {
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

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    if (!user) return;

    // Optimistic update
    setSettings((prev) => ({ ...prev, ...newSettings }));

    // Map to DB fields
    const payload: any = {};
    if (newSettings.currency !== undefined) payload.currency = newSettings.currency;
    if (newSettings.locale !== undefined) payload.locale = newSettings.locale;
    if (newSettings.theme !== undefined) payload.theme = newSettings.theme;
    if (newSettings.cardTheme !== undefined) payload.card_theme = newSettings.cardTheme;
    if (newSettings.categories !== undefined) payload.categories = newSettings.categories;
    if (newSettings.paymentMethods !== undefined) payload.payment_methods = newSettings.paymentMethods;
    if (newSettings.premiumTheme !== undefined) payload.premium_theme = newSettings.premiumTheme;
    if (newSettings.userName !== undefined) payload.user_name = newSettings.userName;
    if (newSettings.profileImage !== undefined) payload.profile_image = newSettings.profileImage;
    if (newSettings.hasCompletedOnboarding !== undefined) payload.has_completed_onboarding = newSettings.hasCompletedOnboarding;
    if (newSettings.hasCompletedTutorial !== undefined) payload.has_completed_tutorial = newSettings.hasCompletedTutorial;
    if (newSettings.hasSeenIntro !== undefined) payload.has_seen_intro = newSettings.hasSeenIntro;
    if (newSettings.hasAcceptedTerms !== undefined) payload.has_accepted_terms = newSettings.hasAcceptedTerms;
    if (newSettings.purchasedThemes !== undefined) payload.purchased_themes = newSettings.purchasedThemes;
    if (newSettings.purchasedCardThemes !== undefined) payload.purchased_card_themes = newSettings.purchasedCardThemes;

    const { error } = await supabase
      .from("user_settings")
      .update(payload)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating settings:", error);
      toast.error(`Fail: ${error.message} - ${error.details || ''}`);
    }
  };

  const addCategory = async (category: string) => {
    if (!settings.categories.includes(category)) {
      const newCategories = [...settings.categories, category];
      await updateSettings({ categories: newCategories });
    }
  };

  const removeCategory = async (category: string) => {
    const newCategories = settings.categories.filter((c) => c !== category);
    await updateSettings({ categories: newCategories });
  };

  const addPaymentMethod = async (method: string) => {
    if (!settings.paymentMethods.includes(method)) {
      const newMethods = [...settings.paymentMethods, method];
      await updateSettings({ paymentMethods: newMethods });
    }
  };

  const removePaymentMethod = async (method: string) => {
    const newMethods = settings.paymentMethods.filter((m) => m !== method);
    await updateSettings({ paymentMethods: newMethods });
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
        resetTheme: () => {
          const root = window.document.documentElement;
          root.classList.remove("light", "dark");
          root.style.removeProperty("--primary");
          root.style.removeProperty("--secondary");
          root.style.removeProperty("--accent");
          setSettings(defaultSettings);
        },
        isLoading
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
