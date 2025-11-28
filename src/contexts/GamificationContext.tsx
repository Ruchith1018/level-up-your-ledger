import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { GamificationState } from "@/types";
import { addXP, removeXP, checkStreak, XP_REWARDS, BADGES, checkTransactionCount, checkSavingsRate, checkIncomeSources, calculateDailyTaskStreak, calculateWeeklyTaskStreak, calculateMonthlyTaskStreak } from "@/utils/gamify";
import { toast } from "sonner";
import dayjs from "dayjs";
import { useExpenses } from "./ExpenseContext";
import { useBudget } from "./BudgetContext";

interface GamificationContextType {
  state: GamificationState;
  rewardXP: (amount: number, reason: string) => void;
  deductXP: (amount: number, reason: string) => void;
  earnCoins: (amount: number) => void;
  updateStreak: () => void;
  unlockBadge: (badgeId: string) => void;
  spendCoins: (amount: number) => boolean;
  claimTaskReward: (taskId: string, reward: number) => void;
  checkBadges: (transactions: any[], budgetState: any) => void;
  addRedemptionLog: (log: { amount: number; coins: number; upiId: string; status: 'pending' | 'completed' | 'failed' }) => void;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

const initialState: GamificationState = {
  level: 1,
  xp: 0,
  totalXP: 0,
  coins: 0,
  totalCoins: 0,
  streak: 0,
  lastCheckIn: new Date().toISOString(),
  badges: [],
  claimedTasks: [],
  history: [],
  redemptionHistory: [],
  createdAt: new Date().toISOString(),
};

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const [storedState, setStoredState] = useLocalStorage<GamificationState>(
    "gft_gamify_v1",
    initialState
  );

  // Ensure state has all required fields (migration for older data)
  const state = {
    ...initialState,
    ...storedState,
    // Migration: if totalCoins is undefined, set it to current coins (best effort)
    totalCoins: storedState.totalCoins ?? storedState.coins ?? 0
  };

  // Level Up Listener
  const prevLevelRef = useRef(state.level);
  useEffect(() => {
    if (state.level > prevLevelRef.current) {
      const levelDiff = state.level - prevLevelRef.current;
      toast.success(`🎉 Level Up! You're now level ${state.level}!`, {
        description: "Keep up the great work!",
      });
    }
    prevLevelRef.current = state.level;
  }, [state.level]);

  const [hasCheckedStreak, setHasCheckedStreak] = useState(false);

  // Check streak on mount
  useEffect(() => {
    if (!hasCheckedStreak) {
      updateStreak();
      // checkBadges requires transactions, can't call here easily without access to them
      // We'll rely on useTransaction to trigger checks on updates
      setHasCheckedStreak(true);
    }
  }, [hasCheckedStreak]);

  const rewardXP = (amount: number, reason: string) => {
    setStoredState(prev => {
      const updatedState = addXP(prev, amount, reason);
      return updatedState;
    });
    toast.success(`+${amount} XP`, { description: reason });
  };

  const deductXP = (amount: number, reason: string) => {
    setStoredState(prev => {
      const updatedState = removeXP(prev, amount, reason);
      return updatedState;
    });
    toast.info(`-${amount} XP`, { description: reason });
  };

  const earnCoins = (amount: number) => {
    setStoredState(prev => ({
      ...prev,
      coins: prev.coins + amount,
      totalCoins: (prev.totalCoins || 0) + amount,
    }));
    toast.success(`+${amount} Coin${amount !== 1 ? 's' : ''}`, {
      className: "text-yellow-500 border-yellow-500",
    });
  };

  const updateStreak = () => {
    setStoredState(prev => {
      const { streak: daysSinceLastCheck, isNewDay } = checkStreak(prev.lastCheckIn);

      if (isNewDay) {
        if (daysSinceLastCheck === 1) {
          // Consecutive day
          const newStreak = prev.streak + 1;
          return prev; // Placeholder, see below
        }
      }
      return prev;
    });
  };

