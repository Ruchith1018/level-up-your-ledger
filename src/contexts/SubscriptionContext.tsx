import React, { createContext, useContext, useReducer, useEffect, useState } from "react";
import { Subscription } from "@/types";
import { v4 as uuid } from "uuid";
import dayjs from "dayjs";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

interface SubscriptionState {
  subscriptions: Subscription[];
  isLoading: boolean;
}

type SubscriptionAction =
  | { type: "SET_ITEMS"; payload: Subscription[] }
  | { type: "ADD"; payload: Subscription }
  | { type: "UPDATE"; payload: Subscription }
  | { type: "DELETE"; payload: { id: string } }
  | { type: "SET_LOADING"; payload: boolean };

interface SubscriptionContextType {
  state: SubscriptionState;
  addSubscription: (subscription: Omit<Subscription, "id" | "createdAt">) => Promise<void>;
  updateSubscription: (subscription: Subscription) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
  getUpcomingSubscriptions: () => Subscription[];
  markAsPaid: (id: string, transactionId: string) => Promise<void>;
  revertPayment: (id: string) => Promise<void>;
  convertSubscriptions: (rate: number) => Promise<void>;
  refreshSubscriptions: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

function reducer(state: SubscriptionState, action: SubscriptionAction): SubscriptionState {
  switch (action.type) {
    case "SET_ITEMS":
      return { ...state, subscriptions: action.payload, isLoading: false };
    case "ADD":
      return { ...state, subscriptions: [action.payload, ...state.subscriptions] };
    case "UPDATE":
      return {
        ...state,
        subscriptions: state.subscriptions.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      };
    case "DELETE":
      return {
        ...state,
        subscriptions: state.subscriptions.filter((s) => s.id !== action.payload.id),
      };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, {
    subscriptions: [],
    isLoading: true,
  });

  useEffect(() => {
    if (!user) {
      dispatch({ type: "SET_ITEMS", payload: [] });
      return;
    }

    const fetchSubscriptions = async () => {
      dispatch({ type: "SET_LOADING", payload: true });
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching subscriptions:", error);
        toast.error("Failed to load subscriptions");
      } else {
        const mappedData: Subscription[] = (data || []).map((s: any) => ({
          id: s.id,
          title: s.title,
          amount: Number(s.amount),
          billingDate: s.billing_date,
          interval: s.interval,
          paymentMethod: s.payment_method,
          reminderDaysBefore: s.reminder_days_before,
          active: s.active,
          category: s.category,
          createdAt: s.created_at,
          lastPaidDate: s.last_paid_date,
          lastPaymentTransactionId: s.last_payment_transaction_id
        }));
        dispatch({ type: "SET_ITEMS", payload: mappedData });
      }
    };

    fetchSubscriptions();
    fetchSubscriptions();
  }, [user?.id]);

