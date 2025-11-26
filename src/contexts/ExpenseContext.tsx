import React, { createContext, useContext, useReducer, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Expense } from "@/types";
import { v4 as uuid } from "uuid";
import dayjs from "dayjs";

interface ExpenseState {
  items: Expense[];
}

type ExpenseAction =
  | { type: "ADD"; payload: Omit<Expense, "createdAt"> | Omit<Expense, "id" | "createdAt"> }
  | { type: "UPDATE"; payload: Expense }
  | { type: "DELETE"; payload: { id: string } }
  | { type: "LOAD"; payload: Expense[] };

interface ExpenseContextType {
  state: ExpenseState;
  addExpense: (expense: Omit<Expense, "createdAt"> | Omit<Expense, "id" | "createdAt">) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  getExpensesByMonth: (month: string) => Expense[];
  getExpensesByCategory: (month: string) => Record<string, number>;
  getTotalByType: (type: "expense" | "income", month: string) => number;
}

const ExpenseContext = createContext<ExpenseContextType | null>(null);

function reducer(state: ExpenseState, action: ExpenseAction): ExpenseState {
  switch (action.type) {
    case "ADD":
      const newExp: Expense = {
        id: action.payload.id || uuid(),
        createdAt: new Date().toISOString(),
        ...action.payload,
      };
      return { items: [newExp, ...state.items] };
    case "UPDATE":
      return {
        items: state.items.map((e) => (e.id === action.payload.id ? action.payload : e)),
      };
    case "DELETE":
      return { items: state.items.filter((e) => e.id !== action.payload.id) };
    case "LOAD":
      return { items: action.payload };
    default:
      return state;
  }
}

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const [persisted, setPersisted] = useLocalStorage<ExpenseState>("gft_expenses_v1", {
    items: [],
  });
  const [state, dispatch] = useReducer(reducer, persisted);

  useEffect(() => {
    setPersisted(state);
  }, [state, setPersisted]);

  const addExpense = (expense: Omit<Expense, "id" | "createdAt">) => {
    dispatch({ type: "ADD", payload: expense });
  };

  const updateExpense = (expense: Expense) => {
    dispatch({ type: "UPDATE", payload: expense });
  };

  const deleteExpense = (id: string) => {
    dispatch({ type: "DELETE", payload: { id } });
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
