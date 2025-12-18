import { useState } from "react";
import { useSubscriptions } from "@/contexts/SubscriptionContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getCurrencySymbol } from "@/constants/currencies";
import { SubscriptionCard } from "@/components/subscriptions/SubscriptionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";

import dayjs from "dayjs";

import { Skeleton } from "@/components/ui/skeleton";

export default function Subscriptions() {
  const navigate = useNavigate();
  const { state, addSubscription, updateSubscription, deleteSubscription, toggleActive, getUpcomingSubscriptions } =
    useSubscriptions();
  const { settings } = useSettings();
  const currencySymbol = getCurrencySymbol(settings.currency);
  const isLoading = state.isLoading;
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    billingDate: "",
    interval: "monthly" as "monthly" | "yearly",
    paymentMethod: "",
    category: "",
    reminderDaysBefore: 3,
  });

  const upcomingSubs = getUpcomingSubscriptions();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.amount || !formData.billingDate || !formData.paymentMethod) {
      toast.error("Please fill in all required fields");
      return;
    }

    const subscriptionData = {
      title: formData.title,
      amount: parseFloat(formData.amount),
      billingDate: formData.billingDate,
      interval: formData.interval,
      paymentMethod: formData.paymentMethod,
      category: formData.category || "Subscription",
      reminderDaysBefore: formData.reminderDaysBefore,
      active: true,
    };

    if (editingId) {
      const existingSub = state.subscriptions.find(s => s.id === editingId);
      if (existingSub) {
        updateSubscription({
          ...existingSub,
          ...subscriptionData,
        });
        toast.success("Subscription updated successfully!");
      }
    } else {
      if (dayjs(formData.billingDate).isBefore(dayjs(), 'day')) {
        toast.error("Billing date cannot be in the past for new subscriptions");
        return;
      }
      addSubscription(subscriptionData);
      toast.success("Subscription added successfully!");
    }

    setFormData({
      title: "",
      amount: "",
      billingDate: "",
      interval: "monthly",
      paymentMethod: "",
      category: "",
      reminderDaysBefore: 3,
    });
    setEditingId(null);
    setOpen(false);
  };

  const handleEdit = (subscription: any) => {
    setEditingId(subscription.id);
    setFormData({
      title: subscription.title,
      amount: subscription.amount.toString(),
      billingDate: subscription.billingDate,
      interval: subscription.interval,
      paymentMethod: subscription.paymentMethod,
      category: subscription.category,
      reminderDaysBefore: subscription.reminderDaysBefore,
    });
    setOpen(true);
  };

  return (
    <div className="bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="hidden md:flex">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Subscriptions</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your recurring payments
                </p>
              </div>
            </div>
            <div className="hidden md:block">
              <Button id="add-subscription-btn-desktop" onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Subscription
              </Button>
            </div>
            <Dialog open={open} onOpenChange={(val) => {
              setOpen(val);
              if (!val) {
                setEditingId(null);
                setFormData({
                  title: "",
                  amount: "",
                  billingDate: "",
                  interval: "monthly",
                  paymentMethod: "",
                  category: "",
                  reminderDaysBefore: 3,
                });
              }
            }}>
              <DialogContent className="max-h-[85vh] overflow-y-auto w-[90%] max-w-lg rounded-lg">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Edit Subscription" : "Add Subscription"}</DialogTitle>
                  <DialogDescription>{editingId ? "Update subscription details" : "Track a new recurring payment"}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Service Name *</Label>
                    <Input
                      id="title"
                      placeholder="Netflix, Spotify, etc."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {currencySymbol}
                        </span>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          required
                          className="pl-7"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interval">Billing Cycle</Label>
                      <Select
                        value={formData.interval}
                        onValueChange={(value: "monthly" | "yearly") =>
                          setFormData({ ...formData, interval: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingDate">Next Billing Date *</Label>
                    <Input
                      id="billingDate"
                      type="date"
                      min={!editingId ? new Date().toISOString().split('T')[0] : undefined}
                      value={formData.billingDate}
                      onChange={(e) => setFormData({ ...formData, billingDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method *</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) =>
                        setFormData({ ...formData, paymentMethod: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {settings.paymentMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {settings.categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
                      {editingId ? "Update Subscription" : "Add Subscription"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 pb-24">
        {isLoading ? (
          <div className="space-y-6">
            {/* Upcoming Skeleton */}
            <Skeleton className="w-full h-24 rounded-lg" />

            {/* Grid Skeleton */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-[200px] rounded-xl" />
              <Skeleton className="h-[200px] rounded-xl" />
              <Skeleton className="h-[200px] rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            {upcomingSubs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-warning/10 border border-warning/20 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-warning" />
                  <h2 className="font-semibold text-warning">Upcoming Payments</h2>
                </div>
                <div className="space-y-2">
                  {upcomingSubs.map((sub) => (
                    <div key={sub.id} className="text-sm">
                      <span className="font-medium">{sub.title}</span> - {currencySymbol}{sub.amount.toFixed(2)}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {state.subscriptions.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No subscriptions yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start tracking your recurring payments
                </p>
                <Button onClick={() => setOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Subscription
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {state.subscriptions.map((subscription) => (
                  <SubscriptionCard
                    key={subscription.id}
                    subscription={subscription}
                    onToggle={() => toggleActive(subscription.id)}
                    onDelete={() => {
                      deleteSubscription(subscription.id);
                      toast.success("Subscription deleted");
                    }}
                    onEdit={() => handleEdit(subscription)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Button
        id="add-subscription-btn-mobile"
        onClick={() => setOpen(true)}
        size="lg"
        className="md:hidden fixed bottom-28 right-6 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow z-40 p-0"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
