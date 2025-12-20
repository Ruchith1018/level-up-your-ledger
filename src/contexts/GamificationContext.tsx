import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { GamificationState } from "@/types";
import { addXP, removeXP, checkStreak, XP_REWARDS, BADGES, getBadgeProgress } from "@/utils/gamify";
import { getDailyTasks, getWeeklyTasks, getMonthlyTasks } from "@/utils/gamificationTasks";
import dayjs from "dayjs";
import { toast } from "sonner";
import { useExpenses } from "./ExpenseContext";
import { useBudget } from "./BudgetContext";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { useSettings } from "./SettingsContext";
import { CURRENCIES } from "@/constants/currencies";

interface GamificationContextType {
  state: GamificationState;
  rewardXP: (amount: number, reason: string) => Promise<void>;
  deductXP: (amount: number, reason: string) => Promise<void>;
  earnCoins: (amount: number) => Promise<void>;
  updateStreak: () => Promise<void>;
  unlockBadge: (badgeId: string) => Promise<void>;
  spendCoins: (amount: number) => Promise<boolean>;
  claimTaskReward: (taskId: string, reward: number) => Promise<void>;
  revertTransactionReward: (type: "expense" | "income") => Promise<void>;
  claimableBadges: string[];
  totalUnclaimedTasks: number;

  addRedemptionLog: (log: { amount: number; coins: number; upiId: string; status: 'pending' | 'completed' | 'failed' }) => Promise<void>;
  isLoading: boolean;
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
  const { user } = useAuth();
  const [state, setState] = useState<GamificationState>(initialState);
  const [isLoading, setIsLoading] = useState(true);

  // Level Up Listener
  const prevLevelRef = useRef(state.level);
  useEffect(() => {
    if (state.level > prevLevelRef.current) {
      toast.success(`🎉 Level Up! You're now level ${state.level}!`, {
        description: "Keep up the great work!",
      });
    }
    prevLevelRef.current = state.level;
  }, [state.level]);

  // Fetch or Create Profile
  useEffect(() => {
    if (!user) {
      setState(initialState);
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("gamification_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Not found, create one
        const newProfile = {
          user_id: user.id,
          level: 1,
          xp: 0,
          total_xp: 0,
          coins: 0,
          total_coins: 0,
          streak: 0,
          last_check_in: new Date().toISOString(),
          badges: [],
          claimed_tasks: [],
          history: [],
          redemption_history: [],
        };
        const { data: createdData } = await supabase
          .from("gamification_profiles")
          .insert(newProfile)
          .select()
          .single();

        if (createdData) {
          setState({
            level: createdData.level,
            xp: createdData.xp,
            totalXP: createdData.total_xp,
            coins: createdData.coins,
            totalCoins: createdData.total_coins,
            streak: createdData.streak,
            lastCheckIn: createdData.last_check_in,
            badges: createdData.badges || [],
            claimedTasks: createdData.claimed_tasks || [],
            history: createdData.history || [],
            redemptionHistory: createdData.redemption_history || [],
            createdAt: createdData.created_at
          });
        }
      } else if (data) {
        setState({
          level: data.level,
          xp: data.xp,
          totalXP: data.total_xp,
          coins: data.coins,
          totalCoins: data.total_coins,
          streak: data.streak,
          lastCheckIn: data.last_check_in,
          badges: data.badges || [],
          claimedTasks: data.claimed_tasks || [],
          history: data.history || [],
          redemptionHistory: data.redemption_history || [],
          createdAt: data.created_at
        });
      }
      setIsLoading(false);
    };
    fetchProfile();
  }, [user]);


  // State Ref to prevent stale closures in async functions
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Helper to persist state to DB
  const persistState = async (newState: GamificationState) => {
    stateRef.current = newState; // Update ref immediately
    setState(newState); // Optimistic update for UI

    if (!user) return;

    const payload = {
      level: newState.level,
      xp: newState.xp,
      total_xp: newState.totalXP,
      coins: newState.coins,
      total_coins: newState.totalCoins,
      streak: newState.streak,
      last_check_in: newState.lastCheckIn,
      badges: newState.badges,
      claimed_tasks: newState.claimedTasks,
      history: newState.history,
      redemption_history: newState.redemptionHistory
    };

    await supabase
      .from("gamification_profiles")
      .update(payload)
      .eq("user_id", user.id);
  };