  const refreshSubscriptions = async () => {
    if (!user) return;
    dispatch({ type: "SET_LOADING", payload: true });
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching subscriptions:", error);
      toast.error("Failed to load subscriptions");
      dispatch({ type: "SET_LOADING", payload: false });
    } else {
      const mappedData: Subscription[] = (data || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        amount: Number(s.amount),
        billingDate: s.billing_date,
        interval: s.interval,
        paymentMethod: s.payment_method,
        reminderDaysBefore: s.reminder_days_before,
        active: s.active,
        category: s.category,
        createdAt: s.created_at,
        lastPaidDate: s.last_paid_date,
        lastPaymentTransactionId: s.last_payment_transaction_id
      }));
      dispatch({ type: "SET_ITEMS", payload: mappedData });
    }
  };

  const addSubscription = async (subscriptionData: Omit<Subscription, "id" | "createdAt">) => {
    if (!user) return;

    const tempId = uuid();
    const newSub: Subscription = {
      id: tempId,
      createdAt: new Date().toISOString(),
      ...subscriptionData,
    };
    dispatch({ type: "ADD", payload: newSub });

    const { data, error } = await supabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        title: newSub.title,
        amount: newSub.amount,
        billing_date: newSub.billingDate,
        interval: newSub.interval,
        payment_method: newSub.paymentMethod,
        reminder_days_before: newSub.reminderDaysBefore,
        active: newSub.active,
        category: newSub.category
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding subscription:", error);
      toast.error("Failed to save subscription");
      dispatch({ type: "DELETE", payload: { id: tempId } });
    } else {
      const savedSub: Subscription = {
        id: data.id,
        title: data.title,
        amount: Number(data.amount),
        billingDate: data.billing_date,
        interval: data.interval,
        paymentMethod: data.payment_method,
        reminderDaysBefore: data.reminder_days_before,
        active: data.active,
        category: data.category,
        createdAt: data.created_at,
        lastPaidDate: data.last_paid_date,
        lastPaymentTransactionId: data.last_payment_transaction_id
      };
      dispatch({ type: "DELETE", payload: { id: tempId } });
      dispatch({ type: "ADD", payload: savedSub });
    }
  };

  const updateSubscription = async (subscription: Subscription) => {
    if (!user) return;
    dispatch({ type: "UPDATE", payload: subscription });

    const { error } = await supabase
      .from("subscriptions")
      .update({
        title: subscription.title,
        amount: subscription.amount,
        billing_date: subscription.billingDate,
        interval: subscription.interval,
        payment_method: subscription.paymentMethod,
        reminder_days_before: subscription.reminderDaysBefore,
        active: subscription.active,
        category: subscription.category,
        last_paid_date: subscription.lastPaidDate,
        last_payment_transaction_id: subscription.lastPaymentTransactionId
      })
      .eq("id", subscription.id);

    if (error) {
      console.error("Error updating subscription:", error);
      toast.error("Failed to update subscription");
    }
  };

  const deleteSubscription = async (id: string) => {
    if (!user) return;
    dispatch({ type: "DELETE", payload: { id } });

    const { error } = await supabase.from("subscriptions").delete().eq("id", id);
    if (error) {
      console.error("Error deleting subscription:", error);
      toast.error("Failed to delete subscription");
    }
  };

  const toggleActive = async (id: string) => {
    if (!user) return;
    const sub = state.subscriptions.find(s => s.id === id);
    if (!sub) return;

    const updatedSub = { ...sub, active: !sub.active };
    dispatch({ type: "UPDATE", payload: updatedSub });

    const { error } = await supabase
      .from("subscriptions")
      .update({ active: updatedSub.active })
      .eq("id", id);

    if (error) {
      console.error("Error toggling active status:", error);
      toast.error("Failed to update status");
    }
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

  const markAsPaid = async (id: string, transactionId: string) => {
    if (!user) return;
    const sub = state.subscriptions.find(s => s.id === id);
    if (!sub) return;

    const nextDate = dayjs(sub.billingDate)
      .add(1, sub.interval === "monthly" ? "month" : "year")
      .format("YYYY-MM-DD");

    const updatedSub = {
      ...sub,
      lastPaidDate: new Date().toISOString(),
      lastPaymentTransactionId: transactionId,
      billingDate: nextDate,
    };
    dispatch({ type: "UPDATE", payload: updatedSub });

    const { error } = await supabase
      .from("subscriptions")
      .update({
        last_paid_date: updatedSub.lastPaidDate,
        last_payment_transaction_id: updatedSub.lastPaymentTransactionId,
        billing_date: updatedSub.billingDate
      })
      .eq("id", id);

    if (error) {
      console.error("Error marking as paid:", error);
      toast.error("Failed to mark as paid");
    }
  };

  const revertPayment = async (id: string) => {
    if (!user) return;
    const sub = state.subscriptions.find(s => s.id === id);
    if (!sub || !sub.lastPaymentTransactionId) return;

    const prevDate = dayjs(sub.billingDate)
      .subtract(1, sub.interval === "monthly" ? "month" : "year")
      .format("YYYY-MM-DD");

    const updatedSub: Subscription = {
      ...sub,
      lastPaidDate: undefined,
      lastPaymentTransactionId: undefined,
      billingDate: prevDate,
    };
    dispatch({ type: "UPDATE", payload: updatedSub });

    const { error } = await supabase
      .from("subscriptions")
      .update({
        last_paid_date: null,
        last_payment_transaction_id: null,
        billing_date: updatedSub.billingDate
      })
      .eq("id", id);

    if (error) {
      console.error("Error reverting payment:", error);
      toast.error("Failed to revert payment");
    }
  };

  const convertSubscriptions = async (rate: number) => {
    if (!user) return;
    toast.loading("Converting subscriptions...");

    const updates = state.subscriptions.map(async (s) => {
      const newAmount = Number((s.amount * rate).toFixed(2));
      return supabase
        .from("subscriptions")
        .update({ amount: newAmount })
        .eq("id", s.id);
    });

    await Promise.all(updates);

    // Refresh
    const { data } = await supabase.from("subscriptions").select("*").order("created_at", { ascending: false });
    if (data) {
      const mappedData: Subscription[] = data.map((s: any) => ({
        id: s.id,
        title: s.title,
        amount: Number(s.amount),
        billingDate: s.billing_date,
        interval: s.interval,
        paymentMethod: s.payment_method,
        reminderDaysBefore: s.reminder_days_before,
        active: s.active,
        category: s.category,
        createdAt: s.created_at,
        lastPaidDate: s.last_paid_date,
        lastPaymentTransactionId: s.last_payment_transaction_id
      }));
      dispatch({ type: "SET_ITEMS", payload: mappedData });
    }
    toast.dismiss();
    toast.success("Subscriptions converted");
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
        markAsPaid,
        revertPayment,
        convertSubscriptions,
        refreshSubscriptions,
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
