import React, { createContext, useContext, useReducer, useEffect, useState } from "react";
import { Budget } from "@/types";
import { v4 as uuid } from "uuid";
import dayjs from "dayjs";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

interface BudgetState {
  budgets: Budget[];
  isLoading: boolean;
}

type BudgetAction =
  | { type: "SET_ITEMS"; payload: Budget[] }
  | { type: "ADD"; payload: Budget }
  | { type: "UPDATE"; payload: Budget }
  | { type: "DELETE"; payload: { id: string } }
  | { type: "SET_LOADING"; payload: boolean };

interface BudgetContextType {
  state: BudgetState;
  addBudget: (budget: Omit<Budget, "id" | "createdAt">) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  getCurrentBudget: () => Budget | undefined;
  getBudgetByMonth: (month: string) => Budget | undefined;
  convertBudgets: (rate: number) => Promise<void>;
  refreshBudgets: () => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType | null>(null);

function reducer(state: BudgetState, action: BudgetAction): BudgetState {
  switch (action.type) {
    case "SET_ITEMS":
      return { ...state, budgets: action.payload, isLoading: false };
    case "ADD":
      return { ...state, budgets: [action.payload, ...state.budgets] };
    case "UPDATE":
      return {
        ...state,
        budgets: state.budgets.map((b) =>
          b.id === action.payload.id ? action.payload : b
        ),
      };
    case "DELETE":
      return {
        ...state,
        budgets: state.budgets.filter((b) => b.id !== action.payload.id),
      };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, {
    budgets: [],
    isLoading: true,
  });

  useEffect(() => {
    if (!user) {
      dispatch({ type: "SET_ITEMS", payload: [] });
      return;
    }

    const fetchBudgets = async () => {
      dispatch({ type: "SET_LOADING", payload: true });
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching budgets:", error);
        toast.error("Failed to load budgets");
      } else {
        const mappedData: Budget[] = (data || []).map((b: any) => ({
          id: b.id,
          period: b.period,
          month: b.month,
          total: Number(b.total),
          categoryLimits: b.category_limits || {},
          surplusAction: b.surplus_action,
          rollover: b.surplus_action === 'rollover', // Back compat
          createdAt: b.created_at
        }));
        dispatch({ type: "SET_ITEMS", payload: mappedData });
      }
    };

    fetchBudgets();
  }, [user]);

  const refreshBudgets = async () => {
    if (!user) return;
    dispatch({ type: "SET_LOADING", payload: true });
    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching budgets:", error);
      toast.error("Failed to load budgets");
      dispatch({ type: "SET_LOADING", payload: false });
    } else {
      const mappedData: Budget[] = (data || []).map((b: any) => ({
        id: b.id,
        period: b.period,
        month: b.month,
        total: Number(b.total),
        categoryLimits: b.category_limits || {},
        surplusAction: b.surplus_action,
        rollover: b.surplus_action === 'rollover', // Back compat
        createdAt: b.created_at
      }));
      dispatch({ type: "SET_ITEMS", payload: mappedData });
    }
  };

  const addBudget = async (budgetData: Omit<Budget, "id" | "createdAt">) => {
    if (!user) return;

    const tempId = uuid();
    const newBudget: Budget = {
      id: tempId,
      createdAt: new Date().toISOString(),
      ...budgetData,
      rollover: budgetData.surplusAction === 'rollover'
    };
    dispatch({ type: "ADD", payload: newBudget });

    const { data, error } = await supabase
      .from("budgets")
      .insert({
        user_id: user.id,
        period: newBudget.period,
        month: newBudget.month,
        total: newBudget.total,
        category_limits: newBudget.categoryLimits,
        surplus_action: newBudget.surplusAction
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding budget:", error);
      toast.error("Failed to save budget");
      dispatch({ type: "DELETE", payload: { id: tempId } });
    } else {
      const savedBudget: Budget = {
        id: data.id,
        period: data.period,
        month: data.month,
        total: Number(data.total),
        categoryLimits: data.category_limits || {},
        surplusAction: data.surplus_action,
        rollover: data.surplus_action === 'rollover',
        createdAt: data.created_at
      };
      dispatch({ type: "DELETE", payload: { id: tempId } });
      dispatch({ type: "ADD", payload: savedBudget });
    }
  };

  const updateBudget = async (budget: Budget) => {
    if (!user) return;
    dispatch({ type: "UPDATE", payload: budget });

    const { error } = await supabase
      .from("budgets")
      .update({
        period: budget.period,
        month: budget.month,
        total: budget.total,
        category_limits: budget.categoryLimits,
        surplus_action: budget.surplusAction
      })
      .eq("id", budget.id);

    if (error) {
      console.error("Error updating budget:", error);
      toast.error("Failed to update budget");
    }
  };

  const deleteBudget = async (id: string) => {
    if (!user) return;
    dispatch({ type: "DELETE", payload: { id } });

    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) {
      console.error("Error deleting budget:", error);
      toast.error("Failed to delete budget");
    }
  };

  const convertBudgets = async (rate: number) => {
    if (!user) return;
    toast.loading("Converting budgets...");

    const updates = state.budgets.map(async (b) => {
      const newTotal = Number((b.total * rate).toFixed(2));
      const newLimits: Record<string, number> = {};
      Object.entries(b.categoryLimits || {}).forEach(([k, v]) => {
        newLimits[k] = Number((v * rate).toFixed(2));
      });

      return supabase
        .from("budgets")
        .update({
          total: newTotal,
          category_limits: newLimits
        })
        .eq("id", b.id);
    });

    await Promise.all(updates);

    // Refresh
    const { data } = await supabase.from("budgets").select("*").order("created_at", { ascending: false });
    if (data) {
      const mappedData: Budget[] = data.map((b: any) => ({
        id: b.id,
        period: b.period,
        month: b.month,
        total: Number(b.total),
        categoryLimits: b.category_limits || {},
        surplusAction: b.surplus_action,
        rollover: b.surplus_action === 'rollover',
        createdAt: b.created_at
      }));
      dispatch({ type: "SET_ITEMS", payload: mappedData });
    }
    toast.dismiss();
    toast.success("Budgets converted");
  };

  const getCurrentBudget = (): Budget | undefined => {
    const currentMonth = dayjs().format("YYYY-MM");
    return state.budgets.find((b) => b.month === currentMonth);
  };

  const getBudgetByMonth = (month: string): Budget | undefined => {
    return state.budgets.find((b) => b.month === month);
  };

  return (
    <BudgetContext.Provider
      value={{
        state,
        addBudget,
        updateBudget,
        deleteBudget,
        getCurrentBudget,
        getBudgetByMonth,
        convertBudgets,
        refreshBudgets,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error("useBudget must be used within BudgetProvider");
  }
  return context;
}
