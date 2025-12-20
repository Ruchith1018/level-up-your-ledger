import { useGamification } from "@/contexts/GamificationContext";
import { useExpenses } from "@/contexts/ExpenseContext";
import { BADGES, xpThreshold } from "@/utils/gamify";
import { motion } from "framer-motion";
import { Trophy, Calendar, History, ShoppingBag, ArrowLeft, CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dayjs from "dayjs";

import { getDailyTasks, getWeeklyTasks, getMonthlyTasks } from "@/utils/gamificationTasks";
import { useMemo, useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { GamificationTutorialOverlay } from "@/components/tutorial/GamificationTutorialOverlay";
import { useSettings } from "@/contexts/SettingsContext";
import { CURRENCIES } from "@/constants/currencies";

export default function Gamification() {
    const { state, claimableBadges } = useGamification();
    const { state: expenseState } = useExpenses();
    const navigate = useNavigate();
    const nextLevelXP = xpThreshold(state.level);
    const progress = (state.xp / nextLevelXP) * 100;

    // Tutorial State
    const [hasSeenTour, setHasSeenTour] = useLocalStorage("hasSeenGamificationTour", false);
    const [showTour, setShowTour] = useState(false);

    useEffect(() => {
        if (!hasSeenTour) {
            // Small delay to ensure everything is rendered
            const timer = setTimeout(() => setShowTour(true), 500);
            return () => clearTimeout(timer);
        }
    }, [hasSeenTour]);

    const handleTourComplete = () => {
        setShowTour(false);
        setHasSeenTour(true);
    };

    // Task Logic
    const today = dayjs();
    const startOfWeek = dayjs().startOf('week');
    const startOfMonth = dayjs().startOf('month');

    const dailyTransactions = expenseState.items.filter(t => dayjs(t.date).isSame(today, 'day'));
    const weeklyTransactions = expenseState.items.filter(t => dayjs(t.date).isAfter(startOfWeek));
    const monthlyTransactions = expenseState.items.filter(t => dayjs(t.date).isAfter(startOfMonth));

    const { settings } = useSettings();
    const currencySymbol = CURRENCIES.find(c => c.code === settings.currency)?.symbol || settings.currency;

    const dailyTasks = useMemo(() => {
        const tasks = getDailyTasks(today, settings.currency);
        return tasks.map(task => {
            const uniqueId = `${task.id}_${today.format('YYYY-MM-DD')}`;
            return {
                ...task,
                uniqueId,
                progress: Math.min(task.checkProgress(dailyTransactions), task.total),
                isClaimed: state.claimedTasks?.includes(uniqueId)
            };
        });
    }, [dailyTransactions, state.claimedTasks, settings.currency]);

    const weeklyTasks = useMemo(() => {
        const tasks = getWeeklyTasks(today, settings.currency);
        return tasks.map(task => {
            const uniqueId = `${task.id}_${today.format('YYYY-Www')}`;
            return {
                ...task,
                uniqueId,
                progress: Math.min(task.checkProgress(weeklyTransactions), task.total),
                isClaimed: state.claimedTasks?.includes(uniqueId)
            };
        });
    }, [weeklyTransactions, state.claimedTasks, settings.currency]);

    const monthlyTasks = useMemo(() => {
        const tasks = getMonthlyTasks(today, settings.currency);
        return tasks.map(task => {
            const uniqueId = `${task.id}_${today.format('YYYY-MM')}`;
            return {
                ...task,
                uniqueId,
                progress: Math.min(task.checkProgress(monthlyTransactions), task.total),
                isClaimed: state.claimedTasks?.includes(uniqueId)
            };
        });
    }, [monthlyTransactions, state.claimedTasks, settings.currency]);

    const { claimTaskReward } = useGamification();

    const renderTask = (task: any) => (
        <div key={task.uniqueId} className="flex items-center justify-between p-3 border rounded-lg bg-card">
            <div className="flex-1 mr-4">
                <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm flex items-center gap-2">
                        {task.progress >= task.total ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                        {task.title}
                    </p>
                    <span className="text-xs text-muted-foreground">{task.progress}/{task.total}</span>
                </div>
                <Progress value={(task.progress / task.total) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
                <span className="text-xs font-bold text-yellow-500">+{task.reward} XP</span>
                {task.progress >= task.total && !task.isClaimed && (
                    <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs bg-green-600 hover:bg-green-700"
                        onClick={() => claimTaskReward(task.uniqueId, task.reward)}
                    >
                        Claim
                    </Button>
                )}
                {task.isClaimed && (
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">Claimed</span>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background pb-24">
            <GamificationTutorialOverlay isActive={showTour} onComplete={handleTourComplete} />
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Gamification</h1>
                            <p className="text-sm text-muted-foreground">Your achievements and progress</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
                {/* Stats Overview */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        id="gami-level-card"
                    >
                        <Card className="bg-gradient-to-br from-xp/20 to-accent/20 border-xp/50 h-full">
                            <CardContent className="p-4 flex flex-col justify-center gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-xp/20 rounded-full text-xp-foreground">
                                        <img src="/assets/level.png" alt="Level" className="w-5 h-5 object-contain" />
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium">Level</p>
                                </div>
                                <h3 className="text-2xl font-bold">{state.level}</h3>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        id="gami-coins-card"
                    >
                        <Card
                            className="bg-gradient-to-br from-gold/20 to-yellow-500/20 border-gold/50 h-full cursor-pointer hover:shadow-md transition-all"
                            onClick={() => navigate('/gamification/tokens')}
                        >
                            <CardContent className="p-4 flex flex-col justify-center gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-gold/20 rounded-full text-gold">
                                        <img src="/assets/token.png" alt="Token" className="w-5 h-5 object-contain" />
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium">Tokens</p>
                                </div>
                                <h3 className="text-2xl font-bold">{state.coins}</h3>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        id="gami-xp-card"
                    >
                        <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/50 h-full">
                            <CardContent className="p-4 flex flex-col justify-center gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-500/20 rounded-full text-blue-500">
                                        <img src="/assets/xp.png" alt="XP" className="w-5 h-5 object-contain" />
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium">Total XP</p>
                                </div>
                                <h3 className="text-2xl font-bold">{state.totalXP || 0}</h3>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        id="gami-streak-card"
                    >
                        <Card className="bg-gradient-to-br from-destructive/20 to-red-500/20 border-destructive/50 h-full">
                            <CardContent className="p-4 flex flex-col justify-center gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-destructive/20 rounded-full text-destructive">
                                        <img src="/assets/streak.png" alt="Streak" className="w-5 h-5 object-contain" />
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium">Streak</p>
                                </div>
                                <h3 className="text-2xl font-bold">{state.streak}</h3>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Level Progress */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Level Progress</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm font-medium">
                                <span>Level {state.level}</span>
                                <span>{state.xp} / {nextLevelXP} XP</span>
                            </div>
                            <Progress value={progress} className="h-4" />
                            <p className="text-sm text-muted-foreground text-center">
                                {nextLevelXP - state.xp} XP needed for Level {state.level + 1}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex justify-center"
                >
                    <Button
                        size="lg"
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                        onClick={() => navigate("/shop")}
                    >
                        <ShoppingBag className="w-5 h-5 mr-2" />
                        Visit Theme Shop
                    </Button>
                </motion.div>

                {/* Tasks Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    id="gami-tasks-section"
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-indigo-500" />
                                Tasks & Challenges
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="daily" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 mb-4 h-auto p-1">
                                    <TabsTrigger value="daily" className="flex items-center gap-2 py-2">
                                        Daily
                                        {dailyTasks.filter(t => t.progress >= t.total && !t.isClaimed).length > 0 && (
                                            <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-600 rounded-full animate-bounce">
                                                {dailyTasks.filter(t => t.progress >= t.total && !t.isClaimed).length}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="weekly" className="flex items-center gap-2 py-2">
                                        Weekly
                                        {weeklyTasks.filter(t => t.progress >= t.total && !t.isClaimed).length > 0 && (
                                            <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-600 rounded-full animate-bounce">
                                                {weeklyTasks.filter(t => t.progress >= t.total && !t.isClaimed).length}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="monthly" className="flex items-center gap-2 py-2">
                                        Monthly
                                        {monthlyTasks.filter(t => t.progress >= t.total && !t.isClaimed).length > 0 && (
                                            <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-600 rounded-full animate-bounce">
                                                {monthlyTasks.filter(t => t.progress >= t.total && !t.isClaimed).length}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="daily" className="space-y-4">
                                    {dailyTasks.map(renderTask)}
                                </TabsContent>
                                <TabsContent value="weekly" className="space-y-4">
                                    {weeklyTasks.map(renderTask)}
                                </TabsContent>
                                <TabsContent value="monthly" className="space-y-4">
                                    {monthlyTasks.map(renderTask)}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Badges */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    id="gami-badges-section"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <img src="/assets/badge.png" alt="Badge" className="w-5 h-5 object-contain" />
                            Badges
                        </h2>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/gamification/badges')} className="gap-2">
                            {claimableBadges.length > 0 && (
                                <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-600 rounded-full animate-bounce">
                                    {claimableBadges.length}
                                </span>
                            )}
                            Show More <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {state?.badges?.slice(0, 4).map((badgeId) => {
                            const badge = Object.values(BADGES).find((b) => b.id === badgeId);
                            if (!badge) return null;
                            return (
                                <Card key={badgeId} className="bg-card border-border/50">
                                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                                        <div className="text-2xl">{badge.icon}</div>
                                        <div>
                                            <p className="font-semibold text-xs line-clamp-1">{badge.name}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                        {(!state?.badges || state.badges.length === 0) && (
                            <div className="col-span-full text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                                <p>No badges earned yet. Keep going!</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* History */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <History className="w-5 h-5 text-blue-500" />
                        Recent History
                    </h2>
                    <Card>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border">
                                {state.history?.filter(h => (h.xpEarned || 0) > 0).length > 0 ? (
                                    state.history.filter(h => (h.xpEarned || 0) > 0).slice(0, 10).map((item, index) => (
                                        <div key={index} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-green-500/10 text-green-500 rounded-full">
                                                    <Calendar className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{item.reason}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {dayjs(item.date).fromNow()}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-green-500">+{item.xpEarned} XP</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-muted-foreground">
                                        No history yet. Start using the app to earn XP!
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </main>
        </div>
    );
}