  // Re-implementing updateStreak properly
  const updateStreakSafe = () => {
    const { streak: daysSinceLastCheck, isNewDay } = checkStreak(state.lastCheckIn);

    if (isNewDay) {
      if (daysSinceLastCheck === 1) {
        // Consecutive day
        const newStreak = (state.streak || 0) + 1;

        // We need to update state AND reward XP.
        // We can chain them manually.
        setStoredState(prev => {
          let newState = {
            ...initialState, // Ensure we have all fields
            ...prev,
            streak: newStreak,
            lastCheckIn: new Date().toISOString(),
          };
          // Reward XP inline
          newState = addXP(newState, XP_REWARDS.DAILY_CHECKIN, "Daily check-in");
          return newState;
        });

        // Check for streak badges (using local var newStreak)
        if (newStreak === 7) {
          unlockBadge(BADGES.WEEK_WARRIOR.id);
        } else if (newStreak === 30) {
          unlockBadge(BADGES.MONTH_MASTER.id);
        }
      } else if (daysSinceLastCheck > 1) {
        // Streak broken
        setStoredState(prev => ({
          ...initialState,
          ...prev,
          streak: 1,
          lastCheckIn: new Date().toISOString(),
        }));
        toast.info("Streak reset! Start a new one today.");
      }
    }
  };

  const { state: expenseState, getExpensesByMonth } = useExpenses();
  const { state: budgetState } = useBudget();

  const checkBadges = (transactions: any[], budgetState: any) => {
    // 1. First Steps
    if (checkTransactionCount(transactions, 1)) {
      unlockBadge(BADGES.FIRST_STEPS.id);
    }

    // 2. Transaction Count Milestones
    if (checkTransactionCount(transactions, 10)) unlockBadge(BADGES.LOG_10.id);
    if (checkTransactionCount(transactions, 50)) unlockBadge(BADGES.LOG_50.id);
    if (checkTransactionCount(transactions, 100)) unlockBadge(BADGES.TRACKER_ELITE.id);
    if (checkTransactionCount(transactions, 500)) unlockBadge(BADGES.LOG_500.id);
    if (checkTransactionCount(transactions, 1000)) unlockBadge(BADGES.FINANCE_GURU.id);

    // 3. Income Badges
    const incomeTransactions = transactions.filter((t: any) => t.type === 'income');
    if (incomeTransactions.length >= 10) {
      unlockBadge(BADGES.INCOME_LOGGER.id);
    }
    if (checkIncomeSources(transactions, 3)) {
      unlockBadge(BADGES.INCOME_STREAMER.id);
    }
    if (transactions.some((t: any) => t.type === 'income' && t.category.toLowerCase().includes('salary'))) {
      unlockBadge(BADGES.SALARY_MASTER.id);
    }
    if (transactions.some((t: any) => t.type === 'income' && (t.category.toLowerCase().includes('freelance') || t.category.toLowerCase().includes('side')))) {
      unlockBadge(BADGES.SIDE_HUSTLER.id);
    }

    // 4. Savings & Net Worth Badges
    const totalIncome = transactions
      .filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    // Saver Pro (20% savings rate)
    if (checkSavingsRate(totalIncome, totalExpenses, 0.2)) {
      unlockBadge(BADGES.SAVER_PRO.id);
    }

    // Positive Net Worth
    if (totalIncome > totalExpenses) {
      unlockBadge(BADGES.POSITIVE_NET_WORTH.id);
    }

    // 5. Daily Task Streak Badges
    const dailyStreak = calculateDailyTaskStreak(state.claimedTasks);

    if (dailyStreak >= 1) unlockBadge(BADGES.DAILY_STARTER.id);
    if (dailyStreak >= 2) unlockBadge(BADGES.DAILY_DUO.id);
    if (dailyStreak >= 3) unlockBadge(BADGES.DAILY_STREAK_3.id);
    if (dailyStreak >= 7) unlockBadge(BADGES.DAILY_STREAK_7.id);
    if (dailyStreak >= 14) unlockBadge(BADGES.DAILY_STREAK_14.id);
    if (dailyStreak >= 30) unlockBadge(BADGES.DAILY_STREAK_30.id);
    if (dailyStreak >= 50) unlockBadge(BADGES.DAILY_STREAK_50.id);
    if (dailyStreak >= 100) unlockBadge(BADGES.DAILY_STREAK_100.id);
    if (dailyStreak >= 150) unlockBadge(BADGES.DAILY_MACHINE.id);
    if (dailyStreak >= 365) unlockBadge(BADGES.DAILY_LEGEND.id);

    // 6. Weekly Task Streak Badges
    const weeklyStreak = calculateWeeklyTaskStreak(state.claimedTasks);

    if (weeklyStreak >= 1) unlockBadge(BADGES.WEEKLY_STARTER.id);
    if (weeklyStreak >= 2) unlockBadge(BADGES.WEEKLY_CONSISTENT.id);
    if (weeklyStreak >= 4) unlockBadge(BADGES.WEEKLY_STREAK_4.id);
    if (weeklyStreak >= 8) unlockBadge(BADGES.WEEKLY_STREAK_8.id);
    if (weeklyStreak >= 12) unlockBadge(BADGES.WEEKLY_DOMINATOR.id);
    if (weeklyStreak >= 26) unlockBadge(BADGES.WEEKLY_CHAMPION.id);
    if (weeklyStreak >= 52) unlockBadge(BADGES.WEEKLY_ACE.id);

    // 7. Monthly Task Streak Badges
    const monthlyStreak = calculateMonthlyTaskStreak(state.claimedTasks);

    if (monthlyStreak >= 1) unlockBadge(BADGES.MONTHLY_TASK_STREAK_1.id);
    if (monthlyStreak >= 2) unlockBadge(BADGES.MONTHLY_TASK_STREAK_2.id);
    if (monthlyStreak >= 3) unlockBadge(BADGES.MONTHLY_TASK_STREAK_3.id);
    if (monthlyStreak >= 6) unlockBadge(BADGES.MONTHLY_TASK_STREAK_6.id);
    if (monthlyStreak >= 12) unlockBadge(BADGES.MONTHLY_TASK_STREAK_12.id);
    if (monthlyStreak >= 18) unlockBadge(BADGES.MONTHLY_TASK_STREAK_18.id);
    if (monthlyStreak >= 24) unlockBadge(BADGES.MONTHLY_TASK_STREAK_24.id);
    if (monthlyStreak >= 36) unlockBadge(BADGES.MONTHLY_TASK_STREAK_36.id);
  };