  const [hasCheckedStreak, setHasCheckedStreak] = useState(false);

  // Check streak on mount (once data is loaded)
  useEffect(() => {
    if (!hasCheckedStreak && !isLoading && user) {
      updateStreak();
      setHasCheckedStreak(true);
    }
  }, [hasCheckedStreak, isLoading, user]);

  const rewardXP = async (amount: number, reason: string) => {
    const updatedState = addXP(stateRef.current, amount, reason);
    await persistState(updatedState);
    toast.success(`+${amount} XP`, { description: reason });
  };

  const deductXP = async (amount: number, reason: string) => {
    const updatedState = removeXP(stateRef.current, amount, reason);
    await persistState(updatedState);
    toast.info(`-${amount} XP`, { description: reason });
  };

  const earnCoins = async (amount: number) => {
    const currentState = stateRef.current;
    const updatedState = {
      ...currentState,
      coins: currentState.coins + amount,
      totalCoins: (currentState.totalCoins || 0) + amount,
    };
    await persistState(updatedState);

    toast.success(`+${amount} Token${amount !== 1 ? 's' : ''}`, {
      className: "text-yellow-500 border-yellow-500",
    });

    // Log history
    const historyItem = {
      date: new Date().toISOString(),
      reason: "Tokens Earned",
      coinsEarned: amount,
      xpEarned: 0
    };
    const finalState = {
      ...updatedState,
      history: [historyItem, ...updatedState.history]
    };
    await persistState(finalState);
  };

  const updateStreak = async () => {
    const currentState = stateRef.current;
    const { streak: daysSinceLastCheck, isNewDay } = checkStreak(currentState.lastCheckIn);

    if (isNewDay) {
      if (daysSinceLastCheck === 1) {
        // Consecutive day
        const newStreak = (currentState.streak || 0) + 1;

        let newState = {
          ...currentState,
          streak: newStreak,
          lastCheckIn: new Date().toISOString(),
        };
        // Reward XP inline
        newState = addXP(newState, XP_REWARDS.DAILY_CHECKIN, "Daily check-in");

        // Check for streak badges
        if (newStreak === 7) {
          if (!newState.badges.includes(BADGES.WEEK_WARRIOR.id)) {
            newState.badges.push(BADGES.WEEK_WARRIOR.id);
            toast.success(`🏆 Badge Unlocked: Week Warrior!`);
          }
        }

        await persistState(newState);

      } else if (daysSinceLastCheck > 1) {
        // Streak broken
        const newState = {
          ...currentState,
          streak: 1,
          lastCheckIn: new Date().toISOString(),
        };
        await persistState(newState);
        toast.info("Streak reset! Start a new one today.");
      }
    }
  };

  const { state: expenseState } = useExpenses();
  const { state: budgetState } = useBudget();
  const { settings } = useSettings();
  const [claimableBadges, setClaimableBadges] = useState<string[]>([]);




  // Calculate claimable badges reactively
  useEffect(() => {
    if (!state.badges || !expenseState.items) return;

    const newClaimable: string[] = [];
    const allBadges = Object.values(BADGES);

    allBadges.forEach(badge => {
      // Skip if already unlocked
      if (state.badges.includes(badge.id)) return;

      const progress = getBadgeProgress(
        badge.id,
        expenseState.items,
        state.claimedTasks,
        state.streak,
        budgetState
      );

      if (progress.current >= progress.target) {
        newClaimable.push(badge.id);
      }
    });

    // Only update if changed to avoid loops
    if (JSON.stringify(newClaimable) !== JSON.stringify(claimableBadges)) {
      setClaimableBadges(newClaimable);
    }
  }, [state.badges, state.claimedTasks, state.streak, expenseState.items, budgetState]);

  // Calculate total unclaimed tasks reactively
  const [totalUnclaimedTasks, setTotalUnclaimedTasks] = useState(0);

