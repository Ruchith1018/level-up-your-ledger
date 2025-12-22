import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Calendar, Trophy, CheckCircle, Trash2, PartyPopper, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useGamification } from "@/contexts/GamificationContext";
import { useSubscriptions } from "@/contexts/SubscriptionContext";
import { useSettings } from "@/contexts/SettingsContext";
import { BADGES } from "@/utils/gamify";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import { getCurrencySymbol } from "@/constants/currencies";
import { Skeleton } from "@/components/ui/skeleton";

export default function Notifications() {
    const navigate = useNavigate();
    const { claimableBadges, unclaimedTaskItems, dismissedIds, dismissNotification, isLoading, redeemableItems } = useGamification();
    const { getUpcomingSubscriptions } = useSubscriptions();
    const { settings } = useSettings();

    // Derived Notifications State
    const upcomingSubs = getUpcomingSubscriptions();
    const currencySymbol = getCurrencySymbol(settings.currency);

    const dismissItem = (id: string) => {
        dismissNotification(id);
        toast.info("Notification dismissed");
    };

    const hasNotifications =
        (claimableBadges.length > 0) ||
        (unclaimedTaskItems.length > 0) ||
        (upcomingSubs.length > 0);

    const filteredBadges = claimableBadges.filter(id => !dismissedIds.includes(`badge-${id}`));
    const filteredTasks = unclaimedTaskItems.filter(task => !dismissedIds.includes(`task-${task.uniqueId}`));
    const filteredSubs = upcomingSubs.filter(sub => !dismissedIds.includes(`sub-${sub.id}`));
    const filteredRedeemables = redeemableItems?.filter(item => !dismissedIds.includes(`redeem-${item.value}`)) || [];

    const isEmpty = filteredBadges.length === 0 && filteredTasks.length === 0 && filteredSubs.length === 0 && filteredRedeemables.length === 0;

    return (
        <div className="min-h-screen bg-background">
            <header className="h-[88px] border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex items-center transition-all duration-200">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="flex md:hidden">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">

                                Notifications
                            </h1>
                            <p className="text-sm text-muted-foreground">Stay updated with your progress and payments</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6 pb-24">
                {isLoading ? (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-24 w-full rounded-xl" />
                            <Skeleton className="h-24 w-full rounded-xl" />
                        </div>
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-24 w-full rounded-xl" />
                        </div>
                    </div>
                ) : isEmpty ? (
                    <div className="text-center py-20 space-y-4">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                            <Bell className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold">All caught up!</h3>
                        <p className="text-muted-foreground">You have no new notifications.</p>
                        <Button variant="outline" onClick={() => navigate("/dashboard")}>
                            Return to Dashboard
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">

                        {/* Unclaimed Badges */}
                        <AnimatePresence mode="popLayout">
                            {filteredBadges.length > 0 && (
                                <motion.div layout className="space-y-3">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider pl-1">Achievements</h3>
                                    {filteredBadges.map(badgeId => {
                                        const badge = Object.values(BADGES).find(b => b.id === badgeId);
                                        if (!badge) return null;
                                        return (
                                            <motion.div
                                                layout
                                                key={badgeId}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                                className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-center justify-between gap-4"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center text-2xl">
                                                        {badge.icon}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold flex items-center gap-2">
                                                            Badge Unlocked: {badge.name}
                                                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase font-bold">New</span>
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-muted-foreground hover:text-destructive"
                                                        onClick={() => dismissItem(`badge-${badgeId}`)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0"
                                                        onClick={() => navigate("/gamification")}
                                                    >
                                                        View
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Unclaimed Tasks */}
                        <AnimatePresence mode="popLayout">
                            {filteredTasks.length > 0 && (
                                <motion.div layout className="space-y-3">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider pl-1">Rewards Ready</h3>
                                    {filteredTasks.map(task => (
                                        <motion.div
                                            layout
                                            key={task.uniqueId}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                            className="bg-card border border-l-4 border-l-green-500 p-4 rounded-xl shadow-sm flex items-center justify-between gap-4"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                                    <Trophy className="w-5 h-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold">Task Completed: {task.title}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        Claim your <span className="font-bold text-green-600">+{task.reward} XP</span> reward!
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-muted-foreground hover:text-destructive"
                                                    onClick={() => dismissItem(`task-${task.uniqueId}`)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => navigate("/gamification")}
                                                >
                                                    Go to Claim
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Redeemable Gift Cards */}
                        <AnimatePresence mode="popLayout">
                            {filteredRedeemables.length > 0 && (
                                <motion.div layout className="space-y-3">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider pl-1">Rewards Available</h3>
                                    {filteredRedeemables.map(item => (
                                        <motion.div
                                            layout
                                            key={`redeem-${item.value}`}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                            className="bg-card border border-l-4 border-l-purple-500 p-4 rounded-xl shadow-sm flex items-center justify-between gap-4"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                                                    <ShoppingBag className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold">Redeem Gift Card</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        You have enough tokens for a <span className="font-bold text-purple-600">Gift Card worth {currencySymbol}{item.value}</span>!
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-muted-foreground hover:text-destructive"
                                                    onClick={() => dismissItem(`redeem-${item.value}`)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-purple-500 hover:bg-purple-600 text-white border-0"
                                                    onClick={() => navigate("/shop")}
                                                >
                                                    Redeem
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Upcoming Subscriptions */}
                        <AnimatePresence mode="popLayout">
                            {filteredSubs.length > 0 && (
                                <motion.div layout className="space-y-3">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider pl-1">Reminders</h3>
                                    {filteredSubs.map(sub => {
                                        const daysLeft = dayjs(sub.billingDate).diff(dayjs(), 'day');
                                        return (
                                            <motion.div
                                                layout
                                                key={sub.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                                className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-center justify-between gap-4"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                                        <Calendar className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold">{sub.title} Payment Due</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {currencySymbol}{sub.amount} due in <span className="font-bold text-foreground">{daysLeft === 0 ? "Today" : `${daysLeft} days`}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-muted-foreground hover:text-destructive"
                                                        onClick={() => dismissItem(`sub-${sub.id}`)}
                                                    >
                                                        Dismiss
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => navigate("/subscriptions")}
                                                    >
                                                        Details
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
}

import React from "react";
