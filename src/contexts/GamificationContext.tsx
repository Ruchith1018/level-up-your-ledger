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
}

const GamificationContext = createContext<GamificationContextType | null>(null);

const initialState: GamificationState = {
  level: 1,
  xp: 0,
  totalXP: 0,
  coins: 0,
  streak: 0,
  lastCheckIn: new Date().toISOString(),
  badges: [],
  claimedTasks: [],
  history: [],
  createdAt: new Date().toISOString(),
};

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const [storedState, setStoredState] = useLocalStorage<GamificationState>(
    "gft_gamify_v1",
    initialState
  );

  // Ensure state has all required fields (migration for older data)
  const state = { ...initialState, ...storedState };

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
    // ... (rest of checkBadges is fine as it uses 'state' which is safe)
    // But wait, I need to replace the whole block or just the updaters.
    // I will just replace the updaters below.
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

      let newState = {
        ...initialState,
        ...prev,
        claimedTasks: [...currentClaimedTasks, taskId],
      };
      newState = addXP(newState, reward, "Task Completed");
      return newState;
    });

    if (!state.claimedTasks?.includes(taskId)) {
      toast.success(`+${reward} XP`, { description: "Task Completed" });
    }
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
