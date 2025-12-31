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
  isLocked?: boolean;
  familyBudgetID?: string;
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
  history: Array<{ date: string; xpEarned?: number; coinsEarned?: number; coinsSpent?: number; reason: string }>;
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
  customCardImage?: string;
  customCardOverlay?: {
    showBalance: boolean;
    showCardNumber: boolean;
    showExpiry: boolean;
    showChip: boolean;
    showCardHolder: boolean;
  };
  hasPremiumPack?: boolean;
  premiumPackClaims?: {
    classic: boolean;
    marvel: boolean;
    anime: boolean;
  };
  appFont?: string;
}

export interface Family {
  id: string;
  name: string;
  share_code: string;
  created_at: string;
  created_by: string;
  currency: string;
  profile_image?: string;
  // Optional enriched field for invites
  invitedBy?: string;
}

export interface FamilyMember {
  family_id: string;
  user_id: string;
  role: 'admin' | 'leader' | 'member' | 'viewer';
  joined_at: string;
  allowance: number;
  visibility_level: 'full' | 'limited' | 'none';
  // Optional joined fields if fetching with profiles
  profile?: {
    name?: string;
    avatar_url?: string;
    email?: string;
  };
}

export interface FamilyRequest {
  id: string;
  family_id: string;
  user_id: string;
  request_type: 'invite' | 'join_request';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  // Optional joined fields
  family?: Family;
  profile?: {
    name?: string;
    email?: string;
    avatar_url?: string;
  };
}

export interface FamilyBudget {
  id: string;
  family_id: string;
  month: string;
  total_amount: number;
  created_by: string;
  created_at: string;
  // Optional enriched fields
  contributions?: FamilyBudgetContribution[];
  total_contributed?: number;
}

export interface FamilyBudgetContribution {
  id: string;
  family_budget_id: string;
  user_id: string;
  amount: number;
  transaction_id?: string;
  created_at: string;
  // Optional enriched fields
  profile?: {
    name?: string;
    avatar_url?: string;
  };
}
