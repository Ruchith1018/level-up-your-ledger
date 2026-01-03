import React, { createContext, useContext, useReducer, useEffect, useState } from "react";
import { Expense } from "@/types";
import { v4 as uuid } from "uuid"; // Still used for optimistic updates / generic IDs
import dayjs from "dayjs";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

interface ExpenseState {
  items: Expense[];
  isLoading: boolean;
}

type ExpenseAction =
  | { type: "SET_ITEMS"; payload: Expense[] }
  | { type: "ADD"; payload: Expense }
  | { type: "UPDATE"; payload: Expense }
  | { type: "DELETE"; payload: { id: string } }
  | { type: "SET_LOADING"; payload: boolean };

interface ExpenseContextType {
  state: ExpenseState;
  addExpense: (expense: Omit<Expense, "createdAt"> | Omit<Expense, "id" | "createdAt">) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getExpensesByMonth: (month: string) => Expense[];
  getExpensesByCategory: (month: string) => Record<string, number>;
  getTotalByType: (type: "expense" | "income", month: string) => number;
  convertExpenses: (rate: number) => Promise<void>;
  refreshExpenses: () => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextType | null>(null);

function reducer(state: ExpenseState, action: ExpenseAction): ExpenseState {
  switch (action.type) {
    case "SET_ITEMS":
      return { ...state, items: action.payload, isLoading: false };
    case "ADD":
      return { ...state, items: [action.payload, ...state.items] };
    case "UPDATE":
      return {
        ...state,
        items: state.items.map((e) => (e.id === action.payload.id ? action.payload : e)),
      };
    case "DELETE":
      return { ...state, items: state.items.filter((e) => e.id !== action.payload.id) };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, {
    items: [],
    isLoading: true,
  });

  // Fetch expenses when user logs in
  useEffect(() => {
    if (!user) {
      dispatch({ type: "SET_ITEMS", payload: [] });
      return;
    }

    const fetchExpenses = async () => {
      dispatch({ type: "SET_LOADING", payload: true });
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching expenses:", error);
        toast.error("Failed to load expenses");
      } else {
        const mappedData: Expense[] = (data || []).map((dbItem: any) => ({
          id: dbItem.id,
          type: dbItem.type,
          amount: Number(dbItem.amount),
          currency: dbItem.currency,
          category: dbItem.category,
          merchant: dbItem.merchant,
          paymentMethod: dbItem.payment_method,
          date: dbItem.date,
          notes: dbItem.notes,
          recurring: dbItem.recurring,
          tags: dbItem.tags,
          isLocked: dbItem.is_locked,
          createdAt: dbItem.created_at,
          familyBudgetID: dbItem.family_budget_id
        }));
        dispatch({ type: "SET_ITEMS", payload: mappedData });
      }
    };

    fetchExpenses();

    // Setup realtime subscription for expenses
    const channel = supabase
      .channel('expenses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Realtime expense change:', payload);

          if (payload.eventType === 'INSERT') {
            const newExpense: Expense = {
              id: payload.new.id,
              type: payload.new.type,
              amount: Number(payload.new.amount),
              currency: payload.new.currency,
              category: payload.new.category,
              merchant: payload.new.merchant,
              paymentMethod: payload.new.payment_method,
              date: payload.new.date,
              notes: payload.new.notes,
              recurring: payload.new.recurring,
              tags: payload.new.tags,
              isLocked: payload.new.is_locked,
              createdAt: payload.new.created_at,
              familyBudgetID: payload.new.family_budget_id
            };
            dispatch({ type: "ADD", payload: newExpense });
          } else if (payload.eventType === 'UPDATE') {
            const updatedExpense: Expense = {
              id: payload.new.id,
              type: payload.new.type,
              amount: Number(payload.new.amount),
              currency: payload.new.currency,
              category: payload.new.category,
              merchant: payload.new.merchant,
              paymentMethod: payload.new.payment_method,
              date: payload.new.date,
              notes: payload.new.notes,
              recurring: payload.new.recurring,
              tags: payload.new.tags,
              isLocked: payload.new.is_locked,
              createdAt: payload.new.created_at,
              familyBudgetID: payload.new.family_budget_id
            };
            dispatch({ type: "UPDATE", payload: updatedExpense });
          } else if (payload.eventType === 'DELETE') {
            dispatch({ type: "DELETE", payload: { id: payload.old.id } });
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const refreshExpenses = async () => {
    if (!user) return;
    dispatch({ type: "SET_LOADING", payload: true });
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Failed to load expenses");
      dispatch({ type: "SET_LOADING", payload: false });
    } else {
      const mappedData: Expense[] = (data || []).map((dbItem: any) => ({
        id: dbItem.id,
        type: dbItem.type,
        amount: Number(dbItem.amount),
        currency: dbItem.currency,
        category: dbItem.category,
        merchant: dbItem.merchant,
        paymentMethod: dbItem.payment_method,
        date: dbItem.date,
        notes: dbItem.notes,
        recurring: dbItem.recurring,
        tags: dbItem.tags,
        isLocked: dbItem.is_locked,
        createdAt: dbItem.created_at,
        familyBudgetID: dbItem.family_budget_id
      }));
      dispatch({ type: "SET_ITEMS", payload: mappedData });
    }
  };

  const addExpense = async (expenseData: Omit<Expense, "id" | "createdAt">) => {
    if (!user) return;

    // NOTE: Realtime subscription in useEffect handles adding the expense to state.
    const dbPayload = {
      user_id: user.id,
      type: expenseData.type,
      amount: expenseData.amount,
      currency: expenseData.currency,
      category: expenseData.category,
      merchant: expenseData.merchant,
      payment_method: expenseData.paymentMethod,
      date: expenseData.date,
      notes: expenseData.notes,
      recurring: expenseData.recurring,
      tags: expenseData.tags,
      is_locked: expenseData.isLocked,
      family_budget_id: expenseData.familyBudgetID || null
    };

    const { data, error } = await supabase
      .from("expenses")
      .insert(dbPayload)
      .select()
      .single();

    if (error) {
      console.error("Error adding expense:", error);
      toast.error(`Failed to save expense: ${error.message}`);
      // No need to revert since we didn't add optimistically
    } else {
      toast.success(`${expenseData.type === 'income' ? 'Income' : 'Expense'} added successfully!`);
      // Realtime subscription will handle adding to state automatically
    }
  };

  const updateExpense = async (expense: Expense) => {
    if (!user) return;
    dispatch({ type: "UPDATE", payload: expense });

    const { error } = await supabase
      .from("expenses")
      .update({
        amount: expense.amount,
        category: expense.category,
        merchant: expense.merchant,
        payment_method: expense.paymentMethod,
        date: expense.date,
        notes: expense.notes,
        recurring: expense.recurring,
        tags: expense.tags,
      })
      .eq("id", expense.id);

    if (error) {
      console.error("Error updating expense:", error);
      toast.error("Failed to update expense");
    }
  };

  const deleteExpense = async (id: string) => {
    if (!user) return;
    dispatch({ type: "DELETE", payload: { id } });

    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  const convertExpenses = async (rate: number) => {
    if (!user) return;
    // This is a heavy operation.
    // For now, we update local state and try to update server.
    // In a real app, send a batch update RPC or simple loop.
    // We'll loop for safety. 
    toast.loading("Converting currency...");

    const updates = state.items.map(async (e) => {
      const newAmount = Number((e.amount * rate).toFixed(2));
      return supabase.from("expenses").update({ amount: newAmount }).eq("id", e.id);
    });

    await Promise.all(updates);

    // Refresh state
    const { data } = await supabase.from("expenses").select("*").order("date", { ascending: false });
    if (data) {
      const mappedData: Expense[] = data.map((dbItem: any) => ({
        id: dbItem.id,
        type: dbItem.type,
        amount: Number(dbItem.amount),
        currency: dbItem.currency,
        category: dbItem.category,
        merchant: dbItem.merchant,
        paymentMethod: dbItem.payment_method,
        date: dbItem.date,
        notes: dbItem.notes,
        recurring: dbItem.recurring,
        tags: dbItem.tags,
        isLocked: dbItem.is_locked,
        createdAt: dbItem.created_at,
        familyBudgetID: dbItem.family_budget_id
      }));
      dispatch({ type: "SET_ITEMS", payload: mappedData });
    }
    toast.dismiss();
    toast.success("Currency converted");
  };

  const getExpensesByMonth = (month: string): Expense[] => {
    return state.items.filter((e) => dayjs(e.date).format("YYYY-MM") === month);
  };

  const getExpensesByCategory = (month: string): Record<string, number> => {
    const expenses = getExpensesByMonth(month).filter((e) => e.type === "expense" && !e.familyBudgetID);
    return expenses.reduce(
      (acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      },
      {} as Record<string, number>
    );
  };

  const getTotalByType = (type: "expense" | "income", month: string): number => {
    return getExpensesByMonth(month)
      .filter((e) => e.type === type && !e.familyBudgetID)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  return (
    <ExpenseContext.Provider
      value={{
        state,
        addExpense,
        updateExpense,
        deleteExpense,
        getExpensesByMonth,
        getExpensesByCategory,
        getTotalByType,
        convertExpenses,
        refreshExpenses,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error("useExpenses must be used within ExpenseProvider");
  }
  return context;
}
