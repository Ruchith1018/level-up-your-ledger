import React, { createContext, useContext, useReducer, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { v4 as uuid } from "uuid";

export interface SavingsGoal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    color: string;
    icon: string;
    deadline?: string;
    createdAt: string;
    isCompleted: boolean;
}

interface SavingsState {
    goals: SavingsGoal[];
}

type SavingsAction =
    | { type: "ADD_GOAL"; payload: Omit<SavingsGoal, "id" | "createdAt" | "currentAmount" | "isCompleted"> }
    | { type: "UPDATE_GOAL"; payload: SavingsGoal }
    | { type: "DELETE_GOAL"; payload: { id: string } }
    | { type: "ALLOCATE_SAVINGS"; payload: { goalId: string; amount: number } }
    | { type: "TOGGLE_COMPLETION"; payload: { id: string } }
    | { type: "CONVERT_CURRENCY"; payload: { rate: number } };

interface SavingsContextType {
    state: SavingsState;
    addGoal: (goal: Omit<SavingsGoal, "id" | "createdAt" | "currentAmount" | "isCompleted">) => void;
    updateGoal: (goal: SavingsGoal) => void;
    deleteGoal: (id: string) => void;
    allocateSavings: (goalId: string, amount: number) => void;
    toggleGoalCompletion: (id: string) => void;
    convertGoals: (rate: number) => void;
}

const SavingsContext = createContext<SavingsContextType | null>(null);

function reducer(state: SavingsState, action: SavingsAction): SavingsState {
    switch (action.type) {
        case "ADD_GOAL":
            const newGoal: SavingsGoal = {
                id: uuid(),
                createdAt: new Date().toISOString(),
                currentAmount: 0,
                isCompleted: false,
                ...action.payload,
            };
            return { goals: [newGoal, ...state.goals] };
        case "UPDATE_GOAL":
            return {
                goals: state.goals.map((g) => {
                    if (g.id === action.payload.id) {
                        const newTarget = action.payload.targetAmount;
                        const current = g.currentAmount;

                        // Check if the new target amount makes the goal incomplete
                        // Only if target is strictly greater than current
                        const isNowIncomplete = newTarget > current;

                        // If target is reduced below current amount, cap current amount to target
                        // This effectively returns the excess to available savings
                        const newCurrent = newTarget < current ? newTarget : current;

                        return {
                            ...action.payload,
                            currentAmount: newCurrent,
                            isCompleted: isNowIncomplete ? false : action.payload.isCompleted
                        };
                    }
                    return g;
                }),
            };
        case "DELETE_GOAL":
            return {
                goals: state.goals.filter((g) => g.id !== action.payload.id),
            };
        case "ALLOCATE_SAVINGS":
            return {
                goals: state.goals.map((g) =>
                    g.id === action.payload.goalId
                        ? { ...g, currentAmount: g.currentAmount + action.payload.amount }
                        : g
                ),
            };
        case "TOGGLE_COMPLETION":
            return {
                goals: state.goals.map((g) =>
                    g.id === action.payload.id
                        ? { ...g, isCompleted: !g.isCompleted }
                        : g
                ),
            };
        case "CONVERT_CURRENCY":
            return {
                goals: state.goals.map((g) => ({
                    ...g,
                    targetAmount: g.targetAmount * action.payload.rate,
                    currentAmount: g.currentAmount * action.payload.rate,
                })),
            };
        default:
            return state;
    }
}

export function SavingsProvider({ children }: { children: React.ReactNode }) {
    const [persisted, setPersisted] = useLocalStorage<SavingsState>("gft_savings_goals_v1", {
        goals: [],
    });
    const [state, dispatch] = useReducer(reducer, persisted);

    useEffect(() => {
        setPersisted(state);
    }, [state, setPersisted]);

    const addGoal = (goal: Omit<SavingsGoal, "id" | "createdAt" | "currentAmount" | "isCompleted">) => {
        dispatch({ type: "ADD_GOAL", payload: goal });
    };

    const updateGoal = (goal: SavingsGoal) => {
        dispatch({ type: "UPDATE_GOAL", payload: goal });
    };

    const deleteGoal = (id: string) => {
        dispatch({ type: "DELETE_GOAL", payload: { id } });
    };

    const allocateSavings = (goalId: string, amount: number) => {
        dispatch({ type: "ALLOCATE_SAVINGS", payload: { goalId, amount } });
    };

    const toggleGoalCompletion = (id: string) => {
        dispatch({ type: "TOGGLE_COMPLETION", payload: { id } });
    };

    const convertGoals = (rate: number) => {
        dispatch({ type: "CONVERT_CURRENCY", payload: { rate } });
    };

    return (
        <SavingsContext.Provider
            value={{
                state,
                addGoal,
                updateGoal,
                deleteGoal,
                allocateSavings,
                toggleGoalCompletion,
                convertGoals,
            }}
        >
            {children}
        </SavingsContext.Provider>
    );
}

export function useSavings() {
    const context = useContext(SavingsContext);
    if (!context) {
        throw new Error("useSavings must be used within SavingsProvider");
    }
    return context;
}