  useEffect(() => {
    if (expenseState.isLoading || !expenseState.items) return;

    const today = dayjs();
    const startOfWeek = dayjs().startOf('week');
    const startOfMonth = dayjs().startOf('month');

    const dailyTransactions = expenseState.items.filter(t => dayjs(t.date).isSame(today, 'day'));
    const weeklyTransactions = expenseState.items.filter(t => dayjs(t.date).isAfter(startOfWeek));
    const monthlyTransactions = expenseState.items.filter(t => dayjs(t.date).isAfter(startOfMonth));

    const dailyTasks = getDailyTasks(today, settings.currency).map(task => ({
      ...task,
      uniqueId: `${task.id}_${today.format('YYYY-MM-DD')}`,
    }));

    const weeklyTasks = getWeeklyTasks(today, settings.currency).map(task => ({
      ...task,
      uniqueId: `${task.id}_${today.format('YYYY-Www')}`,
    }));

    const monthlyTasks = getMonthlyTasks(today, settings.currency).map(task => ({
      ...task,
      uniqueId: `${task.id}_${today.format('YYYY-MM')}`,
    }));

    let count = 0;
    const tasksToCheck = [...dailyTasks, ...weeklyTasks, ...monthlyTasks];

    // Check Unclaimed Count AND Invalid Claims (Reversion)
    tasksToCheck.forEach(task => {
      // Calculate raw progress first
      let currentProgress = 0;
      if (task.id.startsWith("daily_")) {
        currentProgress = task.checkProgress(dailyTransactions);
      } else if (task.id.startsWith("weekly_")) {
        currentProgress = task.checkProgress(weeklyTransactions);
      } else if (task.id.startsWith("monthly_")) {
        currentProgress = task.checkProgress(monthlyTransactions);
      }

      const cappedProgress = Math.min(currentProgress, task.total);

      // Case 1: Task completed but NOT claimed -> Increment notification count
      if (cappedProgress >= task.total && !state.claimedTasks.includes(task.uniqueId)) {
        count++;
      }

      // Case 2: Task IS claimed but progress is no longer met -> REVERT
      if (state.claimedTasks.includes(task.uniqueId) && cappedProgress < task.total) {
        // Found an invalid claim!
        revertTaskReward(task.uniqueId, task.reward);
      }
    });

    setTotalUnclaimedTasks(count);

  }, [expenseState.items, state.claimedTasks]);

  const unlockBadge = async (badgeId: string) => {
    const currentState = stateRef.current;
    if (!currentState.badges.includes(badgeId)) {
      const badge = Object.values(BADGES).find((b) => b.id === badgeId);
      if (badge) {
        toast.success(`🏆 Badge Unlocked: ${badge.name}!`, {
          description: badge.description,
        });
      }
      const newState = {
        ...currentState,
        badges: [...currentState.badges, badgeId]
      };
      await persistState(newState);
    }
  };

  const spendCoins = async (amount: number): Promise<boolean> => {
    const currentState = stateRef.current;
    if ((currentState.coins || 0) >= amount) {
      const newState = {
        ...currentState,
        coins: (currentState.coins || 0) - amount,
        history: [{
          date: new Date().toISOString(),
          reason: "Tokens Spent",
          coinsSpent: amount,
          xpEarned: 0
        }, ...currentState.history]
      };
      await persistState(newState);
      return true;
    }
    toast.error("Not enough tokens!");
    return false;
  };

  const getCoinReward = (taskId: string) => {
    if (taskId.includes("daily_")) return 1;
    if (taskId.includes("weekly_")) return 3;
    if (taskId.includes("monthly_")) return 5;
    return 0;
  };

