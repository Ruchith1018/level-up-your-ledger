import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { GamificationState } from "@/types";
import { addXP, checkStreak, XP_REWARDS, BADGES } from "@/utils/gamify";
import { toast } from "sonner";

interface GamificationContextType {
  state: GamificationState;
  rewardXP: (amount: number, reason: string) => void;
  updateStreak: () => void;
  unlockBadge: (badgeId: string) => void;
  spendCoins: (amount: number) => boolean;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

const initialState: GamificationState = {
  level: 1,
  xp: 0,
  coins: 0,
  streak: 0,
  lastCheckIn: new Date().toISOString(),
  badges: [],
  history: [],
  createdAt: new Date().toISOString(),
};

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useLocalStorage<GamificationState>(
    "gft_gamify_v1",
    initialState
  );
  const [hasCheckedStreak, setHasCheckedStreak] = useState(false);

  // Check streak on mount
  useEffect(() => {
    if (!hasCheckedStreak) {
      updateStreak();
      setHasCheckedStreak(true);
    }
  }, [hasCheckedStreak]);

  const rewardXP = (amount: number, reason: string) => {
    const oldLevel = state.level;
    const updatedState = addXP(state, amount, reason);
    setState(updatedState);

    // Show toast for level up
    if (updatedState.level > oldLevel) {
      toast.success(`🎉 Level Up! You're now level ${updatedState.level}!`, {
        description: `You earned ${updatedState.coins - state.coins} coins!`,
      });
    } else {
      toast.success(`+${amount} XP`, { description: reason });
    }
  };

  const updateStreak = () => {
    const { streak: daysSinceLastCheck, isNewDay } = checkStreak(state.lastCheckIn);

    if (isNewDay) {
      if (daysSinceLastCheck === 1) {
        // Consecutive day
        const newStreak = state.streak + 1;
        setState({
          ...state,
          streak: newStreak,
          lastCheckIn: new Date().toISOString(),
        });

        // Reward daily check-in
        rewardXP(XP_REWARDS.DAILY_CHECKIN, "Daily check-in");

        // Check for streak badges
        if (newStreak === 7) {
          unlockBadge(BADGES.WEEK_WARRIOR.id);
        } else if (newStreak === 30) {
          unlockBadge(BADGES.MONTH_MASTER.id);
        }
      } else if (daysSinceLastCheck > 1) {
        // Streak broken
        setState({
          ...state,
          streak: 1,
          lastCheckIn: new Date().toISOString(),
        });
        toast.info("Streak reset! Start a new one today.");
      }
    }
  };

  const unlockBadge = (badgeId: string) => {
    if (!state.badges.includes(badgeId)) {
      setState({
        ...state,
        badges: [...state.badges, badgeId],
      });

      const badge = Object.values(BADGES).find((b) => b.id === badgeId);
      if (badge) {
        toast.success(`🏆 Badge Unlocked: ${badge.name}!`, {
          description: badge.description,
        });
      }
    }
  };

  const spendCoins = (amount: number): boolean => {
    if (state.coins >= amount) {
      setState({
        ...state,
        coins: state.coins - amount,
      });
      return true;
    }
    toast.error("Not enough coins!");
    return false;
  };

  return (
    <GamificationContext.Provider
      value={{
        state,
        rewardXP,
        updateStreak,
        unlockBadge,
        spendCoins,
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
