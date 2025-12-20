export interface Expense {
  id: string;
  type: "expense" | "income";
  amount: number;
  currency: string;
  category: string;
  merchant?: string;
  paymentMethod: string;
  date: string;
  notes?: string;
  recurring?: {
    interval: "daily" | "weekly" | "monthly" | "yearly";
    nextDate: string;
  };
  createdAt: string;
  tags?: string[];
}

export interface Budget {
  id: string;
  period: "monthly";
  month: string;
  total: number;
  categoryLimits: Record<string, number>;
  rollover: boolean; // Deprecated in favor of surplusAction, kept for backward compatibility
  surplusAction?: 'rollover' | 'saved' | 'ignored';
  createdAt: string;
}

export interface GamificationState {
  level: number;
  xp: number;
  totalXP: number;
  coins: number;
  totalCoins: number;
  streak: number;
  lastCheckIn: string;
  badges: string[];
  claimedTasks: string[];
  history: Array<{ date: string; xpEarned: number; reason: string }>;
  redemptionHistory: Array<{
    id: string;
    date: string;
    amount: number;
    coins: number;
    upiId: string;
    status: 'pending' | 'completed' | 'failed';
  }>;
  createdAt: string;
}

export interface Subscription {
  id: string;
  title: string;
  amount: number;
  billingDate: string;
  interval: "monthly" | "yearly";
  paymentMethod: string;
  reminderDaysBefore: number;
  active: boolean;
  category: string;
  createdAt: string;
  lastPaidDate?: string;
  lastPaymentTransactionId?: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  price: number;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  preview: string;
}

export interface AppSettings {
  currency: string;
  locale: string;
  theme: string;
  categories: string[];
  paymentMethods: string[];
  cardTheme?: string | null;
  premiumTheme?: string | null;
  userName?: string;
  hasCompletedOnboarding?: boolean;
  hasCompletedTutorial?: boolean;
  hasSeenIntro?: boolean;
  purchasedThemes?: string[];
  purchasedCardThemes?: string[];
  hasAcceptedTerms?: boolean;
  profileImage?: string;
}
