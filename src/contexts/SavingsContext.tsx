import React, { createContext, useContext, useReducer, useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

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
    isLoading: boolean;
}

type SavingsAction =
    | { type: "SET_ITEMS"; payload: SavingsGoal[] }
    | { type: "ADD_GOAL"; payload: SavingsGoal }
    | { type: "UPDATE_GOAL"; payload: SavingsGoal }
    | { type: "DELETE_GOAL"; payload: { id: string } }
    | { type: "SET_LOADING"; payload: boolean };

interface SavingsContextType {
    state: SavingsState;
    addGoal: (goal: Omit<SavingsGoal, "id" | "createdAt" | "currentAmount" | "isCompleted">) => Promise<void>;
    updateGoal: (goal: SavingsGoal) => Promise<void>;
    deleteGoal: (id: string) => Promise<void>;
    allocateSavings: (goalId: string, amount: number) => Promise<void>;
    toggleGoalCompletion: (id: string) => Promise<void>;
    convertGoals: (rate: number) => Promise<void>;
}

const SavingsContext = createContext<SavingsContextType | null>(null);

function reducer(state: SavingsState, action: SavingsAction): SavingsState {
    switch (action.type) {
        case "SET_ITEMS":
            return { ...state, goals: action.payload, isLoading: false };
        case "ADD_GOAL":
            return { ...state, goals: [action.payload, ...state.goals] };
        case "UPDATE_GOAL":
            return {
                ...state,
                goals: state.goals.map((g) => {
                    if (g.id === action.payload.id) {
                        return action.payload;
                    }
                    return g;
                }),
            };
        case "DELETE_GOAL":
            return {
                ...state,
                goals: state.goals.filter((g) => g.id !== action.payload.id),
            };
        case "SET_LOADING":
            return { ...state, isLoading: action.payload };
        default:
            return state;
    }
}

