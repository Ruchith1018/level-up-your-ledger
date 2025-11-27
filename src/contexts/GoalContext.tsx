import React, { createContext, useContext, useReducer } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Goal } from "@/types";
import { v4 as uuid } from "uuid";
import { toast } from "sonner";
import { useGamification } from "./GamificationContext";

interface GoalState {
  goals: Goal[];
}

type GoalAction =
  | { type: "ADD_GOAL"; payload: Omit<Goal, "id" | "createdAt" | "currentAmount"> }
  | { type: "UPDATE_GOAL"; payload: { id: string; updates: Partial<Goal> } }
  | { type: "DELETE_GOAL"; payload: string }
  | { type: "ADD_FUNDS"; payload: { id: string; amount: number } }
  | { type: "SET_GOALS"; payload: Goal[] };

interface GoalContextType {
  state: GoalState;
  addGoal: (goal: Omit<Goal, "id" | "createdAt" | "currentAmount">) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addFundsToGoal: (id: string, amount: number) => void;
}

const GoalContext = createContext<GoalContextType | null>(null);

function goalReducer(state: GoalState, action: GoalAction): GoalState {
  switch (action.type) {
    case "ADD_GOAL":
      return {
        goals: [
          ...state.goals,
          {
            ...action.payload,
            id: uuid(),
            currentAmount: 0,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    case "UPDATE_GOAL":
      return {
        goals: state.goals.map((goal) =>
          goal.id === action.payload.id ? { ...goal, ...action.payload.updates } : goal
        ),
      };
    case "DELETE_GOAL":
      return {
        goals: state.goals.filter((goal) => goal.id !== action.payload),
      };
    case "ADD_FUNDS":
      return {
        goals: state.goals.map((goal) =>
          goal.id === action.payload.id
            ? { ...goal, currentAmount: goal.currentAmount + action.payload.amount }
            : goal
        ),
      };
    case "SET_GOALS":
      return { goals: action.payload };
    default:
      return state;
  }
}

export function GoalProvider({ children }: { children: React.ReactNode }) {
  const [persisted, setPersisted] = useLocalStorage<GoalState>("gft_goals_v1", { goals: [] });
  const [state, dispatch] = useReducer(goalReducer, persisted);
  const { rewardXP } = useGamification();

  React.useEffect(() => {
    setPersisted(state);
  }, [state, setPersisted]);

  const addGoal = (goal: Omit<Goal, "id" | "createdAt" | "currentAmount">) => {
    dispatch({ type: "ADD_GOAL", payload: goal });
    rewardXP(15, "Created a new savings goal!");
    toast.success("Goal created successfully!");
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    dispatch({ type: "UPDATE_GOAL", payload: { id, updates } });
  };

  const deleteGoal = (id: string) => {
    dispatch({ type: "DELETE_GOAL", payload: id });
    toast.success("Goal deleted");
  };

  const addFundsToGoal = (id: string, amount: number) => {
    const goal = state.goals.find((g) => g.id === id);
    if (!goal) return;

    const newAmount = goal.currentAmount + amount;
    const wasCompleted = goal.completedAt;
    const isNowComplete = newAmount >= goal.targetAmount && !wasCompleted;

    dispatch({ type: "ADD_FUNDS", payload: { id, amount } });

    if (isNowComplete) {
      dispatch({
        type: "UPDATE_GOAL",
        payload: { id, updates: { completedAt: new Date().toISOString() } },
      });
      rewardXP(200, `Completed goal: ${goal.title}! 🎉`);
      toast.success(`🎉 Goal Achieved: ${goal.title}!`, {
        description: `You've saved ${goal.targetAmount} for your ${goal.title}!`,
        duration: 5000,
      });
    } else {
      toast.success(`Added ${amount} to ${goal.title}`);
    }
  };

  return (
    <GoalContext.Provider value={{ state, addGoal, updateGoal, deleteGoal, addFundsToGoal }}>
      {children}
    </GoalContext.Provider>
  );
}

export function useGoals() {
  const context = useContext(GoalContext);
  if (!context) {
    throw new Error("useGoals must be used within GoalProvider");
  }
  return context;
}