  // ...

  const unlockBadge = (badgeId: string) => {
    setStoredState(prev => {
      const currentBadges = prev.badges || [];
      if (!currentBadges.includes(badgeId)) {
        // Toast logic moved inside to ensure it only fires on new unlock
        const badge = Object.values(BADGES).find((b) => b.id === badgeId);
        if (badge) {
          setTimeout(() => {
            toast.success(`🏆 Badge Unlocked: ${badge.name}!`, {
              description: badge.description,
            });
          }, 100);
        }
        return {
          ...prev,
          badges: [...currentBadges, badgeId],
        };
      }
      return prev;
    });
  };

  const spendCoins = (amount: number): boolean => {
    if ((state.coins || 0) >= amount) {
      setStoredState(prev => ({
        ...prev,
        coins: (prev.coins || 0) - amount,
      }));
      return true;
    }
    toast.error("Not enough coins!");
    return false;
  };

  const claimTaskReward = (taskId: string, reward: number) => {
    setStoredState(prev => {
      const currentClaimedTasks = prev.claimedTasks || [];
      if (currentClaimedTasks.includes(taskId)) return prev;

      let coinReward = 0;
      if (taskId.includes("daily_")) coinReward = 1;
      else if (taskId.includes("weekly_")) coinReward = 3;
      else if (taskId.includes("monthly_")) coinReward = 5;

      let newState = {
        ...initialState,
        ...prev,
        claimedTasks: [...currentClaimedTasks, taskId],
        coins: (prev.coins || 0) + coinReward,
        totalCoins: (prev.totalCoins || 0) + coinReward,
      };
      newState = addXP(newState, reward, "Task Completed");
      return newState;
    });

    if (!state.claimedTasks?.includes(taskId)) {
      let coinReward = 0;
      if (taskId.includes("daily_")) coinReward = 1;
      else if (taskId.includes("weekly_")) coinReward = 3;
      else if (taskId.includes("monthly_")) coinReward = 5;

      toast.success(`+${reward} XP & +${coinReward} Coins`, { description: "Task Completed" });
    }
  };

  const addRedemptionLog = (log: { amount: number; coins: number; upiId: string; status: 'pending' | 'completed' | 'failed' }) => {
    setStoredState(prev => ({
      ...prev,
      redemptionHistory: [
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          ...log
        },
        ...(prev.redemptionHistory || [])
      ]
    }));
  };

  return (
    <GamificationContext.Provider
      value={{
        state,
        rewardXP,
        deductXP,
        earnCoins,
        updateStreak: updateStreakSafe,
        unlockBadge,
        spendCoins,
        claimTaskReward,
        checkBadges,
        addRedemptionLog,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error("useGamification must be used within GamificationProvider");
  }
  return context;
}