export function SavingsProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [state, dispatch] = useReducer(reducer, {
        goals: [],
        isLoading: true,
    });

    useEffect(() => {
        if (!user) {
            dispatch({ type: "SET_ITEMS", payload: [] });
            return;
        }

        const fetchGoals = async () => {
            dispatch({ type: "SET_LOADING", payload: true });
            const { data, error } = await supabase
                .from("savings_goals")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching savings:", error);
                toast.error("Failed to load savings goals");
            } else {
                const mappedData: SavingsGoal[] = (data || []).map((g: any) => ({
                    id: g.id,
                    name: g.name,
                    targetAmount: Number(g.target_amount),
                    currentAmount: Number(g.current_amount),
                    color: g.color,
                    icon: g.icon,
                    deadline: g.deadline,
                    createdAt: g.created_at,
                    isCompleted: g.is_completed // Snake case in DB
                }));
                dispatch({ type: "SET_ITEMS", payload: mappedData });
            }
        };

        fetchGoals();
    }, [user]);

    const addGoal = async (goalData: Omit<SavingsGoal, "id" | "createdAt" | "currentAmount" | "isCompleted">) => {
        if (!user) return;

        const tempId = uuid();
        const newGoal: SavingsGoal = {
            id: tempId,
            createdAt: new Date().toISOString(),
            currentAmount: 0,
            isCompleted: false,
            ...goalData,
        };
        dispatch({ type: "ADD_GOAL", payload: newGoal });

        const { data, error } = await supabase
            .from("savings_goals")
            .insert({
                user_id: user.id,
                name: newGoal.name,
                target_amount: newGoal.targetAmount,
                current_amount: newGoal.currentAmount,
                color: newGoal.color,
                icon: newGoal.icon,
                deadline: newGoal.deadline,
                is_completed: newGoal.isCompleted
            })
            .select()
            .single();

        if (error) {
            console.error("Error adding goal:", error);
            toast.error("Failed to save goal");
            dispatch({ type: "DELETE_GOAL", payload: { id: tempId } });
        } else {
            const savedGoal: SavingsGoal = {
                id: data.id,
                name: data.name,
                targetAmount: Number(data.target_amount),
                currentAmount: Number(data.current_amount),
                color: data.color,
                icon: data.icon,
                deadline: data.deadline,
                createdAt: data.created_at,
                isCompleted: data.is_completed
            };
            dispatch({ type: "DELETE_GOAL", payload: { id: tempId } });
            dispatch({ type: "ADD_GOAL", payload: savedGoal });
        }
    };

    const updateGoal = async (goal: SavingsGoal) => {
        if (!user) return;

        // Calculate logic for incomplete/complete status based on target vs current
        // (Similar to old reducer logic)
        const isNowIncomplete = goal.targetAmount > goal.currentAmount;
        const newCurrent = goal.targetAmount < goal.currentAmount ? goal.targetAmount : goal.currentAmount;

        const updatedGoal = {
            ...goal,
            currentAmount: newCurrent,
            isCompleted: isNowIncomplete ? false : goal.isCompleted
        };

        dispatch({ type: "UPDATE_GOAL", payload: updatedGoal });

        const { error } = await supabase
            .from("savings_goals")
            .update({
                name: updatedGoal.name,
                target_amount: updatedGoal.targetAmount,
                current_amount: updatedGoal.currentAmount,
                color: updatedGoal.color,
                icon: updatedGoal.icon,
                deadline: updatedGoal.deadline,
                is_completed: updatedGoal.isCompleted
            })
            .eq("id", updatedGoal.id);

        if (error) {
            console.error("Error updating goal:", error);
            toast.error("Failed to update goal");
        }
    };

    const deleteGoal = async (id: string) => {
        if (!user) return;
        dispatch({ type: "DELETE_GOAL", payload: { id } });

        const { error } = await supabase.from("savings_goals").delete().eq("id", id);
        if (error) {
            console.error("Error deleting goal:", error);
            toast.error("Failed to delete goal");
        }
    };

    const allocateSavings = async (goalId: string, amount: number) => {
        if (!user) return;

        const goal = state.goals.find(g => g.id === goalId);
        if (!goal) return;

        const updatedGoal = { ...goal, currentAmount: goal.currentAmount + amount };
        dispatch({ type: "UPDATE_GOAL", payload: updatedGoal });

        const { error } = await supabase
            .from("savings_goals")
            .update({ current_amount: updatedGoal.currentAmount })
            .eq("id", goalId);

        if (error) {
            console.error("Error allocating savings:", error);
            toast.error("Failed to update savings allocation");
        }
    };

    const toggleGoalCompletion = async (id: string) => {
        if (!user) return;

        const goal = state.goals.find(g => g.id === id);
        if (!goal) return;

        const updatedGoal = { ...goal, isCompleted: !goal.isCompleted };
        dispatch({ type: "UPDATE_GOAL", payload: updatedGoal });

        const { error } = await supabase
            .from("savings_goals")
            .update({ is_completed: updatedGoal.isCompleted })
            .eq("id", id);

        if (error) {
            console.error("Error toggling completion:", error);
            toast.error("Failed to update completion status");
        }
    };

    const convertGoals = async (rate: number) => {
        if (!user) return;
        toast.loading("Converting savings goals...");

        const updates = state.goals.map(async (g) => {
            const newTarget = Number((g.targetAmount * rate).toFixed(2));
            const newCurrent = Number((g.currentAmount * rate).toFixed(2));

            return supabase
                .from("savings_goals")
                .update({
                    target_amount: newTarget,
                    current_amount: newCurrent
                })
                .eq("id", g.id);
        });

        await Promise.all(updates);

        // Refresh
        const { data } = await supabase.from("savings_goals").select("*").order("created_at", { ascending: false });
        if (data) {
            const mappedData: SavingsGoal[] = data.map((g: any) => ({
                id: g.id,
                name: g.name,
                targetAmount: Number(g.target_amount),
                currentAmount: Number(g.current_amount),
                color: g.color,
                icon: g.icon,
                deadline: g.deadline,
                createdAt: g.created_at,
                isCompleted: g.is_completed
            }));
            dispatch({ type: "SET_ITEMS", payload: mappedData });
        }
        toast.dismiss();
        toast.success("Savings goals converted");
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