  const revertTaskReward = async (taskId: string, rewardXP: number) => {
    const currentState = stateRef.current;
    if (!currentState.claimedTasks.includes(taskId)) return;

    const coinReward = getCoinReward(taskId);

    // Manual deduction (skipping removeXP to avoid auto-history log)
    let newState = {
      ...currentState,
      xp: Math.max(0, currentState.xp - rewardXP),
      totalXP: Math.max(0, (currentState.totalXP || 0) - rewardXP),
      coins: Math.max(0, (currentState.coins || 0) - coinReward),
      totalCoins: Math.max(0, (currentState.totalCoins || 0) - coinReward),
      claimedTasks: currentState.claimedTasks.filter(id => id !== taskId)
    };

    // Remove the corresponding "Task Completed" history entry
    // We look for the most recent entry that matches the rewards and reason
    const historyIndex = newState.history.findIndex(h =>
      h.reason === "Task Completed" &&
      h.xpEarned === rewardXP &&
      (h.coinsEarned === coinReward || (coinReward === 0 && !h.coinsEarned))
    );

    if (historyIndex !== -1) {
      // Remove that specific entry
      const newHistory = [...newState.history];
      newHistory.splice(historyIndex, 1);
      newState.history = newHistory;
    }

    await persistState(newState);
    toast.warning(`Task Reverted`, { description: "Transaction requirement no longer met" });
  };

  const revertTransactionReward = async (type: "expense" | "income") => {
    const currentState = stateRef.current;

    // Constants for transaction rewards (mirrors addTransaction in useTransaction.ts)
    const xpAmount = 5;
    const coinAmount = 1;

    let newState = {
      ...currentState,
      xp: Math.max(0, currentState.xp - xpAmount),
      totalXP: Math.max(0, (currentState.totalXP || 0) - xpAmount),
      coins: Math.max(0, (currentState.coins || 0) - coinAmount),
      totalCoins: Math.max(0, (currentState.totalCoins || 0) - coinAmount),
    };

    // Remove history entries
    // 1. Remove "Added expense" or "Added income"
    const reason = type === "expense" ? "Added expense" : "Added income";
    const xpHistoryIndex = newState.history.findIndex(h => h.reason === reason && h.xpEarned === xpAmount);

    if (xpHistoryIndex !== -1) {
      const newHistory = [...newState.history];
      newHistory.splice(xpHistoryIndex, 1);
      newState.history = newHistory;
    }

    // 2. Remove "Tokens Earned" (1 coin)
    const coinHistoryIndex = newState.history.findIndex(h => h.reason === "Tokens Earned" && h.coinsEarned === coinAmount);

    if (coinHistoryIndex !== -1) {
      const newHistory = [...newState.history];
      newHistory.splice(coinHistoryIndex, 1);
      newState.history = newHistory;
    }

    await persistState(newState);
    // Silent toast or just info? User expects it to just "disappear" based on request.
    // But helpful to know it happened.
    toast.info(`${type === 'expense' ? 'Expense' : 'Income'} deleted`, { description: "Rewards reverted" });
  };

  const claimTaskReward = async (taskId: string, reward: number) => {
    const currentState = stateRef.current;
    if (currentState.claimedTasks.includes(taskId)) return;

    const coinReward = getCoinReward(taskId);

    let newState = {
      ...currentState,
      claimedTasks: [...currentState.claimedTasks, taskId],
      coins: (currentState.coins || 0) + coinReward,
      totalCoins: (currentState.totalCoins || 0) + coinReward,
    };
    newState = addXP(newState, reward, "Task Completed");

    // Enhance history logic for claiming to be consistent
    const latestHistory = newState.history[0];
    if (latestHistory && latestHistory.reason === "Task Completed") {
      const enhancedHistory = {
        ...latestHistory,
        coinsEarned: coinReward
      };
      newState = {
        ...newState,
        history: [enhancedHistory, ...newState.history.slice(1)]
      };
    }

    await persistState(newState);

    toast.success(`+${reward} XP & +${coinReward} Tokens`, { description: "Task Completed" });
  };

  const addRedemptionLog = async (log: { amount: number; coins: number; upiId: string; status: 'pending' | 'completed' | 'failed' }) => {
    const currentState = stateRef.current;
    const newLog = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      ...log
    };
    const newState = {
      ...currentState,
      redemptionHistory: [newLog, ...currentState.redemptionHistory]
    };
    await persistState(newState);
  };

  return (
    <GamificationContext.Provider
      value={{
        state,
        rewardXP,
        deductXP,
        earnCoins,
        updateStreak, // This doesn't need to be `updateStreakSafe` anymore as implementation is updated
        unlockBadge,
        spendCoins,
        claimTaskReward,
        revertTransactionReward,
        claimableBadges,
        totalUnclaimedTasks,
        addRedemptionLog,
        isLoading,
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
