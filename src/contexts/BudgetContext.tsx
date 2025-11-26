import React, { createContext, useContext, useReducer, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Budget } from "@/types";
import { v4 as uuid } from "uuid";
import dayjs from "dayjs";

interface BudgetState {
  budgets: Budget[];
}

type BudgetAction =
  | { type: "ADD"; payload: Omit<Budget, "id" | "createdAt"> }
  | { type: "UPDATE"; payload: Budget }
  | { type: "DELETE"; payload: { id: string } };

interface BudgetContextType {
  state: BudgetState;
  addBudget: (budget: Omit<Budget, "id" | "createdAt">) => void;
  updateBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;
  getCurrentBudget: () => Budget | undefined;
  getBudgetByMonth: (month: string) => Budget | undefined;
}

const BudgetContext = createContext<BudgetContextType | null>(null);

function reducer(state: BudgetState, action: BudgetAction): BudgetState {
  switch (action.type) {
    case "ADD":
      const newBudget: Budget = {
        id: uuid(),
        createdAt: new Date().toISOString(),
        ...action.payload,
      };
      return { budgets: [newBudget, ...state.budgets] };
    case "UPDATE":
      return {
        budgets: state.budgets.map((b) =>
          b.id === action.payload.id ? action.payload : b
        ),
      };
    case "DELETE":
      return {
        budgets: state.budgets.filter((b) => b.id !== action.payload.id),
      };
    default:
      return state;
  }
}

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [persisted, setPersisted] = useLocalStorage<BudgetState>("gft_budgets_v1", {
    budgets: [],
  });
  const [state, dispatch] = useReducer(reducer, persisted);

  useEffect(() => {
    setPersisted(state);
  }, [state, setPersisted]);

  const addBudget = (budget: Omit<Budget, "id" | "createdAt">) => {
    dispatch({ type: "ADD", payload: budget });
  };

  const updateBudget = (budget: Budget) => {
    dispatch({ type: "UPDATE", payload: budget });
  };

  const deleteBudget = (id: string) => {
    dispatch({ type: "DELETE", payload: { id } });
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
