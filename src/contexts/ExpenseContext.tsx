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
        // Transform DB snake_case to CamelCase if needed, but our SQL schema uses names that match types mostly.
        // Wait, our types use camelCase (paymentMethod), DB uses snake_case (payment_method).
        // We need to map them.
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
          createdAt: dbItem.created_at
        }));
        dispatch({ type: "SET_ITEMS", payload: mappedData });
      }
    };

    fetchExpenses();
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
        createdAt: dbItem.created_at
      }));
      dispatch({ type: "SET_ITEMS", payload: mappedData });
    }
  };

  const addExpense = async (expenseData: Omit<Expense, "id" | "createdAt">) => {
    if (!user) return;

    // Optimistic Update
    const tempId = uuid();
    const finalId = "id" in expenseData ? (expenseData as any).id : tempId;

    const newExpense: Expense = {
      ...expenseData,
      id: finalId,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: "ADD", payload: newExpense });

    // DB Call
    const dbPayload = {
      user_id: user.id,
      type: newExpense.type,
      amount: newExpense.amount,
      currency: newExpense.currency,
      category: newExpense.category,
      merchant: newExpense.merchant,
      payment_method: newExpense.paymentMethod,
      date: newExpense.date,
      notes: newExpense.notes,
      recurring: newExpense.recurring,
      tags: newExpense.tags,
      id: newExpense.id, // Ensure we use the generated ID
    };

    const { data, error } = await supabase
      .from("expenses")
      .insert(dbPayload)
      .select()
      .single();

    if (error) {
      console.error("Error adding expense:", error);
      toast.error(`Failed to save expense: ${error.message}`);
      // Revert optimistic update
      dispatch({ type: "DELETE", payload: { id: finalId } });
    } else {
      // Update temp ID with real ID (if different, though we try to force it)
      const savedExpense = {
        id: data.id,
        type: data.type,
        amount: Number(data.amount),
        currency: data.currency,
        category: data.category,
        merchant: data.merchant,
        paymentMethod: data.payment_method,
        date: data.date,
        notes: data.notes,
        recurring: data.recurring,
        tags: data.tags,
        isLocked: data.is_locked,
        createdAt: data.created_at
      };
      dispatch({ type: "DELETE", payload: { id: finalId } }); // Remove optimistic
      dispatch({ type: "ADD", payload: savedExpense }); // Add real
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
        createdAt: dbItem.created_at
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
    const expenses = getExpensesByMonth(month).filter((e) => e.type === "expense");
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
      .filter((e) => e.type === type)
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
