import { GamificationState } from "@/types";

export function xpThreshold(level: number, base = 100): number {
  return Math.floor(base * Math.pow(level, 1.4));
}

export function addXP(
  user: GamificationState,
  xpGain: number,
  reason: string
): GamificationState {
  const updatedUser = { ...user };
  updatedUser.xp += xpGain;

  // Add to history (initialize if undefined)
  updatedUser.history = [
    { date: new Date().toISOString(), xpEarned: xpGain, reason },
    ...(updatedUser.history || []).slice(0, 49), // Keep last 50 entries
  ];

  // Level up
  while (updatedUser.xp >= xpThreshold(updatedUser.level)) {
    updatedUser.xp -= xpThreshold(updatedUser.level);
    updatedUser.level += 1;
    updatedUser.coins += Math.floor(updatedUser.level * 10);
  }

  return updatedUser;
}

export function checkStreak(lastCheckIn: string): { streak: number; isNewDay: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastCheck = new Date(lastCheckIn);
  lastCheck.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - lastCheck.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return {
    streak: diffDays,
    isNewDay: diffDays > 0,
  };
}

export const XP_REWARDS = {
  ADD_EXPENSE: 5,
  ADD_INCOME: 8,
  UNDER_DAILY_BUDGET: 10,
  UNDER_MONTHLY_BUDGET: 100,
  DAILY_CHECKIN: 2,
  COMPLETE_CHALLENGE: 50,
  FIRST_TRANSACTION: 20,
  WEEK_STREAK: 30,
  MONTH_STREAK: 200,
};

export const BADGES = {
  FIRST_STEPS: { id: "first_steps", name: "First Steps", description: "Added your first transaction" },
  BUDGET_NINJA: { id: "budget_ninja", name: "Budget Ninja", description: "Stayed under budget for a month" },
  WEEK_WARRIOR: { id: "week_warrior", name: "Week Warrior", description: "7-day streak" },
  MONTH_MASTER: { id: "month_master", name: "Month Master", description: "30-day streak" },
  SAVER_PRO: { id: "saver_pro", name: "Saver Pro", description: "Saved 20% of income" },
  TRACKER_ELITE: { id: "tracker_elite", name: "Tracker Elite", description: "100 transactions logged" },
};
