import { useGamification } from "@/contexts/GamificationContext";
import { useExpenses } from "@/contexts/ExpenseContext";
import { BADGES, xpThreshold } from "@/utils/gamify";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Calendar, History, ShoppingBag, ArrowLeft, CheckCircle2, Circle, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
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
    const { state, claimableBadges, isLoading, refreshGamification } = useGamification();
    const { state: expenseState } = useExpenses();

    useEffect(() => {
        refreshGamification();
    }, []);
    const navigate = useNavigate();
    const nextLevelXP = xpThreshold(state.level);
    const progress = (state.xp / nextLevelXP) * 100;

    // Tutorial State
    const [hasSeenTour, setHasSeenTour] = useLocalStorage("hasSeenGamificationTour", false);
    const [showTour, setShowTour] = useState(false);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(true);

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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background pb-24">
                <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} disabled className="flex md:hidden">
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
                    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full animate-pulse" />
                            <img
                                src="/assets/token.png"
                                alt="Loading..."
                                className="w-24 h-24 animate-[spin_2s_linear_infinite] relative z-10 object-contain"
                            />
                        </div>
                        <p className="text-muted-foreground animate-pulse font-medium">Loading progress...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            <GamificationTutorialOverlay isActive={showTour} onComplete={handleTourComplete} />
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="flex md:hidden">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Gamification</h1>
                            <p className="text-sm text-muted-foreground">Your achievements and progress</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* --- LEFT COLUMN (Level Progress, Tasks) --- */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* 1. Level Progress */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <Card className="bg-card border-border shadow-sm">
                                <CardContent className="pt-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                        <div>
                                            <h2 className="text-lg font-bold flex items-center gap-2">
                                                Level Progress
                                                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Level {state.level}</span>
                                            </h2>
                                            <p className="text-sm text-muted-foreground">Keep earning XP to reach the next level!</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-primary">
                                                {state.xp} <span className="text-sm text-muted-foreground font-medium">/ {nextLevelXP} XP</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative h-4 bg-muted overflow-hidden rounded-full transform translate-z-0">
                                        <motion.div
                                            className="absolute top-0 left-0 h-full bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                        />
                                        {/* Striped overlay pattern */}
                                        <div className="absolute inset-0 opacity-10 bg-[length:10px_10px] bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] pointer-events-none" />
                                    </div>
                                    <p className="text-xs text-center text-muted-foreground mt-2 font-medium">
                                        {nextLevelXP - state.xp} XP more to reach Level {state.level + 1}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* 2. Tasks & Challenges */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <Card className="bg-card border-border shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Trophy className="w-5 h-5 text-indigo-500" />
                                        Tasks & Challenges
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Tabs defaultValue="daily" className="w-full">
                                        <TabsList className="grid w-full grid-cols-3 mb-6 p-1 bg-muted/50">
                                            <TabsTrigger value="daily" className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">
                                                Daily
                                                {dailyTasks.filter(t => t.progress >= t.total && !t.isClaimed).length > 0 && (
                                                    <span className="ml-2 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500/50">
                                                        {dailyTasks.filter(t => t.progress >= t.total && !t.isClaimed).length}
                                                    </span>
                                                )}
                                            </TabsTrigger>
                                            <TabsTrigger value="weekly" className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">
                                                Weekly
                                                {weeklyTasks.filter(t => t.progress >= t.total && !t.isClaimed).length > 0 && (
                                                    <span className="ml-2 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500/50">
                                                        {weeklyTasks.filter(t => t.progress >= t.total && !t.isClaimed).length}
                                                    </span>
                                                )}
                                            </TabsTrigger>
                                            <TabsTrigger value="monthly" className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">
                                                Monthly
                                                {monthlyTasks.filter(t => t.progress >= t.total && !t.isClaimed).length > 0 && (
                                                    <span className="ml-2 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500/50">
                                                        {monthlyTasks.filter(t => t.progress >= t.total && !t.isClaimed).length}
                                                    </span>
                                                )}
                                            </TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="daily" className="space-y-3 mt-0 focus-visible:ring-0">
                                            <AnimatePresence mode="popLayout">
                                                {dailyTasks.map(task => (
                                                    <motion.div key={task.uniqueId} layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                                                        {renderTask(task)}
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </TabsContent>

                                        <TabsContent value="weekly" className="space-y-3 mt-0 focus-visible:ring-0">
                                            <AnimatePresence mode="popLayout">
                                                {weeklyTasks.map(task => (
                                                    <motion.div key={task.uniqueId} layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                                                        {renderTask(task)}
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </TabsContent>

                                        <TabsContent value="monthly" className="space-y-3 mt-0 focus-visible:ring-0">
                                            <AnimatePresence mode="popLayout">
                                                {monthlyTasks.map(task => (
                                                    <motion.div key={task.uniqueId} layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                                                        {renderTask(task)}
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>


                    {/* --- RIGHT COLUMN (Stats, Shop, Badges, History) --- */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* 1. Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Level */}
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                                <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 hover:border-indigo-500/40 transition-colors cursor-pointer group" onClick={() => navigate('/leaderboard')}>
                                    <CardContent className="p-4 flex flex-col items-center text-center gap-2 relative">
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronRight className="w-4 h-4 text-indigo-400" />
                                        </div>
                                        <div className="p-2.5 bg-indigo-500/20 rounded-full text-indigo-400 mb-1">
                                            <img src="/assets/level.png" alt="Level" className="w-6 h-6 object-contain" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Level</p>
                                            <h3 className="text-2xl font-bold mt-0.5">{state.level}</h3>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Tokens */}
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                                <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/20 hover:border-yellow-500/40 transition-colors cursor-pointer group" onClick={() => navigate('/gamification/tokens')}>
                                    <CardContent className="p-4 flex flex-col items-center text-center gap-2 relative">
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronRight className="w-4 h-4 text-yellow-400" />
                                        </div>
                                        <div className="p-2.5 bg-yellow-500/20 rounded-full text-yellow-500 mb-1">
                                            <img src="/assets/token.png" alt="Token" className="w-6 h-6 object-contain" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tokens</p>
                                            <h3 className="text-2xl font-bold mt-0.5">{state.coins}</h3>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* XP */}
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
                                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                                        <div className="p-2.5 bg-blue-500/20 rounded-full text-blue-400 mb-1">
                                            <img src="/assets/xp.png" alt="XP" className="w-6 h-6 object-contain" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total XP</p>
                                            <h3 className="text-xl font-bold mt-0.5">{state.totalXP || 0}</h3>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Streak */}
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
                                <Card className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/20">
                                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                                        <div className="p-2.5 bg-red-500/20 rounded-full text-red-500 mb-1">
                                            <img src="/assets/streak.png" alt="Streak" className="w-6 h-6 object-contain" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Streak</p>
                                            <h3 className="text-2xl font-bold mt-0.5">{state.streak}</h3>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>

                        {/* 2. Theme Shop Button */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                            <Button
                                size="lg"
                                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/20 h-14"
                                onClick={() => navigate("/shop")}
                            >
                                <div className="flex items-center gap-3">
                                    <ShoppingBag className="w-5 h-5" />
                                    <div className="flex flex-col items-start leading-none">
                                        <span className="text-sm font-bold">Visit Theme Shop</span>
                                        <span className="text-[10px] opacity-80 font-normal">Spend your tokens</span>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 ml-auto opacity-50" />
                            </Button>
                        </motion.div>

                        {/* 3. Badges Grid */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                            <Card className="border-border/50 bg-card/50">
                                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <img src="/assets/badge.png" alt="Badge" className="w-5 h-5 object-contain" />
                                        Badges
                                    </CardTitle>
                                    <Button variant="ghost" size="sm" onClick={() => navigate('/gamification/badges')} className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary">
                                        View All
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-3">
                                        {(() => {
                                            const earnedBadges = Object.values(BADGES)
                                                .filter(b => state.badges?.includes(b.id))
                                                .slice(0, 4);

                                            return (
                                                <>
                                                    {earnedBadges.map((badge) => (
                                                        <div key={badge.id} className="bg-background border border-border/40 rounded-xl p-3 flex flex-col items-center text-center gap-2 hover:bg-accent/50 transition-colors">
                                                            <div className="w-12 h-12 flex items-center justify-center">
                                                                <img
                                                                    src={badge.image}
                                                                    alt={badge.name}
                                                                    className="w-full h-full object-contain filter drop-shadow-sm rounded-full"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                                    }}
                                                                />
                                                                <span className="text-3xl hidden">{badge.icon}</span>
                                                            </div>
                                                            <p className="font-semibold text-[10px] leading-tight line-clamp-2">{badge.name}</p>
                                                        </div>
                                                    ))}

                                                    {earnedBadges.length === 0 && (
                                                        <div className="col-span-full py-8 text-center">
                                                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-2 opacity-50">
                                                                <Trophy className="w-6 h-6 text-muted-foreground" />
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">Complete tasks to earn your first badge!</p>
                                                        </div>
                                                    )}

                                                    {/* Filler to maintain 2x2 grid structure if we have some badges but less than 4 */}
                                                    {earnedBadges.length > 0 && Array.from({ length: Math.max(0, 4 - earnedBadges.length) }).map((_, i) => (
                                                        <div key={`empty-${i}`} className="border border-dashed border-border/40 rounded-xl p-3 flex flex-col items-center justify-center gap-1 opacity-50">
                                                            <div className="w-8 h-8 rounded-full bg-muted/50" />
                                                        </div>
                                                    ))}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* 4. History */}
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                            <Card className="border-border/50 overflow-hidden">
                                <div
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                                >
                                    <div className="flex items-center gap-2">
                                        <History className="w-5 h-5 text-blue-500" />
                                        <h2 className="text-lg font-bold">Recent History</h2>
                                    </div>
                                    <motion.div animate={{ rotate: isHistoryOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                    </motion.div>
                                </div>

                                <AnimatePresence initial={false}>
                                    {isHistoryOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                        >
                                            <div className="border-t border-border/40">
                                                <CardContent className="p-0">
                                                    <div className="divide-y divide-border/40">
                                                        {(() => {
                                                            const historyItems = state.history?.filter(h => (h.xpEarned || 0) > 0) || [];
                                                            const visibleHistory = isHistoryExpanded ? historyItems : historyItems.slice(0, 5);

                                                            if (historyItems.length === 0) {
                                                                return (
                                                                    <div className="p-12 text-center flex flex-col items-center justify-center text-muted-foreground gap-2">
                                                                        <History className="w-8 h-8 opacity-20" />
                                                                        <p className="text-sm">No history yet. Start completing tasks!</p>
                                                                    </div>
                                                                );
                                                            }

                                                            return (
                                                                <>
                                                                    {visibleHistory.map((item, index) => (
                                                                        <div
                                                                            key={`${item.date}-${index}`}
                                                                            className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group"
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="p-2 bg-green-500/10 text-green-500 rounded-full group-hover:bg-green-500/20 transition-colors">
                                                                                    <Calendar className="w-4 h-4" />
                                                                                </div>
                                                                                <div>
                                                                                    <p className="font-medium text-sm">{item.reason}</p>
                                                                                    <p className="text-xs text-muted-foreground group-hover:text-muted-foreground/80">
                                                                                        {dayjs(item.date).fromNow()}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            <span className="font-bold text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded inline-block">+{item.xpEarned} XP</span>
                                                                        </div>
                                                                    ))}

                                                                    {historyItems.length > 5 && (
                                                                        <div
                                                                            className="p-2 text-center bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setIsHistoryExpanded(!isHistoryExpanded);
                                                                            }}
                                                                        >
                                                                            <span className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1">
                                                                                {isHistoryExpanded ? 'Show Less' : `Show ${historyItems.length - 5} more items`}
                                                                                {isHistoryExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                </CardContent>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}