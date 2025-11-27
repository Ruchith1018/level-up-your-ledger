import React, { createContext, useContext, useReducer, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Subscription } from "@/types";
import { v4 as uuid } from "uuid";
import dayjs from "dayjs";

interface SubscriptionState {
  subscriptions: Subscription[];
}

type SubscriptionAction =
  | { type: "ADD"; payload: Omit<Subscription, "id" | "createdAt"> }
  | { type: "UPDATE"; payload: Subscription }
  | { type: "DELETE"; payload: { id: string } }
  | { type: "TOGGLE_ACTIVE"; payload: { id: string } }
  | { type: "MARK_PAID"; payload: { id: string; transactionId: string } }
  | { type: "REVERT_PAYMENT"; payload: { id: string } }
  | { type: "CONVERT_CURRENCY"; payload: { rate: number } };

interface SubscriptionContextType {
  state: SubscriptionState;
  addSubscription: (subscription: Omit<Subscription, "id" | "createdAt">) => void;
  updateSubscription: (subscription: Subscription) => void;
  deleteSubscription: (id: string) => void;
  toggleActive: (id: string) => void;
  getUpcomingSubscriptions: () => Subscription[];
  markAsPaid: (id: string, transactionId: string) => void;
  revertPayment: (id: string) => void;
  convertSubscriptions: (rate: number) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

function reducer(state: SubscriptionState, action: SubscriptionAction): SubscriptionState {
  switch (action.type) {
    case "ADD":
      const newSub: Subscription = {
        id: uuid(),
        createdAt: new Date().toISOString(),
        ...action.payload,
      };
      return { subscriptions: [newSub, ...state.subscriptions] };
    case "UPDATE":
      return {
        subscriptions: state.subscriptions.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      };
    case "DELETE":
      return {
        subscriptions: state.subscriptions.filter((s) => s.id !== action.payload.id),
      };
    case "TOGGLE_ACTIVE":
      return {
        subscriptions: state.subscriptions.map((s) =>
          s.id === action.payload.id ? { ...s, active: !s.active } : s
        ),
      };
    case "MARK_PAID":
      return {
        subscriptions: state.subscriptions.map((s) => {
          if (s.id === action.payload.id) {
            const nextDate = dayjs(s.billingDate)
              .add(1, s.interval === "monthly" ? "month" : "year")
              .format("YYYY-MM-DD");
            return {
              ...s,
              lastPaidDate: new Date().toISOString(),
              lastPaymentTransactionId: action.payload.transactionId,
              billingDate: nextDate,
            };
          }
          return s;
        }),
      };
    case "REVERT_PAYMENT":
      return {
        subscriptions: state.subscriptions.map((s) => {
          if (s.id === action.payload.id) {
            const prevDate = dayjs(s.billingDate)
              .subtract(1, s.interval === "monthly" ? "month" : "year")
              .format("YYYY-MM-DD");
            return {
              ...s,
              lastPaidDate: undefined,
              lastPaymentTransactionId: undefined,
              billingDate: prevDate,
            };
          }
          return s;
        }),
      };
    case "CONVERT_CURRENCY":
      return {
        subscriptions: state.subscriptions.map((s) => ({
          ...s,
          amount: Number((s.amount * action.payload.rate).toFixed(2)),
        })),
      };
    default:
      return state;
  }
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [persisted, setPersisted] = useLocalStorage<SubscriptionState>(
    "gft_subscriptions_v1",
    { subscriptions: [] }
  );
  const [state, dispatch] = useReducer(reducer, persisted);

  useEffect(() => {
    setPersisted(state);
  }, [state, setPersisted]);

  const addSubscription = (subscription: Omit<Subscription, "id" | "createdAt">) => {
    dispatch({ type: "ADD", payload: subscription });
  };

  const updateSubscription = (subscription: Subscription) => {
    dispatch({ type: "UPDATE", payload: subscription });
  };

  const deleteSubscription = (id: string) => {
    dispatch({ type: "DELETE", payload: { id } });
  };

  const toggleActive = (id: string) => {
    dispatch({ type: "TOGGLE_ACTIVE", payload: { id } });
  };

  const getUpcomingSubscriptions = (): Subscription[] => {
    const today = dayjs();
    return state.subscriptions
      .filter((s) => s.active)
      .filter((s) => {
        const daysUntil = dayjs(s.billingDate).diff(today, "day");
        return daysUntil >= 0 && daysUntil <= s.reminderDaysBefore;
      })
      .sort((a, b) => dayjs(a.billingDate).diff(dayjs(b.billingDate)));
  };

  return (
    <SubscriptionContext.Provider
      value={{
        state,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        toggleActive,
        getUpcomingSubscriptions,
        markAsPaid: (id: string, transactionId: string) => dispatch({ type: "MARK_PAID", payload: { id, transactionId } }),
        revertPayment: (id: string) => dispatch({ type: "REVERT_PAYMENT", payload: { id } }),
        convertSubscriptions: (rate: number) => dispatch({ type: "CONVERT_CURRENCY", payload: { rate } }),
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptions() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscriptions must be used within SubscriptionProvider");
  }
  return context;
}
