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
  rollover: boolean;
  createdAt: string;
}

export interface GamificationState {
  level: number;
  xp: number;
  coins: number;
  streak: number;
  lastCheckIn: string;
  badges: string[];
  history: Array<{ date: string; xpEarned: number; reason: string }>;
  createdAt: string;
}

export interface AppSettings {
  currency: string;
  locale: string;
  theme: "light" | "dark" | "system";
  categories: string[];
  paymentMethods: string[];
}
